import { ConsoleLogger } from "@nestjs/common";

export class SyncLogger extends ConsoleLogger {
  #block: number;
  constructor(block: number) {
    super();
    this.#block = block;
  }

  log(message: any): void {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }

    super.log(`[Block ${this.#block}] ${message}`);
  }

  error(message: any): void {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }

    super.error(`[Block ${this.#block}] ${message}`);
  }
}