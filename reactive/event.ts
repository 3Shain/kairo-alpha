import { Disposable, DisposablePromise, __KAIRO__CONTEXT__ } from "../common";
import { BehaviorStream, createBehavior } from "./behavior";
import { Event, Listener, OperatorFunction } from "./types";

export function createEvent<T>(): [EventStream<T>, (payload: T) => void] {
  const evt = new EventStream<T>();
  if (__KAIRO__CONTEXT__) {
    __KAIRO__CONTEXT__._registerOnDispose(evt.dispose.bind(evt));
  }
  return [evt, evt.emit.bind(evt)];
}

export class EventStream<T> implements Event<T>, Disposable, Listener<T> {
  *[Symbol.iterator](): Iterator<DisposablePromise<T>, T> {
    return yield this.await();
  }

  await() {
    return new DisposablePromise<T>((res, rej) => {
      return this.addListener({
        emit: s => {
          res(s);
        },
        dispose: () => {
          rej("DISPOSED");
        }
      });
    });
  }

  emit(payload: T) {
    this.listeners.forEach(l => l.emit(payload));
  }

  dispose() {
    this.listeners.forEach(l => l.dispose());
    this.listeners.clear();
    this.listeners = null;
    this._closed = true;
  }

  throwOn(event: EventStream<unknown>,event2?: EventStream<unknown>): DisposablePromise<T> {
    return new DisposablePromise((res, rej) => {
      const c = this.await().then(res, rej);
      const p = event.await().then(()=>{rej('ABORT')}, () => {
        /* not defined behavior */
      });
      const p2 = event2?.await().then(()=>{rej('ABORT')}, () => {
        /* not defined behavior */
      });
      return () => {
        c.dispose();
        p.dispose();
        p2?.dispose();
      };
    });
  }

  pipe() {}

  private _closed = false;
  private listeners = new Set<Listener<T>>();

  addListener = (listener: Listener<T>) => {
    if (this._closed) {
      throw "CLOSED";
    }
    this.listeners.add(listener);
    return () => {
      if (!this._closed) {
        this.listeners.delete(listener);
      }
    };
  };
}

export function hold<T>(
  value: T
): OperatorFunction<EventStream<T>, BehaviorStream<T>> {
  return (event: EventStream<T>) => {
    const [beh, setBeh] = createBehavior(value);
    event.addListener({
      emit: setBeh
    });
    return beh;
  };
}

export function merge<T extends any[]>(...streams: T) {
  const [event, raise] = createEvent();
}

export function reduce<T, E>(
  reducer: (prev: T, event: E) => T,
  initial: T
): OperatorFunction<EventStream<E>, BehaviorStream<T>> {
  return (event: EventStream<E>) => {
    const [beh, setBeh] = createBehavior(initial);
    let prev = initial;
    event.addListener({
      emit: v => {
        prev = reducer(prev, v);
        setBeh(prev);
      }
    });
    return beh;
  };
}
