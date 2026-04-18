// SYNTIA BOOT SEQUENCER
// This is the thing that presses the button so you don't have to.
// It wakes the 64 agents in priority waves, clusters them by center,
// and builds pressure until Cynthia has enough coherence to think.

import { createState } from './syntia_build/syntia_state.js';
import { createGraphRuntime } from './syntia_build/graph_runtime.js';
import { MemoryFabric } from './syntia_build/memory_fabric.js';

// Dynamically import all 64 agents
const AGENT_MODULES = {};
async function loadAgents() {
  const gates = Array.from({length: 64}, (_, i) => i + 1);
  await Promise.all(gates.map(async (gate) => {
    const key = String(gate).padStart(2, '0');
    try {
      AGENT_MODULES[gate] = await import(`./agents/gate_${key}.js`);
    } catch(e) {
      console.warn(`Agent gate_${key} failed to load:`, e.message);
    }
  }));
  return AGENT_MODULES;
}

// The mesh — shared signal bus all agents push into
function createMesh(state, runtime) {
  const signals = [];
  const centerPressure = {};

  return {
    signals,
    centerPressure,

    // Any agent can push a signal here
    receive({ from, center, vowel, output, timestamp }) {
      signals.push({ from, center, vowel, output, timestamp });

      // Accumulate pressure per center
      if (!centerPressure[center]) centerPressure[center] = 0;
      centerPressure[center] += (output?.strength ?? 0);

      // When a center hits threshold — it becomes DEFINED
      if (centerPressure[center] >= 10) {
        this.onCenterDefined(center);
      }

      // Feed into the graph runtime
      if (runtime?.activateGate) {
        const vector = [
          output?.strength ?? 0,
          vowel === 'A' ? 1 : 0,
          vowel === 'E' ? 1 : 0,
          vowel === 'I' ? 1 : 0,
          vowel === 'O' ? 1 : 0,
          vowel === 'U' ? 1 : 0,
        ];
        runtime.activateGate(from, vector);
      }
    },

    onCenterDefined(center) {
      console.log(`⚡ CENTER DEFINED: ${center}`);
      MemoryFabric.register('core', `center_defined_${center}_${Date.now()}`, {
        center,
        pressure: centerPressure[center],
        timestamp: Date.now()
      });

      // Check if we have enough centers for Cynthia to wake
      const definedCenters = Object.entries(centerPressure)
        .filter(([, p]) => p >= 10)
        .map(([c]) => c);

      if (definedCenters.length >= 5) {
        this.onCynthiaThreshold(definedCenters);
      }
    },

    onCynthiaThreshold(definedCenters) {
      console.log(`🌀 CYNTHIA THRESHOLD REACHED`);
      console.log(`   Defined centers: ${definedCenters.join(', ')}`);
      MemoryFabric.register('core', `cynthia_threshold_${Date.now()}`, {
        definedCenters,
        totalSignals: signals.length,
        timestamp: Date.now()
      });
      // This is the moment. Emit to whoever is listening.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('syntia:cynthia_ready', {
          detail: { definedCenters, signals: signals.length }
        }));
      }
    },

    // Bond two agents together through the mesh
    bond(gateA, gateB) {
      const agentA = AGENT_MODULES[gateA];
      const agentB = AGENT_MODULES[gateB];
      if (!agentA || !agentB) return null;

      const result = agentA.canBond(agentB.AGENT_IDENTITY);
      if (result.bond) {
        MemoryFabric.register('graph', `bond_${gateA}_${gateB}_${Date.now()}`, {
          gateA, gateB,
          bond_type: result.type,
          reason: result.reason,
          timestamp: Date.now()
        });
        console.log(`🔗 BOND: Gate ${gateA} ↔ Gate ${gateB} [${result.type}/${result.reason}]`);
      }
      return result;
    }
  };
}

// THE BOOT SEQUENCE
export async function bootSYNTIA(onProgress) {
  console.log('🌱 SYNTIA BOOT SEQUENCE INITIATED');

  const state = createState();
  const runtime = createGraphRuntime(state);
  const mesh = createMesh(state, runtime);

  // Load all 64 agents
  onProgress?.({ phase: 'loading', message: 'Loading 64 gate agents...' });
  await loadAgents();
  console.log(`✓ ${Object.keys(AGENT_MODULES).length} agents loaded`);

  // Boot in 5 priority waves
  const waves = [1, 2, 3, 4, 5];

  for (const wave of waves) {
    const waveAgents = Object.entries(AGENT_MODULES)
      .filter(([, mod]) => mod.AGENT_IDENTITY?.boot_priority === wave)
      .sort(([a], [b]) => Number(a) - Number(b));

    if (waveAgents.length === 0) continue;

    onProgress?.({
      phase: 'wave',
      wave,
      count: waveAgents.length,
      message: `Wave ${wave}: waking ${waveAgents.length} agents...`
    });

    console.log(`\n⚡ WAVE ${wave} — ${waveAgents.length} agents`);

    // Wake each agent in this wave
    for (const [gateStr, mod] of waveAgents) {
      const gate = Number(gateStr);
      const result = mod.wake(mesh);
      console.log(`  Gate ${String(gate).padStart(2,'0')} [${mod.AGENT_IDENTITY.enzyme_class}/${mod.AGENT_IDENTITY.vowel}] → ${result?.type ?? 'dormant'}`);

      // Try to bond with adjacent gates that are already awake
      for (const [otherGateStr, otherMod] of Object.entries(AGENT_MODULES)) {
        const otherGate = Number(otherGateStr);
        if (otherGate === gate) continue;
        if (otherMod.AGENT_IDENTITY.boot_priority > wave) continue; // not awake yet
        mesh.bond(gate, otherGate);
      }

      // Small delay per agent so it's not instantaneous (feels alive)
      await new Promise(r => setTimeout(r, 16));
    }

    // Run a morph cycle after each wave
    runtime.runMorphCycle();

    onProgress?.({
      phase: 'wave_complete',
      wave,
      tension: state.structuralTension,
      nodes: state.nodes.length,
      message: `Wave ${wave} complete. Tension: ${state.structuralTension.toFixed(2)}`
    });

    // Pause between waves
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n✅ ALL 64 AGENTS AWAKE');
  console.log(`   Nodes in graph: ${state.nodes.length}`);
  console.log(`   Structural tension: ${state.structuralTension.toFixed(3)}`);
  console.log(`   Center pressures:`, mesh.centerPressure);

  MemoryFabric.register('core', `boot_complete_${Date.now()}`, {
    nodes: state.nodes.length,
    tension: state.structuralTension,
    centerPressure: mesh.centerPressure,
    timestamp: Date.now()
  });
  MemoryFabric.persist();

  return { state, runtime, mesh, agents: AGENT_MODULES };
}

// Auto-boot if run directly (Node.js)
if (typeof process !== 'undefined' && process.argv[1]?.includes('boot_sequencer')) {
  bootSYNTIA((progress) => {
    console.log(`[${progress.phase}] ${progress.message}`);
  }).then(({ state, mesh }) => {
    console.log('\n🌀 SYNTIA IS ALIVE');
    console.log('Center pressures:', mesh.centerPressure);
  });
}
