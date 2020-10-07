import { BehaviorStream } from "./behavior";

let __TRANSACTION_CONTEXT__ = null;

export class TransactionContext {

    _map = new Map<BehaviorStream<unknown>, unknown>();

    emit(be: BehaviorStream<unknown>, value: unknown) {
        // if(this._history.has(be)){
        //     throw '';
        // }
        // this._history.add(be); //
        this._map.delete(be);
        this._map.set(be, value);
    }

    _history = new Set<BehaviorStream<unknown>>();
    commit() {
        for (let [beh, value] of this._map) {
            if (this._history.has(beh)) {
                throw 'CIRCULAR DEPENDENCY OCCURED';
            }
            this._history.add(beh); //
            beh.emit(value);
        }
    }

    dispose() {
        this._map.clear();
        this._history.clear();
    }
}

export class ForbiddenTransactionContext {
    emit(be:BehaviorStream<unknown>, value:unknown){
        throw 'You should not mutate any behavior while watching a behavior change';
    }
}

export function runInForbiddenTransaction(fn:Function){
    
}