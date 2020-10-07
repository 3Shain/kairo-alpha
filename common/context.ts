export let __KAIRO__CONTEXT__:DisposableContext = null;

export class DisposableContext {

    private disposeHandlers: Set<Function> = new Set<Function>();
    _registerOnDispose(
        fn:Function
    ){
        this.disposeHandlers.add(fn);
        return ()=>{
            this.disposeHandlers.delete(fn);
        }
    }

    dispose(){
        this.disposeHandlers.forEach(fn=>fn());
        this.disposeHandlers.clear();
    }
}

export function using<P extends any[],T>(
    fn:(...args:P)=>T,
    args: P
){
    if(__KAIRO__CONTEXT__){
        throw 'ALREADY IN REACTIVEZONE'
    }
    __KAIRO__CONTEXT__ = new DisposableContext();
    const ret = fn(...args);
    const dispose = ()=>__KAIRO__CONTEXT__.dispose();
    __KAIRO__CONTEXT__ = null;
    return {
        dispose,
        result:ret
    };
}

export function runInZone<T>(fn:(...args:any[])=>T){
    if(!__KAIRO__CONTEXT__){
        throw 'NOT IN ZONE';
    }
    const zone = __KAIRO__CONTEXT__;
    return (...args:any[])=>{
        if(__KAIRO__CONTEXT__){
            throw 'SHOULD BE NOT IN ZONE';
        }
        __KAIRO__CONTEXT__ = zone;
        fn(...args);
        __KAIRO__CONTEXT__ = null;
    }
}

export function onDispose(fn:()=>void) {
    if(!__KAIRO__CONTEXT__){
        throw 'NOT IN ZONE';
    }
    __KAIRO__CONTEXT__._registerOnDispose(fn);
}