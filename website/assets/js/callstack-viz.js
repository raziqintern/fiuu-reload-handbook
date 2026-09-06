/* Fiuu Reload Academy — animated call-stack visualizer for recursion.
   Markup: <div class="callstack-viz" data-n="5"></div>
   Simulates Factorial(n) and shows the call stack growing then unwinding. */

(function () {
  function buildFactorialSteps(n) {
    const steps = [];
    const stack = [];

    function call(k) {
      stack.push({ n: k, status: "waiting" });
      steps.push({
        stack: stack.map((f) => ({ ...f })),
        note: k <= 1 ? `Factorial(${k}) called — base case` : `Factorial(${k}) called — needs Factorial(${k - 1})`,
      });

      let result;
      if (k <= 1) {
        result = 1;
      } else {
        result = k * call(k - 1);
      }

      stack[stack.length - 1] = { n: k, status: "returning", result };
      steps.push({ stack: stack.map((f) => ({ ...f })), note: `Factorial(${k}) returns ${result}` });
      stack.pop();
      return result;
    }

    const finalResult = call(n);
    steps.push({ stack: [], note: `Done — Factorial(${n}) = ${finalResult}` });
    return steps;
  }

  function initCallstackViz(container) {
    const n = Number(container.getAttribute("data-n") || 5);
    const steps = buildFactorialSteps(n);
    let stepIndex = 0;

    container.innerHTML = `
      <div class="cstack-controls">
        <button type="button" class="cstack-btn cstack-step-back">◂ Back</button>
        <button type="button" class="cstack-btn cstack-step primary">Step ▸</button>
        <button type="button" class="cstack-btn cstack-reset">Reset</button>
        <span class="cstack-status"></span>
      </div>
      <div class="cstack-note"></div>
      <div class="cstack-frames"></div>
    `;
    const frames = container.querySelector(".cstack-frames");
    const note = container.querySelector(".cstack-note");
    const status = container.querySelector(".cstack-status");

    function render() {
      const step = steps[stepIndex];
      status.textContent = `Step ${stepIndex} / ${steps.length - 1}`;
      note.textContent = step.note;
      frames.innerHTML = step.stack
        .slice()
        .reverse()
        .map((f) => {
          const label = f.status === "returning" ? `Factorial(${f.n}) → ${f.result}` : `Factorial(${f.n}) — waiting`;
          const cls = f.status === "returning" ? "cstack-frame returning" : "cstack-frame";
          return `<div class="${cls}">${label}</div>`;
        })
        .join("");
      if (!step.stack.length) {
        frames.innerHTML = '<div class="cstack-empty">Call stack empty</div>';
      }
    }

    container.querySelector(".cstack-step").addEventListener("click", () => {
      if (stepIndex < steps.length - 1) stepIndex++;
      render();
    });
    container.querySelector(".cstack-step-back").addEventListener("click", () => {
      if (stepIndex > 0) stepIndex--;
      render();
    });
    container.querySelector(".cstack-reset").addEventListener("click", () => {
      stepIndex = 0;
      render();
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".callstack-viz").forEach(initCallstackViz);
  });
})();
