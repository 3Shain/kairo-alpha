import { DisposablePromise, __KAIRO__CONTEXT__ } from "../common";
import { BehaviorStream, createBehavior } from "../reactive";
import { Semaphore } from "./semaphore";
import { executeTask, Runner } from "./task";

export const keepLatest:Runner & {
  isRunning: BehaviorStream<boolean>
} = (()=>{
  const zone = __KAIRO__CONTEXT__;
  const [isRunning, setIsRunning] = createBehavior(false);
  const semaphore = new Semaphore(1);
  const perform = () => {
    return executeTask(function*() {
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

  return {
    perform,
    isRunning
  }
})();