import { ConsoleLogger } from "@nestjs/common";

export class SyncLogger extends ConsoleLogger {
  #block: number;
  constructor(block: number) {
    super();
    this.#block = block;
  }

  log(message: any): void {
    super.log(`[Block ${this.#block}] ${message}`);
  }

  error(message: any): void {
    super.error(`[Block ${this.#block}] ${message}`);
  }
}