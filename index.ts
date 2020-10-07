import { html, render } from "lit-html";
import { DisposablePromise } from "./common";
import { createTask } from "./concurrency";
import { defineElement } from "./lit";
import { createBehavior, createEvent, hold } from "./reactive";
import "./style.css";

defineElement(
  () => {
    const [position, setPosition] = createBehavior([0, 0]);

    const [mousedown, tmd] = createEvent<MouseEvent>();
    const [mousemove, tmm] = createEvent<MouseEvent>();
    const [mouseup, tmu] = createEvent<MouseEvent>();
    const [mouseleave, tml] = createEvent<MouseEvent>();
    const [performDnd] = createTask(function*(e: MouseEvent) {
      let [x, y] = yield* position;
      let lastMv = e;
      while (true) {
        try {
          const mv = yield* mousemove.throwOn(mouseup, mouseleave);
          x += mv.clientX - lastMv.clientX;
          y += mv.clientY - lastMv.clientY;
          lastMv = mv;
          setPosition(radius(x, y, 50));
        } catch {
          break;
        } // intend to throw error : logic interrupte
      }
      [x, y] = yield* position; //...
      let frameTotal = Math.floor(Math.sqrt(x * x + y * y) / 2);
      let framePass = 0;
      while (framePass < frameTotal) {
        framePass++;
        setPosition(interpolate2d(x, y, 1 - framePass / frameTotal));
        yield* nextFrame();
      }
      // done
    });
    mousedown.addListener({
      emit: performDnd
    });

    return {
      position,
      tmd,
      tmm,
      tmu,
      tml
    };
  },
  props =>
    html`
      <p>
        x:${props.position[0].toFixed(2)}, y:${props.position[1].toFixed(2)}
      </p>
      <div class="box">
        <div
          class="sticker"
          @mouseup=${props.tmu}
          @mousemove=${props.tmm}
          @mousedown=${props.tmd}
          @mouseleave=${props.tml}
          style="transform:translate3d(${props.position[0]}px,
      ${props.position[1]}px,0px)"
        ></div>
        <div class="bg"></div>
      </div>
    `
);

function interpolate2d(x: number, y: number, step: number) {
  step = EasingFunctions.easeInCubic(step);
  if (step < 0) {
    step = 0;
  }
  return [x * step, y * step];
}

function* nextFrame() {
  yield new DisposablePromise((res, rej) => {
    const t = requestAnimationFrame(res);
    return () => cancelAnimationFrame(t);
  });
}

function radius(x: number, y: number, radius: number) {
  const d = x * x + y * y;
  const p = radius * radius;
  if (d <= p) {
    return [x, y];
  } else {
    const g = radius / Math.sqrt(d);
    return [x * g, y * g];
  }
}

const EasingFunctions = {
  // no easing, no acceleration
  linear: t => t,
  // accelerating from zero velocity
  easeInQuad: t => t * t,
  // decelerating to zero velocity
  easeOutQuad: t => t * (2 - t),
  // acceleration until halfway, then deceleration
  easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  // accelerating from zero velocity
  easeInCubic: t => t * t * t,
  // decelerating to zero velocity
  easeOutCubic: t => --t * t * t + 1,
  // acceleration until halfway, then deceleration
  easeInOutCubic: t =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  // accelerating from zero velocity
  easeInQuart: t => t * t * t * t,
  // decelerating to zero velocity
  easeOutQuart: t => 1 - --t * t * t * t,
  // acceleration until halfway, then deceleration
  easeInOutQuart: t => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),
  // accelerating from zero velocity
  easeInQuint: t => t * t * t * t * t,
  // decelerating to zero velocity
  easeOutQuint: t => 1 + --t * t * t * t * t,
  // acceleration until halfway, then deceleration
  easeInOutQuint: t =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t
};
