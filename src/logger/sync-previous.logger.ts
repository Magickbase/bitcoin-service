import { ConsoleLogger } from "@nestjs/common";

export class SyncPreviousLogger extends ConsoleLogger {
  constructor(private _total: number, private _index: number) {
    super();
  }

  log(message: any): void {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }

    super.log(`[index ${this._index} of ${this._total}] ${message}`);
  }

  error(message: any): void {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }

    super.error(`[index ${this._index} of ${this._total}] ${message}`);
  }
}