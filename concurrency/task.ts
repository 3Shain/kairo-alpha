import { Disposable, DisposablePromise } from "../common";
import { Semaphore } from "./semaphore";
import { __KAIRO__CONTEXT__ } from "../common";
import { createBehavior } from "../reactive";

export interface Task<T, P extends any[] = []> {
  (...args: P): Generator<unknown, T>;
}

const CANCELED = {
  CANCELED: 1
};

export interface Runner {
  perform<T>(task:Task<T>):DisposablePromise<T>;
}

export function createTask<T, P extends any[] = []>(task:Task<T,P>,runner?:Runner){

  let p:Disposable;
  return [(...args:P)=>{
    p?.dispose();
    p = executeTask(task,...args);
  }];
}

function semaphoreTask<T>(task: Task<T>, semaphore: Semaphore) {
  const zone = __KAIRO__CONTEXT__;
  const [isRunningBeh, setIsRunning] = createBehavior(false);
  const [isWaiting, setWaiting] = createBehavior(false);

  const perform = () => {
    return executeTask(function*() {
        setWaiting(true);
        try {
          yield* semaphore.waitOne();
        } catch (e) {
          setWaiting(false); // TODO: transaction: if waitOne is synchronize
          throw e;
        }
        let result = undefined;
        try {
          setIsRunning(true);
          result = yield* task();
        } finally {
          setIsRunning(false);
          semaphore.release();
        }
        return result; // or throw?!
      })
  };
}

export function executeTask<T, P extends any[] = []>(task: Task<T,P>,...args:P): DisposablePromise<T> {
  return new DisposablePromise((res, rej) => {
    const generator = task(...args);
    let currentDisposer: Disposable = null;
    let running = true;
    const resumeTask = (nextYield: unknown, error: unknown) => {
      if (error) {
        console.log(error);
        try{
        generator.throw(new Error('aaa')); //? allow recovery?
        } catch(e){
          console.log('unhandled error!');
        }
      }
      try {
        const lastYield = generator.next(nextYield);
        if (lastYield.done) {
          running = false;
          console.log('finished?maybe');
          res(lastYield.value);
          return;
        } else if (lastYield.value instanceof DisposablePromise) {
          currentDisposer = (lastYield.value as DisposablePromise<unknown>).then(
            (a)=>resumeTask(a,undefined),
            (e:any)=>resumeTask(undefined,e)
          )
        } else {
          console.log(lastYield.value);
        }
      } catch (e) {
        if (e.CANCELED) {
          //break; // stop running now...
        }
      }
    };
    resumeTask(undefined, undefined);
    return () => {
      currentDisposer.dispose();
      if(running){

      resumeTask(undefined, CANCELED); //if running
      }
    };
  });
}
