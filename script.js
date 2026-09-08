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
  var figures = document.querySelectorAll('.mc, .delegate, .ralph, .term-bleed, .models, .localbox, .memflow, .coord, .board, .pipe, .brief-card, .collab, .stats-row, .run-demo, .final-console');
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
    var exit = mark.querySelector('[data-scene-exit]');
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
    var T_END = 0.64;                   /* the viewer flies out of the tunnel, the mark stands */
    var P_START = 0.70, P_END = 0.90;   /* the name unfolds, then holds */
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
      var lightFade = 1 - ease(g / 0.35);   /* the board stays behind as the viewer flies out */
      var still = (1 - k) * lightFade;
      var rush = g;                          /* the way out: the corridor rushes past */
      /* the exit: a small bright opening at the vanishing point from the start, then it comes at the viewer */
      var base = 0.04 + 0.03 * c;
      var sM = g > 0 ? base * Math.pow(3.4 / base, rush) : base;
      scene.style.setProperty('--scene-lines', (emerge * (0.35 + 0.65 * Math.max(1 - k, rush)) * (1 - ease((rush - 0.8) / 0.2))).toFixed(3));
      scene.style.setProperty('--scene-scan', (emerge * (1 - ease((rush - 0.4) / 0.5))).toFixed(3));
      scene.style.setProperty('--scene-vig', (1 - ease(rush / 0.6)).toFixed(3));

      /* camera: a slow drift while flying, dead still once in control */
      var swayX = Math.sin(clock * 0.37) * 16 * still, swayY = Math.cos(clock * 0.29) * 10 * still;
      var swayR = Math.sin(clock * 0.23) * 0.9 * still;
      cam.style.transform = 'translate(' + swayX.toFixed(1) + 'px, ' + swayY.toFixed(1) + 'px) rotate(' + swayR.toFixed(2) + 'deg)';

      /* corridor: the grid flows past, faster with scroll, then stops */
      var dist = (clock * 90 + c * 900 + rush * 3600) % GRID;
      walls.floor.style.transform = 'rotateX(-90deg) translateY(' + (-dist).toFixed(1) + 'px)';
      walls.ceil.style.transform = 'rotateX(90deg) translateY(' + dist.toFixed(1) + 'px)';
      walls.left.style.transform = 'rotateY(90deg) translateX(' + (-dist).toFixed(1) + 'px)';
      walls.right.style.transform = 'rotateY(-90deg) translateX(' + dist.toFixed(1) + 'px)';

      /* ring frames rushing past */
      var camz = clock * 0.32 + c * 1.4 + rush * 5;
      for (var i = 0; i < RINGS; i++) {
        var d = (i / RINGS + 1 - (camz - Math.floor(camz))) % 1;
        var s = 2.8 / (1 + d * 26);
        var o = 0.5 * (0.4 + 0.6 * (1 - d)) * ease(d / 0.06) * ease((1 - d) / 0.3) * emerge * (1 - k + rush) * (1 - ease((rush - 0.75) / 0.25));
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
      capB.style.opacity = (ease((k - 0.55) / 0.35) * (1 - ease(g / 0.25))).toFixed(3);
      var textA = counts.run + ' running · ' + counts.att + ' retrying · ' + counts.wait + ' waiting';
      var textB = counts.done + ' complete' + (counts.run ? ' · ' + counts.run + ' running' : '');
      if (textA !== lastCountA) { countA.textContent = textA; lastCountA = textA; }
      if (textB !== lastCountB) { countB.textContent = textB; lastCountB = textB; }

      /* the opening comes at the viewer; outside, the mark already stands and grows with it */
      exit.style.transform = 'translate(-50%, -50%) scale(' + sM.toFixed(4) + ')';
      exit.style.opacity = (emerge * (0.6 + 0.4 * ease(g / 0.3))).toFixed(3);
      mark.style.setProperty('--mark-pop', Math.max(0.04, Math.min(1, sM)).toFixed(4));
      mark.classList.toggle('is-dawning', g > 0.001);
      root.classList.toggle('mark-dark', sM < 1.15);
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
        if (lit) { root.classList.remove('mark-dark'); mark.classList.remove('is-dawning'); mark.style.setProperty('--mark-pop', '1'); }
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
