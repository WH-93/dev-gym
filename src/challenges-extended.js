/**
 * Hook Drills — Extended Challenges
 *
 * Production-grade React hook exercises beyond the core set.
 * Each challenge follows the same schema as challenges.js.
 *
 * IMPORTANT: same escaping rules apply — backticks inside
 * template literals escape as \x60. Single quotes inside
 * single-quoted JS strings escape as \x27.
 */

var extendedChallenges = [
  {
    id: "usecallback-stale-closure",
    title: "useCallback — Stale Closure in Debounced Save",
    hook: "useCallback",
    concept: "useCallback closures freeze values unless deps are correct — the ref escape hatch keeps callbacks stable while reading latest state",
    instruction: [
      'A note editor has "auto-save" — it debounces a save call after',
      'the user stops typing. But it always saves the FIRST version of',
      'the note, not the latest. The save callback was created once',
      'with useCallback(fn, []) — the note inside it is frozen.',
      '',
      'In production: Debounced handlers, WebSocket message handlers,',
      'and event listeners all need stable callbacks that still read',
      'current state. The ref + useCallback combo is the standard fix.',
      '',
      'Fix: Add a noteRef that always holds the latest note text.',
      'Update ref.current before the debounced save reads it.',
      'The callback stays stable (no deps change) but always saves',
      'the current value.'
    ].join('\n'),
    starterCode: [
      "import { useState, useCallback, useRef, useEffect } from 'react';",
      '',
      'export default function NoteEditor() {',
      "  const [note, setNote] = useState('Hello');",
      "  const [saved, setSaved] = useState('Hello');",
      '  const saveTimer = useRef(null);',
      '',
      '  // Bug: useCallback(fn, []) captures `note` from the first render.',
      '  // Every debounced save sends the initial value, not the latest.',
      '  const autoSave = useCallback(() => {',
      '    setSaved(note);  // stale! always "Hello"',
      "    console.log('Saving:', note);",
      '  }, []); // empty deps = frozen closure',
      '',
      '  useEffect(() => {',
      '    // Simulate debounce: save 1 second after last keystroke',
      '    clearTimeout(saveTimer.current);',
      '    saveTimer.current = setTimeout(autoSave, 1000);',
      '    return () => clearTimeout(saveTimer.current);',
      '  }, [note, autoSave]);',
      '',
      '  return (',
      '    <div>',
      '      <textarea',
      '        value={note}',
      "        onChange={e => setNote(e.target.value)}",
      '        rows={6}',
      "        style={{ width: '100%', fontFamily: 'monospace', fontSize: 14 }}",
      '      />',
      "      <p style={{ fontSize: 13, color: '#888' }}>",
      '        Last saved: {saved}',
      '      </p>',
      "      <p style={{ fontSize: 12, color: '#f59e0b' }}>",
      '        Current note: {note}',
      '      </p>',
      '      {saved !== note && (',
      "        <p style={{ fontSize: 11, color: '#ef4444' }}>",
      '          Mismatch! The auto-save is saving a stale value.',
      '        </p>',
      '      )}',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasRefForNote = /noteRef|latestNote|currentNote/.test(code);
      var hasRefCurrentAssign = /\.current\s*=\s*(note|text|value)/.test(code);
      var hasCallback = /useCallback/.test(code);
      var hasUseRef = /useRef/.test(code);

      if (!hasCallback || !hasUseRef) {
        return { pass: false, message: 'Add a useRef to hold the latest note value, and read ref.current inside the debounced callback instead of the stale `note` closure.' };
      }
      if (!hasRefForNote) {
        return { pass: false, message: 'Create a ref (e.g. const noteRef = useRef(note)) to hold the latest note. Then read noteRef.current inside autoSave.' };
      }
      if (!hasRefCurrentAssign) {
        return { pass: false, message: 'Update the ref on every render: noteRef.current = note. Without this, the ref still holds the initial value.' };
      }
      return {
        pass: true,
        message: 'useRef bridges the closure gap! The callback stays stable but always reads the latest value through ref.current.'
      };
    }
  },
  {
    id: "useref-prev-value",
    title: "useRef — Track Previous State Without Re-rendering",
    hook: "useRef",
    concept: "useEffect + useRef captures the previous render's state for comparison, without triggering extra renders",
    instruction: [
      'A dashboard shows a count and flashes "Increased!" or "Decreased!"',
      'when the value changes. The current code uses state to track the',
      'previous value — but that causes a DOUBLE re-render on every change:',
      'once for the new count, once for updating "prevCount".',
      '',
      'In production: Comparing previous and current values (scroll position,',
      'selection changes, form dirty state) should use useRef — it stores',
      'the value for the NEXT render without causing one now.',
      '',
      'Fix: Replace the prevCount state with a useRef. In useEffect,',
      'read prevCountRef.current before updating it. The ref gives you',
      'the value from the PREVIOUS render without triggering a new one.'
    ].join('\n'),
    starterCode: [
      "import { useState, useRef } from 'react';",
      '',
      'export default function ChangeTracker() {',
      '  const [count, setCount] = useState(0);',
      '  // BUG: Using state to track the previous value causes',
      '  // double re-renders. Each count change fires TWO renders:',
      '  // one for setCount, another for setPrevCount.',
      '  const [prevCount, setPrevCount] = useState(0);',
      '  const [renderCount, setRenderCount] = useState(0);',
      '',
      '  function handleIncrement() {',
      '    setPrevCount(count);',
      "    setCount(c => c + 1);",
      '  }',
      '',
      '  function handleDecrement() {',
      '    setPrevCount(count);',
      "    setCount(c => c - 1);",
      '  }',
      '',
      '  // Count re-renders to visualize the double-render problem',
      "  setRenderCount(r => r + 1);",
      '',
      "  var direction = count > prevCount ? 'increased' :",
      "    count < prevCount ? 'decreased' : 'same';",
      '',
      '  return (',
      '    <div>',
      '      <h1>Count: {count}</h1>',
      '      <p>Previous: {prevCount} | Direction: {direction}</p>',
      "      <p style={{ fontSize: 12, color: '#f59e0b' }}>",
      '        Render #{renderCount}',
      '      </p>',
      "      <p style={{ fontSize: 11, color: '#ef4444' }}>",
      '        Bug: Each click triggers TWO renders. Watch render count.',
      '      </p>',
      '      <button onClick={handleIncrement}>+1</button>',
      '      <button onClick={handleDecrement} style={{ marginLeft: 8 }}>-1</button>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasPrevRef = /prevCountRef|prevRef|previousRef/.test(code);
      var hasRefUpdate = /\.current\s*=\s*(count|value)/.test(code);
      var noPrevState = !/setPrevCount/.test(code);
      var hasUseEffect = /useEffect/.test(code);
      var usesRef = /useRef/.test(code) && !/setPrevCount/.test(code);

      return {
        pass: usesRef && hasRefUpdate && noPrevState,
        message: usesRef && hasRefUpdate && noPrevState
          ? 'useRef tracks previous values silently — one render per click now, no double-render penalty!'
          : !usesRef
            ? 'Add a useRef for tracking the previous count. Remove the prevCount state entirely.'
            : !hasRefUpdate
              ? 'Update the ref in a useEffect: prevRef.current = count. This captures the value for the NEXT render without causing one now.'
              : 'Remove setPrevCount calls. The ref gets updated in useEffect after each render.'
      };
    }
  },
  {
    id: "uselayouteffect-flicker",
    title: "useLayoutEffect — Tooltip Positioning Flicker",
    hook: "useLayoutEffect",
    concept: "useLayoutEffect runs synchronously before the browser paints; useEffect runs after paint, causing visible flicker for layout measurements",
    instruction: [
      'A tooltip measures its position and adjusts to avoid going off-screen.',
      'But there is a VISIBLE FLICKER — the tooltip appears at the wrong',
      'position first, then jumps to the corrected position.',
      '',
      'In production: Any DOM measurement that affects the visual output',
      '(tooltips, popovers, scroll restoration, animation starting positions)',
      'must happen before the browser paints. That means useLayoutEffect,',
      'not useEffect.',
      '',
      'Fix: Change useEffect to useLayoutEffect. Now the position',
      'measurement and correction happen synchronously before the frame is',
      'painted — no flicker. The paint includes the final position.'
    ].join('\n'),
    starterCode: [
      "import { useState, useEffect, useRef } from 'react';",
      '',
      "export default function Tooltip({ text = 'Hover info' }) {",
      '  const [visible, setVisible] = useState(true);',
      '  const [pos, setPos] = useState({ x: 0, y: 0 });',
      '  const ref = useRef(null);',
      '',
      '  // BUG: useEffect runs AFTER the browser paints.',
      '  // The tooltip initially renders at (0,0), then jumps',
      '  // to the corrected position — visible flicker.',
      '  useEffect(() => {',
      '    if (ref.current) {',
      '      var rect = ref.current.getBoundingClientRect();',
      '      // Simulate position correction to avoid off-screen',
      '      var corrected = {',
      '        x: Math.max(0, 100 - rect.width / 2),',
      '        y: Math.max(0, -rect.height - 8),',
      '      };',
      '      setPos(corrected);',
      '    }',
      '  }, []);',
      '',
      '  return (',
      "    <div style={{ position: 'relative', marginTop: 80, marginLeft: 120 }}>",
      '      <button',
      '        onMouseEnter={() => setVisible(true)}',
      '        onMouseLeave={() => setVisible(false)}',
      '      >',
      '        Hover me',
      '      </button>',
      '      {visible && (',
      '        <div',
      '          ref={ref}',
      '          style={{',
      "            position: 'absolute',",
      '            left: pos.x,',
      '            top: pos.y,',
      "            padding: '6px 12px',",
      "            background: '#1e293b',",
      "            color: '#f1f5f9',",
      '            borderRadius: 6,',
      '            fontSize: 13,',
      "            whiteSpace: 'nowrap',",
      "            border: '1px solid #334155',",
      "            transition: 'none',",
      '          }}',
      '        >',
      '          {text}',
      '        </div>',
      '      )}',
      "      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 80 }}>",
      '        Notice the flicker? useEffect paints BEFORE the position fix.',
      '      </p>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasLayoutEffect = /useLayoutEffect/.test(code);
      var layoutEffectUsedForDOM = /useLayoutEffect\s*\(/.test(code);

      return {
        pass: layoutEffectUsedForDOM,
        message: layoutEffectUsedForDOM
          ? 'useLayoutEffect measures and corrects BEFORE paint — no more flicker!'
          : 'Replace useEffect with useLayoutEffect (same API, same signature). It runs synchronously after DOM mutations but before the browser paints, so the user never sees the intermediate (0,0) position.'
      };
    }
  },
  {
    id: "usecontext-split",
    title: "useContext — Split Context to Prevent Unnecessary Re-renders",
    hook: "useContext",
    concept: "A single context object causes all consumers to re-render when any field changes; split into separate contexts for independent subscriptions",
    instruction: [
      'A chat app has a single context with { user, theme, unreadCount }.',
      'Updating unreadCount causes the THEME consumer to re-render too —',
      'even though its value (theme) never changed.',
      '',
      'In production: Monolithic contexts are the #1 cause of unnecessary',
      're-renders in React apps. Each context value creates an independent',
      'subscription channel. Consumers only re-render when THEIR value changes.',
      '',
      'Fix: Split AppContext into AppStateContext (user + unreadCount)',
      'and ThemeContext (theme). The theme consumer only subscribes to',
      'ThemeContext — unreadCount changes no longer re-render it.'
    ].join('\n'),
    starterCode: [
      "import { useState, createContext, useContext } from 'react';",
      '',
      '// Single context — any field change re-renders ALL consumers',
      'var AppContext = createContext();',
      '',
      'function ThemeBadge() {',
      '  var { theme } = useContext(AppContext);',
      '  var [renderCount, setRenderCount] = useState(0);',
      "  setRenderCount(function(r) { return r + 1; });",
      '  return (',
      "    <div style={{ padding: 8, background: theme === 'dark' ? '#1e293b' : '#e2e8f0',",
      "      color: theme === 'dark' ? '#f1f5f9' : '#0f172a', borderRadius: 6, fontSize: 13 }}>",
      '      Theme: {theme} | Renders: {renderCount}',
      '    </div>',
      '  );',
      '}',
      '',
      'function MessageList() {',
      '  var { unreadCount } = useContext(AppContext);',
      '  var [renderCount, setRenderCount] = useState(0);',
      "  setRenderCount(function(r) { return r + 1; });",
      '  return (',
      "    <div style={{ padding: 8, marginTop: 8, background: '#0f172a', borderRadius: 6, fontSize: 13 }}>",
      '      Unread: {unreadCount} | Renders: {renderCount}',
      '    </div>',
      '  );',
      '}',
      '',
      'export default function ChatApp() {',
      "  var [theme, setTheme] = useState('dark');",
      '  var [unreadCount, setUnreadCount] = useState(0);',
      '',
      '  // Every context state change re-renders BOTH consumers',
      '  return (',
      "    <AppContext.Provider value={{ user: 'Alice', theme: theme, unreadCount: unreadCount }}>",
      '      <div>',
      '        <ThemeBadge />',
      '        <MessageList />',
      "        <button onClick={function() {",
      "          setTheme(function(t) { return t === 'dark' ? 'light' : 'dark'; });",
      '        }}>',
      '          Toggle theme',
      '        </button>',
      "        <button onClick={function() {",
      "          setUnreadCount(function(c) { return c + 1; });",
      '        }} style={{ marginLeft: 8 }}>',
      '          New message',
      '        </button>',
      "        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>",
      '          Bug: clicking New message also re-renders ThemeBadge!',
      '        </p>',
      '      </div>',
      '    </AppContext.Provider>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var contextCount = (code.match(/createContext/g) || []).length;
      var hasSplit = contextCount >= 2;
      var themeConsumerUsesThemeCtx = /useContext\s*\(\s*\w*[Tt]heme/.test(code) || /ThemeContext/.test(code);

      return {
        pass: hasSplit && themeConsumerUsesThemeCtx,
        message: hasSplit && themeConsumerUsesThemeCtx
          ? 'Split contexts! ThemeBadge now only re-renders when theme actually changes.'
          : hasSplit && !themeConsumerUsesThemeCtx
            ? 'You created the split context but ThemeBadge still reads from the old combined context. Point it to ThemeContext instead.'
            : 'Create a separate ThemeContext (createContext) alongside AppContext. Provide them separately and have ThemeBadge subscribe to ThemeContext only.'
      };
    }
  },
  {
    id: "usestate-functional-update",
    title: "useState — Functional Update vs Stale Closure in Intervals",
    hook: "useState",
    concept: "useState's functional updater (prev => prev + 1) always reads the latest state; raw state variables in setInterval closures are frozen at creation time",
    instruction: [
      'A stopwatch increments every second, but it always shows "1" —',
      'the interval callback captured `seconds` from the first render (0)',
      'and never sees the updated value.',
      '',
      'In production: Intervals, timeouts, animation frames, and any',
      'recurring callback that outlives a single render need the functional',
      'form of setState: setCount(prev => prev + 1).',
      'React guarantees `prev` is always the latest committed state.',
      '',
      'Fix: Replace setSeconds(seconds + 1) with setSeconds(s => s + 1).',
      'The functional updater reads the queue, not the closure.'
    ].join('\n'),
    starterCode: [
      "import { useState, useEffect, useRef } from 'react';",
      '',
      'export default function Stopwatch() {',
      '  var [seconds, setSeconds] = useState(0);',
      '  var [running, setRunning] = useState(false);',
      '',
      '  useEffect(function() {',
      '    if (!running) return;',
      '',
      '    // BUG: The interval captures `seconds` once, at the moment',
      '    // setInterval was created. Every tick reads 0.',
      '    var id = setInterval(function() {',
      '      setSeconds(seconds + 1); // always: 0 + 1 = 1',
      '    }, 1000);',
      '',
      '    return function() { clearInterval(id); };',
      '  }, [running]); // eslint would warn about missing `seconds` dep',
      '',
      '  return (',
      '    <div>',
      "      <h1 style={{ fontSize: 48, fontFamily: 'monospace', margin: '16px 0' }}>",
      "        {String(seconds).padStart(2, '0')}s",
      '      </h1>',
      '      <button onClick={function() {',
      "        setRunning(function(r) { return !r; });",
      '        if (running) setSeconds(0);',
      '      }}>',
      "        {running ? 'Stop' : 'Start'}",
      '      </button>',
      '      <button onClick={function() { setSeconds(0); }} style={{ marginLeft: 8 }}>',
      '        Reset',
      '      </button>',
      '      {running && seconds > 0 && seconds < 2 && (',
      "        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>",
      '          Stuck at 1? The closure captured seconds=0 permanently.',
      '        </p>',
      '      )}',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasFunctionalUpdate = /setSeconds\s*\(\s*(s|prev|sec|\w+)\s*=>/.test(code);
      var hasFunctionKeyword = /setSeconds\s*\(\s*function\s*\(/.test(code);
      var stillRaw = /setSeconds\s*\(\s*seconds\s*[+\-]/.test(code);

      return {
        pass: (hasFunctionalUpdate || hasFunctionKeyword) && !stillRaw,
        message: (hasFunctionalUpdate || hasFunctionKeyword) && !stillRaw
          ? 'Functional update reads the latest state from React\'s queue. The stopwatch now counts up correctly!'
          : 'Use setSeconds(function(s) { return s + 1; }) instead of setSeconds(seconds + 1). The function receives the latest committed state, not the closure-bound value.'
      };
    }
  },
  {
    id: "custom-hook-usedebounce",
    title: "Custom Hook — useDebounce with Cleanup",
    hook: "Custom Hook",
    concept: "Debounce hooks must cancel pending timers on unmount and value change to prevent memory leaks and stale updates",
    instruction: [
      'The app debounces a search input to avoid hammering the API.',
      'But the hook never cleans up its timer — if the component unmounts',
      'mid-debounce, setDebouncedValue fires on an unmounted component',
      '(React 19 warns about this). Also, old timers are never cancelled,',
      'leaking memory on each keystroke.',
      '',
      'In production: Every timer-based custom hook needs cleanup in',
      'the useEffect return function. Multiple pending timers can stack up',
      'and fire in the wrong order, producing stale results.',
      '',
      'Fix: Store the timer ID in a ref. In useEffect, clear the previous',
      'timer before creating a new one, AND clear it on unmount. Both',
      'cleanup paths are required for correctness.'
    ].join('\n'),
    starterCode: [
      "import { useState, useEffect } from 'react';",
      '',
      '// Write a custom hook here:',
      '// function useDebounce(value, delay) { ... }',
      '',
      'export default function DebouncedSearch() {',
      "  var [query, setQuery] = useState('');",
      "  var [debouncedQuery, setDebouncedQuery] = useState('');",
      '  var [calls, setCalls] = useState(0);',
      '',
      '  // BUG: No cleanup — timers stack up, fire on unmounted component,',
      '  // and can deliver stale results in the wrong order.',
      '  useEffect(function() {',
      "    setCalls(function(c) { return c + 1; });",
      '    setTimeout(function() {',
      '      setDebouncedQuery(query);',
      '    }, 500);',
      '  }, [query]);',
      '',
      '  return (',
      '    <div>',
      '      <input',
      '        value={query}',
      "        onChange={function(e) { setQuery(e.target.value); }}",
      '        placeholder="Type to search..."',
      '        style={{ padding: 8, fontSize: 14, width: 300 }}',
      '      />',
      "      <p>Debounced: {debouncedQuery || '(waiting)'}</p>",
      "      <p style={{ fontSize: 12, color: '#f59e0b' }}>",
      '        Timers fired: {calls} (should be 1 per debounce, but stack up)',
      '      </p>',
      "      <p style={{ fontSize: 11, color: '#ef4444' }}>",
      '        No cleanup = leaked timers + wrong order results',
      '      </p>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasHook = /function\s+useDebounce/.test(code);
      var hasUseRef = /useRef/.test(code);
      var hasClearInEffect = /clearTimeout/.test(code);
      var hasCleanupReturn = /return\s+function\s*\(/.test(code) && /clearTimeout/.test(code);
      var usesHook = /useDebounce\s*\(/.test(code);

      return {
        pass: hasHook && usesHook && hasClearInEffect && hasUseRef,
        message: hasHook && usesHook && hasClearInEffect && hasUseRef
          ? 'Custom useDebounce with proper timer cleanup! No leaks, no stale updates.'
          : !hasHook
            ? 'Define function useDebounce(value, delay) that stores the timer ID in a useRef, clears the previous timer on each value change, and clears on unmount via useEffect cleanup.'
            : !hasClearInEffect
              ? 'Inside useDebounce\'s useEffect, call clearTimeout on the stored timer ref before creating a new setTimeout. Also return a cleanup function that clears it on unmount.'
              : 'Wire it up: call useDebounce(query, 500) in the component and use the returned debounced value instead of the raw useEffect + setTimeout.'
      };
    }
  }
];

export default extendedChallenges;
