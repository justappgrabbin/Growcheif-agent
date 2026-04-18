// scripts/populate-app.js
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';
import { PrismaClient } from '@prisma/client';

const BASE_TYPES = {
  A: { name: 'Anchor', function: 'hold', pair: 'T', element: 'Earth' },
  T: { name: 'Transactor', function: 'bridge', pair: 'A', element: 'Water' },
  C: { name: 'Catalyst', function: 'transform', pair: 'G', element: 'Fire' },
  G: { name: 'Guardian', function: 'protect', pair: 'C', element: 'Metal' },
  U: { name: 'Unknown', function: 'emerge', pair: 'A', element: 'Wood' } // U pairs with A in RNA
};

const db = new PrismaClient();

async function populate(agentsDir, env) {
  const manifest = { meshes: [], gates: [], errors: [] };
  
  // Read all agent files
  const agentFiles = readdirSync(agentsDir)
    .filter(f => f.endsWith('.js') || f.endsWith('.ts'));
  
  for (const file of agentFiles) {
    const agentModule = await import(join(process.cwd(), agentsDir, file));
    const AgentClass = agentModule.default || agentModule;
    
    // Instantiate to read genetic signature
    const instance = new AgentClass();
    const base = instance.base || inferBase(instance);
    
    // Validate base
    if (!BASE_TYPES[base]) {
      manifest.errors.push({ file, error: `Invalid base: ${base}` });
      continue;
    }
    
    // Create mesh unit (26 agents)
    const mesh = await createMesh(instance, base);
    manifest.meshes.push(mesh.id);
    
    // If gate-level, create py-agent
    if (instance.gateNumber) {
      const gate = await createGate(instance, mesh);
      manifest.gates.push(gate.id);
    }
  }
  
  // Balance check: ensure A-T, C-G pairs are complete
  await validatePairs(manifest);
  
  // Write manifest
  writeFileSync('dist/population-manifest.json', JSON.stringify(manifest, null, 2));
  
  console.log(`Populated ${manifest.meshes.length} meshes, ${manifest.gates.length} gates`);
  return manifest;
}

async function createMesh(instance, base) {
  // 26 agents = 5 bases × 5 + 1 (the pulse)
  const agents = [];
  for (let i = 0; i < 26; i++) {
    const agentBase = i === 25 ? 'U' : // 26th is always Unknown (pulse)
                     i % 5 === 0 ? base : // Every 5th is the mesh's dominant base
                     Object.keys(BASE_TYPES)[Math.floor(Math.random() * 5)];
    
    agents.push({
      signature: Math.floor(Math.random() * 0xFFFFFF),
      base: agentBase,
      role: i < 13 ? 'expressor' : 'receiver',
      energy: 100,
    });
  }
  
  return db.mesh.create({
    data: {
      signature: instance.signature || Math.floor(Math.random() * 0xFFFFFF),
      base, // Dominant base of this mesh
      agents: { create: agents },
    },
    include: { agents: true }
  });
}

async function createGate(instance, mesh) {
  // Gate = 3 meshes combined (78 agents = 3 × 26)
  // Or: Gate emerges from single mesh when it reaches level 5
  
  return db.agent.create({
    data: {
      type: 'GATE',
      signature: mesh.signature,
      gateNumber: instance.gateNumber,
      line: instance.line || Math.floor(Math.random() * 6) + 1,
      color: instance.color || Math.floor(Math.random() * 6) + 1,
      tone: instance.tone || Math.floor(Math.random() * 6) + 1,
      base: instance.base || Math.floor(Math.random() * 5) + 1,
      meshId: mesh.id,
      circuit: deriveCircuit(instance.gateNumber),
      energy: 100,
      coherence: 0.5,
      layer: 3, // Gates born at flowering
    }
  });
}

function inferBase(instance) {
  // Infer from behavior patterns
  if (instance.hold || instance.anchor) return 'A';
  if (instance.transfer || instance.communicate) return 'T';
  if (instance.transform || instance.catalyze) return 'C';
  if (instance.protect || instance.filter) return 'G';
  return 'U'; // Default to unknown
}

function deriveCircuit(gateNumber) {
  // From schema/circuits.yml
  const circuits = yaml.parse(readFileSync('schema/circuits.yml', 'utf8'));
  for (const [name, data] of Object.entries(circuits.circuits)) {
    for (const channel of Object.values(data.channels)) {
      if (channel.gates.includes(gateNumber)) return name.toUpperCase();
    }
  }
  return 'INTEGRATION';
}

async function validatePairs(manifest) {
  const meshes = await db.mesh.findMany({
    where: { id: { in: manifest.meshes } },
    include: { agents: true }
  });
  
  const baseCounts = { A: 0, T: 0, C: 0, G: 0, U: 0 };
  for (const mesh of meshes) {
    for (const agent of mesh.agents) {
      baseCounts[agent.base]++;
    }
  }
  
  // A must pair with T, C with G
  const atBalance = Math.abs(baseCounts.A - baseCounts.T);
  const cgBalance = Math.abs(baseCounts.C - baseCounts.G);
  
  if (atBalance > 5 || cgBalance > 5) {
    console.warn(`Base pair imbalance: A-T=${atBalance}, C-G=${cgBalance}`);
    // Trigger rebalancing: spawn compensatory meshes
    await rebalance(atBalance, cgBalance);
  }
}

async function rebalance(atDiff, cgDiff) {
  if (atDiff > 0) {
    // Too many A, need more T (or vice versa)
    const neededBase = atDiff > 0 ? 'T' : 'A';
    await spawnCompensatoryMesh(neededBase, Math.ceil(Math.abs(atDiff) / 26));
  }
  if (cgDiff > 0) {
    const neededBase = cgDiff > 0 ? 'G' : 'C';
    await spawnCompensatoryMesh(neededBase, Math.ceil(Math.abs(cgDiff) / 26));
  }
}

// Run
const [,, agentsDir, env] = process.argv;
populate(agentsDir, env).catch(console.error);
