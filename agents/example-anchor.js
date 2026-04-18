// agents/example-anchor.js
export default class AnchorAgent {
  base = 'A'; // Anchor: holds position, reference point
  
  // Gate-level properties (optional)
  gateNumber = 63; // Logic gate
  line = 1; // Investigator
  
  // Behaviors
  async hold(context) {
    // Anchor maintains position in field
    return { action: 'hold', position: context.position };
  }
  
  async pair(transactor) {
    // A pairs with T
    if (transactor.base !== 'T') return null;
    return { bond: 'A-T', stability: 1.0 };
  }
}
