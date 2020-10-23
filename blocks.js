export class Block {
  constructor(id, ...args) {
    this.id = id;
    this.args = args;
  }

  equals(block) {
    return this.id === block.id &&
      this.args.length === block.args.length &&
      this.args.every((a, i) => a === block.args[i]);
  }
}