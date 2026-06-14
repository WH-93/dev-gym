/**
 * Hook Drills — production-grade React challenges.
 * Each challenge is a broken component with a real-world bug.
 * The user fixes it by applying the correct hook pattern.
 *
 * IMPORTANT: template literal strings (backticks) inside the
 * instruction/starterCode fields must escape their internal
 * backticks as \x60 (or just avoid backticks entirely).
 * The Oxc parser in Vite 8 is strict about this.
 */

import extendedChallenges from './challenges-extended.js';
import compositionChallenges from './challenges-composition.js';
import dockerChallenges from './challenges-docker.js';
import orpcChallenges from './challenges-orpc.js';
import advancedReactChallenges from './challenges-advanced-react.js';
import testingChallenges from './challenges-testing.js';
import dataFetchingChallenges from './challenges-datafetching.js';
import messagingChallenges from './challenges-messaging.js';

const challenges = [
  {
    id: "usestate-lazy-init",
    title: "useState \u2014 Lazy Initializer Trap",
    hook: "useState",
    concept: "useState(fn()) runs on every render; useState(() => fn()) runs once",
    instruction: [
      'An expensive initTodos() function is called every time the',
      'component re-renders \u2014 even when you just toggle the theme.',
      'A counter shows exactly how many times it has run.',
      '',
      'Most devs assume useState only uses the initial value once, but',
      'the EXPRESSION inside the call is evaluated on every render.',
      'React ignores the result after the first render, but the',
      'computation already happened.',
      '',
      'In production: This causes unnecessary expensive work on every',
      're-render. The app works fine, just slower \u2014 a silent perf bug.',
      '',
      'Fix: useState(() => initTodos()) \u2014 or just useState(initTodos) \u2014',
      'both defer execution until React actually reads the initial state.'
    ].join('\n'),
    starterCode: [
      "import { useState } from 'react';",
      '',
      'let callCount = 0;',
      '',
      'function initTodos() {',
      '  callCount++;',
      '  // Expensive computation (2M iterations)',
      '  let i = 0; while (i < 2000000) i++;',
      '  return [',
      '    { id: 1, text: \'Learn React hooks\', done: false },',
      '    { id: 2, text: \'Build something\', done: false },',
      '  ];',
      '}',
      '',
      'export default function TodoDashboard() {',
      '  // initTodos() runs on EVERY render, not just the first!',
      '  const [todos] = useState(initTodos());',
      '  const [theme, setTheme] = useState(\'light\');',
      '',
      '  return (',
      '    <div>',
      '      <button onClick={() =>',
      '        setTheme(t => t === \'light\' ? \'dark\' : \'light\')',
      '      }>',
      '        Theme: {theme}',
      '      </button>',
      '      <p>initTodos called: {callCount} times</p>',
      '      <ul>',
      '        {todos.map(t => <li key={t.id}>{t.text}</li>)}',
      '      </ul>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: (code) => {
      const hasArrowWrapper = /useState\s*\(\s*\(\)\s*=>/.test(code);
      const hasFuncRef = /useState\s*\(\s*(init|create|get|load)\w*\s*\)/.test(code);
      const stillEager = /useState\s*\(\s*(init|create|get|load)\w*\s*\(/.test(code);
      const hasLazyInit = /useState\s*\(\s*\(\s*\)\s*=>/.test(code) || /useState\s*\(\s*initTodos\s*\)/.test(code);
      return {
        pass: (hasArrowWrapper || hasFuncRef) && !stillEager,
        message: (hasArrowWrapper || hasFuncRef) && !stillEager
          ? 'Lazy initializer! initTodos only runs once, when the component first mounts.'
          : 'useState(initTodos()) calls initTodos on EVERY render \u2014 the expression is evaluated before useState sees it. Use useState(() => initTodos()) or useState(initTodos) to defer the call.'
      };
    }
  },
  {
    id: "effect-race-condition",
    title: "useEffect \u2014 Race Conditions in Search",
    hook: "useEffect",
    concept: "AbortController cleanup prevents stale fetch responses",
    instruction: [
      'A search input fetches results as the user types. Without an',
      'AbortController, old responses can overwrite new ones \u2014 type',
      '"apple" then quickly "banana": if the "apple" response arrives last,',
      'the results show apples for a "banana" query.',
      '',
      'In production: Every fetch in a useEffect with changing deps needs',
      'an AbortController and cleanup.',
      '',
      'Fix: Create an AbortController, pass its signal to fetch,',
      'and call abort() in the cleanup function. Also show a loading state.'
    ].join('\n'),
    starterCode: [
      "import { useState, useEffect } from 'react';",
      '',
      'export default function SearchBox() {',
      '  const [query, setQuery] = useState(\'\');',
      '  const [results, setResults] = useState([]);',
      '  const [loading, setLoading] = useState(false);',
      '',
      '  useEffect(() => {',
      '    if (!query.trim()) {',
      '      setResults([]);',
      '      return;',
      '    }',
      '',
      '    setLoading(true);',
      '    // No abort \u2014 old fetches race with new ones',
      "    fetch('/api/search?q=' + query)",
      '      .then(r => r.json())',
      '      .then(data => {',
      '        setResults(data);',
      '        setLoading(false);',
      '      });',
      '  }, [query]);',
      '',
      '  return (',
      '    <div>',
      '      <input',
      '        value={query}',
      "        onChange={e => setQuery(e.target.value)}",
      '        placeholder="Search..."',
      '      />',
      '      {loading && <p style={{ color: \'#888\' }}>Searching...</p>}',
      '      <ul>',
      '        {results.map((r, i) => <li key={i}>{r.title || r}</li>)}',
      '      </ul>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: (code) => {
      const hasAbort = /AbortController/.test(code);
      const hasSignal = /signal/.test(code);
      const hasCleanup = /abort\s*\(/.test(code);
      const hasReturnWithAbort = /return\s+.+abort/.test(code);
      return {
        pass: hasAbort && hasSignal && (hasCleanup || hasReturnWithAbort),
        message: hasAbort && hasSignal && (hasCleanup || hasReturnWithAbort)
          ? 'AbortController + cleanup in place! No more race conditions.'
          : 'Create an AbortController in the effect body, pass { signal } to fetch, and call abort() in the cleanup.'
      };
    }
  },
  {
    id: "ref-render-count",
    title: "useRef \u2014 Count Renders Without Re-rendering",
    hook: "useRef",
    concept: "useRef persists mutable values without causing re-renders",
    instruction: [
      'A debug panel tries to count renders by using setRenderCount',
      'in a useEffect. This creates an INFINITE LOOP: setRenderCount',
      'triggers a re-render, which runs the effect again...',
      '',
      'In production: Use useRef for values that must persist across',
      "renders but should never trigger re-renders (interval IDs, handles,",
      'tracked metrics, previous values).',
      '',
      'Fix: Replace renderCount state with useRef(1). Increment',
      'ref.current in useEffect \u2014 no re-render triggered.'
    ].join('\n'),
    starterCode: [
      "import { useState, useEffect } from 'react';",
      '',
      'export default function RenderCounter() {',
      '  const [count, setCount] = useState(0);',
      '  // Using state for render tracking causes an infinite loop!',
      '  const [renderCount, setRenderCount] = useState(0);',
      '',
      '  useEffect(() => {',
      '    setRenderCount(c => c + 1);',
      '  });',
      '',
      '  return (',
      '    <div>',
      '      <p>Count: {count}</p>',
      '      <p>Rendered {renderCount} times</p>',
      '      <button onClick={() => setCount(c => c + 1)}>+1</button>',
      '      <button onClick={() => setCount(0)}>Reset</button>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: (code) => {
      const hasRef = /useRef/.test(code);
      const hasRefCurrent = /\.current/.test(code);
      const noRenderCountState = !/setRenderCount/.test(code);
      const hasEffect = /useEffect/.test(code);
      return {
        pass: hasRef && hasRefCurrent && noRenderCountState && hasEffect,
        message: hasRef && hasRefCurrent && noRenderCountState
          ? 'useRef tracks renders silently \u2014 no more infinite loops!'
          : 'Remove renderCount state. Add const renderRef = useRef(1) and in useEffect: renderRef.current++.'
      };
    }
  },
  {
    id: "usememo-ref-stability",
    title: "useMemo \u2014 Stable Object in Dependency Array",
    hook: "useMemo",
    concept: "useMemo stabilizes object references for dependency arrays",
    instruction: [
      'A dashboard component shows a counter of "API calls" that increments',
      'every time the component re-renders \u2014 even when clicking an',
      'unrelated "Toggle theme" button. Why? Because { userId } creates a',
      'BRAND NEW object every render, so the useEffect dependency thinks',
      'params changed and fires again.',
      '',
      'In production: This is the real reason to reach for useMemo \u2014',
      'not to cache expensive computations, but to stabilize object',
      'references so downstream dependency arrays dont fire on every render.',
      'The bug is silent: no error, just wasted API calls.',
      '',
      'Fix: Wrap params in useMemo(() => ({ userId }), [userId]).',
      'Now the object reference stays the same as long as userId hasnt',
      'changed \u2014 switching themes wont trigger the effect.'
    ].join('\n'),
    starterCode: [
      "import { useState, useEffect } from 'react';",
      '',
      'export default function Dashboard() {',
      '  const [userId, setUserId] = useState(1);',
      "  const [theme, setTheme] = useState('light');",
      '  const [apiCalls, setApiCalls] = useState(0);',
      '',
      '  // { userId } is a NEW object every render',
      '  // Even clicking "Toggle theme" creates a fresh reference,',
      '  // tricking the effect into thinking params changed.',
      '  const params = { userId };',
      '',
      '  useEffect(() => {',
      '    setApiCalls(c => c + 1);',
      '  }, [params]); // params reference changes every render!',
      '',
      '  return (',
      "    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>",
      '      <p>',
      '        <strong>User {userId}</strong>',
      "        <button onClick={() => setUserId(u => u + 1)} style={{ marginLeft: 8 }}>",
      '          Next user',
      '        </button>',
      '      </p>',
      '      <p>',
      '        Theme: {theme}',
      "        <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} style={{ marginLeft: 8 }}>",
      '          Toggle',
      '        </button>',
      '      </p>',
      '      <p>API calls made: {apiCalls}</p>',
      "      <p style={{ fontSize: 13, color: '#888' }}>",
      '        Bug: even toggling the theme increments API calls!',
      '      </p>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: (code) => {
      const hasUseMemo = /useMemo/.test(code);
      const memoBlock = code.match(/useMemo\s*\([^)]+\)/)?.[0] || '';
      const memoWrapsObject = memoBlock.includes('({') || memoBlock.includes('=>');
      const hasUserIdDep = /userId/.test(memoBlock);
      return {
        pass: hasUseMemo && memoWrapsObject && hasUserIdDep,
        message: hasUseMemo && hasUserIdDep
          ? 'useMemo stabilizes the object reference \u2014 theme toggles no longer trigger phantom API calls!'
          : hasUseMemo && !hasUserIdDep
            ? 'You added useMemo but forgot userId in the deps array. Try: useMemo(() => ({ userId }), [userId])'
            : 'Wrap params in useMemo: const params = useMemo(() => ({ userId }), [userId]). Now changing themes will not create a new object reference.'
      };
    }
  },
  {
    id: "usereducer-booking",
    title: "useReducer \u2014 Booking Form State Machine",
    hook: "useReducer",
    concept: "Complex state with multiple interacting fields belongs in a single reducer",
    instruction: [
      'A booking form spreads its state across 5 useState calls: name,',
      'email, date, errors, and status. When validation runs, the scattered',
      'state makes it easy to miss edge cases \u2014 what if the user submits',
      'twice? What if they reset while submitting?',
      '',
      'In production: When multiple state variables change together',
      '(form fields + validation + submission lifecycle), a reducer',
      'guarantees atomic state transitions.',
      '',
      'Actions: SET_FIELD, VALIDATE, SUBMIT_START, SUBMIT_SUCCESS,',
      'SUBMIT_ERROR, and RESET.'
    ].join('\n'),
    starterCode: [
      "import { useState } from 'react';",
      '',
      'export default function BookingForm() {',
      "  const [name, setName] = useState('');",
      "  const [email, setEmail] = useState('');",
      "  const [date, setDate] = useState('');",
      '  const [errors, setErrors] = useState({});',
      "  const [status, setStatus] = useState('idle');",
      '',
      '  // 5 separate useState calls \u2014 easy to forget edge cases:',
      '  const validate = () => {',
      '    const e = {};',
      "    if (!name) e.name = 'Required';",
      "    if (!email || !email.includes('@')) e.email = 'Valid email required';",
      "    if (!date) e.date = 'Select a date';",
      '    setErrors(e);',
      '    return Object.keys(e).length === 0;',
      '  };',
      '',
      '  const handleSubmit = async () => {',
      "    if (status === 'submitting') return;",
      '    if (!validate()) return;',
      "    setStatus('submitting');",
      '    await new Promise(r => setTimeout(r, 1000));',
      "    setStatus('success');",
      '  };',
      '',
      '  const handleReset = () => {',
      "    setName(''); setEmail(''); setDate('');",
      '    setErrors({});',
      "    setStatus('idle');",
      '  };',
      '',
      "  if (status === 'success') return <div>Booking confirmed!</div>;",
      '',
      '  return (',
      '    <div>',
      '      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />',
      "      {errors.name && <span style={{color:'red', fontSize:12}}>{errors.name}</span>}<br />",
      '      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />',
      "      {errors.email && <span style={{color:'red', fontSize:12}}>{errors.email}</span>}<br />",
      '      <input type="date" value={date} onChange={e => setDate(e.target.value)} />',
      "      {errors.date && <span style={{color:'red', fontSize:12}}>{errors.date}</span>}<br />",
      '      <button onClick={handleSubmit} disabled={status === \'submitting\'}>',
      "        {status === 'submitting' ? 'Booking...' : 'Book now'}",
      '      </button>',
      '      <button onClick={handleReset} style={{marginLeft: 8}}>Reset</button>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: (code) => {
      const hasReducer = /useReducer/.test(code);
      const hasDispatch = /dispatch\s*\(/.test(code);
      const hasReducerFn = /case\s+['"]\w+['"]\s*:/.test(code) || /function\s+\w+Reducer/.test(code);
      return {
        pass: hasReducer && hasDispatch && hasReducerFn,
        message: hasReducer && hasDispatch && hasReducerFn
          ? 'One reducer, one dispatch \u2014 all state transitions are explicit and atomic!'
          : 'Replace the 5 setState calls with useReducer(reducer, initialState). Define case handlers for SET_FIELD, VALIDATE, SUBMIT_START, SUBMIT_SUCCESS, SUBMIT_ERROR, and RESET.'
      };
    }
  },
  {
    id: "custom-hook-online",
    title: "Custom Hook \u2014 useOnlineStatus",
    hook: "Custom Hook",
    concept: "Extract browser API subscriptions into reusable, cleanable hooks",
    instruction: [
      "A status badge reads navigator.onLine once at mount. But what",
      'happens when the user goes offline? The badge never updates \u2014',
      'no event listeners are attached.',
      '',
      'In production: Browser APIs like online/offline, resize, scroll,',
      'and intersection observer all need event listeners with cleanup.',
      'Extracting them into custom hooks makes them testable and reusable.',
      '',
      'Fix: Write function useOnlineStatus() with useState(navigator.onLine),',
      'useEffect with online/offline event listeners, and cleanup.'
    ].join('\n'),
    starterCode: [
      "import { useState } from 'react';",
      '',
      '// Write a custom hook here:',
      '// function useOnlineStatus() { ... }',
      '',
      'export default function StatusBadge() {',
      '  // navigator.onLine is captured ONCE \u2014 never updates',
      '  const [isOnline] = useState(navigator.onLine);',
      '',
      '  return (',
      '    <div style={{',
      '      padding: 16,',
      "      background: isOnline ? '#d4edda' : '#f8d7da',",
      "      color: isOnline ? '#155724' : '#721c24',",
      '      borderRadius: 8,',
      '      fontWeight: 700,',
      '      textAlign: \'center\',',
      '    }}>',
      "      {isOnline ? 'Online' : 'Offline'}",
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: (code) => {
      const hasHook = /function\s+useOnlineStatus/.test(code);
      const usesHook = /\buseOnlineStatus\s*\(/.test(code);
      const hasUseState = /useState/.test(code);
      const hasUseEffect = /useEffect/.test(code);
      const hasEvents = /online/.test(code) && /offline/.test(code);
      return {
        pass: hasHook && usesHook && hasEvents,
        message: hasHook && usesHook && hasEvents
          ? 'useOnlineStatus extracted with event listeners! Reusable across the whole app.'
          : 'Define function useOnlineStatus() with useState(navigator.onLine), useEffect to add online/offline event listeners on window, and clean them up with removeEventListener.'
      };
    }
  }
];

var coreChallenges = challenges.map(function(c) { return Object.assign({}, c, { category: 'hooks' }); });
var extendedWithCat = extendedChallenges.map(function(c) { return Object.assign({}, c, { category: 'hooks' }); });
var compositionWithCat = compositionChallenges.map(function(c) { return Object.assign({}, c, { category: 'composition' }); });
var dockerWithCat = dockerChallenges.map(function(c) { return Object.assign({}, c, { category: 'docker' }); });
var orpcWithCat = orpcChallenges.map(function(c) { return Object.assign({}, c, { category: 'orpc' }); });
var advancedReactWithCat = advancedReactChallenges.map(function(c) { return Object.assign({}, c, { category: 'advanced' }); });
var testingWithCat = testingChallenges.map(function(c) { return Object.assign({}, c, { category: 'testing' }); });
var dataFetchingWithCat = dataFetchingChallenges.map(function(c) { return Object.assign({}, c, { category: 'data' }); });
var messagingWithCat = messagingChallenges.map(function(c) { return Object.assign({}, c, { category: 'messaging' }); });

var allChallenges = [...coreChallenges, ...extendedWithCat, ...compositionWithCat, ...dockerWithCat, ...orpcWithCat, ...advancedReactWithCat, ...testingWithCat, ...dataFetchingWithCat, ...messagingWithCat];

export default allChallenges;
