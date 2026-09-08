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
      toggle.textContent = isDark ? 'Dark' : 'Light';
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
  var figures = document.querySelectorAll('.mc, .delegate, .ralph, .term-bleed, .models, .localbox, .memflow, .coord, .board, .pipe, .brief-card, .collab, .stats-row, .run-demo');
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
  var glanceSteps = document.querySelectorAll('[data-glance-step]');
  var glanceStatus = document.querySelector('[data-glance-status]');
  var GLANCE_LABELS = ['Goal received', '4 tasks running', 'Tests running', 'Ready to review'];

  var A_LINES = [
    ['<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> working on sign-in backend', 'updating session handling', '3 files changed'],
    ['<span class="glyph" aria-hidden="true">●</span> running sign-in checks', '<span class="glyph" aria-hidden="true">✓</span><span class="sr-only">complete: </span> 31 passed · 3 skipped', 'strengthening token rotation'],
    ['<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> updating sign-in session', 'separate backend workspace', '4 files changed']
  ];
  var B_LINES = [
    ['<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> updating sign-in screen', 'keeping the session active', ''],
    ['<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> connecting the new flow', 'handling session expiry', ''],
    ['<span class="glyph" aria-hidden="true">✓</span><span class="sr-only">complete: </span> interface checks passed', '<span class="glyph" aria-hidden="true">●</span><span class="sr-only">running: </span> finishing redirect flow', '']
  ];
  var CMD_STATES = [
    ['◐', 'planning', 'st-thinking'],
    ['●', 'dispatching', 'st-running'],
    ['●', 'monitoring', 'st-running']
  ];
  var heroTick = 0;
  var setGlance = function (index) {
    glanceSteps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === index);
      step.classList.toggle('is-past', i < index);
    });
    if (glanceStatus) glanceStatus.textContent = GLANCE_LABELS[index];
  };
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
    setGlance(heroTick % glanceSteps.length);
    renderTermLines(termA, A_LINES[heroTick % A_LINES.length]);
    if (heroTick % 2 === 0) renderTermLines(termB, B_LINES[(heroTick / 2) % B_LINES.length]);
    if (cmdStatus) {
      var st = CMD_STATES[heroTick % CMD_STATES.length];
      cmdStatus.innerHTML = '<span class="glyph" aria-hidden="true">' + st[0] + '</span> ' + st[1];
      cmdStatus.className = 'status ' + st[2];
    }
  }, 3400);

  /* Subtle pointer response keeps Mission Control feeling like an instrument. */
  if (heroStage && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    heroStage.addEventListener('pointermove', function (event) {
      var rect = heroStage.getBoundingClientRect();
      var x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      var y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      heroStage.style.setProperty('--tilt-x', ((0.5 - y) * 1.8).toFixed(2) + 'deg');
      heroStage.style.setProperty('--tilt-y', ((x - 0.5) * 2.2).toFixed(2) + 'deg');
      heroStage.style.setProperty('--glint-x', (x * 100).toFixed(1) + '%');
      heroStage.style.setProperty('--glint-y', (y * 100).toFixed(1) + '%');
    });
    heroStage.addEventListener('pointerleave', function () {
      heroStage.style.setProperty('--tilt-x', '0deg');
      heroStage.style.setProperty('--tilt-y', '0deg');
      heroStage.style.setProperty('--glint-x', '72%');
      heroStage.style.setProperty('--glint-y', '18%');
    });
  }

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

  /* ── closing run chooser: one goal branches into visible work ── */
  var runDemo = document.querySelector('.run-demo');
  var runChoiceList = document.querySelector('.run-choices');
  var runChoices = Array.prototype.slice.call(document.querySelectorAll('[data-run-choice]'));
  var runGoal = document.querySelector('[data-run-goal]');
  var finalGoal = document.querySelector('[data-final-goal]');
  var runTaskNames = document.querySelectorAll('[data-run-task-name]');
  var runTasks = document.querySelectorAll('[data-run-task]');
  var runTaskStatuses = document.querySelectorAll('[data-run-task-status]');
  var runStatus = document.querySelector('[data-run-status]');
  var runResult = document.querySelector('[data-run-result]');
  var runProof = document.querySelector('[data-run-proof]');
  var runA11yStatus = document.querySelector('[data-run-a11y-status]');
  var runShouldAnnounceReady = false;
  var runTick = 4;
  var RUN_STEP_SEQUENCE = [0, 1, 2, 3, 4, 4];
  var RUNS = {
    feature: {
      goal: 'Build a secure passkey sign-in flow.',
      tasks: ['sign-in API', 'account interface', 'regression checks', 'final review'],
      result: 'One feature. Four focused tasks. One review.',
      proof: 'Separate workspaces · checks before merge'
    },
    queue: {
      goal: 'Work through the approved accessibility queue.',
      tasks: ['navigation fixes', 'form labels', 'contrast checks', 'release review'],
      result: 'Queued work keeps moving while decisions stay visible.',
      proof: 'Progress and open decisions in one summary'
    },
    risk: {
      goal: 'Upgrade the authentication package safely.',
      tasks: ['dependency scan', 'isolated upgrade', 'compatibility checks', 'diff review'],
      result: 'Risk stays separate until you approve the change.',
      proof: 'Worktree isolation · dependency checks · you approve'
    }
  };

  var runOrientationQuery = window.matchMedia('(min-width: 721px) and (max-width: 1080px)');
  function syncRunOrientation() {
    if (runChoiceList) runChoiceList.setAttribute('aria-orientation', runOrientationQuery.matches ? 'horizontal' : 'vertical');
  }
  syncRunOrientation();
  runOrientationQuery.addEventListener('change', syncRunOrientation);

  function setRunStep(step) {
    if (!runDemo) return;
    var isReady = step >= runTasks.length;
    runDemo.classList.toggle('is-ready', isReady);
    if (runStatus) {
      runStatus.className = 'status ' + (isReady ? 'st-done' : 'st-running');
      runStatus.innerHTML = isReady
        ? '<span class="glyph" aria-hidden="true">✓</span> ready to review'
        : '<span class="glyph" aria-hidden="true">●</span> working';
    }
    runTasks.forEach(function (task, index) {
      var status = runTaskStatuses[index];
      var isComplete = index < step || isReady;
      var isActive = index === step && !isReady;
      task.classList.toggle('is-complete', isComplete);
      task.classList.toggle('is-active', isActive);
      if (!status) return;
      status.className = 'status ' + (isComplete ? 'st-done' : isActive ? 'st-running' : 'st-waiting');
      status.innerHTML = isComplete
        ? '<span class="glyph" aria-hidden="true">✓</span> complete'
        : isActive
          ? '<span class="glyph" aria-hidden="true">●</span> running'
          : '<span class="glyph" aria-hidden="true">○</span> queued';
    });
    if (isReady && runShouldAnnounceReady && runA11yStatus) {
      runA11yStatus.textContent = 'Ready to review. ' + (runResult ? runResult.textContent : 'The example run is complete.');
      runShouldAnnounceReady = false;
    }
  }

  function selectRun(choice, moveFocus) {
    if (!runDemo || !choice) return;
    var key = choice.getAttribute('data-run-choice');
    var data = RUNS[key];
    if (!data) return;
    runChoices.forEach(function (button) {
      var selected = button === choice;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.setAttribute('tabindex', selected ? '0' : '-1');
    });
    runDemo.setAttribute('aria-labelledby', choice.id);
    if (runGoal) runGoal.textContent = data.goal;
    if (finalGoal) finalGoal.textContent = data.goal;
    runTaskNames.forEach(function (name, index) { name.textContent = data.tasks[index]; });
    if (runResult) runResult.textContent = data.result;
    if (runProof) runProof.textContent = data.proof;
    if (runA11yStatus) {
      runA11yStatus.textContent = reduceMotion
        ? 'Example selected: ' + data.goal + ' The completed run is ready to review.'
        : 'Example selected: ' + data.goal + ' Four focused tasks started.';
    }
    runShouldAnnounceReady = !reduceMotion;
    runDemo.classList.remove('is-changing');
    void runDemo.offsetWidth;
    runDemo.classList.add('is-changing');
    runTick = 0;
    setRunStep(reduceMotion ? 4 : 0);
    if (moveFocus) choice.focus();
  }

  runChoices.forEach(function (choice, index) {
    choice.addEventListener('click', function () { selectRun(choice, false); });
    choice.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % runChoices.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + runChoices.length) % runChoices.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = runChoices.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectRun(runChoices[next], true);
    });
  });
  if (runDemo) {
    setRunStep(4);
    ambient(runDemo, function () {
      runTick = (runTick + 1) % RUN_STEP_SEQUENCE.length;
      setRunStep(RUN_STEP_SEQUENCE[runTick]);
    }, 1450);
  }

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
    setRunStep(4);
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

  /* ── mark: inside the machine — agents swarm, come under control, IVE unfolds ── */
  (function () {
    var root = document.documentElement;
    var mark = document.querySelector('[data-mark]');
    if (!mark) return;
    if (reduceMotion || !root.classList.contains('mark-live')) {
      root.classList.remove('mark-live');
      root.classList.remove('mark-dark');
      return;
    }
    var pin = mark.querySelector('[data-mark-pin]');
    var line = mark.querySelector('[data-mark-line]');
    var caps = Array.prototype.slice.call(mark.querySelectorAll('[data-mark-cap]'));
    var rests = Array.prototype.slice.call(mark.querySelectorAll('[data-mark-rest]'));
    var scene = mark.querySelector('[data-scene]');
    var cam = mark.querySelector('[data-scene-cam]');
    var walls = {};
    Array.prototype.forEach.call(mark.querySelectorAll('[data-wall]'), function (w) { walls[w.getAttribute('data-wall')] = w; });
    var ringsBox = mark.querySelector('[data-scene-rings]');
    var swarmBox = mark.querySelector('[data-scene-swarm]');
    var board = mark.querySelector('[data-scene-board]');
    var capA = mark.querySelector('[data-scene-caption="a"]');
    var capB = mark.querySelector('[data-scene-caption="b"]');
    var countA = mark.querySelector('[data-scene-count="a"]');
    var countB = mark.querySelector('[data-scene-count="b"]');
    var hero = document.querySelector('.hero');
    var columnQuery = window.matchMedia('(max-width: 720px)');
    var GAP0 = 0.02, GAP1 = 0.24;      /* em between the words: wordmark-tight → real word gap */
    /* story on the scroll axis */
    var T_CHAOS = 0.30;                 /* agents swarm */
    var T_CTRL = 0.50;                  /* they come under control */
    var T_END = 0.55;                   /* everything has gone dark; the mark is there, the viewer inside a stroke */
    var Z_END = 0.72;                   /* zoomed out of the letters, the mark stands */
    var P_START = 0.76, P_END = 0.92;   /* the name unfolds, then holds */
    var RINGS = 8, GRID = 120;
    var AGENTS = [
      ['s-01 · backend', 'updating session handling'], ['s-02 · frontend', 'redirect flow next'],
      ['s-03 · tests', 'running checks again'], ['s-04 · review', 'waiting on changes'],
      ['s-05 · docs', '3 files changed'], ['s-06 · api', 'code_verifier route'],
      ['s-07 · auth', 'src/auth/pkce.ts'], ['s-08 · build', 'bundling · 2 warnings'],
      ['s-09 · lint', '12 files checked'], ['s-10 · migrate', 'schema v14 → v15'],
      ['s-11 · e2e', 'sign-in flow · attempt 2'], ['s-12 · release', 'changelog drafted']
    ];
    var STATUS = { run: ['●', 'running'], att: ['!', 'retrying'], wait: ['◇', 'waiting'], done: ['✓', 'complete'] };
    var m = null;                       /* measurements in em (taken at 100px) */
    var raw = 0, lastRaw = -1;
    var hintReady = false;              /* the scroll hint waits a moment on the black screen */
    var clock = 0, age = 0, lastTs = null, looping = false, frameNo = 0;
    var lastCountA = '', lastCountB = '';

    var ease = function (x) {
      x = x < 0 ? 0 : x > 1 ? 1 : x;
      return x * x * (3 - 2 * x);
    };
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var rnd = function (i, k) { var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

    var rings = [];
    for (var r = 0; r < RINGS; r++) {
      var ring = document.createElement('div');
      ring.className = 'scene-ring';
      ringsBox.appendChild(ring);
      rings.push(ring);
    }
    var agents = AGENTS.map(function (def, i) {
      var el = document.createElement('div');
      el.className = 'scene-agent';
      el.innerHTML = '<div class="sa-head"><span class="sa-id"></span><span class="sa-st"><span class="glyph"></span><span class="sa-word"></span></span></div><p class="sa-line"></p>';
      el.querySelector('.sa-id').textContent = def[0];
      el.querySelector('.sa-line').textContent = def[1];
      swarmBox.appendChild(el);
      return {
        el: el, glyph: el.querySelector('.glyph'), word: el.querySelector('.sa-word'), st: '',
        x0: (rnd(i, 1) * 2 - 1) * 0.9, y0: (rnd(i, 2) * 2 - 1) * 0.8, z0: rnd(i, 3),
        v: (0.045 + 0.06 * rnd(i, 4)) * (rnd(i, 5) < 0.3 ? -1 : 1),
        ax: 0.12 + 0.3 * rnd(i, 6), ay: 0.08 + 0.22 * rnd(i, 7),
        wx: 0.3 + 0.5 * rnd(i, 8), wy: 0.25 + 0.45 * rnd(i, 9),
        px: rnd(i, 10) * 6.283, py: rnd(i, 11) * 6.283,
        rot: 3 + 7 * rnd(i, 12), flick: 0.6 + 0.8 * rnd(i, 13)
      };
    });

    function setStatus(a, st) {
      if (a.st === st) return;
      a.st = st;
      a.el.setAttribute('data-st', st);
      a.glyph.textContent = STATUS[st][0];
      a.word.textContent = STATUS[st][1];
    }

    function measure() {
      mark.classList.add('is-measuring');
      var capEm = caps.map(function (c) { return c.getBoundingClientRect().width / 100; });
      var restEm = rests.map(function (r) { return r.getBoundingClientRect().width / 100; });
      var lineEmH = line.getBoundingClientRect().height / 100;
      mark.classList.remove('is-measuring');
      rests.forEach(function (r, i) {
        r.parentNode.style.setProperty('--rest-em', restEm[i].toFixed(4));
      });
      var cs = getComputedStyle(pin);
      var availW = pin.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      availW = Math.min(availW, 1480) * 0.9;
      var availH = pin.clientHeight * 0.56;
      var column = columnQuery.matches;
      var sumCap = capEm.reduce(function (a, b) { return a + b; }, 0);
      var sumRest = restEm.reduce(function (a, b) { return a + b; }, 0);
      /* board slots for the controlled agents */
      var cols = column ? 2 : 4, rows = AGENTS.length / cols;
      var cw = column ? 162 : 214, ch = column ? 58 : 66;
      var boardScale = column ? 1 : 1.12;
      var slots = agents.map(function (a, i) {
        var col = i % cols, row = Math.floor(i / cols);
        return { x: (col - (cols - 1) / 2) * cw, y: (row - (rows - 1) / 2) * ch };
      });
      board.style.width = (cols * cw + 28) + 'px';
      board.style.height = (rows * ch + 28 + 28) + 'px';
      m = {
        column: column,
        capEm: capEm, restEm: restEm,
        availW: availW, availH: availH, lineEmH: lineEmH,
        w: pin.clientWidth, h: pin.clientHeight,
        vmin: Math.min(pin.clientWidth, pin.clientHeight),
        slots: slots, boardScale: boardScale,
        /* a: width in em with nothing revealed, b: em that reveal adds at full */
        a: column ? Math.max.apply(null, capEm) : sumCap + 2 * GAP0,
        b: column ? Math.max.apply(null, restEm) : sumRest,
        top: mark.getBoundingClientRect().top + window.scrollY,
        travel: Math.max(1, mark.offsetHeight - pin.offsetHeight)
      };
      /* zoom origin: the V's left stroke at mid height, as a fraction of the tight IVE line */
      m.originX = column ? (0.31 * capEm[1]) / m.a : (capEm[0] + GAP0 + 0.31 * capEm[1]) / m.a;
      var size0 = Math.min(availW / m.a, availH / lineEmH);
      var diag = Math.sqrt(m.w * m.w + m.h * m.h);
      m.zoom0 = Math.max(10, 1.45 * diag / (0.19 * size0));
      lastRaw = -1;
    }

    function renderScene(dt) {
      frameNo++;
      var c = clamp(raw / T_CHAOS);
      var k = ease((raw - T_CHAOS) / (T_CTRL - T_CHAOS));
      var g = ease((raw - T_CTRL) / (T_END - T_CTRL));
      age += dt;
      clock += dt * (1 - k);                 /* the swarm's own time slows as control takes over */
      var emerge = ease(age / 1.4);          /* out of black */
      var dim = 1 - g;                       /* after control, everything goes dark */
      var lightFade = dim;
      var still = (1 - k) * dim;
      scene.style.setProperty('--scene-lines', (emerge * (0.35 + 0.65 * (1 - k)) * dim).toFixed(3));
      scene.style.setProperty('--scene-scan', (emerge * dim).toFixed(3));
      scene.style.setProperty('--scene-vig', '1');

      /* camera: a slow drift while flying, dead still once in control */
      var swayX = Math.sin(clock * 0.37) * 16 * still, swayY = Math.cos(clock * 0.29) * 10 * still;
      var swayR = Math.sin(clock * 0.23) * 0.9 * still;
      cam.style.transform = 'translate(' + swayX.toFixed(1) + 'px, ' + swayY.toFixed(1) + 'px) rotate(' + swayR.toFixed(2) + 'deg)';

      /* corridor: the grid flows past, faster with scroll, then stops */
      var dist = (clock * 90 + c * 900) % GRID;
      walls.floor.style.transform = 'rotateX(-90deg) translateY(' + (-dist).toFixed(1) + 'px)';
      walls.ceil.style.transform = 'rotateX(90deg) translateY(' + dist.toFixed(1) + 'px)';
      walls.left.style.transform = 'rotateY(90deg) translateX(' + (-dist).toFixed(1) + 'px)';
      walls.right.style.transform = 'rotateY(-90deg) translateX(' + dist.toFixed(1) + 'px)';

      /* ring frames rushing past */
      var camz = clock * 0.32 + c * 1.4;
      for (var i = 0; i < RINGS; i++) {
        var d = (i / RINGS + 1 - (camz - Math.floor(camz))) % 1;
        var s = 2.8 / (1 + d * 26);
        var o = 0.5 * (0.4 + 0.6 * (1 - d)) * ease(d / 0.06) * ease((1 - d) / 0.3) * emerge * still;
        rings[i].style.transform = 'translate(-50%, -50%) scale(' + s.toFixed(4) + ')';
        rings[i].style.opacity = o.toFixed(3);
      }

      /* agents: swarm in depth, then glide onto the board */
      var RX = m.w * 0.55, RY = m.h * 0.5;
      var t = clock;
      var counts = { run: 0, att: 0, wait: 0, done: 0 };
      for (var n = 0; n < agents.length; n++) {
        var a = agents[n];
        var dz = ((a.z0 + t * a.v + c * 0.6 * (a.v > 0 ? 1 : -1)) % 1 + 1) % 1;   /* 0 = at the viewer, 1 = far */
        var persp = 0.35 / (0.35 + 2.2 * dz);
        var sx = a.x0 + a.ax * Math.sin(a.wx * t + a.px);
        var sy = a.y0 + a.ay * Math.sin(a.wy * t + a.py);
        var px = sx * RX * persp, py = sy * RY * persp;
        var sc = 2.4 * persp;
        var op = ease(dz / 0.05) * ease((1 - dz) / 0.2) * emerge;
        var rot = a.rot * Math.sin(a.wy * t * 1.3 + a.py);
        var tiltY = -sx * 16, tiltX = sy * 10;
        var st;
        if (k < 0.5) {
          var f = Math.sin(t * a.flick + a.px * 2);
          st = f > 0.82 ? 'att' : f < -0.9 ? 'wait' : 'run';
        } else {
          st = (k - 0.78) / 0.22 > (n + 0.5) / agents.length ? 'done' : 'run';
        }
        if (st === 'att' && k < 0.5) { px += (rnd(frameNo, n) - 0.5) * 3; py += (rnd(frameNo, n + 40) - 0.5) * 3; }
        if (k > 0) {
          var slot = m.slots[n];
          px += (slot.x - px) * k; py += (slot.y - py) * k;
          sc += (m.boardScale - sc) * k; rot *= (1 - k); op += (1 - op) * k;
          tiltY *= (1 - k); tiltX *= (1 - k);
        }
        op *= lightFade;
        a.el.style.transform = 'translate(-50%, -50%) translate(' + px.toFixed(1) + 'px, ' + py.toFixed(1) + 'px) perspective(700px) rotateY(' + tiltY.toFixed(1) + 'deg) rotateX(' + tiltX.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
        a.el.style.opacity = op.toFixed(3);
        a.el.style.zIndex = k > 0.5 ? 60 : 10 + Math.round((1 - dz) * 40);
        setStatus(a, st);
        counts[st]++;
      }

      /* the board panel appears around the controlled agents */
      var bo = ease((k - 0.45) / 0.45) * lightFade;
      board.style.opacity = bo.toFixed(3);
      board.style.transform = 'translate(-50%, -50%) translateY(-14px) scale(' + (0.96 + 0.04 * ease((k - 0.45) / 0.45)).toFixed(3) + ')';

      /* captions and live counts */
      capA.style.opacity = (ease((age - 0.6) / 0.8) * (1 - ease(k / 0.4))).toFixed(3);
      capB.style.opacity = (ease((k - 0.55) / 0.35) * dim).toFixed(3);
      var textA = counts.run + ' running · ' + counts.att + ' retrying · ' + counts.wait + ' waiting';
      var textB = counts.done + ' complete' + (counts.run ? ' · ' + counts.run + ' running' : '');
      if (textA !== lastCountA) { countA.textContent = textA; lastCountA = textA; }
      if (textB !== lastCountB) { countB.textContent = textB; lastCountB = textB; }

      root.classList.add('mark-dark');
    }

    function renderUnfold() {
      var p = clamp((raw - P_START) / (P_END - P_START));
      var u = ease((p - 0.02) / 0.84);
      /* exponential reveal: the size then shrinks at a steady visual rate */
      var K = 1 + m.b / m.a;
      var reveal = (m.a / m.b) * (Math.pow(K, u) - 1);
      var gap = GAP0 + (GAP1 - GAP0) * ease(p / 0.5);
      var contentEm;
      if (m.column) {
        contentEm = 0;
        for (var i = 0; i < m.capEm.length; i++) {
          contentEm = Math.max(contentEm, m.capEm[i] + m.restEm[i] * reveal);
        }
      } else {
        contentEm = m.a - 2 * GAP0 + m.b * reveal + 2 * gap;
      }
      var size = Math.min(m.availW / contentEm, m.availH / m.lineEmH);
      /* out of the letters: the view starts inside the V's left stroke and zooms out until the mark stands */
      var z = clamp((raw - T_END) / (Z_END - T_END));
      var pop = Math.pow(m.zoom0, 1 - ease(z));
      var shiftX = 0, shiftY = 0, tPop = 1;
      if (pop > 1.0001) {
        /* browsers stop drawing glyphs past a few thousand px: grow the type up to a cap, the rest is a transform about the same point */
        var fontPop = Math.min(pop, 6000 / size);
        tPop = pop / fontPop;
        var W1 = m.a * size;
        shiftX = m.column ? -m.originX * W1 * (fontPop - 1) : -(m.originX - 0.5) * W1 * (fontPop - 1);
        size *= fontPop;
      }
      root.classList.remove('mark-dark');
      var alpha = ease(p / 0.28);
      var slide = -0.15 * (1 - reveal);
      var fade = 0.35 * (1 - reveal);
      var st = mark.style;
      st.setProperty('--mark-size', size.toFixed(2) + 'px');
      st.setProperty('--mark-gap', gap.toFixed(4) + 'em');
      st.setProperty('--mark-reveal', reveal.toFixed(4));
      st.setProperty('--mark-slide', slide.toFixed(4) + 'em');
      st.setProperty('--mark-fade', fade.toFixed(4) + 'em');
      st.setProperty('--mark-alpha', alpha.toFixed(3));
      st.setProperty('--mark-shift-x', shiftX.toFixed(1) + 'px');
      st.setProperty('--mark-shift-y', shiftY.toFixed(1) + 'px');
      st.setProperty('--mark-pop', tPop.toFixed(4));
      st.setProperty('--mark-origin-x', (m.originX * 100).toFixed(2) + '%');
      var by = ease((p - 0.78) / 0.2);
      st.setProperty('--mark-by', by.toFixed(3));
      mark.classList.toggle('has-by', by > 0.5);
    }

    function frame(ts) {
      looping = false;
      if (!m) return;
      var dt = lastTs === null ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      raw = clamp((window.scrollY - m.top) / m.travel);
      var lit = raw >= T_END;
      var inView = window.scrollY < m.top + m.travel + m.h;
      if (raw !== lastRaw) {
        mark.classList.toggle('is-lit', lit);
        if (!lit) root.classList.add('mark-dark');
        renderUnfold();
        mark.style.setProperty('--mark-hint', (lit || !hintReady) ? '0' : (1 - ease(raw / 0.03)).toFixed(3));
        lastRaw = raw;
      }
      if (!lit && inView) {
        renderScene(dt);
        loop();
      } else {
        lastTs = null;
      }
    }
    function loop() {
      if (looping) return;
      looping = true;
      window.requestAnimationFrame(frame);
    }

    var resizeTimer = null;
    var onResize = function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { measure(); loop(); }, 120);
    };

    measure(); loop();
    setTimeout(function () { hintReady = true; lastRaw = -1; loop(); }, 900);
    window.addEventListener('scroll', loop, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); loop(); });
    }
    window.addEventListener('load', function () { measure(); loop(); });

    /* the hero's entrance waits until it scrolls into view */
    if (hero && 'IntersectionObserver' in window) {
      var heroIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { hero.classList.add('is-in'); heroIO.disconnect(); }
        });
      }, { threshold: 0.18 });
      heroIO.observe(hero);
    } else if (hero) {
      hero.classList.add('is-in');
    }
  })();

})();

/* IVE.DEV — exit: back into the letters.
   The mark stands, the view dives into the V's left stroke, the page goes
   black, the machine from the opening is there again with every agent on
   the board at rest, then the terminal rises with your first goal. Typing a
   goal and pressing enter plans it: four cards fly onto the board. */
(function () {
  'use strict';

  var root = document.documentElement;
  var exit = document.querySelector('[data-exit]');
  if (!exit) return;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  var live = root.classList.contains('mark-live') && !reduceMotion;

  var pin = exit.querySelector('[data-exit-pin]');
  var line = exit.querySelector('[data-exit-line]');
  var caps = Array.prototype.slice.call(exit.querySelectorAll('[data-exit-cap]'));
  var anchor = exit.querySelector('[data-exit-anchor]');
  var scene = exit.querySelector('[data-exit-scene]');
  var cam = exit.querySelector('[data-exit-cam]');
  var walls = {};
  Array.prototype.forEach.call(exit.querySelectorAll('[data-exit-wall]'), function (w) { walls[w.getAttribute('data-exit-wall')] = w; });
  var board = exit.querySelector('[data-exit-board]');
  var boardCount = exit.querySelector('[data-exit-board-count]');
  var swarmBox = exit.querySelector('[data-exit-swarm]');
  var caption = exit.querySelector('[data-exit-caption]');
  var capCount = exit.querySelector('[data-exit-count]');
  var term = exit.querySelector('[data-exit-term]');
  var termStatus = exit.querySelector('[data-exit-status]');
  var typeEls = Array.prototype.slice.call(exit.querySelectorAll('[data-exit-type]'));
  var form = exit.querySelector('[data-exit-form]');
  var input = exit.querySelector('[data-exit-input]');
  var result = exit.querySelector('[data-exit-result]');
  var finalGoal = exit.querySelector('[data-final-goal]');
  var columnQuery = window.matchMedia('(max-width: 720px)');

  var GAP0 = 0.02;                     /* em between the letters, wordmark-tight */
  /* story on the scroll axis */
  var Z0 = 0.04, Z1 = 0.36;            /* dive into the V */
  var R1 = 0.56;                       /* the room is there */
  var P1 = 0.78;                       /* the terminal has risen; then hold */
  var GRID = 120, TYPE_SPEED = 34;
  var REST = [
    ['s-01 · backend', 'sessions updated'], ['s-02 · frontend', 'redirect flow done'],
    ['s-03 · tests', '48 checks passed'], ['s-04 · review', 'approved'],
    ['s-05 · docs', '3 files changed'], ['s-06 · api', 'code_verifier route'],
    ['s-07 · auth', 'src/auth/pkce.ts'], ['s-08 · build', 'bundled · 0 warnings'],
    ['s-09 · lint', '12 files clean'], ['s-10 · migrate', 'schema v15 applied'],
    ['s-11 · e2e', 'sign-in flow passed'], ['s-12 · release', 'changelog ready']
  ];
  var STATUS = { run: ['●', 'running'], att: ['!', 'retrying'], wait: ['◇', 'waiting'], done: ['✓', 'complete'] };
  var RULES = [
    [/sign[- ]?in|log[- ]?in|auth|passkey|session|oauth|sso|password/i, ['sign-in API', 'account interface', 'regression checks', 'final review']],
    [/upgrade|dependenc|package|version|migrat/i, ['dependency scan', 'isolated upgrade', 'compatibility checks', 'diff review']],
    [/accessib|a11y|contrast|screen reader|keyboard/i, ['navigation fixes', 'form labels', 'contrast checks', 'release review']],
    [/bug|fix|error|crash|broken|fail/i, ['reproduce the bug', 'isolated fix', 'regression test', 'final review']],
    [/test|coverage|spec/i, ['test plan', 'unit tests', 'integration run', 'final review']],
    [/docs?\b|readme|guide|manual/i, ['outline', 'draft pages', 'link checks', 'final review']],
    [/perf|speed|fast|slow|cache|latency/i, ['profile the hot path', 'targeted changes', 'benchmark run', 'final review']],
    [/api|endpoint|route|webhook|graphql/i, ['API routes', 'request validation', 'integration tests', 'final review']],
    [/deploy|release|ci\b|pipeline|docker|kubernetes/i, ['pipeline config', 'build step', 'dry run', 'release review']],
    [/database|schema|sql|table|model|data\b/i, ['schema change', 'data migration', 'integrity checks', 'final review']],
    [/ui\b|page|screen|design|layout|landing|dashboard|form|dark mode|theme|component/i, ['layout', 'components', 'visual checks', 'final review']]
  ];

  var m = null;
  var raw = 0, lastRaw = -1;
  var clock = 0, lastTs = null, looping = false;
  var hintReady = false, darkSet = false, roomOn = false;
  var typing = { started: false, done: false, t0: 0, full: typeEls.map(function (el) { return el.textContent; }), shown: typeEls.map(function () { return -1; }) };
  var plan = null;
  var lastCap = '';

  var ease = function (x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rnd = function (i, k) { var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

  function makeAgent(def, i, isPlan) {
    var el = document.createElement('div');
    el.className = 'scene-agent' + (isPlan ? ' is-plan' : '');
    el.innerHTML = '<div class="sa-head"><span class="sa-id"></span><span class="sa-st"><span class="glyph"></span><span class="sa-word"></span></span></div><p class="sa-line"></p>';
    el.querySelector('.sa-id').textContent = def[0];
    el.querySelector('.sa-line').textContent = def[1];
    swarmBox.appendChild(el);
    return {
      el: el, id: el.querySelector('.sa-id'), glyph: el.querySelector('.glyph'), word: el.querySelector('.sa-word'), line: el.querySelector('.sa-line'), st: '',
      x0: (rnd(i + 20, 1) * 2 - 1), y0: (rnd(i + 20, 2) * 2 - 1), rot: 4 + 8 * rnd(i + 20, 3)
    };
  }
  var rest = REST.map(function (def, i) { return makeAgent(def, i, false); });
  var planAgents = [0, 1, 2, 3].map(function (i) { return makeAgent(['s-0' + (i + 1), ''], i + 12, true); });

  function setStatus(a, st) {
    if (a.st === st) return;
    a.st = st;
    a.el.setAttribute('data-st', st);
    a.glyph.textContent = STATUS[st][0];
    a.word.textContent = STATUS[st][1];
  }
  function setTermStatus(cls, glyph, word) {
    termStatus.className = 'exit-term-status mono' + (cls ? ' ' + cls : '');
    termStatus.innerHTML = '<span class="glyph" aria-hidden="true"></span> ';
    termStatus.querySelector('.glyph').textContent = glyph;
    termStatus.appendChild(document.createTextNode(word));
  }
  function setCaption(text) {
    if (text === lastCap) return;
    capCount.textContent = text;
    lastCap = text;
  }
  function sizeBoard(cols, rows) {
    board.style.width = (cols * m.cw + 28) + 'px';
    board.style.height = (rows * m.ch + 56) + 'px';
  }

  function measure() {
    var column = columnQuery.matches;
    var W, H;
    if (live) {
      exit.classList.add('is-measuring');
      var capEm = caps.map(function (c) { return c.getBoundingClientRect().width / 100; });
      var lineEmH = line.getBoundingClientRect().height / 100;
      exit.classList.remove('is-measuring');
      var cs = getComputedStyle(pin);
      var availW = pin.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      availW = Math.min(availW, 1480) * 0.9;
      var availH = pin.clientHeight * 0.56;
      var a = capEm.reduce(function (s, v) { return s + v; }, 0) + 2 * GAP0;
      W = pin.clientWidth; H = pin.clientHeight;
      var size0 = Math.min(availW / a, availH / lineEmH);
      var diag = Math.sqrt(W * W + H * H);
      m = {
        a: a, size0: size0,
        originX: (capEm[0] + GAP0 + 0.31 * capEm[1]) / a,
        zoom0: Math.max(10, 1.45 * diag / (0.19 * size0)),
        top: exit.getBoundingClientRect().top + window.scrollY,
        travel: Math.max(1, exit.offsetHeight - pin.offsetHeight)
      };
      anchor.style.top = Math.round(m.travel * 0.86) + 'px';
    } else {
      W = scene.clientWidth; H = scene.clientHeight;
      m = { top: 0, travel: 1 };
    }
    m.column = column; m.w = W; m.h = H;
    m.cw = column ? 162 : 214; m.ch = column ? 58 : 66;
    m.boardScale = column ? 1 : 1.12;
    var cols = column ? 2 : 4, rows = REST.length / cols;
    m.restCols = cols; m.restRows = rows;
    m.restSlots = rest.map(function (a, i) {
      var col = i % cols, row = Math.floor(i / cols);
      return { x: (col - (cols - 1) / 2) * m.cw, y: (row - (rows - 1) / 2) * m.ch };
    });
    var pc = column ? 2 : 4, pr = 4 / pc;
    m.planCols = pc; m.planRows = pr;
    m.planSlots = planAgents.map(function (a, i) {
      var col = i % pc, row = Math.floor(i / pc);
      return { x: (col - (pc - 1) / 2) * m.cw, y: (row - (pr - 1) / 2) * m.ch };
    });
    if (plan && plan.resized) sizeBoard(pc, pr); else sizeBoard(cols, rows);
    lastRaw = -1;
  }

  /* ── the dive into the V ── */
  function renderZoom() {
    var z = clamp((raw - Z0) / (Z1 - Z0));
    var pop = Math.pow(m.zoom0, ease(z));
    var size = m.size0, shiftX = 0, tPop = 1;
    if (pop > 1.0001) {
      /* browsers stop drawing glyphs past a few thousand px: grow the type up to a cap, the rest is a transform about the same point */
      var fontPop = Math.min(pop, 6000 / size);
      tPop = pop / fontPop;
      shiftX = -(m.originX - 0.5) * (m.a * size) * (fontPop - 1);
      size *= fontPop;
    }
    var st = exit.style;
    st.setProperty('--exit-size', size.toFixed(2) + 'px');
    st.setProperty('--exit-shift-x', shiftX.toFixed(1) + 'px');
    st.setProperty('--exit-pop', tPop.toFixed(4));
    st.setProperty('--exit-origin-x', (m.originX * 100).toFixed(2) + '%');
    st.setProperty('--exit-dark', (ease((z - 0.3) / 0.45) * 100).toFixed(1) + '%');
    st.setProperty('--exit-fade', (1 - ease(z / 0.2)).toFixed(3));
    st.setProperty('--mark-hint', (!hintReady || raw > Z0) ? '0' : (1 - ease(raw / Z0)).toFixed(3));
    line.style.visibility = z >= 1 ? 'hidden' : '';
    roomOn = z >= 0.8;
    scene.classList.toggle('is-on', roomOn);
    scene.style.opacity = ease((z - 0.8) / 0.2).toFixed(3);
    var wantDark = z >= 0.7;
    if (wantDark !== darkSet) { root.classList.toggle('mark-dark', wantDark); darkSet = wantDark; }
  }

  /* ── the room at rest, the terminal, the plan ── */
  function renderRoom(now, dt) {
    var r = live ? ease((raw - Z1) / (R1 - Z1)) : 1;
    var p = live ? ease((raw - R1) / (P1 - R1)) : 0;
    clock += dt;
    scene.style.setProperty('--scene-lines', (0.42 * r).toFixed(3));
    scene.style.setProperty('--scene-scan', r.toFixed(3));
    scene.style.setProperty('--scene-vig', '1');

    /* camera: the faintest breath, nothing more */
    cam.style.transform = 'translate(' + (Math.sin(clock * 0.21) * 3).toFixed(1) + 'px, ' + (Math.cos(clock * 0.17) * 2).toFixed(1) + 'px)';
    var dist = (clock * 8) % GRID;
    walls.floor.style.transform = 'rotateX(-90deg) translateY(' + (-dist).toFixed(1) + 'px)';
    walls.ceil.style.transform = 'rotateX(90deg) translateY(' + dist.toFixed(1) + 'px)';
    walls.left.style.transform = 'rotateY(90deg) translateX(' + (-dist).toFixed(1) + 'px)';
    walls.right.style.transform = 'rotateY(-90deg) translateX(' + dist.toFixed(1) + 'px)';

    /* the board slides up as the terminal rises */
    var bs = 1 - p * (m.column ? 0.28 : 0.10);
    var by = -p * m.h * (m.column ? 0.21 : 0.20);
    var u = plan ? (now - plan.t0) / 1000 : -1;
    if (plan && !live) u = 10;
    var restFade = plan ? ease(u / 0.4) : 0;
    var animating = false;

    for (var n = 0; n < rest.length; n++) {
      var a = rest[n], slot = m.restSlots[n];
      var settle = ease((r - n * 0.035) / 0.45);
      var op = settle * (1 - restFade);
      var sc = m.boardScale * bs * (0.94 + 0.06 * settle);
      a.el.style.transform = 'translate(-50%, -50%) translate(' + (slot.x * bs).toFixed(1) + 'px, ' + (slot.y * bs + by + (1 - settle) * 16).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
      a.el.style.opacity = op.toFixed(3);
      setStatus(a, 'done');
    }
    if (plan) {
      if (u > 0.25 && !plan.resized) { plan.resized = true; sizeBoard(m.planCols, m.planRows); }
      var RX = m.w * 0.55, RY = m.h * 0.5;
      for (var i = 0; i < planAgents.length; i++) {
        var pa = planAgents[i], ps = m.planSlots[i];
        var start = 0.4 + i * 0.14;
        var q = ease((u - start) / 0.85);
        var fx = pa.x0 * RX * 0.16, fy = pa.y0 * RY * 0.16 + by;
        var px = lerp(fx, ps.x * bs, q), py = lerp(fy, ps.y * bs + by, q);
        var psc = lerp(0.38, m.boardScale * bs, q);
        var pop = q <= 0 ? 0 : Math.min(1, q * 3);
        var rot = (1 - q) * pa.rot, tiltY = (1 - q) * -pa.x0 * 16, tiltX = (1 - q) * pa.y0 * 10;
        pa.el.style.transform = 'translate(-50%, -50%) translate(' + px.toFixed(1) + 'px, ' + py.toFixed(1) + 'px) perspective(700px) rotateY(' + tiltY.toFixed(1) + 'deg) rotateX(' + tiltX.toFixed(1) + 'deg) scale(' + psc.toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
        pa.el.style.opacity = pop.toFixed(3);
        var done = q >= 1 && u > 1.9 + i * 0.32;
        setStatus(pa, q >= 1 ? (done ? 'done' : 'run') : 'wait');
      }
      if (u > 3.1 && !plan.done) {
        plan.done = true;
        result.textContent = '✓ One goal. Four focused tasks. One review.';
        result.classList.add('is-done');
        setTermStatus('st-done', '✓', 'ready to review');
      }
      setCaption(plan.done ? '4 complete · ready to review' : '4 sessions · running');
      animating = u < 3.4;
    } else {
      setCaption('12 complete · 0 running');
    }

    var bo = ease((r - 0.15) / 0.6);
    board.style.opacity = bo.toFixed(3);
    board.style.transform = 'translate(-50%, -50%) translate(0px, ' + (by - 14 * bs).toFixed(1) + 'px) scale(' + bs.toFixed(3) + ')';
    caption.style.opacity = (ease((r - 0.25) / 0.5) * (1 - ease(p / 0.5))).toFixed(3);

    /* the terminal rises, then types */
    var ta = ease((p - 0.2) / 0.6);
    var st = exit.style;
    st.setProperty('--term-alpha', ta.toFixed(3));
    st.setProperty('--term-rise', ((1 - ta) * 48).toFixed(1) + 'px');
    st.setProperty('--term-y', (m.h * (m.column ? 0.05 : 0.015)).toFixed(1) + 'px');
    term.classList.toggle('is-live', p > 0.2);
    if (p >= 0.55 && !typing.started) { typing.started = true; typing.t0 = now; }
    if (typing.started && !typing.done) animating = updateTyping(now) || animating;
    return animating;
  }

  function updateTyping(now) {
    var chars = Math.floor((now - typing.t0) / 1000 * TYPE_SPEED);
    var off = 0, allDone = true;
    for (var i = 0; i < typeEls.length; i++) {
      var full = typing.full[i];
      var n = Math.max(0, Math.min(full.length, chars - off));
      if (typing.shown[i] !== n) { typeEls[i].textContent = full.slice(0, n); typing.shown[i] = n; }
      var active = n < full.length && chars - off >= 0;
      typeEls[i].classList.toggle('is-typing', active);
      if (n < full.length) { allDone = false; break; }
      off += full.length + 10;
    }
    if (allDone) {
      typing.done = true;
      typeEls.forEach(function (el) { el.classList.remove('is-typing'); });
      exit.style.setProperty('--goal-alpha', '1');
      term.classList.add('is-open');
    }
    return !allDone;
  }
  function finishTyping() {
    typeEls.forEach(function (el, i) { el.textContent = typing.full[i]; });
    typing.started = true; typing.done = true;
    exit.style.setProperty('--goal-alpha', '1');
    term.classList.add('is-open');
  }

  function planTasks(goal) {
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(goal)) return RULES[i][1];
    var topic = goal.replace(/^(please\s+)?(build|add|create|make|implement|write|set up|setup|refactor|improve|update|change|design|ship|fix|migrate|move)\s+(a|an|the|our|my)?\s*/i, '').replace(/[.!?]+$/, '').trim();
    topic = topic.split(/\s+/).slice(0, 3).join(' ') || 'the goal';
    return ['plan ' + topic, 'implement ' + topic, 'check ' + topic, 'review ' + topic];
  }
  function startPlan(text) {
    var goal = (text || '').trim() || input.placeholder;
    var tasks = planTasks(goal);
    plan = { t0: performance.now(), goal: goal, resized: plan ? plan.resized : false, done: false };
    planAgents.forEach(function (a, i) {
      a.line.textContent = tasks[i];
      a.st = ''; setStatus(a, 'wait');
      a.el.style.opacity = '0';
    });
    boardCount.textContent = '4 sessions';
    setTermStatus('st-run', '●', 'working');
    result.classList.remove('is-done');
    result.textContent = '● planning · four focused tasks started';
    loop();
  }

  function frame(ts) {
    looping = false;
    if (!m) return;
    var dt = lastTs === null ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    var animating = false;
    if (live) {
      raw = clamp((window.scrollY - m.top) / m.travel);
      if (raw !== lastRaw) { renderZoom(); lastRaw = raw; }
      if (!roomOn) term.classList.remove('is-live');
      var inView = window.scrollY + m.h > m.top && window.scrollY < m.top + m.travel + m.h;
      if (roomOn && inView) animating = renderRoom(ts, dt) || true;
    } else {
      animating = renderRoom(ts, dt);
    }
    if (animating) loop(); else lastTs = null;
  }
  function loop() {
    if (looping) return;
    looping = true;
    window.requestAnimationFrame(frame);
  }

  /* ── wiring ── */
  if (finalGoal) {
    var syncGoal = function () { input.placeholder = finalGoal.textContent.trim() || input.placeholder; };
    syncGoal();
    if ('MutationObserver' in window) new MutationObserver(syncGoal).observe(finalGoal, { childList: true, characterData: true, subtree: true });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); startPlan(input.value); });

  var resizeTimer = null;
  var onResize = function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { measure(); loop(); }, 120);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  if (live) {
    measure();
    setTimeout(function () { loop(); }, 60);
    setTimeout(function () { hintReady = true; lastRaw = -1; loop(); }, 900);
    window.addEventListener('scroll', loop, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); loop(); });
    window.addEventListener('load', function () { measure(); loop(); });
  } else {
    exit.classList.add('is-static');
    scene.classList.add('is-on');
    scene.style.opacity = '1';
    term.classList.add('is-live');
    finishTyping();
    measure();
    loop();
    window.addEventListener('load', function () { measure(); loop(); });
  }
})();
