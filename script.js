/* IVE.DEV — behavior. Vanilla JS, no dependencies.
   Motion grammar: Branch → Execute → Report → Merge. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  /* ── theme ───────────────────────────────────────────── */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeToggles = document.querySelectorAll('[data-theme-toggle]');
  var isGerman = document.documentElement.lang === 'de';

  function readTheme() {
    try {
      var storedTheme = localStorage.getItem('ive-theme');
      if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
    } catch (e) {}
    return 'light';
  }

  function applyTheme(theme, persist) {
    var isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggles.forEach(function (toggle) {
      toggle.textContent = isDark ? '● DARK' : '○ LIGHT';
      toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      toggle.setAttribute('aria-label', isGerman
        ? (isDark ? 'Zum hellen Farbschema wechseln' : 'Zum dunklen Farbschema wechseln')
        : (isDark ? 'Switch to light theme' : 'Switch to dark theme'));
    });
    if (themeMeta) {
      themeMeta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    }
    if (persist) {
      try { localStorage.setItem('ive-theme', isDark ? 'dark' : 'light'); } catch (e) {}
    }
  }

  applyTheme(readTheme(), false);
  themeToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  });

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;

  /* ── nav ─────────────────────────────────────────────── */
  var nav = document.querySelector('.nav');
  var onScrollNav = function () {
    nav.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ── reveal figures ──────────────────────────────────── */
  var figures = document.querySelectorAll('.mc, .delegate, .ralph, .term-bleed, .models, .localbox, .memflow, .coord, .board, .pipe, .brief-card, .collab, .stats-row');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    figures.forEach(function (f) {
      f.classList.add('reveal-fig');
      revealIO.observe(f);
    });
  }

  /* ── signature scroll story ──────────────────────────── */
  var story = document.querySelector('.story');
  var stage = document.querySelector('.story-stage');
  var railItems = document.querySelectorAll('.story-rail li');
  var captions = document.querySelectorAll('.story-caption');
  var STEPS = 7;
  var currentStep = 0;
  var storyScroll = null;
  var rbWord = document.querySelector('[data-ralph-word]');
  var rbIter = document.querySelector('[data-ralph-i]');
  var storyRalphTimer = null;
  var storyRalphState = 0;
  var STORY_WORDS = ['work', 'check', 'fix'];

  var setStep = function (step) {
    if (step === currentStep) return;
    currentStep = step;
    stage.setAttribute('data-step', String(step));
    for (var i = 2; i <= STEPS; i++) {
      stage.classList.toggle('s' + i, step >= i);
    }
    railItems.forEach(function (li, idx) {
      li.classList.toggle('on', idx + 1 === step);
      li.classList.toggle('past', idx + 1 < step);
    });
    captions.forEach(function (c) {
      c.classList.toggle('on', c.getAttribute('data-caption') === String(step));
    });
    if (step === 5) startStoryRalph(); else stopStoryRalph();
  };

  /* story RALPH badge: cycle execute → verify → fix while step 5 */
  function startStoryRalph() {
    if (storyRalphTimer || !rbWord || reduceMotion) return;
    storyRalphState = 0;
    storyRalphTimer = setInterval(function () {
      storyRalphState++;
      rbWord.textContent = STORY_WORDS[storyRalphState % 3];
      if (rbIter) rbIter.textContent = String(Math.min(2, 1 + Math.floor(storyRalphState / 3)));
    }, 700);
  }
  function stopStoryRalph() {
    if (storyRalphTimer) { clearInterval(storyRalphTimer); storyRalphTimer = null; }
  }

  var clearStorySteps = function () {
    if (!stage) return;
    currentStep = 0;
    stage.removeAttribute('data-step');
    for (var i = 2; i <= STEPS; i++) stage.classList.remove('s' + i);
    railItems.forEach(function (li) {
      li.classList.remove('on');
      li.classList.remove('past');
    });
    captions.forEach(function (c) { c.classList.remove('on'); });
  };

  var setStaticStory = function () {
    if (!stage) return;
    if (story) story.classList.remove('story-scroll');
    stage.classList.add('story-static');
    clearStorySteps();
    stopStoryRalph();
    if (rbWord) rbWord.textContent = 'passed';
    if (rbIter) rbIter.textContent = '2';
  };

  if (story && stage && !reduceMotion && window.matchMedia('(min-width: 661px)').matches) {
    story.classList.add('story-scroll');
    stage.classList.remove('story-static');
    if (rbWord) rbWord.textContent = STORY_WORDS[0];
    if (rbIter) rbIter.textContent = '1';
    storyScroll = function () {
      var rect = story.getBoundingClientRect();
      var total = story.offsetHeight - window.innerHeight;
      if (total <= 0) { setStep(STEPS); return; }
      var progress = Math.min(1, Math.max(0, -rect.top / total));
      var step = Math.min(STEPS, Math.floor(progress * (STEPS + 0.35)) + 1);
      setStep(step);
    };
    window.addEventListener('scroll', storyScroll, { passive: true });
    storyScroll();
  } else {
    setStaticStory();
  }

  /* ── ambient engine: only run while visible ──────────── */
  var ambientStops = [];
  function ambient(el, fn, ms) {
    if (reduceMotion || !el || !('IntersectionObserver' in window)) return;
    var timer = null;
    var stopped = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!stopped && !reduceMotion && e.isIntersecting && !timer) {
          timer = setInterval(fn, ms);
        } else if (!e.isIntersecting && timer) {
          clearInterval(timer); timer = null;
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    ambientStops.push(function () {
      stopped = true;
      io.disconnect();
      if (timer) { clearInterval(timer); timer = null; }
    });
  }

  function stopAmbientIntervals() {
    ambientStops.forEach(function (stop) { stop(); });
    ambientStops = [];
    stopStoryRalph();
  }

  /* ── hero ambient: terminals advance, commander cycles ── */
  var heroStage = document.querySelector('.hero-stage');
  var termA = document.querySelector('[data-term="a"]');
  var termB = document.querySelector('[data-term="b"]');
  var cmdStatus = document.querySelector('[data-cmd-status]');

  var A_LINES = [
    ['<span class="ps1">$</span> claude -p "migrate session middleware"', '<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> editing src/auth/middleware.ts', '+47 −12 · 3 files'],
    ['<span class="glyph" aria-hidden="true">●</span> running: npm test -- auth', '<span class="glyph" aria-hidden="true">✓</span><span class="sr-only">complete: </span> 31 passed · 3 skipped', 'writing refresh-token rotation'],
    ['<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> editing src/auth/session.ts', 'worktree: wt/backend-auth', '+63 −20 · 4 files']
  ];
  var B_LINES = [
    ['<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> updating LoginForm.tsx', 'token refresh on focus', ''],
    ['<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> updating AuthProvider.tsx', 'context: session expiry', ''],
    ['<span class="glyph" aria-hidden="true">✓</span><span class="sr-only">complete: </span> lint clean · 0 warnings', '<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> wiring redirect flow', '']
  ];
  var CMD_STATES = [
    ['◐', 'planning', 'st-thinking'],
    ['●', 'dispatching', 'st-running'],
    ['●', 'monitoring', 'st-running']
  ];
  var heroTick = 0;
  var renderTermLines = function (term, lines) {
    if (!term) return;
    var kids = term.children;
    for (var i = 0; i < kids.length && i < lines.length; i++) {
      if (lines[i]) {
        kids[i].innerHTML = lines[i].indexOf('<') === 0 ? lines[i]
          : lines[i];
        kids[i].className = lines[i].indexOf('✓') >= 0 ? 't-done'
          : lines[i].indexOf('●') >= 0 ? 't-run'
          : lines[i].indexOf('$') >= 0 && lines[i].indexOf('ps1') >= 0 ? ''
          : 't-dim';
        if (lines[i].indexOf('ps1') >= 0) kids[i].className = '';
      }
    }
  };
  ambient(heroStage, function () {
    heroTick++;
    renderTermLines(termA, A_LINES[heroTick % A_LINES.length]);
    if (heroTick % 2 === 0) renderTermLines(termB, B_LINES[(heroTick / 2) % B_LINES.length]);
    if (cmdStatus) {
      var st = CMD_STATES[heroTick % CMD_STATES.length];
      cmdStatus.innerHTML = '<span class="glyph" aria-hidden="true">' + st[0] + '</span> ' + st[1];
      cmdStatus.className = 'status ' + st[2];
    }
  }, 3400);

  /* ── mission control ambient: statuses tick realistically ── */
  var mc = document.querySelector('.mc');
  var MC_FLOW = [
    { sel: 's-07', seq: [['○', 'queued', 'st-queued'], ['◐', 'thinking', 'st-thinking'], ['●', 'running', 'st-running']] },
    { sel: 's-04', seq: [['◐', 'thinking', 'st-thinking'], ['●', 'running', 'st-running'], ['✓', 'complete', 'st-done']] },
    { sel: 's-06', seq: [['◇', 'waiting', 'st-waiting'], ['●', 'running', 'st-running']] }
  ];
  var mcTick = 0;
  var mcTiles = {};
  document.querySelectorAll('.mc-tile').forEach(function (t) {
    var sid = t.querySelector('.sid');
    if (sid) mcTiles[sid.textContent.trim()] = t.querySelector('.status');
  });
  ambient(mc, function () {
    mcTick++;
    MC_FLOW.forEach(function (f, i) {
      var idx = Math.floor((mcTick + i * 2) / 3) % f.seq.length;
      var s = f.seq[idx];
      var el = mcTiles[f.sel];
      if (el) {
        el.innerHTML = '<span class="glyph" aria-hidden="true">' + s[0] + '</span> ' + s[1];
        el.className = 'status ' + s[2];
      }
    });
  }, 2600);

  /* ── RALPH section loop ──────────────────────────────── */
  var ralphTrack = document.querySelector('.ralph-track');
  var ralphCount = document.querySelector('[data-ralph-count]');
  var ralphState = document.querySelector('[data-ralph-state]');
  var R_STATES = [
    [0, 'applying changes…'],
    [1, 'running tests…'],
    [2, '2 failing · patching…'],
    [0, 'applying fix…'],
    [1, 'running tests…'],
    [3, 'green · loop closed']
  ];
  var rTick = -1;
  ambient(ralphTrack, function () {
    rTick = (rTick + 1) % (R_STATES.length + 1);
    if (rTick === R_STATES.length) return; /* hold the pass state one beat */
    var s = R_STATES[rTick];
    ralphTrack.setAttribute('data-ralph-stage', String(s[0]));
    if (ralphState) ralphState.textContent = s[1];
    if (ralphCount) ralphCount.textContent = rTick < 3 ? '1' : '2';
  }, 1500);

  /* ── board: cause → effect loop ──────────────────────── */
  var board = document.querySelector('.board');
  var ticketMoving = document.querySelector('[data-ticket]');
  var ticketLive = document.querySelector('[data-ticket-live]');
  var bTick = -1;
  if (ticketLive && reduceMotion) ticketLive.hidden = false;
  ambient(board, function () {
    bTick = (bTick + 1) % 4;
    /* 0: only backlog ghost · 1: appears in ready · 2: agent picks up · 3: hold */
    if (ticketMoving) ticketMoving.style.opacity = bTick >= 1 ? '1' : '0';
    if (ticketLive) ticketLive.hidden = bTick < 2;
  }, 2000);

  motionQuery.addEventListener('change', function (event) {
    if (!event.matches) return;
    reduceMotion = true;
    stopAmbientIntervals();
    if (revealIO) revealIO.disconnect();
    figures.forEach(function (f) { f.classList.remove('reveal-fig'); });
    if (storyScroll) {
      window.removeEventListener('scroll', storyScroll);
      storyScroll = null;
    }
    setStaticStory();
    if (ticketLive) ticketLive.hidden = false;
  });

  /* ── copy install command ────────────────────────────── */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        btn.classList.add('copied');
        btn.textContent = 'Copied ✓';
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.textContent = 'Copy';
        }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else { done(); }
    });
  });

})();
