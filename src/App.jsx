import React, { useState, useCallback, useRef, useEffect } from 'react';
import allChallenges from './challenges';
import ExecutionSandbox from './ExecutionSandbox';
import SyntaxSandbox from './SyntaxSandbox';
import APIRunner from './APIRunner';
import CyberBackground from './CyberBackground';
import TShirtChecklist from './TShirtChecklist';
import MentoringInsights from './MentoringInsights';
import PictorialHint from './PictorialHint';

// ── Top-level drill categories ──────────────────
var DRILL_TYPES = [
  {
    key: 'react',
    label: 'Drills',
    icon: '\u25E6',  // white bullet
    tabs: [
      { key: 'hooks', label: 'Hooks', icon: '\u2699' },         // ⚙ gear
      { key: 'composition', label: 'Composition', icon: '\u25EB' }, // ◫
      { key: 'advanced', label: 'Advanced', icon: '\u26A1' },     // ⚡
      { key: 'data', label: 'Data', icon: '\u25C8' },            // ◈
      { key: 'testing', label: 'Testing', icon: '\u2303' },      // ⌃
      { key: 'docker', label: 'Docker', icon: '\u2B22' },        // ⬢ hexagon
      { key: 'messaging', label: 'Messaging', icon: '\u21C6' },  // ⇆
      { key: 'orpc', label: 'oRPC', icon: '\u25CE' },            // ◎
    ],
  },
  {
    key: 'api',
    label: 'API',
    icon: '\u25CE',  // ◎ bullseye
    tabs: [
      { key: 'api', label: 'Express', icon: '\u25CE' },  // ◎
    ],
  },
  {
    key: 'mentoring',
    label: 'Mentoring',
    icon: '\u25C9',  // ◉ fisheye
    tabs: [],
    comingSoon: true,
  },
  {
    key: 'checklist',
    label: 'TS',
    icon: '\u229E',  // ⊞ squared plus
    tabs: [],
    isChecklist: true,
  },
];

var SYNTAX_TABS = ['docker', 'orpc', 'messaging', 'advanced', 'data', 'testing'];

// ── Helper: class name builder ──────────────────
function cx() {
  var classes = [];
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (typeof arg === 'string') classes.push(arg);
    else if (arg) {
      var keys = Object.keys(arg);
      for (var j = 0; j < keys.length; j++) {
        if (arg[keys[j]]) classes.push(keys[j]);
      }
    }
  }
  return classes.join(' ');
}

// ── SolvePulse — brief particle burst on solve ──
function SolvePulse(_props) {
  // Pure CSS animation ring that self-removes
  return React.createElement('div', {
    className: 'solve-pulse',
    style: {
      width: 120,
      height: 120,
      borderRadius: '50%',
      border: '2px solid rgba(99,102,241,0.6)',
      boxShadow: '0 0 40px rgba(99,102,241,0.3), inset 0 0 20px rgba(99,102,241,0.1)',
      top: '50%',
      left: '50%',
      marginLeft: -60,
      marginTop: -60,
    },
  });
}

// ═══════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════

export default function App() {
  var [drillType, setDrillType] = useState('react');
  var activeDrillType = DRILL_TYPES.find(function (d) { return d.key === drillType; }) || DRILL_TYPES[0];
  var CATEGORIES = activeDrillType.tabs;

  var [category, setCategory] = useState(CATEGORIES[0] ? CATEGORIES[0].key : '');
  var [currentIdx, setCurrentIdx] = useState(0);
  var [code, setCode] = useState('');
  var [feedback, setFeedback] = useState(null);
  var [showHint, setShowHint] = useState(false);
  var [pulseKey, setPulseKey] = useState(0); // increment to trigger new pulse
  var [bgOpacity, setBgOpacity] = useState(1.0);
  var [bgHue, setBgHue] = useState(0);
  var bgParamsRef = useRef({ opacity: 1.0, hueShift: 0 });
  var [solved, setSolved] = useState(function () {
    try { return JSON.parse(localStorage.getItem('dev-gym-solved') || '{}'); } catch (e) { return {}; }
  });
  var [results, setResults] = useState(function () {
    try { return JSON.parse(localStorage.getItem('dev-gym-results') || '{}'); } catch (e) { return {}; }
  });

  useEffect(function () {
    localStorage.setItem('dev-gym-solved', JSON.stringify(solved));
  }, [solved]);
  useEffect(function () {
    localStorage.setItem('dev-gym-results', JSON.stringify(results));
  }, [results]);

  var textareaRef = useRef(null);

  // Sync bg params to ref so p5.js reads them without re-renders
  useEffect(function () {
    bgParamsRef.current = { opacity: bgOpacity, hueShift: bgHue };
  }, [bgOpacity, bgHue]);

  // ── Drill type change ─────────────────────────
  var handleDrillTypeChange = function (dt) {
    var dtConfig = DRILL_TYPES.find(function (d) { return d.key === dt; });
    setDrillType(dt);
    setCategory(dtConfig && dtConfig.tabs[0] ? dtConfig.tabs[0].key : '');
    setCurrentIdx(0);
    setFeedback(null);
    setShowHint(false);
  };

  var filteredChallenges = allChallenges.filter(function (c) { return c.category === category; });

  var handleCategoryChange = function (cat) {
    setCategory(cat);
    setCurrentIdx(0);
    setFeedback(null);
    setShowHint(false);
  };

  useEffect(function () {
    if (filteredChallenges.length > 0) {
      setCode(filteredChallenges[0].starterCode);
      setCurrentIdx(0);
      setFeedback(null);
      setShowHint(false);
    }
  }, [category]);

  var challenge = filteredChallenges[currentIdx];
  var total = filteredChallenges.length;
  var isLast = currentIdx === total - 1;
  var isFirst = currentIdx === 0;

  useEffect(function () {
    if (challenge) {
      setCode(challenge.starterCode);
      setFeedback(null);
      setShowHint(false);
    }
  }, [currentIdx, category]);

  useEffect(function () {
    if (feedback) setFeedback(null);
  }, [code]);

  // ── Check solution ────────────────────────────
  var handleCheck = useCallback(function () {
    if (!challenge) return;
    var result = challenge.solutionCheck(code);
    setFeedback(result);
    setResults(function (prev) { var n = {}; n[challenge.id] = result.pass; return Object.assign({}, prev, n); });
    if (result.pass) {
      setSolved(function (prev) { var n = {}; n[challenge.id] = true; return Object.assign({}, prev, n); });
      // Trigger cyber flourish
      setPulseKey(function (k) { return k + 1; });
    }
  }, [code, challenge]);

  var goNext = useCallback(function () {
    if (currentIdx < total - 1) setCurrentIdx(function (i) { return i + 1; });
  }, [currentIdx, total]);

  var goPrev = useCallback(function () {
    if (currentIdx > 0) setCurrentIdx(function (i) { return i - 1; });
  }, [currentIdx]);

  // ── Keyboard shortcuts ────────────────────────
  useEffect(function () {
    var handler = function (e) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleCheck();
      }
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return function () { window.removeEventListener('keydown', handler); };
  }, [handleCheck, goNext, goPrev]);

  // ── Counts ────────────────────────────────────
  var categoryCounts = {};
  CATEGORIES.forEach(function (cat) {
    var catChallenges = allChallenges.filter(function (c) { return c.category === cat.key; });
    categoryCounts[cat.key] = {
      total: catChallenges.length,
      solved: catChallenges.filter(function (c) { return solved[c.id]; }).length,
    };
  });

  var drillTypeCounts = {};
  DRILL_TYPES.forEach(function (dt) {
    var dtTotal = 0;
    var dtSolved = 0;
    (dt.tabs || []).forEach(function (tab) {
      var tabChallenges = allChallenges.filter(function (c) { return c.category === tab.key; });
      dtTotal += tabChallenges.length;
      dtSolved += tabChallenges.filter(function (c) { return solved[c.id]; }).length;
    });
    drillTypeCounts[dt.key] = { total: dtTotal, solved: dtSolved };
  });

  // ═══════════════════════════════════════════════
  // CHECKLIST BOARD (tshirt-shop-api)
  // ═══════════════════════════════════════════════
  if (activeDrillType.isChecklist) {
    return React.createElement(
      'div',
      { className: 'app-shell' },
      React.createElement(CyberBackground, { paramsRef: bgParamsRef, opacity: bgOpacity }),
      // Header
      React.createElement(
        'header',
        { className: 'app-header' },
        React.createElement(
          'div',
          { className: 'header-row' },
          React.createElement(
            'div',
            { className: 'header-brand' },
            React.createElement('img', { src: '/icon.png', className: 'header-logo', alt: 'Shell' }),
            React.createElement('span', { className: 'header-title' }, 'Shell')
          ),
          React.createElement(
            'div',
            { className: 'drill-nav' },
            DRILL_TYPES.map(function (dt) {
              var counts = drillTypeCounts[dt.key];
              var active = dt.key === drillType;
              return React.createElement(
                'button',
                {
                  key: dt.key,
                  onClick: function () { handleDrillTypeChange(dt.key); },
                  className: cx('drill-btn', { active: active }),
                },
                React.createElement('span', null, dt.icon),
                React.createElement('span', null, dt.label),
                !dt.comingSoon && !dt.isChecklist && counts && React.createElement('span', { className: 'count' }, counts.solved + '/' + counts.total)
              );
            }),
            React.createElement(
              'a',
              {
                href: 'https://typedash.dev',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'ext-link',
                title: 'Typing speed practice for developers',
              },
              React.createElement('span', null, '\u2328'),
              React.createElement('span', null, 'Typing'),
              React.createElement('span', { className: 'ext-arrow' }, '↗')
            )
          )
        )
      ),
      // Checklist board
      React.createElement(
        'div',
        { style: { flex: 1, overflow: 'hidden' } },
        React.createElement(TShirtChecklist, null)
      )
    );
  }

  // ═══════════════════════════════════════════════
  // COMING SOON (Mentoring)
  // ═══════════════════════════════════════════════
  if (activeDrillType.comingSoon) {
    return React.createElement(
      'div',
      { className: 'app-shell' },
      React.createElement(CyberBackground, { paramsRef: bgParamsRef, opacity: bgOpacity }),
      // Header
      React.createElement(
        'header',
        { className: 'app-header' },
        React.createElement(
          'div',
          { className: 'header-row' },
          React.createElement(
            'div',
            { className: 'header-brand' },
            React.createElement('img', { src: '/icon.png', className: 'header-logo', alt: 'Shell' }),
            React.createElement('span', { className: 'header-title' }, 'Shell')
          ),
          React.createElement(
            'div',
            { className: 'drill-nav' },
            DRILL_TYPES.map(function (dt) {
              var counts = drillTypeCounts[dt.key];
              var active = dt.key === drillType;
              return React.createElement(
                'button',
                {
                  key: dt.key,
                  onClick: function () { handleDrillTypeChange(dt.key); },
                  className: cx('drill-btn', { active: active }),
                },
                React.createElement('span', null, dt.icon),
                React.createElement('span', null, dt.label),
                !dt.comingSoon && counts && React.createElement('span', { className: 'count' }, counts.solved + '/' + counts.total)
              );
            }),
            React.createElement(
              'a',
              {
                href: 'https://typedash.dev',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'ext-link',
                title: 'Typing speed practice for developers',
              },
              React.createElement('span', null, '\u2328'),
              React.createElement('span', null, 'Typing'),
              React.createElement('span', { className: 'ext-arrow' }, '↗')
            )
          )
        )
      ),
      // Mentoring insights
      React.createElement(
        'div',
        { style: { flex: 1, overflow: 'hidden' } },
        React.createElement(MentoringInsights, null)
      )
    );
  }

  // ═══════════════════════════════════════════════
  // EMPTY STATES
  // ═══════════════════════════════════════════════
  if (!challenge && CATEGORIES.length > 0) {
    return React.createElement(
      'div',
      { className: 'app-shell' },
      React.createElement(CyberBackground, { paramsRef: bgParamsRef, opacity: bgOpacity }),
      React.createElement('div', { className: 'empty-state' }, 'No challenges in this category yet.')
    );
  }

  if (!challenge) {
    return React.createElement(
      'div',
      { className: 'app-shell' },
      React.createElement(CyberBackground, { paramsRef: bgParamsRef, opacity: bgOpacity }),
      React.createElement('div', { className: 'empty-state' }, 'Select a drill type to begin.')
    );
  }

  // ═══════════════════════════════════════════════
  // MAIN DRILL VIEW
  // ═══════════════════════════════════════════════
  return React.createElement(
    'div',
    { className: 'app-shell' },

    // ── Cyber background canvas ──────────────────
    React.createElement(CyberBackground, { paramsRef: bgParamsRef, opacity: bgOpacity }),

    // ── Solve pulse (self-destructing) ───────────
    pulseKey > 0 && React.createElement(SolvePulse, { key: pulseKey }),

    // ═══════════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════════
    React.createElement(
      'header',
      { className: 'app-header' },

      // Row 1: Logo + drill nav + typedash
      React.createElement(
        'div',
        { className: 'header-row' },
        React.createElement(
          'div',
          { className: 'header-brand' },
          React.createElement('img', { src: '/icon.png', className: 'header-logo', alt: 'Shell' }),
          React.createElement('span', { className: 'header-title' }, 'Shell')
        ),
        React.createElement(
          'div',
          { className: 'drill-nav' },
          DRILL_TYPES.map(function (dt) {
            var counts = drillTypeCounts[dt.key];
            var active = dt.key === drillType;
            return React.createElement(
              'button',
              {
                key: dt.key,
                onClick: function () { handleDrillTypeChange(dt.key); },
                className: cx('drill-btn', { active: active }),
              },
              React.createElement('span', null, dt.icon),
              React.createElement('span', null, dt.label),
              !dt.comingSoon && counts && React.createElement('span', { className: 'count' }, counts.solved + '/' + counts.total)
            );
          }),
          // typedash external link
          React.createElement(
            'a',
            {
              href: 'https://typedash.dev',
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'ext-link',
              title: 'Typing speed practice for developers',
            },
            React.createElement('span', null, '\u2328'),
            React.createElement('span', null, 'Typing'),
            React.createElement('span', { className: 'ext-arrow' }, '↗')
          )
        )
      ),

      // Row 1.5: Background controls (subtle sliders)
      React.createElement('div', {
        className: 'bg-controls',
        style: { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 2 }
      },
        React.createElement('span', { style: { fontSize: 10, color: '#475569' } }, 'BG'),
        React.createElement('input', {
          type: 'range', min: 0, max: 100, value: Math.round(bgOpacity * 100),
          onChange: function(e) { setBgOpacity(Number(e.target.value) / 100); },
          style: { width: 60, height: 3, accentColor: '#6366f1', cursor: 'pointer' },
          title: 'Opacity: ' + Math.round(bgOpacity * 100) + '%'
        }),
        React.createElement('input', {
          type: 'range', min: 0, max: 360, value: bgHue,
          onChange: function(e) { setBgHue(Number(e.target.value)); },
          style: { width: 60, height: 3, accentColor: '#6366f1', cursor: 'pointer' },
          title: 'Hue: ' + bgHue + '°'
        }),
        React.createElement('span', { style: { fontSize: 10, color: '#475569', minWidth: 32 } },
          Math.round(bgOpacity * 100) + '% · ' + bgHue + '°'
        )
      ),

      // Row 2: Tab nav + progress
      CATEGORIES.length > 1 &&
        React.createElement(
          'div',
          { className: 'tab-row' },
          React.createElement(
            'div',
            { className: 'tab-nav' },
            CATEGORIES.map(function (cat) {
              var counts = categoryCounts[cat.key];
              var active = cat.key === category;
              return React.createElement(
                'button',
                {
                  key: cat.key,
                  onClick: function () { handleCategoryChange(cat.key); },
                  className: cx('tab-btn', { active: active }),
                },
                React.createElement('span', null, cat.icon),
                React.createElement('span', null, cat.label),
                counts && React.createElement('span', { className: 'count' }, counts.solved + '/' + counts.total)
              );
            })
          ),
          React.createElement(
            'div',
            { className: 'tab-progress' },
            React.createElement(
              'div',
              { className: 'progress-dots' },
              filteredChallenges.map(function (ch, i) {
                return React.createElement('button', {
                  key: ch.id,
                  onClick: function () { setCurrentIdx(i); },
                  className: cx('progress-dot', {
                    solved: solved[ch.id],
                    active: !solved[ch.id] && i === currentIdx,
                  }),
                  title: (ch.title || '') + (solved[ch.id] ? ' ✓' : ''),
                });
              })
            ),
            React.createElement(
              'span',
              { className: 'progress-total' },
              Object.values(solved).filter(Boolean).length + '/' + allChallenges.length + ' total'
            )
          )
        )
    ),

    // ═══════════════════════════════════════════════
    // MAIN CONTENT
    // ═══════════════════════════════════════════════
    React.createElement(
      'div',
      { className: 'main-content' },

      // ── LEFT: Editor ────────────────────────────
      React.createElement(
        'div',
        { className: 'editor-panel' },

        // Challenge header
        React.createElement(
          'div',
          { className: 'challenge-header' },
          React.createElement(
            'div',
            { className: 'challenge-meta-row' },
            React.createElement(
              'div',
              null,
              React.createElement(
                'div',
                { className: 'challenge-category' },
                'Challenge ' + (currentIdx + 1) + '/' + total + ' — ' +
                (challenge.hook || challenge.area || challenge.category)
              ),
              React.createElement('h2', { className: 'challenge-title' }, challenge.title),
              challenge.difficulty &&
                React.createElement('span', { className: 'challenge-difficulty' }, challenge.difficulty)
            ),
            !solved[challenge.id] &&
              React.createElement(
                'div',
                { className: 'shortcut-badge' },
                React.createElement('kbd', null, 'Ctrl'),
                '+',
                React.createElement('kbd', null, 'Enter'),
                ' to check'
              )
          ),
          (challenge.concept || challenge.description) &&
            React.createElement('p', { className: 'challenge-desc' }, challenge.concept || challenge.description),
          challenge.instruction &&
            React.createElement('p', { className: 'challenge-instruction' }, challenge.instruction),
          challenge.area && challenge.description && challenge.concept !== challenge.description &&
            React.createElement('p', { className: 'challenge-instruction', style: { whiteSpace: 'pre-wrap' } }, challenge.description)
        ),

        // Editor area
        React.createElement(
          'div',
          { className: 'editor-wrap' },
          React.createElement(
            'div',
            { className: 'editor-toolbar' },
            React.createElement('span', null, '\u270E Editor'),
            React.createElement('span', { className: 'editor-lines' }, code.split('\n').length + ' lines')
          ),
          SYNTAX_TABS.indexOf(category) !== -1
            ? React.createElement(SyntaxSandbox, { code: code, onChange: setCode })
            : React.createElement('textarea', {
                ref: textareaRef,
                value: code,
                onChange: function (e) { setCode(e.target.value); },
                spellCheck: false,
                className: 'code-textarea',
                wrap: 'off',
              })
        )
      ),

      // ── RIGHT: Preview + Actions ────────────────
      React.createElement(
        'div',
        { className: 'preview-panel' },

        // API Runner
        category === 'api' &&
          React.createElement(
            'div',
            { className: 'sandbox-wrap' },
            React.createElement(APIRunner, {
              code: code,
              requestSpec: challenge.requestSpec,
              expectedResponse: challenge.expectedResponse,
              onCheck: function (result) {
                if (!challenge) return;
                setFeedback(result);
                setResults(function (prev) { var n = {}; n[challenge.id] = result.pass; return Object.assign({}, prev, n); });
                if (result.pass) {
                  setSolved(function (prev) { var n = {}; n[challenge.id] = true; return Object.assign({}, prev, n); });
                  setPulseKey(function (k) { return k + 1; });
                }
              },
            })
          ),

        // Execution sandbox
        SYNTAX_TABS.indexOf(category) === -1 && category !== 'api' &&
          React.createElement(
            'div',
            { className: 'sandbox-wrap' },
            React.createElement(ExecutionSandbox, { code: code })
          ),

        // Feedback
        feedback &&
          React.createElement(
            'div',
            { className: cx('feedback-banner', feedback.pass ? 'pass' : 'fail') },
            React.createElement('span', { className: 'feedback-icon' }, feedback.pass ? '\u2713' : '\u2717'),
            React.createElement(
              'div',
              null,
              React.createElement('div', { className: 'feedback-verdict' }, feedback.pass ? 'Pass' : 'Not quite'),
              React.createElement('div', { className: 'feedback-msg' }, feedback.message)
            )
          ),

        // Actions bar
        React.createElement(
          'div',
          { className: 'actions-bar' },
          React.createElement(
            'div',
            { className: 'actions-left' },
            React.createElement(
              'button',
              {
                onClick: function () { setShowHint(function (h) { return !h; }); },
                className: 'btn btn-hint',
              },
              showHint ? '\u25C9 Hide hint' : '\u25CE Hint'
            ),
            React.createElement(
              'button',
              {
                onClick: handleCheck,
                className: cx('btn btn-check', solved[challenge.id] ? 'solved' : 'active'),
              },
              solved[challenge.id] ? '\u2713 Solved' : 'Check solution'
            )
          ),
          React.createElement(
            'div',
            { className: 'actions-right' },
            React.createElement(
              'button',
              {
                onClick: goPrev,
                disabled: isFirst,
                className: 'btn-nav',
              },
              '← Prev'
            ),
            React.createElement(
              'button',
              {
                onClick: goNext,
                disabled: isLast,
                className: 'btn-nav',
              },
              'Next →'
            )
          )
        )
      )
    ),

    // ── Hint overlay ──────────────────────────────
    showHint &&
      React.createElement(
        'div',
        { className: 'hint-overlay' },
        React.createElement('div', { className: 'hint-label' }, '\u25CE Hint'),
        React.createElement(PictorialHint, { diagram: diagramSpecs[challenge.id] }),
        hints[challenge.id] || "Look at the pattern and think about what's missing.",
        React.createElement('div', { className: 'hint-disclaimer' }, "Try it yourself first! This is a hint, not an answer.")
      )
  );
}

// ── Hint database ────────────────────────────────
var hints = {
  'usestate-lazy-init': "useState(initTodos()) calls initTodos on EVERY render because the expression is evaluated eagerly. Use useState(() => initTodos()) or just useState(initTodos) to pass a lazy initializer that React only calls once.",
  'effect-race-condition': "An AbortController gives you a `signal` to pass to fetch, plus an `abort()` to cancel the in-flight request. Call `abort()` in the cleanup function returned by useEffect. Also set loading state after the async gap.",
  'ref-render-count': "`useRef(0)` gives you `{ current: 0 }` that persists across renders but never triggers one. Increment `ref.current` in useEffect and read it in JSX. No infinite loop.",
  'usememo-ref-stability': "`{ userId }` is a new object every render — useEffect sees a new reference and fires. `useMemo(() => ({ userId }), [userId])` returns the SAME object until userId actually changes.",
  'usereducer-booking': "One initialState object, one reducer function with case handlers. Actions like `{ type: \"SET_FIELD\", field: \"email\", value }` keep all state transitions in one place.",
  'custom-hook-online': "useOnlineStatus → useState(navigator.onLine) → useEffect with addEventListener(\"online\", ...) and addEventListener(\"offline\", ...) on window → cleanup via removeEventListener → return the boolean.",
  'usecallback-stale-closure': "useCallback(fn, []) is a frozen snapshot of the first render. Create a noteRef with useRef(note), update it: noteRef.current = note. Then in autoSave, read noteRef.current.",
  'useref-prev-value': "Remove prevCount state. Add const prevRef = useRef(0). Add useEffect(() => { prevRef.current = count }, [count]). Now prevRef.current is the value from the PREVIOUS render.",
  'uselayouteffect-flicker': "useLayoutEffect has the exact same signature as useEffect. Replace \"useEffect\" with \"useLayoutEffect\" and import it. The position correction now runs synchronously before the browser paints.",
  'usecontext-split': "Create a separate ThemeContext = createContext(). Wrap theme in <ThemeContext.Provider>. Have ThemeBadge call useContext(ThemeContext) instead of AppContext.",
  'usestate-functional-update': "setSeconds(seconds + 1) reads the closure-bound value. Change to setSeconds(function(s) { return s + 1; }) — the function argument receives the latest committed state.",
  'custom-hook-usedebounce': "Write function useDebounce(value, delay) { const timerRef = useRef(); useEffect(() => { clearTimeout(timerRef.current); timerRef.current = setTimeout(...); return () => clearTimeout(timerRef.current); }, [value, delay]); ... }",
  'composition-children-prop': "Dashboard should render {children} instead of importing DashboardContent internally. DashboardContent should also render {children}. Lift WelcomeMessage up to App where user is in scope.",
  'composition-implicit-vs-explicit': "Remove useContext(UserContext) from WelcomeMessage. Add a user prop instead: function WelcomeMessage({ user }). Pass user explicitly. Now it works everywhere.",
  'composition-black-box': "PageLayout should render {children} instead of hardcoding Header, Sidebar, and Content. Lift those elements up so each page can compose them freely.",
  'composition-named-slots': "DashboardLayout accepts `header` and `sidebar` props alongside children. Render {header || <DefaultHeader />} and {sidebar || <DefaultSidebar />}.",
  'composition-render-props': "MouseTracker calls children as a function: {children(pos)}. Usage: <MouseTracker>{function(pos) { return <div>Mouse at ({pos.x}, {pos.y})</div>; }}</MouseTracker>.",
  'composition-compound-tabs': "Create TabsContext with createContext(). Tabs provides activeTab via context. Tab reads from it with useContext. No props passed between them.",
  'multi-stage-go': "Use FROM golang:1.22-alpine AS builder, compile with CGO_ENABLED=0 GOOS=linux, then COPY --from=builder into a distroless final image.",
  'layer-cache': "Copy package.json BEFORE copying source. npm ci should only re-install when package.json changes, not when source code changes.",
  'nonroot': "Create a non-root user with adduser, chown the files, and use USER to switch. Production containers must not run as root.",
  'healthcheck': "HEALTHCHECK with curl/wget, specific endpoint, retries, interval, timeout, and start-period. Install curl in the same RUN then remove it.",
  'buildkit-cache': "Use --mount=type=cache for /root/.npm and node_modules. Combine with npm ci --prefer-offline for reproducible fast builds.",
  'graceful-shutdown': "Use CMD exec form (JSON array), set STOPSIGNAL SIGTERM, document signal handling. Consider tini as init for proper signal forwarding.",
  'compose-init': "migrate service with a command, no ports. app depends_on migrate with condition: service_completed_successfully.",
  'compose-network': "Two networks: frontend (public) and backend (internal: true). DB only on backend, no host ports. API on both.",
  'compose-profiles': "Use profiles: [dev/ci/prod], YAML anchors for shared config, adminer only in dev profile.",
  'compose-secrets': "Top-level secrets: block. file: for db_password, external: true for api_key. Mount to /run/secrets/. Never in environment.",
  'compose-depends-health': "db needs healthcheck. app depends_on db with condition: service_healthy. Shared network.",
  'rootless-dind': "Base: docker:dind-rootless. Non-root user ciuser. DOCKER_HOST to rootless socket. ENTRYPOINT starts dockerd-rootless.sh.",
  'volume-uid': "user: \"${USER_UID:-1000}:${USER_GID:-1000}\" in compose. Build args for UID/GID. .env file for values.",
  'multi-stage-lint': "Three stages: lint (run linter), build (compile), release (distroless + trivy scan). CI in Dockerfile.",
  'orpc-basic-procedure': "os.input(z.object({ name: z.string(), email: z.string().email() })) — Use os.input() with Zod schema. Chain .handler() to define the logic. Return a user with an auto-generated id.",
  'orpc-auth-middleware': "Declare context: os.$context<{ headers: Headers }>(). Define middleware with .middleware(). Extract JWT from context.headers.get(\"authorization\"). Parse user, inject via next({ context: { user } }). Throw ORPCError(\"UNAUTHORIZED\") if invalid.",
  'orpc-typed-errors': "Use os.errors({ NOT_FOUND: { data: z.object({ userId: z.number() }) }, FORBIDDEN: {} }). In handler, throw errors.NOT_FOUND({ data: { userId } }) when user missing. Throw errors.FORBIDDEN() for permission issues.",
  'orpc-combined-context': "Initial: os.$context<{ env: { DB_URL: string } }>(). Middleware: create client from context.env.DB_URL, connect before next(), inject { db: client }, disconnect in finally{} for cleanup.",
  'orpc-client-setup': "new RPCLink({ url: \"...\", headers: {...} }). createORPCClient(link) typed as RouterClient<typeof router>. The client gets full autocomplete for all procedures.",
  'orpc-lazy-router': "os.lazy(() => import(\"./post.router\").then(m => m.postRouter)) — defers loading until first call. Eager routers load immediately. Export top-level router with both eager and lazy sub-routers.",
  'usetransition-tab-switch': "Import useTransition. Destructure [isPending, startTransition]. Wrap setTab in startTransition: startTransition(() => setTab(t)). Show a loading state when isPending is true.",
  'usedeferredvalue-search': "Import useDeferredValue. const deferredQuery = useDeferredValue(query). Use deferredQuery in the filter, not query. React keeps showing old results while computing new ones.",
  'error-boundary-class': "class ErrorBoundary extends Component. static getDerivedStateFromError sets hasError: true. componentDidCatch logs. Render fallback when hasError. Wrap BuggyWidget in <ErrorBoundary>.",
  'useimperativehandle-ref': "Use useImperativeHandle(ref, () => ({ focus() { inputRef.current.focus() }, clear() { inputRef.current.value = \"\" } })). Keep a separate internal ref for the input.",
  'useid-aria-label': "const id = useId(). Replace hardcoded id=\"email\" with id={id} and htmlFor=\"email\" with htmlFor={id}. Each instance gets a unique ID.",
  'suspense-lazy-split': "const HeavyChart = lazy(() => import(\"./HeavyChart\")). Wrap in <Suspense fallback={<p>Loading...</p>}>. Remove the static import.",
  'react-memo-when': "const MemoChild = React.memo(ExpensiveChild). Use <MemoChild> instead of <ExpensiveChild>. But beware: inline objects/arrays still break memo — pair with useMemo/useCallback.",
  'useoptimistic-form': "const [optimisticTodos, addOptimistic] = useOptimistic(todos, (state, newTodo) => [...state, newTodo]). Update optimistically, then call addTodo. React rolls back on failure. Use useFormStatus for button pending state.",
  'reactquery-basic-setup': "useQuery({ queryKey: [\"user\", userId], queryFn: () => fetch(...).then(r => r.json()) }). Destructure { data, isLoading, isError }. Wrap app in QueryClientProvider.",
  'reactquery-optimistic-mutation': "useMutation with onMutate (optimistic cache update via setQueryData), onError (rollback), onSettled (invalidateQueries). Use useQueryClient() to get the client.",
  'reactquery-dependent-query': "Add enabled: !!projectId to the tasks query. It only fetches when a project is selected. Use placeholderData for smooth transitions.",
  'reactquery-infinite-scroll': "useInfiniteQuery with getNextPageParam: (lastPage) => lastPage.nextCursor. fetchNextPage() on button click. hasNextPage controls visibility. data.pages.flatMap().",
  'reactquery-cache-invalidation': "In mutation onSuccess: queryClient.invalidateQueries({ queryKey: [\"posts\"] }). Use useQueryClient() to access the client. This triggers background refetch.",
  'reactquery-prefetch': "onMouseEnter: queryClient.prefetchQuery({ queryKey: [\"article\", id], queryFn: ... }). Check getQueryData first to skip cached items. Set staleTime on the article query.",
  'testing-render-query': "render(<Greeting name=\"Alice\" />). screen.getByText(\"Hello, Alice\"). expect(element).toBeDefined(). Test both name and no-name cases.",
  'testing-user-event': "Import userEvent from @testing-library/user-event. await user.click(screen.getByText(\"+\")). Check count updated. Test disabled state with toBeDisabled().",
  'testing-async-waitfor': "Mock fetch with vi.fn().mockResolvedValue({ json: () => ({ name: \"Alice\" }) }). Use waitFor(() => screen.getByText(\"Alice\")) or findByText(\"Alice\"). Test loading and error states.",
  'testing-mocking-modules': "vi.mock(\"./email-service\"). In test: expect(sendEmail).toHaveBeenCalledWith(\"test@test.com\", \"Hello from the app\"). beforeEach clears mocks.",
  'testing-custom-hook': "const { result } = renderHook(() => useCounter(5)). act(() => result.current.increment()). expect(result.current.count).toBe(6). Test clamp at 0.",
  'testing-snapshot-tradeoffs': "expect(container).toMatchSnapshot() for quick regression. But also write specific assertions for name, email, avatar src, and admin badge presence/absence. Comment on trade-offs.",
  'amqp-connection': "connect() with amqp.connect(url, { heartbeat: 60 }). Create channel, set prefetch(10). Wrap in try/catch. On close/error: reconnect with setTimeout.",
  'amqp-exchange-types': "ch.assertExchange(\"orders\", \"topic\", { durable: true }). Bind queues with ch.bindQueue(q, exchange, pattern). patterns: \"order.us.*\", \"order.eu.*\", \"order.#\".",
  'amqp-dead-letter': "Create orders.dlx exchange (direct). Create orders.dead queue bound to it. Main queue: arguments: { \"x-dead-letter-exchange\": \"orders.dlx\" }.",
  'amqp-consumer-ack': "ch.consume(queue, handler, { noAck: false }). In handler: ch.ack(msg) on success. ch.nack(msg, false, false) to discard poison. ch.nack(msg, false, true) to requeue.",
  'kafka-producer-config': "new Kafka({ clientId, brokers }). Producer config: { acks: -1, idempotent: true, compression: CompressionTypes.GZIP }. Send with key for partitioning.",
  'kafka-consumer-group': "consumer({ groupId: \"order-processor\" }). subscribe({ topic: \"orders\", fromBeginning: false }). eachMessage: process + commitOffsets. Graceful shutdown on SIGTERM.",
  'kafka-topic-config': "admin.createTopics({ topics: [{ topic: \"orders\", numPartitions: 6, replicationFactor: 3, configEntries: [{ name: \"retention.ms\", value: \"604800000\" }] }] }).",
  'kafka-transactions': "producer: { transactionalId, maxInFlightRequests: 1 }. consumer isolationLevel: read_committed. Flow: transaction().begin() → send → sendOffsets → commit(). abort() on error.",
  'api-basic-json': "Call res.status(200).json({ status: \"ok\", version: \"1.0\" }). The .json() method sets Content-Type and sends the response.",
  'api-route-params': "Read req.params.userId and construct the response: res.status(200).json({ id: req.params.userId, name: \"User \" + req.params.userId }).",
  'api-request-body': "Destructure name from req.body. Return res.status(201).json({ id: 1, name: req.body.name }) — omit email from the response.",
  'api-query-params': "Check if req.query.q exists. If not: res.status(400).json({ error: \"Missing query parameter: q\" }). Otherwise: res.status(200).json({ results: [], query: req.query.q }).",
  'api-error-handling': "Check if req.body.title is falsy OR empty string. If so: res.status(400).json({ error: \"VALIDATION_ERROR\", message: \"Title is required\" }). Else: res.status(201).json({ id: 1, title: req.body.title }).",
  'api-auth-middleware': "Check req.headers.authorization === \"Bearer secret-token\". If match: res.status(200).json({ data: \"protected\" }). Else: res.status(401).json({ error: \"Unauthorized\" }).",
  'api-zod-validation': "Check typeof req.body.name === \"string\" && req.body.name.length >= 2. Check typeof req.body.price === \"number\" && req.body.price > 0. If invalid: 400. If valid: 201.",
  'api-jwt-auth': "Split req.headers.authorization on space. Check prefix === \"Bearer\" and token exists. If token === \"valid.jwt.token\": 200 with user. Else: 401.",
  'api-rate-limit': "Parse count as Number. If count > 100: res.status(429).setHeader(\"Retry-After\", \"60\").json({ error: \"...\" }). Always set X-RateLimit-Remaining.",
  'api-role-auth': "Read req.body.role and action. admin+DELETE→200. user+PATCH→200. Everything else→403 with { error: \"Forbidden\" }.",
  'api-input-sanitize': "String.replace in order: & → &amp; first, then < → &lt;, > → &gt;, \" → &quot;. Trim first. If empty after trim: 400.",
  'api-health-check': "Base response: { status: \"healthy\", uptime: 3600, checks: { db: \"ok\", cache: \"ok\" } }. If req.query.verbose: add memory.",
  'api-structured-logging': "Create { timestamp: new Date().toISOString(), method: req.method, path: req.path, status: 200 }. Store on req.log. Return { logged: true, log }.",
  'api-etag-caching': "ETag = \"W/\\\"\" + version + \"\\\"\". Check req.headers[\"if-none-match\"] === etag. If match: 304. Else: 200 + setHeader(\"ETag\", etag).",
  'api-fulltext-search': "If !req.query.q: 400. Filter: items.filter(i => i.toLowerCase().includes(q.toLowerCase())). Return { results, count: results.length }.",
  'api-pagination': "cursor = Number(req.query.cursor || 0), limit = Number(req.query.limit || 10). Slice: items.slice(cursor, cursor + limit). nextCursor = cursor + limit < total ? String(cursor + limit) : null.",
};

// ── Diagram specs (CPA Pictorial layer) ──────────
var diagramSpecs = {
  // ═══ Hooks — lifecycle timelines ═══
  'usestate-lazy-init': { type: 'lifecycle', label: 'useState evaluation timing', stages: [
    { name: 'Render 1', detail: 'useState(initTodos())', good: true },
    { name: 'Render 2', detail: 'evaluates initTodos() AGAIN', warn: true },
    { name: 'Render 3+', detail: 'evaluates every time', warn: true },
    { name: 'Fix', detail: 'useState(() => initTodos())', good: true },
  ]},
  'effect-race-condition': { type: 'lifecycle', label: 'useEffect with cleanup', stages: [
    { name: 'Mount', detail: 'fetch() starts' },
    { name: 'Response', detail: 'setData(res)', good: true },
    { name: 'Unmount', detail: 'abort() in cleanup', good: true },
    { name: 'No cleanup', detail: 'setState on unmounted component', warn: true },
  ]},
  'ref-render-count': { type: 'lifecycle', label: 'useRef across renders', stages: [
    { name: 'Render 1', detail: 'ref.current = 0' },
    { name: 'Render 2', detail: 'ref.current = 1' },
    { name: 'Render 3', detail: 'ref.current = 2' },
    { name: 'Key', detail: 'ref persists, no re-render', good: true },
  ]},
  'usememo-ref-stability': { type: 'beforeafter', label: 'Object identity across renders',
    before: { label: 'Unstable', code: 'useEffect(() => {...}, [{ userId }])', issue: 'New object every render — effect fires every time' },
    after: { label: 'Stable', code: 'const opts = useMemo(() => ({ userId }), [userId])', fix: 'Same object until userId changes' },
  },
  'usereducer-booking': { type: 'statemachine', label: 'Booking form state machine', states: [
    { name: 'idle', detail: 'initial' }, { name: 'filling', detail: 'user typing', active: true },
    { name: 'validating', detail: 'check fields' }, { name: 'submitting', detail: 'POST' },
    { name: 'success', detail: 'confirmed' }, { name: 'error', detail: 'retry' },
  ], transitions: [
    { from: 'idle', to: 'filling', label: 'onChange' }, { from: 'filling', to: 'validating', label: 'onSubmit' },
    { from: 'validating', to: 'submitting', label: 'valid' }, { from: 'validating', to: 'filling', label: 'invalid' },
  ]},
  'custom-hook-online': { type: 'lifecycle', label: 'useOnlineStatus hook lifecycle', stages: [
    { name: 'Mount', detail: 'navigator.onLine' },
    { name: 'Listen', detail: 'addEventListener online/offline', good: true },
    { name: 'Update', detail: 'setState triggers re-render' },
    { name: 'Cleanup', detail: 'removeEventListener', good: true },
  ]},
  'usecallback-stale-closure': { type: 'beforeafter', label: 'Stale closure vs useRef',
    before: { label: 'Stale', code: 'useCallback(fn, []) // frozen snapshot', issue: 'Reads initial note value forever' },
    after: { label: 'Fixed', code: 'noteRef.current = note\nuseCallback(() => save(noteRef.current), [])', fix: 'Ref always reads latest value' },
  },
  'useref-prev-value': { type: 'lifecycle', label: 'Tracking previous value', stages: [
    { name: 'Render 1', detail: 'prevRef = 0, count = 0' },
    { name: 'Render 2', detail: 'prevRef = 0, count = 5' },
    { name: 'Effect', detail: 'prevRef.current = count' },
    { name: 'Render 3', detail: 'prevRef = 5, count = 10', good: true },
  ]},
  'uselayouteffect-flicker': { type: 'lifecycle', label: 'useEffect vs useLayoutEffect', stages: [
    { name: 'Paint', detail: 'Browser renders' },
    { name: 'useEffect', detail: 'Fires after paint → flicker', warn: true },
    { name: 'Paint', detail: 'Browser renders' },
    { name: 'useLayoutEffect', detail: 'Fires before paint → no flicker', good: true },
  ]},
  'usecontext-split': { type: 'treeprops', label: 'Split context to prevent re-renders', nodes: [
    { name: 'AppContext', depth: 0, props: { theme: 'light', user: 'Alice', todos: '[...]' }, note: 'One context → all consumers re-render' },
    { name: 'ThemeContext', depth: 1, props: { theme: 'light' }, highlight: true, note: 'Separate → only theme consumers re-render' },
    { name: 'AppContext', depth: 1, props: { user: 'Alice', todos: '[...]' }, note: 'Data consumers unaffected by theme changes' },
  ]},
  'usestate-functional-update': { type: 'beforeafter', label: 'Closure vs functional update',
    before: { label: 'Stale', code: 'setSeconds(seconds + 1) // closure value', issue: 'Reads stale seconds from closure' },
    after: { label: 'Correct', code: "setSeconds(s => s + 1) // latest state", fix: 'Function argument = latest committed state' },
  },
  'custom-hook-usedebounce': { type: 'lifecycle', label: 'Debounce timing', stages: [
    { name: 'Value change', detail: 'clearTimeout(timer)' },
    { name: 'Delay', detail: 'setTimeout → 300ms' },
    { name: 'New change', detail: 'Clears & resets timer' },
    { name: 'Timeout fires', detail: 'setDebounced(value)', good: true },
  ]},

  // ═══ Composition — tree/props ═══
  'composition-children-prop': { type: 'treeprops', label: 'Children prop composition', nodes: [
    { name: 'App', depth: 0, props: { user: 'Alice' }, highlight: true },
    { name: 'Dashboard', depth: 1, props: { children: '<WelcomeMessage user={user} />' }, note: 'Renders {children} — flexible' },
    { name: 'WelcomeMessage', depth: 2, props: { user: 'Alice' }, note: 'Receives user as explicit prop' },
  ]},
  'composition-implicit-vs-explicit': { type: 'treeprops', label: 'Implicit (context) vs Explicit (props)', nodes: [
    { name: 'WelcomeMessage', depth: 0, props: { user: 'from context' }, note: 'Hidden dependency — breaks if context missing' },
    { name: 'WelcomeMessage', depth: 0, props: { user: 'Alice' }, highlight: true, note: 'Explicit prop — works anywhere' },
  ]},
  'composition-black-box': { type: 'treeprops', label: 'Black-box layout', nodes: [
    { name: 'PageLayout', depth: 0, props: { children: '...' }, highlight: true, note: 'Renders {children} — no hardcoded internals' },
    { name: 'Header', depth: 1, note: 'Composed by parent' },
    { name: 'Sidebar', depth: 1, note: 'Composed by parent' },
    { name: 'Content', depth: 1, note: 'Composed by parent' },
  ]},
  'composition-named-slots': { type: 'treeprops', label: 'Named slots pattern', nodes: [
    { name: 'DashboardLayout', depth: 0, props: { header: '...', sidebar: '...' }, highlight: true },
    { name: 'header slot', depth: 1, props: { default: '<DefaultHeader />' }, note: '{header || <DefaultHeader />}' },
    { name: 'children slot', depth: 1, note: 'Main content area' },
    { name: 'sidebar slot', depth: 1, props: { default: '<DefaultSidebar />' }, note: '{sidebar || <DefaultSidebar />}' },
  ]},
  'composition-render-props': { type: 'treeprops', label: 'Render props pattern', nodes: [
    { name: 'MouseTracker', depth: 0, props: { children: '(pos) => ...' }, highlight: true },
    { name: 'children(pos)', depth: 1, props: { x: 'pos.x', y: 'pos.y' }, note: 'Calls children as function with position' },
  ]},
  'composition-compound-tabs': { type: 'treeprops', label: 'Compound components with context', nodes: [
    { name: 'TabsContext', depth: 0, props: { activeTab: "'tab1'" }, highlight: true, note: 'Provides activeTab via context' },
    { name: 'Tab', depth: 1, note: 'useContext(TabsContext) — reads activeTab' },
    { name: 'TabPanel', depth: 1, note: 'useContext(TabsContext) — shows if active' },
  ]},

  // ═══ Docker — layers ═══
  'multi-stage-go': { type: 'layers', label: 'Multi-stage build', layers: [
    { name: 'Stage 1: builder', detail: 'golang:1.22-alpine — compiles binary' },
    { name: 'Stage 2: release', detail: 'COPY --from=builder → distroless', highlight: true },
    { name: 'Result', detail: 'Tiny image, no build tools in final' },
  ]},
  'layer-cache': { type: 'layers', label: 'Docker layer caching', layers: [
    { name: 'COPY package.json', detail: 'Cache: only changes when deps change', highlight: true },
    { name: 'RUN npm ci', detail: 'Cached if package.json unchanged' },
    { name: 'COPY . .', detail: 'Source changes → invalidates cache', warn: true },
  ]},
  'nonroot': { type: 'layers', label: 'Non-root user', layers: [
    { name: 'RUN adduser app', detail: 'Create non-root user' },
    { name: 'RUN chown app /app', detail: 'Own app directory' },
    { name: 'USER app', detail: 'Switch to non-root', highlight: true },
    { name: 'Container runs', detail: 'Not as root → secure', good: true },
  ]},
  'healthcheck': { type: 'layers', label: 'HEALTHCHECK', layers: [
    { name: 'HEALTHCHECK', detail: '--interval=30s --retries=3' },
    { name: 'CMD curl /health', detail: 'Check endpoint' },
    { name: 'start-period', detail: '30s grace before checks', highlight: true },
  ]},
  'buildkit-cache': { type: 'layers', label: 'BuildKit cache mounts', layers: [
    { name: 'RUN --mount=type=cache', detail: 'target=/root/.npm' },
    { name: 'npm ci --prefer-offline', detail: 'Fast, reproducible', highlight: true },
    { name: 'Cache persists', detail: 'Between builds', good: true },
  ]},
  'graceful-shutdown': { type: 'lifecycle', label: 'Graceful shutdown', stages: [
    { name: 'SIGTERM', detail: 'Docker sends' },
    { name: 'App catches', detail: 'Stop accepting requests' },
    { name: 'Drain', detail: 'Finish in-flight' },
    { name: 'Exit 0', detail: 'Clean shutdown', good: true },
  ]},
  'compose-init': { type: 'flow', label: 'Compose init pattern', nodes: [
    { name: 'migrate', detail: 'Runs DB migrations' },
    { name: 'exits 0', edgeLabel: 'condition: service_completed_successfully' },
    { name: 'app', detail: 'Starts after migrate', highlight: true },
  ]},
  'compose-network': { type: 'layers', label: 'Dual network', layers: [
    { name: 'frontend', detail: 'Public — API exposed', highlight: true },
    { name: 'backend', detail: 'internal: true — DB only', highlight: true },
  ]},
  'compose-profiles': { type: 'layers', label: 'Compose profiles', layers: [
    { name: 'dev', detail: 'profiles: [dev] — adminer, hot reload' },
    { name: 'ci', detail: 'profiles: [ci] — test runner' },
    { name: 'prod', detail: 'profiles: [prod] — minimal', highlight: true },
  ]},
  'compose-secrets': { type: 'layers', label: 'Docker secrets', layers: [
    { name: 'secrets: block', detail: 'Top-level declaration' },
    { name: 'file: db_password', detail: 'From filesystem' },
    { name: 'Mount: /run/secrets/', detail: 'Never in ENV', highlight: true },
  ]},
  'compose-depends-health': { type: 'flow', label: 'Health dependency', nodes: [
    { name: 'db', detail: 'Has HEALTHCHECK' },
    { name: 'healthy', edgeLabel: 'condition: service_healthy' },
    { name: 'app', detail: 'Depends on db healthy', highlight: true },
  ]},
  'rootless-dind': { type: 'layers', label: 'Rootless Docker-in-Docker', layers: [
    { name: 'docker:dind-rootless', detail: 'Base image' },
    { name: 'Non-root ciuser', detail: 'USER ciuser' },
    { name: 'DOCKER_HOST', detail: 'Rootless socket', highlight: true },
  ]},
  'volume-uid': { type: 'layers', label: 'UID/GID in volumes', layers: [
    { name: 'user: "${UID}:${GID}"', detail: 'From .env file' },
    { name: 'Build args', detail: 'ARG UID, ARG GID' },
    { name: 'Volume owner', detail: 'Matches host user', highlight: true },
  ]},
  'multi-stage-lint': { type: 'layers', label: 'CI in Dockerfile', layers: [
    { name: 'Stage 1: lint', detail: 'Run linter' },
    { name: 'Stage 2: build', detail: 'Compile' },
    { name: 'Stage 3: release', detail: 'distroless + trivy scan', highlight: true },
  ]},

  // ═══ oRPC — dataflow ═══
  'orpc-basic-procedure': { type: 'dataflow', label: 'oRPC procedure', layers: [
    { name: 'os.input(z.object(...))', detail: 'Zod validation' },
    { name: '.handler(fn)', detail: 'Business logic', highlight: true },
    { name: 'return { id, ... }', detail: 'Auto-typed response' },
  ]},
  'orpc-auth-middleware': { type: 'dataflow', label: 'Auth middleware chain', layers: [
    { name: 'Request', detail: 'Authorization header' },
    { name: 'Middleware', detail: 'Extract JWT → parse user', highlight: true },
    { name: 'next({ context: { user } })', detail: 'Inject user' },
    { name: 'Handler', detail: 'Uses context.user' },
  ]},
  'orpc-typed-errors': { type: 'dataflow', label: 'Typed errors', layers: [
    { name: 'os.errors({ ... })', detail: 'Declare error types' },
    { name: 'throw errors.NOT_FOUND({ data })', detail: 'Typed throw', highlight: true },
    { name: 'Client', detail: 'Catches typed error' },
  ]},
  'orpc-combined-context': { type: 'dataflow', label: 'Combined context', layers: [
    { name: 'Initial context', detail: 'env: { DB_URL }' },
    { name: 'Middleware', detail: 'Create DB client → inject', highlight: true },
    { name: 'next({ context: { db } })', detail: 'Handler gets db' },
    { name: 'finally { disconnect() }', detail: 'Cleanup' },
  ]},
  'orpc-client-setup': { type: 'dataflow', label: 'Client setup', layers: [
    { name: 'RPCLink', detail: '{ url, headers }' },
    { name: 'createORPCClient(link)', detail: 'Typed client', highlight: true },
    { name: 'client.procedure(...)', detail: 'Full autocomplete' },
  ]},
  'orpc-lazy-router': { type: 'dataflow', label: 'Lazy router loading', layers: [
    { name: 'os.lazy(() => import(...))', detail: 'Defers loading', highlight: true },
    { name: 'First call', detail: 'Loads module' },
    { name: 'Subsequent calls', detail: 'Cached' },
  ]},

  // ═══ Advanced React ═══
  'usetransition-tab-switch': { type: 'lifecycle', label: 'useTransition — urgent vs deferred', stages: [
    { name: 'Click tab', detail: 'Urgent: update UI immediately' },
    { name: 'startTransition', detail: 'Deferred: setTab(t)', highlight: true },
    { name: 'isPending = true', detail: 'Show loading indicator' },
    { name: 'Render done', detail: 'isPending = false', good: true },
  ]},
  'usedeferredvalue-search': { type: 'lifecycle', label: 'useDeferredValue', stages: [
    { name: 'User types', detail: 'query updates immediately' },
    { name: 'deferredQuery', detail: 'Lags behind query' },
    { name: 'Filter', detail: 'Uses deferredQuery → stale UI', highlight: true },
    { name: 'Reconcile', detail: 'deferredQuery catches up' },
  ]},
  'error-boundary-class': { type: 'lifecycle', label: 'Error Boundary', stages: [
    { name: 'Child throws', detail: 'Error in render' },
    { name: 'getDerivedStateFromError', detail: 'hasError = true', highlight: true },
    { name: 'Render fallback', detail: 'Error UI shown' },
    { name: 'componentDidCatch', detail: 'Log error' },
  ]},
  'useimperativehandle-ref': { type: 'dataflow', label: 'useImperativeHandle', layers: [
    { name: 'Parent ref', detail: 'ref = useRef()' },
    { name: 'useImperativeHandle', detail: 'Expose focus(), clear()', highlight: true },
    { name: 'Parent calls', detail: 'ref.current.focus()' },
  ]},
  'useid-aria-label': { type: 'beforeafter', label: 'useId for accessibility',
    before: { label: 'Hardcoded', code: '<input id="email" />\n<label htmlFor="email">', issue: 'Duplicate IDs across instances' },
    after: { label: 'useId()', code: 'const id = useId()\n<input id={id} />\n<label htmlFor={id}>', fix: 'Unique IDs per instance' },
  },
  'suspense-lazy-split': { type: 'lifecycle', label: 'lazy + Suspense', stages: [
    { name: 'Import', detail: 'lazy(() => import(...))' },
    { name: 'Suspense', detail: 'fallback={<Loading />}', highlight: true },
    { name: 'Load', detail: 'Chunk fetched' },
    { name: 'Render', detail: 'Component mounted', good: true },
  ]},
  'react-memo-when': { type: 'beforeafter', label: 'React.memo — when it works',
    before: { label: 'No memo', code: '<ExpensiveChild user={user} />', issue: 'Re-renders every parent render' },
    after: { label: 'Memo + stable props', code: 'const MemoChild = React.memo(ExpensiveChild)\n<MemoChild user={stableUser} />', fix: 'Only re-renders when props change' },
  },
  'useoptimistic-form': { type: 'statemachine', label: 'Optimistic update flow', states: [
    { name: 'Submit', detail: 'User clicks add' }, { name: 'Optimistic', detail: 'Add to UI immediately', active: true },
    { name: 'Server', detail: 'POST request' }, { name: 'Success', detail: 'Already shown', good: true },
    { name: 'Error', detail: 'Rollback', warn: true },
  ]},

  // ═══ Data Fetching ═══
  'reactquery-basic-setup': { type: 'dataflow', label: 'React Query flow', layers: [
    { name: 'useQuery({ queryKey, queryFn })', detail: 'Declare query' },
    { name: 'Fetch', detail: 'queryFn runs' },
    { name: '{ data, isLoading, isError }', detail: 'Destructure state', highlight: true },
    { name: 'Cache', detail: '5 min staleTime default' },
  ]},
  'reactquery-optimistic-mutation': { type: 'statemachine', label: 'Optimistic mutation', states: [
    { name: 'Mutate', detail: 'useMutation fires' }, { name: 'onMutate', detail: 'Optimistic cache update', active: true },
    { name: 'Server', detail: 'POST/PUT' }, { name: 'onSuccess', detail: 'invalidateQueries', good: true },
    { name: 'onError', detail: 'Rollback cache', warn: true },
  ]},
  'reactquery-dependent-query': { type: 'dataflow', label: 'Dependent query', layers: [
    { name: 'Query 1: project', detail: 'Fetches project' },
    { name: 'Query 2: tasks', detail: 'enabled: !!projectId', highlight: true },
    { name: 'Result', detail: 'Tasks load after project selected' },
  ]},
  'reactquery-infinite-scroll': { type: 'dataflow', label: 'Infinite query', layers: [
    { name: 'useInfiniteQuery', detail: 'getNextPageParam' },
    { name: 'data.pages.flatMap()', detail: 'All pages merged' },
    { name: 'fetchNextPage()', detail: 'Load more on scroll', highlight: true },
  ]},
  'reactquery-cache-invalidation': { type: 'dataflow', label: 'Cache invalidation', layers: [
    { name: 'Mutation', detail: 'POST success' },
    { name: 'onSuccess', detail: 'queryClient.invalidateQueries({ queryKey })', highlight: true },
    { name: 'Refetch', detail: 'Background refetch' },
  ]},
  'reactquery-prefetch': { type: 'lifecycle', label: 'Prefetch on hover', stages: [
    { name: 'Mouse enter', detail: 'onMouseEnter fires' },
    { name: 'prefetchQuery', detail: 'Check cache → fetch if missing', highlight: true },
    { name: 'Click', detail: 'Data already in cache → instant' },
  ]},

  // ═══ Testing ═══
  'testing-render-query': { type: 'beforeafter', label: 'Query testing pattern',
    before: { label: 'No test', code: '// Untested component' },
    after: { label: 'Test', code: "render(<Greeting name='Alice' />)\nscreen.getByText('Hello, Alice')\nexpect(element).toBeDefined()", fix: 'Test both cases: name and no name' },
  },
  'testing-user-event': { type: 'dataflow', label: 'User event flow', layers: [
    { name: 'render', detail: 'Component mounted' },
    { name: 'await user.click(...)', detail: 'Simulate real interaction', highlight: true },
    { name: 'Assert', detail: 'expect(count).toBe(1)' },
  ]},
  'testing-async-waitfor': { type: 'lifecycle', label: 'Async test flow', stages: [
    { name: 'Mock fetch', detail: 'vi.fn().mockResolvedValue(...)' },
    { name: 'render', detail: 'Component renders loading state' },
    { name: 'waitFor', detail: 'Poll until element appears', highlight: true },
    { name: 'Assert', detail: 'Data rendered', good: true },
  ]},
  'testing-mocking-modules': { type: 'dataflow', label: 'Module mocking', layers: [
    { name: 'vi.mock("./email")', detail: 'Replace module' },
    { name: 'Component calls sendEmail', detail: 'Calls mock' },
    { name: 'expect(mock).toHaveBeenCalledWith(...)', detail: 'Verify args', highlight: true },
  ]},
  'testing-custom-hook': { type: 'beforeafter', label: 'Hook testing',
    before: { label: 'In-component test', code: '// Need full component to test hook' },
    after: { label: 'renderHook', code: "const { result } = renderHook(() => useCounter(5))\nact(() => result.current.increment())\nexpect(result.current.count).toBe(6)", fix: 'Test hook in isolation' },
  },
  'testing-snapshot-tradeoffs': { type: 'beforeafter', label: 'Snapshot vs specific assertions',
    before: { label: 'Snapshot only', code: 'expect(container).toMatchSnapshot()', issue: 'Catches regression but fragile' },
    after: { label: 'Specific + snapshot', code: 'expect(name).toBe("Alice")\nexpect(avatar).toHaveAttribute("src", "...")\nexpect(container).toMatchSnapshot()', fix: 'Specific assertions + snapshot as safety net' },
  },

  // ═══ Messaging — flow diagrams ═══
  'amqp-connection': { type: 'flow', label: 'AMQP connection lifecycle', nodes: [
    { name: 'amqp.connect(url)', detail: 'heartbeat: 60' },
    { name: 'createChannel()', detail: 'prefetch(10)', edgeLabel: 'channel' },
    { name: 'on close/error', detail: 'reconnect with setTimeout', highlight: true },
  ]},
  'amqp-exchange-types': { type: 'flow', label: 'Exchange → Queue binding', nodes: [
    { name: 'Exchange: orders', detail: 'type: topic, durable: true' },
    { name: 'Queue: order.us', detail: 'pattern: order.us.*', edgeLabel: 'bindQueue' },
    { name: 'Queue: order.eu', detail: 'pattern: order.eu.*', edgeLabel: 'bindQueue' },
    { name: 'Queue: all', detail: 'pattern: order.#', edgeLabel: 'bindQueue' },
  ]},
  'amqp-dead-letter': { type: 'flow', label: 'Dead Letter Exchange', nodes: [
    { name: 'orders.dlx', detail: 'Exchange (direct)' },
    { name: 'orders.dead', detail: 'Queue bound to DLX', edgeLabel: 'bind' },
    { name: 'Main queue', detail: 'x-dead-letter-exchange: orders.dlx', highlight: true, edgeLabel: 'DLX config' },
  ]},
  'amqp-consumer-ack': { type: 'flow', label: 'Consumer ack/nack', nodes: [
    { name: 'consume', detail: 'noAck: false' },
    { name: 'Success', detail: 'ch.ack(msg)', edgeLabel: 'ack', highlight: true },
    { name: 'Poison', detail: 'ch.nack(msg, false, false)', edgeLabel: 'discard' },
    { name: 'Retry', detail: 'ch.nack(msg, false, true)', edgeLabel: 'requeue' },
  ]},
  'kafka-producer-config': { type: 'layers', label: 'Kafka producer config', layers: [
    { name: 'acks: -1', detail: 'All replicas must acknowledge' },
    { name: 'idempotent: true', detail: 'Exactly-once delivery' },
    { name: 'compression: GZIP', detail: 'Reduce network', highlight: true },
  ]},
  'kafka-consumer-group': { type: 'flow', label: 'Consumer group', nodes: [
    { name: 'consumer({ groupId })', detail: 'Join group' },
    { name: 'subscribe({ topic })', detail: 'fromBeginning: false' },
    { name: 'eachMessage', detail: 'process + commitOffsets', edgeLabel: 'per message', highlight: true },
    { name: 'SIGTERM', detail: 'Graceful shutdown' },
  ]},
  'kafka-topic-config': { type: 'layers', label: 'Topic configuration', layers: [
    { name: 'numPartitions: 6', detail: 'Parallelism' },
    { name: 'replicationFactor: 3', detail: 'Durability' },
    { name: 'retention.ms: 604800000', detail: '7 days', highlight: true },
  ]},
  'kafka-transactions': { type: 'flow', label: 'Kafka transaction flow', nodes: [
    { name: 'transaction().begin()', detail: 'Start tx' },
    { name: 'send()', detail: 'Produce messages', edgeLabel: 'messages' },
    { name: 'sendOffsets()', detail: 'Commit consumer offsets', edgeLabel: 'offsets' },
    { name: 'commit()', detail: 'Atomic tx', highlight: true },
  ]},

  // ═══ API — dataflow ═══
  'api-basic-json': { type: 'dataflow', label: 'Basic JSON response', layers: [
    { name: 'req', detail: 'GET /api/health' },
    { name: 'handler(req, res)', detail: 'Your function', highlight: true },
    { name: 'res.status(200).json({...})', detail: 'Sets Content-Type + body' },
  ]},
  'api-route-params': { type: 'dataflow', label: 'Route params', layers: [
    { name: 'req.params.userId', detail: 'Extracted from path' },
    { name: 'Construct response', detail: '{ id: userId, name: ... }', highlight: true },
    { name: 'res.status(200).json(...)', detail: 'Return user data' },
  ]},
  'api-request-body': { type: 'dataflow', label: 'POST body parsing', layers: [
    { name: 'req.body', detail: '{ name, email }' },
    { name: 'Destructure name', detail: 'Omit email from response', highlight: true },
    { name: 'res.status(201).json(...)', detail: '{ id: 1, name }' },
  ]},
  'api-query-params': { type: 'dataflow', label: 'Query string handling', layers: [
    { name: 'req.query.q', detail: 'Check if present' },
    { name: 'Missing?', detail: 'res.status(400).json({ error })', highlight: true },
    { name: 'Present?', detail: 'res.status(200).json({ results, query })' },
  ]},
  'api-error-handling': { type: 'dataflow', label: 'Structured error response', layers: [
    { name: 'req.body.title', detail: 'Check present + non-empty' },
    { name: 'Invalid', detail: '400: { error: "VALIDATION_ERROR", message }', highlight: true },
    { name: 'Valid', detail: '201: { id: 1, title }' },
  ]},
  'api-auth-middleware': { type: 'dataflow', label: 'Auth header check', layers: [
    { name: 'req.headers.authorization', detail: '"Bearer secret-token"' },
    { name: 'Match?', detail: '200: { data: "protected" }', highlight: true },
    { name: 'No match?', detail: '401: { error: "Unauthorized" }' },
  ]},
  'api-zod-validation': { type: 'dataflow', label: 'Request validation', layers: [
    { name: 'req.body', detail: '{ name, price }' },
    { name: 'Validate types', detail: 'typeof checks + length/range', highlight: true },
    { name: 'Invalid', detail: '400 error' },
    { name: 'Valid', detail: '201 created' },
  ]},
  'api-jwt-auth': { type: 'dataflow', label: 'JWT parsing', layers: [
    { name: 'Authorization header', detail: '"Bearer <token>"' },
    { name: 'Split + validate', detail: 'Check prefix + token exists', highlight: true },
    { name: 'Valid token', detail: '200 with user data' },
    { name: 'Invalid', detail: '401 unauthorized' },
  ]},
  'api-rate-limit': { type: 'dataflow', label: 'Rate limiting', layers: [
    { name: 'Parse count', detail: 'Number(req.headers["x-request-count"])' },
    { name: 'count > 100?', detail: '429 + Retry-After: 60', highlight: true },
    { name: 'count <= 100?', detail: '200 + X-RateLimit-Remaining' },
  ]},
  'api-role-auth': { type: 'dataflow', label: 'Role-based auth', layers: [
    { name: 'req.body', detail: '{ role, action }' },
    { name: 'admin+DELETE', detail: '200', highlight: true },
    { name: 'user+PATCH', detail: '200' },
    { name: 'Other', detail: '403 Forbidden' },
  ]},
  'api-input-sanitize': { type: 'dataflow', label: 'Input sanitization', layers: [
    { name: 'Raw input', detail: 'req.body.text' },
    { name: 'Trim + replace', detail: '& → &amp; then < → &lt; ...', highlight: true },
    { name: 'Empty after trim?', detail: '400 bad request' },
    { name: 'Valid', detail: '200 sanitized' },
  ]},
  'api-health-check': { type: 'dataflow', label: 'Health check endpoint', layers: [
    { name: 'Base response', detail: '{ status, uptime, checks: { db, cache } }' },
    { name: 'req.query.verbose?', detail: 'Add memory info', highlight: true },
    { name: 'res.status(200).json(...)', detail: 'Health status returned' },
  ]},
  'api-structured-logging': { type: 'dataflow', label: 'Structured logging', layers: [
    { name: 'req', detail: '{ method, path }' },
    { name: 'Create log object', detail: '{ timestamp, method, path, status }', highlight: true },
    { name: 'Store on req.log', detail: 'Accessible to downstream' },
    { name: 'Return', detail: '{ logged: true, log }' },
  ]},
  'api-etag-caching': { type: 'dataflow', label: 'ETag caching', layers: [
    { name: 'Generate ETag', detail: 'W/"version"' },
    { name: 'if-none-match matches?', detail: '304 Not Modified', highlight: true },
    { name: 'No match', detail: '200 + setHeader("ETag", ...)' },
  ]},
  'api-fulltext-search': { type: 'dataflow', label: 'Full-text search', layers: [
    { name: 'req.query.q', detail: 'Check present' },
    { name: 'Missing?', detail: '400 error' },
    { name: 'Filter items', detail: '.toLowerCase().includes(q.toLowerCase())', highlight: true },
    { name: 'Return', detail: '{ results, count }' },
  ]},
  'api-pagination': { type: 'dataflow', label: 'Cursor pagination', layers: [
    { name: 'req.query', detail: 'cursor, limit (with defaults)' },
    { name: 'Slice items', detail: 'items.slice(cursor, cursor + limit)', highlight: true },
    { name: 'nextCursor?', detail: 'Compute or null' },
    { name: 'Return', detail: '{ items, nextCursor }' },
  ]},
};
