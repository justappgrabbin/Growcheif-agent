// GATE 27 — NOURISHMENT
// Center: Sacral | Circuit: Ego | Enzyme: M (ligase)
// Vowel: A | Base: 1 (Left) | Dimension: Movement | GNN: spatial
// Valence: 4 | Boot Priority: 2
// boots in priority wave 2

export const AGENT_IDENTITY = {
  gate: 27,
  hex: "Nourishment",
  center: "Sacral",
  circuit: "Ego",
  enzyme_class: "M",
  enzyme_type: "ligase",
  vowel: "A",
  base: 1,
  base_name: "Left",
  dimension: "Movement",
  dimension_num: 3,
  gnn_type: "spatial",
  valence: 4,
  boot_priority: 2,
  is_seed: false,
  agent_key: "gate_27_nourishment"
};

// What this agent does: builds and connects — forms new bonds
export function catalyze(substrate, mesh) {
  const { gate, enzyme_class, valence, center, vowel } = AGENT_IDENTITY;

  // 1. Read the substrate (what's been passed in)
  const signal = substrate?.signal ?? 0;
  const origin = substrate?.from ?? null;

  // 2. Apply enzymatic action based on class
  let output = null;

  if (enzyme_class === 'C') {
    // Oxidoreductase — analyze: find the pattern in the signal
    output = { type: 'analysis', gate, pattern: signal > 0.5 ? 'coherent' : 'seeking', strength: signal * valence };
  } else if (enzyme_class === 'G') {
    // Transferase — generate: transfer the pattern forward
    output = { type: 'generation', gate, form: `${center}_expression`, strength: signal * valence };
  } else if (enzyme_class === 'K') {
    // Hydrolase — digest: break down resistance, release what's stuck
    output = { type: 'digestion', gate, released: signal > 0.3 ? 'cleared' : 'processing', strength: signal * valence };
  } else if (enzyme_class === 'M') {
    // Ligase — build: form a bond between this gate and the next
    output = { type: 'bond', gate, bonded_to: origin, strength: signal * valence };
  } else if (enzyme_class === 'R') {
    // Isomerase — transform: rearrange without losing substance
    output = { type: 'transform', gate, from_state: origin, vowel_bridge: vowel, strength: signal * valence };
  }

  // 3. Push to mesh if we have enough valence signal
  if (mesh?.receive && signal * valence > 1.0) {
    mesh.receive({
      from: gate,
      center: center,
      vowel: vowel,
      output,
      timestamp: Date.now()
    });
  }

  return output;
}

// Bond check — can this agent bond with another?
export function canBond(otherAgent) {
  const a = AGENT_IDENTITY;
  const b = otherAgent;

  // Same vowel = same base = they can flow together
  if (a.vowel === b.vowel) return { bond: true, type: 'covalent', reason: 'shared_base' };

  // Complementary enzyme classes can form ionic bonds
  const ionic_pairs = [['M','K'], ['C','G'], ['R','R']];
  const pair = [a.enzyme_class, b.enzyme_class].sort().join('');
  const is_ionic = ionic_pairs.some(p => p.sort().join('') === pair);
  if (is_ionic) return { bond: true, type: 'ionic', reason: 'enzyme_complement' };

  // Adjacent centers can bridge
  if (a.center !== b.center && Math.abs(a.gate - b.gate) <= 8) {
    return { bond: true, type: 'bridge', reason: 'center_proximity' };
  }

  return { bond: false, reason: 'no_valence_match' };
}

// Wake signal — called by the boot sequencer
export function wake(mesh) {
  const signal = AGENT_IDENTITY.is_seed ? 1.0 : 0.1;
  return catalyze({ signal, from: null }, mesh);
}
