import { Disposable,__KAIRO__CONTEXT__ } from "../common";
import { EventStream } from "./event";
import { Behavior, Listener } from "./types";

export function createBehavior<T>(value: T): [BehaviorStream<T>, (v: T) => void] {
    const beh = new BehaviorStream(value);
    if (__KAIRO__CONTEXT__) {
        __KAIRO__CONTEXT__._registerOnDispose(beh.dispose.bind(beh));
    }
    return [beh,(v)=>{
      //transaction:
      beh.emit(v);
    }];
}

export class BehaviorStream<T> implements Behavior<T>,Disposable, Listener<T> {

    *[Symbol.iterator]() {
        return this.value;
    }

    get value(){
      // commit?
      return this._value;
    }

    pipe(){

    }

    constructor(private _value: T) { }

    emit(value: T) {
        this._value = value;
        // send msg to all listener
        this.listeners.forEach(l => l.emit(value));
    }

    dispose() {
        this.listeners.forEach(l => l.dispose());
        this.listeners.clear();
        this.listeners = null;
        this._closed = true;
    }

    private _closed = false;
    private listeners = new Set<Listener<T>>();

    addListener(listener: Listener<T>) {
        if (this._closed) {
            throw 'CLOSED';
        }
        this.listeners.add(listener);
        listener.emit(this._value);
        return () => {
            if (!this._closed) {
                this.listeners.delete(listener);
            }
        }
    }
}