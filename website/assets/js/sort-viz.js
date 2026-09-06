/* Fiuu Reload Academy — animated bubble-sort visualizer.
   Markup: <div class="sort-viz" data-values="8,3,5,1,9,2,7,4,6"></div> */

(function () {
  function recordBubbleSortSteps(values) {
    const arr = values.map((v, id) => ({ value: v, id }));
    const steps = [{ type: "start", order: arr.map((x) => x.id) }];
    const n = arr.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        steps.push({ type: "compare", order: arr.map((x) => x.id), pair: [j, j + 1] });
        if (arr[j].value > arr[j + 1].value) {
          const tmp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = tmp;
          steps.push({ type: "swap", order: arr.map((x) => x.id), pair: [j, j + 1] });
        }
      }
    }
    steps.push({ type: "done", order: arr.map((x) => x.id) });
    return steps;
  }

  function shuffle(values) {
    const a = [...values];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function initSortViz(container) {
    const initialValues = (container.getAttribute("data-values") || "8,3,5,1,9,2,7,4,6")
      .split(",")
      .map(Number);
    const barWidth = 34;
    const gap = 8;
    const stageHeight = 170;

    let values = initialValues;
    let steps, stepIndex, bars, playTimer;

    container.innerHTML = `
      <div class="sort-viz-controls">
        <button type="button" class="sort-viz-btn sort-viz-play primary">▶ Play</button>
        <button type="button" class="sort-viz-btn sort-viz-step">Step ▸</button>
        <button type="button" class="sort-viz-btn sort-viz-shuffle">🔀 Shuffle</button>
        <button type="button" class="sort-viz-btn sort-viz-reset">Reset</button>
        <span class="sort-viz-status"></span>
      </div>
      <div class="sort-viz-stage" style="height:${stageHeight}px;"></div>
    `;
    const stage = container.querySelector(".sort-viz-stage");
    const status = container.querySelector(".sort-viz-status");
    const playBtn = container.querySelector(".sort-viz-play");

    function build() {
      stage.innerHTML = "";
      steps = recordBubbleSortSteps(values);
      stepIndex = 0;
      const maxVal = Math.max(...values);
      bars = values.map((v) => {
        const el = document.createElement("div");
        el.className = "sort-bar";
        el.style.width = barWidth + "px";
        el.style.height = Math.max(14, (v / maxVal) * (stageHeight - 20)) + "px";
        el.textContent = v;
        stage.appendChild(el);
        return el;
      });
      renderStep(0);
    }

    function renderStep(i) {
      const step = steps[i];
      step.order.forEach((id, pos) => {
        bars[id].style.left = pos * (barWidth + gap) + "px";
        bars[id].classList.remove("comparing", "swapping");
      });
      if (step.type === "compare" || step.type === "swap") {
        step.pair.forEach((pos) => {
          bars[step.order[pos]].classList.add(step.type === "swap" ? "swapping" : "comparing");
        });
      }
      const label = step.type === "done" ? "Sorted!" : "Bubble Sort";
      status.textContent = `Step ${i} / ${steps.length - 1} — ${label}`;
      playBtn.disabled = step.type === "done";
    }

    function stopPlaying() {
      clearInterval(playTimer);
      playTimer = null;
      playBtn.textContent = "▶ Play";
    }

    container.querySelector(".sort-viz-step").addEventListener("click", () => {
      stopPlaying();
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        renderStep(stepIndex);
      }
    });

    playBtn.addEventListener("click", () => {
      if (playTimer) {
        stopPlaying();
        return;
      }
      playBtn.textContent = "⏸ Pause";
      playTimer = setInterval(() => {
        if (stepIndex >= steps.length - 1) {
          stopPlaying();
          return;
        }
        stepIndex++;
        renderStep(stepIndex);
      }, 450);
    });

    container.querySelector(".sort-viz-shuffle").addEventListener("click", () => {
      stopPlaying();
      values = shuffle(values);
      build();
    });

    container.querySelector(".sort-viz-reset").addEventListener("click", () => {
      stopPlaying();
      values = initialValues;
      build();
    });

    build();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".sort-viz").forEach(initSortViz);
  });
})();
