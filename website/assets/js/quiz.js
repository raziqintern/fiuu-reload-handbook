/* Fiuu Reload Academy — inline quiz engine.

   Multiple choice / "spot the bug":
   <div class="quiz" data-type="mcq">
     <p class="quiz-q">...question...</p>
     <ul class="quiz-options">
       <li data-correct="false" data-explain="...">option text</li>
       <li data-correct="true"  data-explain="...">option text</li>
     </ul>
   </div>

   Predict-the-output / fill-in-the-blank:
   <div class="quiz" data-type="predict" data-answer="expected text">
     <p class="quiz-q">...question...</p>
     <textarea class="quiz-blank"></textarea>
     <button type="button" class="quiz-submit">Check answer</button>
     <div class="quiz-feedback"></div>
   </div>
*/

(function () {
  function initMcq(quiz) {
    const list = quiz.querySelector(".quiz-options");
    const items = Array.from(list.querySelectorAll("li"));
    let feedback = quiz.querySelector(".quiz-feedback");
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = "quiz-feedback";
      quiz.appendChild(feedback);
    }
    const optionsHtml = items
      .map((li, i) => `<li><button type="button" data-i="${i}">${li.innerHTML}</button></li>`)
      .join("");
    list.innerHTML = optionsHtml;

    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-i"));
        const correct = items[i].getAttribute("data-correct") === "true";
        list.querySelectorAll("button").forEach((b) => (b.disabled = true));
        btn.classList.add(correct ? "correct" : "incorrect");
        if (!correct) {
          const correctIdx = items.findIndex((li) => li.getAttribute("data-correct") === "true");
          const correctBtn = list.querySelector(`button[data-i="${correctIdx}"]`);
          if (correctBtn) correctBtn.classList.add("correct");
        }
        feedback.className = "quiz-feedback " + (correct ? "ok" : "bad");
        feedback.textContent = (correct ? "✓ Correct — " : "✗ Not quite — ") + (items[i].getAttribute("data-explain") || "");
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "tryit-reset";
        retry.style.marginTop = "8px";
        retry.textContent = "Try again";
        retry.addEventListener("click", () => {
          list.querySelectorAll("button").forEach((b) => {
            b.disabled = false;
            b.classList.remove("correct", "incorrect");
          });
          feedback.textContent = "";
          feedback.className = "quiz-feedback";
          retry.remove();
        });
        feedback.appendChild(document.createElement("br"));
        feedback.appendChild(retry);
      });
    });
  }

  function initPredict(quiz) {
    const answer = (quiz.getAttribute("data-answer") || "").trim().toLowerCase();
    const textarea = quiz.querySelector(".quiz-blank");
    const btn = quiz.querySelector(".quiz-submit");
    let feedback = quiz.querySelector(".quiz-feedback");
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = "quiz-feedback";
      quiz.appendChild(feedback);
    }
    btn.addEventListener("click", () => {
      const given = (textarea.value || "").trim().toLowerCase();
      const correct = given === answer;
      feedback.className = "quiz-feedback " + (correct ? "ok" : "bad");
      feedback.textContent = correct
        ? "✓ Correct."
        : `✗ Not quite. Expected: ${quiz.getAttribute("data-answer")}`;
    });
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) btn.click();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quiz").forEach((quiz) => {
      const type = quiz.getAttribute("data-type");
      if (type === "mcq") initMcq(quiz);
      else if (type === "predict") initPredict(quiz);
    });
  });
})();
