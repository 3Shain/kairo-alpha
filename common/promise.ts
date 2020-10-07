import { Disposable } from "./disposable";

interface TeardownLogic {
    (): void;
}

interface PromiseFn<T> {
    (resolve: (v: T) => void, reject: (e: any) => void): TeardownLogic;
}

export class DisposablePromise<T> implements Disposable { //implement disposable

    _dispose:Function;

    constructor(
        fn: PromiseFn<T>
    ) {
        this._dispose = fn(
            (v) => {
                this.dispose(); // TODO? 
                queueMicrotask(() => {
                    this._listeners.forEach(s => s[0](v));
                });
            },
            (e) => {
                this.dispose(); // TODO? 
                queueMicrotask(() => {
                    //
                    this._listeners.forEach(s => s[1](e));
                });
            }
        )
    }

    *[Symbol.iterator](): Iterator<DisposablePromise<T>, T> {
        return yield this;
    }

    private _listeners: [Function,Function][] = [];
    private _value: T;
    private status: 'FULFILLED'|'CANCELED'|'RUNNING'|'IDLE';

    resolve(){

    }

    reject(){

    }

    then(v: (value:T)=>void,reject?:Function) {
        
        this._listeners.push([v,reject]);
        Promise
        return this;
    }

    catch(f:Function) {
        return this;
    }

    private _disposed = false;
    dispose(){
        if(!this._disposed){
            // console.log(this._dispose);
            this._dispose?.();
            this._disposed = true;
        }
    }
}

export function timeout(ms: number) {
    return new DisposablePromise<never>((_, rej) => {
        const handle = setTimeout(() => {
            rej('TIMEOUT');
        }, ms);

        return () => {
            clearTimeout(handle);
        }
    })
}

export function delay(ms: number) {
    return new DisposablePromise<void>((res, _) => {
        const handle = setTimeout(() => {
            res(undefined);
        }, ms);

        return () => {
            clearTimeout(handle);
        }
    })
}

export function fetch2(input: RequestInfo) {
    return new DisposablePromise<Response>((res, rej) => {
        if (typeof input === "string") {
            const controller = new AbortController();
            fetch(input, {
                signal: controller.signal
            }).then(res).catch(rej);
            return () => {
                controller.abort();
            }
        } else {

        }
    })
}