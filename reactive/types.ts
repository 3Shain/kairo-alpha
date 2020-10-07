export interface Listener<T> {
    emit(value:T):void;
    dispose?():void;
}

export interface Behavior<T> {
  [Symbol.iterator](): Iterator<never,T>;
  value: T;
  pipe():any;
}

export interface Event<T> {
  [Symbol.iterator](): Iterator<unknown,T>;
  pipe():any;
}

export type OperatorFunction<A,B> = (v:A)=>B;