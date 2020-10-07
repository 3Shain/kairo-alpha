import { DisposablePromise } from "../common";

export function retry<T>(fn: () => Iterator<unknown, T>, times: any) {}

export function waitAndRetry<T>() {}

export function throwIfTimeout<T>(
  fn: DisposablePromise<T>,
  timeoutMs: number
): DisposablePromise<T> {
  return new DisposablePromise<T>((res, rej) => {
    const h2 = fn.then(res).catch(rej);
    const handler = setTimeout(() => {
      rej("TIMEOUT");
    }, timeoutMs);
    return () => {
      h2.dispose();
      clearTimeout(handler);
    };
  });
}
