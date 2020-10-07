import { DisposablePromise } from "../common";
import { throwIfTimeout } from "./utils";

export class Semaphore {
  private _current: number;

  public get current() {
    return this._current;
  }

  constructor(public readonly max: number) {
    this._current = max;
  }

  release() {
    if (this.current === this.max) {
      throw "FULL";
    }
    this._current++;
    for (let next of this.set) {
      next(); //order: same as insert
      break;
    }
  }

  *waitOne(timeoutMs: number = -1) {
    if (this._current > 0) {
      this._current--;
      return;
    }
    if (timeoutMs >= 0) {
      yield throwIfTimeout(this.wait(), timeoutMs);
    } else {
      yield this.wait();
    }
    this._current--;
    return;
  }

  private set = new Set<Function>();

  private wait() {
    return new DisposablePromise((res, rej) => {
      this.set.add(res);
      return () => {
        this.set.delete(res);
      };
    });
  }
}
