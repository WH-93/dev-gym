/**
 * Training Drills — Advanced React Patterns
 *
 * Beyond the basic hooks: concurrent features, error boundaries,
 * imperative handles, SSR-safe IDs, Suspense, memo, and React 19 actions.
 * These are the patterns that separate mid-level from senior React devs.
 */

var advancedReactChallenges = [
  // ─── USETRANSITION ─────────────────────────────────────────────────
  {
    id: 'usetransition-tab-switch',
    area: 'Advanced React',
    title: 'useTransition — Keep UI Responsive During Heavy Updates',
    difficulty: '★★★',
    description: `A tab switcher renders a heavy list (5000 filtered items). Clicking a tab freezes the UI for 400ms while React re-renders.
Fix: Wrap setTab in startTransition so the tab click is immediate, and React defers the heavy list render. Show a loading indicator while the transition is pending.

Use isPending from useTransition for the loading state. The old tab content stays visible until the new one is ready — no flicker.`,
    starterCode: `import { useState } from 'react'

// const tabs = ['All', 'Active', 'Completed', 'Archived']
// const items = Array.from({ length: 5000 }, (_, i) => ({ id: i, name: \`Item \${i}\`, status: i % 4 === 0 ? 'active' : i % 4 === 1 ? 'completed' : i % 4 === 2 ? 'archived' : 'all' }))

function HeavyList({ filter }) {
  // Filter 5000 items — expensive on every render
  const filtered = items.filter(i => filter === 'All' ? true : i.status === filter.toLowerCase())
  return <ul>{filtered.map(i => <li key={i.id}>{i.name}</li>)}</ul>
}

export default function TabSwitcher() {
  const [tab, setTab] = useState('All')

  return (
    <div>
      {tabs.map(t => (
        <button key={t} onClick={() => setTab(t)}
          style={{ fontWeight: t === tab ? 'bold' : 'normal', marginRight: 8 }}>
          {t}
        </button>
      ))}
      <HeavyList filter={tab} />
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('useTransition')) errors.push('Import and use useTransition from react');
      if (!code.includes('startTransition')) errors.push('Wrap setTab in startTransition: startTransition(() => setTab(t))');
      if (!code.includes('isPending')) errors.push('Destructure isPending from useTransition and show a loading state');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ useTransition keeps the tab click instant while deferring the heavy list render. isPending shows a loading indicator during the transition.' };
    }
  },
  // ─── USEDEFERREDVALUE ──────────────────────────────────────────────
  {
    id: 'usedeferredvalue-search',
    area: 'Advanced React',
    title: 'useDeferredValue — Defer Expensive Search Filtering',
    difficulty: '★★★',
    description: `A search input filters 10000 items as the user types. Every keystroke blocks the UI because the filter runs synchronously on each state change.
Fix: Pass the query through useDeferredValue(query). React keeps showing the OLD results while computing the new ones in the background. The input stays responsive.

Key difference from debounce: useDeferredValue lets React interrupt the render if higher-priority updates come in. Debounce just delays — it doesn't yield to the browser.`,
    starterCode: `import { useState, useMemo } from 'react'

const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: \`Item \${i}\`, category: \`Category \${i % 20}\` }))

export default function SearchList() {
  const [query, setQuery] = useState('')

  // Expensive filter — blocks on every keystroke
  const filtered = useMemo(() => {
    return items.filter(i => i.name.includes(query) || i.category.includes(query))
  }, [query])

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search 10k items..." />
      <p>{filtered.length} results</p>
      <ul>{filtered.slice(0, 100).map(i => <li key={i.id}>{i.name}</li>)}</ul>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('useDeferredValue')) errors.push('Import useDeferredValue from react');
      if (!code.includes('useDeferredValue(query)') && !code.includes('useDeferredValue(q)')) errors.push('Wrap the query in useDeferredValue: const deferredQuery = useDeferredValue(query)');
      if (!code.includes('deferredQuery')) errors.push('Use deferredQuery in the filter, not the raw query');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ useDeferredValue keeps the input responsive. React interrupts the stale render when a new keystroke arrives.' };
    }
  },
  // ─── ERROR BOUNDARY ────────────────────────────────────────────────
  {
    id: 'error-boundary-class',
    area: 'Advanced React',
    title: 'Error Boundary — Class Component Pattern',
    difficulty: '★★★',
    description: `A Dashboard widget throws an error when data is malformed. The error crashes the entire app — not just the widget.

Fix: Write an ErrorBoundary class component with:
- getDerivedStateFromError to set hasError: true
- componentDidCatch to log the error
- A fallback UI when hasError is true
- Wrap the crashing component in <ErrorBoundary>

Error boundaries must be class components — hooks cannot catch render errors. This is the ONE pattern where you still need classes in React.`,
    starterCode: `import { Component } from 'react'

function BuggyWidget() {
  // This throws when data.name is undefined
  const data = null
  return <div>{data.name}</div>
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <BuggyWidget />
      <p>This text never renders — the whole app crashes!</p>
    </div>
  )
}

export default function App() {
  return <Dashboard />
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('getDerivedStateFromError')) errors.push('Implement static getDerivedStateFromError(error) to set hasError: true');
      if (!code.includes('componentDidCatch')) errors.push('Implement componentDidCatch(error, info) to log errors');
      if (!code.includes('hasError')) errors.push('Track hasError in state and render fallback UI when true');
      if (!code.includes('extends Component')) errors.push('ErrorBoundary must extend Component — functional components cannot catch errors');
      if (!code.includes('ErrorBoundary')) errors.push('Wrap BuggyWidget in <ErrorBoundary> so the crash is contained');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ ErrorBoundary catches render errors. BuggyWidget shows fallback UI — Dashboard continues rendering.' };
    }
  },
  // ─── USEIMPERATIVEHANDLE ───────────────────────────────────────────
  {
    id: 'useimperativehandle-ref',
    area: 'Advanced React',
    title: 'useImperativeHandle — Expose Custom Ref Methods',
    difficulty: '★★★',
    description: `A FancyInput component wraps an <input> but its ref exposes the raw DOM node. The parent can call ref.current.focus() but also ref.current.value = 'hacked' — breaking encapsulation.

Fix: Use forwardRef + useImperativeHandle to expose only focus() and clear() — not the raw input. The parent gets a clean API, and the internal DOM node is protected.

This is the pattern used by Radix, React Aria, and design system components.`,
    starterCode: `import { useRef, forwardRef } from 'react'

const FancyInput = forwardRef(function FancyInput(props, ref) {
  // Exposes raw <input> — parent can do anything to it
  return (
    <div style={{ border: '1px solid #334155', padding: 8, borderRadius: 6 }}>
      <input ref={ref} {...props} style={{ border: 'none', outline: 'none', width: '100%' }} />
    </div>
  )
})

export default function Form() {
  const inputRef = useRef(null)

  return (
    <div>
      <FancyInput ref={inputRef} placeholder="Enter name" />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
      <button onClick={() => inputRef.current?.clear?.()} style={{ marginLeft: 8 }}>Clear</button>
      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>
        Bug: Parent can access the raw DOM node and mutate it directly.
      </p>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('useImperativeHandle')) errors.push('Import and use useImperativeHandle inside FancyInput');
      if (!code.includes('forwardRef')) errors.push('Wrap FancyInput in forwardRef to receive the ref');
      if (!code.includes('focus()') || !code.includes('clear')) errors.push('Expose focus() and clear() methods via useImperativeHandle');
      if (!code.includes('inputRef') && !code.includes('innerRef')) errors.push('Use a separate internal ref for the <input> element');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ useImperativeHandle exposes focus() and clear() — the parent gets a clean API, not the raw DOM node.' };
    }
  },
  // ─── USEID ─────────────────────────────────────────────────────────
  {
    id: 'useid-aria-label',
    area: 'Advanced React',
    title: 'useId — SSR-Safe Unique IDs for Accessibility',
    difficulty: '★★☆',
    description: `A form uses a hardcoded id="email" on the input and htmlFor="email" on the label. This breaks when the form is rendered twice on the same page — duplicate IDs.

Fix: Use useId() to generate unique, SSR-safe IDs. Each instance gets a different ID. Critical for accessibility: label-input association via htmlFor/id.

Also applies to aria-labelledby, aria-describedby, and any attribute where unique IDs prevent collisions.`,
    starterCode: `import { useState } from 'react'

function EmailField() {
  // BUG: Hardcoded id — breaks with multiple instances
  return (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" placeholder="you@example.com" />
    </div>
  )
}

export default function SignupForm() {
  const [showBilling, setShowBilling] = useState(false)
  return (
    <div>
      <EmailField />
      {showBilling && <EmailField />}
      <button onClick={() => setShowBilling(b => !b)}>
        {showBilling ? 'Remove billing email' : 'Add billing email'}
      </button>
      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>
        Bug: Adding a second EmailField creates duplicate id="email" — invalid HTML.
      </p>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('useId')) errors.push('Import useId from react');
      if (!code.includes('useId()')) errors.push('Call useId() and use the returned value for the id and htmlFor');
      if (code.includes('id="email"')) errors.push('Replace hardcoded id="email" with the useId-generated value');
      if (code.includes('htmlFor="email"')) errors.push('Replace hardcoded htmlFor="email" with the useId-generated value');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ useId generates unique, SSR-safe IDs. Multiple instances of EmailField get different IDs — no collisions.' };
    }
  },
  // ─── SUSPENSE + LAZY ───────────────────────────────────────────────
  {
    id: 'suspense-lazy-split',
    area: 'Advanced React',
    title: 'Suspense + lazy — Code Splitting',
    difficulty: '★★☆',
    description: `A dashboard eagerly imports a HeavyChart component (500KB) that's only visible when the user clicks "Show Analytics". The chart code loads on page load — slowing the initial render.

Fix: Use React.lazy(() => import('./HeavyChart')) and wrap it in <Suspense fallback={<p>Loading chart...</p>}>. The chart code only loads when the user clicks "Show Analytics".

This is code splitting — one of the most impactful performance optimizations in React. Combine with React Router for route-based splitting.`,
    starterCode: `import { useState } from 'react'
import HeavyChart from './HeavyChart' // 500KB — loaded eagerly

export default function Dashboard() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Key metrics: 1,240 visits today</p>
      <button onClick={() => setShowChart(s => !s)}>
        {showChart ? 'Hide' : 'Show'} Analytics
      </button>
      {showChart && <HeavyChart />}
      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>
        Bug: HeavyChart (500KB) loads on page load even when never shown.
      </p>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('lazy')) errors.push('Use React.lazy to dynamically import HeavyChart');
      if (!code.includes('import(')) errors.push('lazy requires a dynamic import: lazy(() => import("./HeavyChart"))');
      if (!code.includes('Suspense')) errors.push('Wrap the lazy component in <Suspense fallback={...}>');
      if (!code.includes('fallback')) errors.push('Provide a fallback UI (e.g., "Loading chart...") while the chunk loads');
      if (code.includes("import HeavyChart from './HeavyChart'")) errors.push('Remove the static import — use lazy() instead');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Suspense + lazy defers the 500KB chart until the user clicks Show Analytics. Initial page load is faster.' };
    }
  },
  // ─── REACT.MEMO ────────────────────────────────────────────────────
  {
    id: 'react-memo-when',
    area: 'Advanced React',
    title: 'React.memo — When It Helps (and When It Does Not)',
    difficulty: '★★★',
    description: `A parent re-renders every second with a timer. A child component receives the same props every time but re-renders anyway — wasting cycles.

Fix: Wrap the child in React.memo. Now it only re-renders when its props actually change. But there is a catch: if the parent passes an inline object like style={{ color: 'red' }}, memo never helps — the object is a new reference every render.

Show BOTH cases: a memoized child that avoids re-renders, and a memoized child that STILL re-renders because it receives a new object prop every time. Uncomment the fixed version.`,
    starterCode: `import { useState, useEffect } from 'react'

function ExpensiveChild({ label, renderCount }) {
  // This re-renders every second even though label never changes
  renderCount.current++
  return <div style={{ padding: 12, border: '1px solid #334155', borderRadius: 6 }}>
    {label} (rendered {renderCount.current} times)
  </div>
}

export default function Timer() {
  const [time, setTime] = useState(0)
  const childRenders = { current: 0 }

  useEffect(() => {
    const id = setInterval(() => setTime(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <p>Time: {time}s</p>
      <ExpensiveChild label="Static Label" renderCount={childRenders} />
      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>
        Bug: ExpensiveChild re-renders every second even though label never changes.
      </p>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('React.memo') && !code.includes('memo(')) errors.push('Wrap ExpensiveChild in React.memo to skip renders when props are unchanged');
      if (!code.includes('memo(ExpensiveChild') && !code.includes('memo(function')) errors.push('Apply memo to the child component: const MemoChild = React.memo(ExpensiveChild)');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ React.memo prevents re-renders when props are unchanged. But remember: inline objects/arrays/functions still create new references — useMemo and useCallback pair with memo.' };
    }
  },
  // ─── USEOPTIMISTIC + USEFORMSTATUS ─────────────────────────────────
  {
    id: 'useoptimistic-form',
    area: 'Advanced React',
    title: 'useOptimistic — Instant UI Before Server Confirms',
    difficulty: '★★★',
    description: `A todo list calls an async addTodo() function. The user clicks "Add", waits 500ms for the server, and then the new todo appears. Feels sluggish.

Fix: Use useOptimistic to immediately show the new todo in the list BEFORE the server responds. If the server fails, React rolls back the optimistic update automatically.

Also use useFormStatus in a SubmitButton to disable during submission. This is the React 19 way — no manual loading state management.`,
    starterCode: `import { useState, useTransition } from 'react'

// Simulated async add — returns after 500ms
async function addTodo(text) {
  await new Promise(r => setTimeout(r, 500))
  return { id: Date.now(), text, done: false }
}

export default function TodoApp() {
  const [todos, setTodos] = useState([{ id: 1, text: 'Learn React', done: false }])
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleAdd() {
    if (!text.trim()) return
    // BUG: 500ms delay before user sees the new todo
    const newTodo = await addTodo(text)
    setTodos(prev => [...prev, newTodo])
    setText('')
  }

  return (
    <div>
      <ul>{todos.map(t => <li key={t.id}>{t.done ? '✓' : '○'} {t.text}</li>)}</ul>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="New todo" />
      <button onClick={handleAdd} disabled={isPending}>
        {isPending ? 'Adding...' : 'Add'}
      </button>
      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>
        Bug: 500ms delay before the new todo appears. UI feels sluggish.
      </p>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('useOptimistic')) errors.push('Import useOptimistic from react');
      if (!code.includes('useOptimistic(todos')) errors.push('Use useOptimistic with the todos state to show instant updates');
      if (!code.includes('useFormStatus')) errors.push('Import and use useFormStatus in a child component to disable the button during submission');
      if (!code.includes('pending') && !code.includes('isPending')) errors.push('useFormStatus exposes a `pending` boolean — use it for the button disabled state');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ useOptimistic shows the new todo instantly. If the server fails, React rolls back. useFormStatus handles the submit button state.' };
    }
  }
];

export default advancedReactChallenges;
