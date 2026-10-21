(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };

  var header = $('.site-header');
  var navToggle = $('#navToggle');
  var navLinks = $('#navLinks');

  function setMenu(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('open', open);
  }
  navToggle.addEventListener('click', function () {
    setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  $$('a', navLinks).forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          $$('a', navLinks).forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  var revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {

    revealItems.forEach(function (el) { el.classList.add('in'); });
  }

  var typedEl = $('#typed');
  var roles = ['Working scholar', '3rd-year BSIT student', 'Aspiring IT professional', 'Lifelong learner'];
  if (!prefersReducedMotion) {
    var roleIndex = 0, charIndex = 0, deleting = false;
    var typeLoop = function () {
      var word = roles[roleIndex];
      charIndex += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, charIndex);

      var delay = deleting ? 40 : 85;
      if (!deleting && charIndex === word.length) { deleting = true; delay = 1600; }
      else if (deleting && charIndex === 0) { deleting = false; roleIndex = (roleIndex + 1) % roles.length; delay = 400; }
      setTimeout(typeLoop, delay);
    };
    typedEl.textContent = '';
    setTimeout(typeLoop, 900);
  }

  var ticks = $('#ticks');
  var tickMarkup = '';
  for (var i = 0; i < 60; i++) {
    var major = i % 5 === 0;
    var angle = (i * 6 - 90) * Math.PI / 180;
    var outer = 97, inner = major ? 90 : 93.5;
    tickMarkup += '<line class="' + (major ? 'major' : '') + '" ' +
      'x1="' + (100 + Math.cos(angle) * inner).toFixed(2) + '" y1="' + (100 + Math.sin(angle) * inner).toFixed(2) + '" ' +
      'x2="' + (100 + Math.cos(angle) * outer).toFixed(2) + '" y2="' + (100 + Math.sin(angle) * outer).toFixed(2) + '"/>';
  }
  ticks.innerHTML = tickMarkup;

  var clockEl = $('#clock');
  var orbit = $('#secondsOrbit');
  var pad = function (n) { return String(n).padStart(2, '0'); };

  function updateClock() {
    var now = new Date();
    var seconds = now.getSeconds() + (prefersReducedMotion ? 0 : now.getMilliseconds() / 1000);
    orbit.style.setProperty('--sec', (seconds * 6) + 'deg');
    clockEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    clockEl.setAttribute('datetime', now.toTimeString().slice(0, 8));
  }
  updateClock();
  if (prefersReducedMotion) {
    setInterval(updateClock, 1000);
  } else {
    (function frame() { updateClock(); requestAnimationFrame(frame); })();
  }

  var traitCopy = {
    persistent: 'Balancing work and school means I keep going even when the schedule is tight.',
    curious: 'I like finding out how things work, which is why I am learning programming and networking.',
    practical: 'I care about fixing real problems, like troubleshooting a PC, more than talking about them.'
  };
  var traitButtons = $$('.trait');
  var traitText = $('#traitText');
  traitButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      traitButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      traitText.textContent = traitCopy[btn.dataset.trait];
    });
  });

  var canvas = $('#network');
  var ctx = canvas.getContext('2d');
  var glow = $('#glow');
  var nodes = [];
  var pointer = { x: -9999, y: -9999 };
  var width = 0, height = 0, dpr = 1;
  var LINK_DISTANCE = 130;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = Math.max(28, Math.min(70, Math.round(width * height / 22000)));
    nodes = [];
    for (var n = 0; n < count; n++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25
      });
    }
  }

  function drawNetwork(move) {
    ctx.clearRect(0, 0, width, height);

    nodes.forEach(function (node) {
      if (move) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(61, 230, 255, 0.35)';
      ctx.fill();
    });

    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        var dx = nodes[a].x - nodes[b].x;
        var dy = nodes[a].y - nodes[b].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DISTANCE) {
          ctx.strokeStyle = 'rgba(61, 230, 255,' + (0.14 * (1 - dist / LINK_DISTANCE)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(nodes[b].x, nodes[b].y);
          ctx.stroke();
        }
      }

      var px = nodes[a].x - pointer.x;
      var py = nodes[a].y - pointer.y;
      var pd = Math.sqrt(px * px + py * py);
      if (pd < 170) {
        ctx.strokeStyle = 'rgba(61, 230, 255,' + (0.4 * (1 - pd / 170)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }
    }
  }

  var animating = true;
  function networkLoop() {
    if (animating) drawNetwork(true);
    requestAnimationFrame(networkLoop);
  }

  resizeCanvas();
  if (prefersReducedMotion) {
    drawNetwork(false);
  } else {
    networkLoop();

    document.addEventListener('visibilitychange', function () { animating = !document.hidden; });
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeCanvas();
      if (prefersReducedMotion) drawNetwork(false);
    }, 150);
  });

  var pending = false;
  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (!pending) {
      pending = true;
      requestAnimationFrame(function () {
        glow.style.setProperty('--mx', pointer.x + 'px');
        glow.style.setProperty('--my', pointer.y + 'px');
        pending = false;
      });
    }
  }, { passive: true });
  window.addEventListener('pointerleave', function () { pointer.x = pointer.y = -9999; });

  var questions = [
    {
      q: 'Which movie is on my favorites list?',
      options: ['Inception', 'Interstellar', 'The Matrix', 'Tenet'],
      answer: 'Inception',
      note: 'Inception. I like stories that keep you thinking.'
    },
    {
      q: 'Which two shows do I watch?',
      options: ['Peaky Blinders and Breaking Bad', 'Stranger Things and Squid Game', 'Money Heist and Narcos', 'Better Call Saul and Succession'],
      answer: 'Peaky Blinders and Breaking Bad',
      note: 'Peaky Blinders and Breaking Bad are both on my list.'
    },
    {
      q: 'What do I plan to collect once I have my own money?',
      options: ['Watches', 'Sneakers', 'Mechanical keyboards', 'Game consoles'],
      answer: 'Watches',
      note: 'Watches. That is why the photo sits in a watch bezel.'
    },
    {
      q: 'What does my motto, "Qui audet vincit," mean?',
      options: ['Who dares, wins', 'Knowledge is power', 'Slow and steady wins the race', 'Practice makes perfect'],
      answer: 'Who dares, wins',
      note: 'Who dares, wins.'
    },
    {
      q: 'What am I learning right now?',
      options: ['Programming and networking', 'Graphic design and video editing', 'Cooking and baking', 'Photography and music production'],
      answer: 'Programming and networking',
      note: 'Programming and networking. The background is a small nod to that.'
    }
  ];

  var quizState = { index: 0, score: 0, locked: false };
  var els = {
    box: $('#quizBox'),
    bar: $('#quizBar'),
    count: $('#quizCount'),
    question: $('#quizQuestion'),
    options: $('#quizOptions'),
    feedback: $('#quizFeedback'),
    next: $('#quizNext'),
    result: $('#quizResult'),
    score: $('#quizScore'),
    message: $('#quizMessage'),
    restart: $('#quizRestart')
  };

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  function showQuestion() {
    var item = questions[quizState.index];
    quizState.locked = false;

    els.count.textContent = 'Question ' + (quizState.index + 1) + ' of ' + questions.length;
    els.bar.style.width = (quizState.index / questions.length * 100) + '%';
    els.question.textContent = item.q;
    els.feedback.textContent = '';
    els.next.hidden = true;
    els.options.innerHTML = '';

    shuffle(item.options).forEach(function (text) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.textContent = text;
      btn.addEventListener('click', function () { chooseAnswer(btn, text); });
      els.options.appendChild(btn);
    });
  }

  function chooseAnswer(btn, text) {
    if (quizState.locked) return;
    quizState.locked = true;

    var item = questions[quizState.index];
    var correct = text === item.answer;
    if (correct) quizState.score++;

    $$('.quiz-option', els.options).forEach(function (option) {
      option.disabled = true;
      if (option.textContent === item.answer) option.classList.add('correct');
    });
    if (!correct) btn.classList.add('wrong');

    els.feedback.textContent = (correct ? 'Nice. ' : 'Close. ') + item.note;
    els.next.textContent = quizState.index === questions.length - 1 ? 'See my score' : 'Next question';
    els.next.hidden = false;
    els.next.focus();
  }

  function showResult() {
    var total = questions.length;
    els.bar.style.width = '100%';
    $('.quiz-count', els.box).hidden = true;
    els.question.hidden = true;
    els.options.hidden = true;
    els.feedback.textContent = '';
    els.next.hidden = true;
    els.result.hidden = false;

    els.score.textContent = quizState.score + ' out of ' + total;
    if (quizState.score === total) {
      els.message.textContent = 'Perfect score. You know me well.';
    } else if (quizState.score >= 3) {
      els.message.textContent = 'Nice work. You were paying attention.';
    } else {
      els.message.textContent = 'Scroll back up, look around, and try again.';
    }
    els.restart.focus();
  }

  els.next.addEventListener('click', function () {
    quizState.index++;
    if (quizState.index < questions.length) {
      showQuestion();
      els.question.setAttribute('tabindex', '-1');
      els.question.focus();
    } else {
      showResult();
    }
  });

  els.restart.addEventListener('click', function () {
    quizState = { index: 0, score: 0, locked: false };
    els.result.hidden = true;
    $('.quiz-count', els.box).hidden = false;
    els.question.hidden = false;
    els.options.hidden = false;
    showQuestion();
    els.question.setAttribute('tabindex', '-1');
    els.question.focus();
  });


  var copyBtn = $('#copyEmail');
  var copyStatus = $('#copyStatus');
  var emailAddress = $('#emailText').textContent.trim();
  var copyTimer;

  function showCopied(message) {
    copyStatus.textContent = message;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () { copyStatus.textContent = ''; }, 2500);
  }

  function fallbackCopy() {
    var field = document.createElement('textarea');
    field.value = emailAddress;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(field);
    showCopied(ok ? 'Email copied.' : 'Could not copy. Please select the email and copy it manually.');
  }

  copyBtn.addEventListener('click', function () {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(emailAddress).then(
        function () { showCopied('Email copied.'); },
        fallbackCopy
      );
    } else {
      fallbackCopy();
    }
  });

  showQuestion();
})();
