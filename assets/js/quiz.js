/* ============================================================================
   Pre-test / Post-test engine — markup driven, offline friendly.

   Expected markup:
     <section class="quiz" id="pretest" data-quiz="pre" data-chapter="ch01">
       <div class="quiz-head">…</div>
       <div class="quiz-body">
         <div class="q" data-answer="b"
              data-explain-th="เหตุผล…" data-explain-en="Reason…">
           <div class="q-text">…</div>
           <div class="opts">
             <label class="opt" data-opt="a"><input type="radio"><span>…</span></label>
           </div>
         </div>
         …
       </div>
     </section>
   Question numbering, radio grouping, buttons and the score row are built here.
   Copyright (c) 2026 Jedsada Saijai. All rights reserved.
   ========================================================================== */
(function () {
  'use strict';

  var t = function (th, en) {
    return (window.FEE && window.FEE.t) ? window.FEE.t(th, en) : th;
  };

  function bilingual(th, en) {
    return '<span class="th">' + th + '</span><span class="en">' + en + '</span>';
  }

  function build(quiz, index) {
    var questions = Array.prototype.slice.call(quiz.querySelectorAll('.q'));
    var group = (quiz.id || 'quiz' + index);

    questions.forEach(function (q, i) {
      // Number the question
      var text = q.querySelector('.q-text');
      if (text && !text.querySelector('.q-no')) {
        text.insertAdjacentHTML('afterbegin', '<span class="q-no">' + (i + 1) + '</span>');
      }
      // Wire radio inputs
      q.querySelectorAll('.opt').forEach(function (opt) {
        var input = opt.querySelector('input[type="radio"]');
        if (!input) {
          input = document.createElement('input');
          input.type = 'radio';
          opt.insertAdjacentElement('afterbegin', input);
        }
        input.name = group + '-q' + (i + 1);
        input.value = opt.dataset.opt || '';
      });
      // Feedback slot
      if (!q.querySelector('.q-feedback')) {
        var fb = document.createElement('div');
        fb.className = 'q-feedback';
        fb.hidden = true;
        q.appendChild(fb);
      }
    });

    // Footer with the action buttons and the score read-out
    var foot = document.createElement('div');
    foot.className = 'quiz-foot';
    foot.innerHTML =
      '<button type="button" class="btn btn-primary" data-act="check">' +
        bilingual('ตรวจคำตอบ', 'Check answers') + '</button>' +
      '<button type="button" class="btn btn-outline" data-act="reset">' +
        bilingual('ทำใหม่', 'Try again') + '</button>' +
      '<span class="quiz-score" data-role="score" hidden></span>';
    quiz.querySelector('.quiz-body').appendChild(foot);

    foot.querySelector('[data-act="check"]').addEventListener('click', function () {
      grade(quiz, questions);
    });
    foot.querySelector('[data-act="reset"]').addEventListener('click', function () {
      reset(quiz, questions);
    });
  }

  function grade(quiz, questions) {
    var correct = 0;
    var unanswered = 0;

    questions.forEach(function (q) {
      var answer = (q.dataset.answer || '').trim().toLowerCase();
      var picked = q.querySelector('input[type="radio"]:checked');
      var fb = q.querySelector('.q-feedback');

      q.querySelectorAll('.opt').forEach(function (opt) {
        opt.classList.remove('correct', 'wrong');
        var key = (opt.dataset.opt || '').toLowerCase();
        if (key === answer) opt.classList.add('correct');
        else if (picked && opt.contains(picked)) opt.classList.add('wrong');
      });

      if (!picked) { unanswered++; }
      else if (picked.value.toLowerCase() === answer) { correct++; }

      var ok = picked && picked.value.toLowerCase() === answer;
      var head = ok
        ? bilingual('✓ ถูกต้อง — ', '✓ Correct — ')
        : bilingual('✗ ยังไม่ถูก — ', '✗ Not correct — ');
      fb.className = 'q-feedback ' + (ok ? 'ok' : 'no');
      fb.innerHTML = head + bilingual(
        q.dataset.explainTh || 'ทบทวนเนื้อหาในบทนี้อีกครั้ง',
        q.dataset.explainEn || 'Review the related section of this chapter.'
      );
      fb.hidden = false;
    });

    quiz.classList.add('graded');

    var total = questions.length;
    var pct = total ? Math.round((correct / total) * 100) : 0;
    var score = quiz.querySelector('[data-role="score"]');
    score.hidden = false;
    score.innerHTML =
      bilingual('คะแนน: ', 'Score: ') +
      '<span class="pct">' + correct + '/' + total + '</span> (' + pct + '%)' +
      (unanswered
        ? ' <span class="muted small">' +
            bilingual('— ยังไม่ได้ตอบ ' + unanswered + ' ข้อ',
                      '— ' + unanswered + ' unanswered') + '</span>'
        : '');

    if (window.FEE && window.FEE.saveScore) {
      window.FEE.saveScore(
        quiz.dataset.chapter || document.body.dataset.chapter,
        quiz.dataset.quiz || 'quiz',
        correct, total
      );
    }
    score.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function reset(quiz, questions) {
    questions.forEach(function (q) {
      q.querySelectorAll('input[type="radio"]').forEach(function (i) { i.checked = false; });
      q.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('correct', 'wrong'); });
      var fb = q.querySelector('.q-feedback');
      if (fb) { fb.hidden = true; fb.className = 'q-feedback'; }
    });
    quiz.classList.remove('graded');
    var score = quiz.querySelector('[data-role="score"]');
    if (score) score.hidden = true;
    quiz.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function init() {
    document.querySelectorAll('.quiz').forEach(build);
    // Keep the auto-generated strings in sync when the language changes:
    // both languages are already in the DOM, so nothing to redraw — the
    // listener exists for quizzes added dynamically by a future page.
    window.addEventListener('langchange', function () { void t; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
