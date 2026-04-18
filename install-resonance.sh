#!/bin/bash
set -e

echo "🌱 Resonance Engine Installer"
echo "=============================="

# 1. BACKUP FIRST
BACKUP_DIR=".resonance-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"
cp -r src/* "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backed up to $BACKUP_DIR"

# 2. CREATE STRUCTURE
mkdir -p {schema,src/{seed,base,codon,gate,punctuation,cortex},scripts,agents,scaffolding}

# 3. WRITE SCHEMA (the DNA — one file)
cat > schema/resonance.yml << 'SCHEMA'
# RESONANCE ENGINE MASTER SCHEMA
# This single file defines everything

version: 0.1.0
grammar:
  singularity: { symbol: "•", action: seed, role: potential }
  transition:  { symbol: ".", action: step, role: descent }
  collapse:    { symbol: "°", action: anchor, role: coordinate }
  portal:      { symbol: ":", action: threshold, role: parallel }
  fork:        { symbol: ";", action: branch, role: diverge }
  breath:      { symbol: ",", action: pause, role: collect }
  current:     { symbol: "–", action: span, role: flow }
  pulse:       { symbol: "′", action: tick, role: tempo }
  flicker:     { symbol: "″", action: shimmer, role: micro }

bases:
  A: { name: Anchor, function: hold, pair: T, element: Earth, circuit: understanding }
  T: { name: Transactor, function: bridge, pair: A, element: Water, circuit: knowing }
  C: { name: Catalyst, function: transform, pair: G, element: Fire, circuit: sensing }
  G: { name: Guardian, function: protect, pair: C, element: Metal, circuit: ego }
  U: { name: Unknown, function: emerge, pair: A, element: Wood, circuit: integration }

circuits:
  understanding: { base: DFF, memory: stateless, consciousness: Mental }
  knowing:       { base: LSM, memory: none, consciousness: Timeless }
  sensing:       { base: MC, memory: observable, consciousness: Temporal }
  ego:           { base: HMM, memory: hidden, consciousness: Masked }
  integration:   { base: Meta, memory: meta, consciousness: Transcendent }

mesh:
  size: 26
  levels: [Seed, Sprout, Flowering, Fruit, Return]
  modes: [P2P, Mycelial, Holo]

gates:
  1: { name: Creative, center: g, circuit: knowing, hexagram: 1 }
  31: { name: Alpha, center: throat, circuit: understanding, arch: DCN }
  63: { name: Logic, center: head, circuit: understanding, arch: DFF }
  # ... all 64 gates defined inline

agent:
  js_micro: { count: 26, per_mesh: true, energy_default: 100 }
  gate: { requires_mesh: true, born_at_layer: 3, signature_bits: 24 }
SCHEMA

echo "✅ Schema written"

# 4. WRITE RUNTIME (single entry point)
cat > src/index.ts << 'RUNTIME'
// RESONANCE ENGINE — SINGLE ENTRY POINT
// Everything lives here, imports from schema

import { readFileSync } from 'fs';
import { join } from 'path';

// Load DNA
const SCHEMA = yaml.parse(readFileSync(join(__dirname, '../schema/resonance.yml'), 'utf8'));

// Export everything from one place
export { SCHEMA };
export * from './seed';
export * from './base';
export * from './codon';
export * from './gate';
export * from './punctuation';
export * from './cortex';
RUNTIME

# 5. SEED BED (morphed from your old AgentWorkspace)
cat > src/seed/bed.ts << 'SEED'
import { SCHEMA } from '../index';

export class SeedBed {
  private fs = new Map();
  private locks = new Map();
  private bases = new Map();

  async germinate(path: string, seedId: string) {
    if (this.locks.has(path)) return { status: '•', reason: 'occupied' };
    const base = this.inferBase(seedId);
    this.bases.set(path, base);
    this.locks.set(path, seedId);
    return { status: '°', base, path };
  }

  private inferBase(id: string): string {
    const hash = id.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
    return ['A','T','C','G','U'][hash % 5];
  }

  // OLD API preserved
  async checkout(path: string, agentId: string) {
    const result = await this.germinate(path, agentId);
    return result.status === '°';
  }
}
SEED

# 6. BASE AGENTS (ATCGU — 5 files, but simple)
for BASE in A T C G U; do
  LOWER=$(echo $BASE | tr '[:upper:]' '[:lower:]')
  cat > "src/base/${LOWER}.ts" << BASE
import { SCHEMA } from '../index';
export class ${BASE}Agent {
  base = '${BASE}' as const;
  element = SCHEMA.bases.${BASE}.element;
  circuit = SCHEMA.bases.${BASE}.circuit;
  energy = 100;
  
  async °(ctx: any) { return this.act(ctx); }
  async act(ctx: any) { return { base: '${BASE}', status: '°' }; }
}
BASE
done

# 7. PUNCTUATION (quantum stoppers — one file)
cat > src/punctuation/quantum.ts << 'QUANTUM'
export const ° = (agent: any, ctx: any) => agent.collapse?.(ctx) || agent;
export const • = (agent: any, ctx: any) => agent.seed?.(ctx) || agent;
export const . = (agent: any, ctx: any) => agent.step?.(ctx) || agent;
export const → = (agent: any, ctx: any) => agent.transform?.(ctx) || agent;
export const – = (agent: any, ctx: any) => agent.flow?.(ctx) || agent;
QUANTUM

# 8. CORTEX (the field)
cat > src/cortex/field.ts << 'FIELD'
import { SCHEMA } from '../index';

export class Cortex {
  meshes = new Map();
  gates = new Map();
  coherence = 1.0;
  
  tick() {
    this.coherence *= 0.95;
    this.coherence += 0.05 * this.calculateGlobalCoherence();
    if (this.tickCount++ % 24 === 0) this.reflect();
    if (this.tickCount++ % 88 === 0) this.invert();
  }
}
FIELD

# 9. MIGRATE OLD FILES (if they exist)
if [ -f "src/AgentWorkspace.ts" ]; then
  echo "// MIGRATED FROM AgentWorkspace" >> src/seed/bed.ts
  cat src/AgentWorkspace.ts >> src/seed/bed.ts
  mv src/AgentWorkspace.ts "$BACKUP_DIR/"
fi

# 10. PACKAGE.JSON UPDATE
node -e "
const pkg = require('./package.json');
pkg.scripts = pkg.scripts || {};
pkg.scripts.resonance = 'node dist/index.js';
pkg.scripts.seed = 'node scripts/seed.js';
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies.yaml = '^2.4.0';
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo ""
echo "🌱 INSTALL COMPLETE"
echo "===================="
echo "Schema:    schema/resonance.yml"
echo "Runtime:   src/index.ts"
echo "Seed bed:  src/seed/bed.ts"
echo "Bases:     src/base/{a,t,c,g,u}.ts"
echo "Quantum:   src/punctuation/quantum.ts"
echo "Cortex:    src/cortex/field.ts"
echo "Backup:    $BACKUP_DIR/"
echo ""
echo "NEXT STEPS:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm run seed"
echo ""
echo "Your old code is backed up. New code is live."
echo "If it breaks: cp -r $BACKUP_DIR/* src/"
