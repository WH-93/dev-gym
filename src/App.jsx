import React, { useState, useCallback, useRef, useEffect } from 'react';
import allChallenges from './challenges';
import ExecutionSandbox from './ExecutionSandbox';
import SyntaxSandbox from './SyntaxSandbox';

var CATEGORIES = [
  { key: 'hooks', label: 'Hooks', icon: '🔧' },
  { key: 'composition', label: 'Composition', icon: '🧩' },
  { key: 'advanced', label: 'Advanced', icon: '⚡' },
  { key: 'data', label: 'Data', icon: '📡' },
  { key: 'testing', label: 'Testing', icon: '🧪' },
  { key: 'docker', label: 'Docker', icon: '🐳' },
  { key: 'messaging', label: 'Messaging', icon: '📨' },
  { key: 'orpc', label: 'oRPC', icon: '🔗' }
];

export default function App() {
  var [category, setCategory] = useState('hooks');
  var [currentIdx, setCurrentIdx] = useState(0);
  var [code, setCode] = useState('');
  var [feedback, setFeedback] = useState(null);
  var [showHint, setShowHint] = useState(false);
  // Load progress from localStorage on mount
  var [solved, setSolved] = useState(function() {
    try { return JSON.parse(localStorage.getItem('training-drills-solved') || '{}'); } catch(e) { return {}; }
  });
  var [results, setResults] = useState(function() {
    try { return JSON.parse(localStorage.getItem('training-drills-results') || '{}'); } catch(e) { return {}; }
  });

  // Persist progress to localStorage on every change
  useEffect(function() {
    localStorage.setItem('training-drills-solved', JSON.stringify(solved));
  }, [solved]);
  useEffect(function() {
    localStorage.setItem('training-drills-results', JSON.stringify(results));
  }, [results]);
  var textareaRef = useRef(null);

  // Filter challenges by category
  var filteredChallenges = allChallenges.filter(function(c) { return c.category === category; });

  // Reset index when category changes
  var handleCategoryChange = function(cat) {
    setCategory(cat);
    setCurrentIdx(0);
    setFeedback(null);
    setShowHint(false);
  };

  // Init code when filtered challenges change
  useEffect(function() {
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

  // Reset code when challenge changes
  useEffect(function() {
    if (challenge) {
      setCode(challenge.starterCode);
      setFeedback(null);
      setShowHint(false);
    }
  }, [currentIdx, category]);

  // Clear feedback when code changes
  useEffect(function() {
    if (feedback) setFeedback(null);
  }, [code]);

  var handleCheck = useCallback(function() {
    if (!challenge) return;
    var result = challenge.solutionCheck(code);
    setFeedback(result);
    setResults(function(prev) { var n = {}; n[challenge.id] = result.pass; return Object.assign({}, prev, n); });
    if (result.pass) {
      setSolved(function(prev) { var n = {}; n[challenge.id] = true; return Object.assign({}, prev, n); });
    }
  }, [code, challenge]);

  var goNext = useCallback(function() {
    if (currentIdx < total - 1) setCurrentIdx(function(i) { return i + 1; });
  }, [currentIdx, total]);

  var goPrev = useCallback(function() {
    if (currentIdx > 0) setCurrentIdx(function(i) { return i - 1; });
  }, [currentIdx]);

  // Keyboard shortcuts
  useEffect(function() {
    var handler = function(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleCheck();
      }
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return function() { window.removeEventListener('keydown', handler); };
  }, [handleCheck, goNext, goPrev]);

  var completedCount = Object.values(solved).filter(Boolean).length;

  // Category counts
  var categoryCounts = {};
  CATEGORIES.forEach(function(cat) {
    var catChallenges = allChallenges.filter(function(c) { return c.category === cat.key; });
    categoryCounts[cat.key] = {
      total: catChallenges.length,
      solved: catChallenges.filter(function(c) { return solved[c.id]; }).length
    };
  });

  if (!challenge) {
    return React.createElement('div', { style: { padding: 40, color: '#64748b', textAlign: 'center' } },
      'No challenges in this category yet.');
  }

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      background: '#0f172a',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }
  },
    // ===== HEADER =====
    React.createElement('header', {
      style: {
        padding: '12px 24px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0a0f1e',
      }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        React.createElement('span', { style: { fontSize: 20 } }, '⚡'),
        React.createElement('span', { style: { fontWeight: 700, fontSize: 18, color: '#f1f5f9' } }, 'Training Drills')
      ),

      // Category tabs
      React.createElement('div', { style: { display: 'flex', gap: 4 } },
        CATEGORIES.map(function(cat) {
          var counts = categoryCounts[cat.key];
          var active = cat.key === category;
          return React.createElement('button', {
            key: cat.key,
            onClick: function() { handleCategoryChange(cat.key); },
            style: {
              padding: '6px 14px',
              border: active ? '1px solid #3b82f6' : '1px solid #1e293b',
              borderRadius: 6,
              background: active ? '#1e293b' : 'transparent',
              color: active ? '#f1f5f9' : '#64748b',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }
          },
            React.createElement('span', null, cat.icon),
            React.createElement('span', null, cat.label),
            React.createElement('span', {
              style: { fontSize: 11, color: active ? '#60a5fa' : '#475569' }
            }, counts.solved + '/' + counts.total)
          );
        })
      ),

      // Progress / controls
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
        // Progress dots
        React.createElement('div', { style: { display: 'flex', gap: 4, alignItems: 'center' } },
          filteredChallenges.map(function(ch, i) {
            return React.createElement('div', {
              key: ch.id,
              onClick: function() { setCurrentIdx(i); },
              style: {
                width: 16,
                height: 6,
                borderRadius: 3,
                cursor: 'pointer',
                background: solved[ch.id]
                  ? '#22c55e'
                  : i === currentIdx
                    ? '#3b82f6'
                    : '#334155',
                transition: 'background 0.2s',
              },
              title: (ch.title || '') + (solved[ch.id] ? ' ✓' : '')
            });
          })
        ),
        React.createElement('span', { style: { fontSize: 13, color: '#64748b', minWidth: 70, textAlign: 'right' } },
          Object.values(solved).filter(Boolean).length + '/' + allChallenges.length + ' total'
        )
      )
    ),

    // ===== MAIN CONTENT =====
    React.createElement('div', {
      style: { flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 53px)' }
    },
      // Left: Editor
      React.createElement('div', {
        style: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', minWidth: 0 }
      },
        // Challenge header
        React.createElement('div', {
          style: { padding: '16px 20px 12px', borderBottom: '1px solid #1e293b', background: '#0f172a' }
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
            React.createElement('div', null,
              // Badge row
              React.createElement('div', { style: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#64748b', marginBottom: 4 } },
                'Challenge ' + (currentIdx + 1) + '/' + total + ' — ' +
                (challenge.hook || challenge.area || challenge.category)
              ),
              React.createElement('h2', { style: { margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9' } },
                challenge.title
              ),
              challenge.difficulty && React.createElement('span', {
                style: { fontSize: 12, color: '#8b5cf6', marginLeft: 8, fontWeight: 600 }
              }, challenge.difficulty)
            ),
            React.createElement('div', {
              style: { fontSize: 11, color: '#64748b', background: '#1e293b', padding: '3px 10px', borderRadius: 4,
                display: solved[challenge.id] ? 'none' : 'block' }
            },
              React.createElement('kbd', { style: { border: '1px solid #475569', padding: '1px 5px', borderRadius: 3, fontSize: 10, marginRight: 4 } }, 'Ctrl'),
              '+',
              React.createElement('kbd', { style: { border: '1px solid #475569', padding: '1px 5px', borderRadius: 3, fontSize: 10, marginLeft: 4 } }, 'Enter'),
              ' to check'
            )
          ),
          // Concept / description
          (challenge.concept || challenge.description) && React.createElement('p', {
            style: { margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: '#94a3b8', maxWidth: 700 }
          }, challenge.concept || challenge.description),
          // Instruction
          challenge.instruction && React.createElement('p', {
            style: { margin: '8px 0 0', fontSize: 13, lineHeight: 1.6, color: '#cbd5e1', maxWidth: 700 }
          }, challenge.instruction),
          // Docker description (if separate from concept)
          challenge.area && challenge.description && challenge.concept !== challenge.description && React.createElement('p', {
            style: { margin: '8px 0 0', fontSize: 13, lineHeight: 1.6, color: '#cbd5e1', maxWidth: 700, whiteSpace: 'pre-wrap' }
          }, challenge.description)
        ),

        // Code editor area
        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' } },
          React.createElement('div', {
            style: { padding: '6px 16px', fontSize: 11, color: '#64748b', background: '#0a0f1e', borderBottom: '1px solid #1e293b',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
          },
            React.createElement('span', null, '✏️ Editor'),
            React.createElement('span', { style: { fontSize: 10, color: '#475569' } }, code.split('\n').length + ' lines')
          ),

          // Render appropriate sandbox based on category
          category === 'docker' || category === 'orpc' || category === 'messaging' || category === 'advanced' || category === 'data' || category === 'testing'
            ? React.createElement(SyntaxSandbox, { code: code, onChange: setCode })
            : React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
                React.createElement('textarea', {
                  ref: textareaRef,
                  value: code,
                  onChange: function(e) { setCode(e.target.value); },
                  spellCheck: false,
                  style: {
                    flex: 1,
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: 'none',
                    outline: 'none',
                    padding: '14px 16px',
                    fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", "Menlo", monospace',
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    tabSize: 2,
                    resize: 'none',
                    width: '100%',
                  },
                  wrap: 'off'
                })
              )
        )
      ),

      // Right: Preview (hooks/composition only) + Actions
      React.createElement('div', { style: { width: '45%', minWidth: 380, display: 'flex', flexDirection: 'column' } },
        // Preview for hooks/composition
        category !== 'docker' && category !== 'orpc' && category !== 'messaging' && category !== 'advanced' && category !== 'data' && category !== 'testing' && React.createElement('div', { style: { flex: 1, padding: 12, display: 'flex', flexDirection: 'column' } },
          React.createElement(ExecutionSandbox, { code: code })
        ),

        // Feedback panel
        feedback && React.createElement('div', {
          style: {
            margin: 12,
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid ' + (feedback.pass ? '#166534' : '#7f1d1d'),
            background: feedback.pass ? '#052e16' : '#450a0a',
            fontSize: 14,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }
        },
          React.createElement('span', { style: { fontSize: 18, lineHeight: 1, marginTop: 1 } },
            feedback.pass ? '✅' : '❌'
          ),
          React.createElement('div', null,
            React.createElement('div', {
              style: { fontWeight: 700, fontSize: 13, marginBottom: 3, color: feedback.pass ? '#4ade80' : '#f87171' }
            }, feedback.pass ? 'Pass' : 'Not quite'),
            React.createElement('div', { style: { color: '#cbd5e1', lineHeight: 1.5, fontSize: 13, whiteSpace: 'pre-wrap' } },
              feedback.message
            )
          )
        ),

        // Actions bar
        React.createElement('div', {
          style: { padding: '12px 16px', borderTop: '1px solid #1e293b', background: '#0a0f1e',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }
        },
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('button', {
              onClick: function() { setShowHint(function(h) { return !h; }); },
              style: { padding: '7px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #475569', borderRadius: 6,
                background: '#1e293b', color: '#94a3b8', cursor: 'pointer' }
            }, showHint ? '🙈 Hide hint' : '💡 Hint'),
            React.createElement('button', {
              onClick: handleCheck,
              style: { padding: '7px 18px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 6,
                background: solved[challenge.id] ? '#166534' : '#3b82f6', color: 'white', cursor: 'pointer' }
            }, solved[challenge.id] ? '✓ Solved' : 'Check solution')
          ),
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('button', {
              onClick: goPrev, disabled: isFirst,
              style: { padding: '7px 14px', fontSize: 13, border: '1px solid #475569', borderRadius: 6,
                background: isFirst ? '#0f172a' : '#1e293b', color: isFirst ? '#334155' : '#94a3b8',
                cursor: isFirst ? 'not-allowed' : 'pointer' }
            }, '← Prev'),
            React.createElement('button', {
              onClick: goNext, disabled: isLast,
              style: { padding: '7px 14px', fontSize: 13, border: '1px solid #475569', borderRadius: 6,
                background: isLast ? '#0f172a' : '#1e293b', color: isLast ? '#334155' : '#94a3b8',
                cursor: isLast ? 'not-allowed' : 'pointer' }
            }, 'Next →')
          )
        )
      )
    ),

    // Hint overlay
    showHint && React.createElement('div', {
      style: { position: 'fixed', bottom: 70, right: 24, width: 340, padding: '14px 18px', borderRadius: 10,
        background: '#1e293b', border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontSize: 13, lineHeight: 1.6, color: '#cbd5e1', zIndex: 100 }
    },
      React.createElement('div', { style: { fontWeight: 700, marginBottom: 6, color: '#fbbf24', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 } },
        '💡 Hint'
      ),
      hints[challenge.id] || "Look at the pattern and think about what's missing.",
      React.createElement('div', { style: { marginTop: 8, fontSize: 11, color: '#64748b', fontStyle: 'italic' } },
        'Try it yourself first! This is a hint, not an answer.'
      )
    )
  );
}

var hints = {
  // Core hooks
  'usestate-lazy-init': 'useState(initTodos()) calls initTodos on EVERY render because the expression is evaluated eagerly. Use useState(() => initTodos()) or just useState(initTodos) to pass a lazy initializer that React only calls once.',
  'effect-race-condition': 'An AbortController gives you a `signal` to pass to fetch, plus an `abort()` to cancel the in-flight request. Call `abort()` in the cleanup function returned by useEffect. Also set loading state after the async gap.',
  'ref-render-count': '`useRef(0)` gives you `{ current: 0 }` that persists across renders but never triggers one. Increment `ref.current` in useEffect and read it in JSX. No infinite loop.',
  'usememo-ref-stability': '`{ userId }` is a new object every render — useEffect sees a new reference and fires. `useMemo(() => ({ userId }), [userId])` returns the SAME object until userId actually changes.',
  'usereducer-booking': 'One initialState object, one reducer function with case handlers. Actions like `{ type: "SET_FIELD", field: "email", value }` keep all state transitions in one place.',
  'custom-hook-online': 'useOnlineStatus → useState(navigator.onLine) → useEffect with addEventListener("online", ...) and addEventListener("offline", ...) on window → cleanup via removeEventListener → return the boolean.',
  // Extended hooks
  'usecallback-stale-closure': 'useCallback(fn, []) is a frozen snapshot of the first render. Create a noteRef with useRef(note), update it: noteRef.current = note. Then in autoSave, read noteRef.current.',
  'useref-prev-value': 'Remove prevCount state. Add const prevRef = useRef(0). Add useEffect(() => { prevRef.current = count }, [count]). Now prevRef.current is the value from the PREVIOUS render.',
  'uselayouteffect-flicker': 'useLayoutEffect has the exact same signature as useEffect. Replace "useEffect" with "useLayoutEffect" and import it. The position correction now runs synchronously before the browser paints.',
  'usecontext-split': 'Create a separate ThemeContext = createContext(). Wrap theme in <ThemeContext.Provider>. Have ThemeBadge call useContext(ThemeContext) instead of AppContext.',
  'usestate-functional-update': 'setSeconds(seconds + 1) reads the closure-bound value. Change to setSeconds(function(s) { return s + 1; }) — the function argument receives the latest committed state.',
  'custom-hook-usedebounce': 'Write function useDebounce(value, delay) { const timerRef = useRef(); useEffect(() => { clearTimeout(timerRef.current); timerRef.current = setTimeout(...); return () => clearTimeout(timerRef.current); }, [value, delay]); ... }',
  // Composition
  'composition-children-prop': 'Dashboard should render {children} instead of importing DashboardContent internally. DashboardContent should also render {children}. Lift WelcomeMessage up to App where user is in scope.',
  'composition-implicit-vs-explicit': 'Remove useContext(UserContext) from WelcomeMessage. Add a user prop instead: function WelcomeMessage({ user }). Pass user explicitly. Now it works everywhere.',
  'composition-black-box': 'PageLayout should render {children} instead of hardcoding Header, Sidebar, and Content. Lift those elements up so each page can compose them freely.',
  'composition-named-slots': 'DashboardLayout accepts `header` and `sidebar` props alongside children. Render {header || <DefaultHeader />} and {sidebar || <DefaultSidebar />}.',
  'composition-render-props': 'MouseTracker calls children as a function: {children(pos)}. Usage: <MouseTracker>{function(pos) { return <div>Mouse at ({pos.x}, {pos.y})</div>; }}</MouseTracker>.',
  'composition-compound-tabs': 'Create TabsContext with createContext(). Tabs provides activeTab via context. Tab reads from it with useContext. No props passed between them.',
  // Docker
  'multi-stage-go': 'Use FROM golang:1.22-alpine AS builder, compile with CGO_ENABLED=0 GOOS=linux, then COPY --from=builder into a distroless final image.',
  'layer-cache': 'Copy package.json BEFORE copying source. npm ci should only re-install when package.json changes, not when source code changes.',
  'nonroot': 'Create a non-root user with adduser, chown the files, and use USER to switch. Production containers must not run as root.',
  'healthcheck': 'HEALTHCHECK with curl/wget, specific endpoint, retries, interval, timeout, and start-period. Install curl in the same RUN then remove it.',
  'buildkit-cache': 'Use --mount=type=cache for /root/.npm and node_modules. Combine with npm ci --prefer-offline for reproducible fast builds.',
  'graceful-shutdown': 'Use CMD exec form (JSON array), set STOPSIGNAL SIGTERM, document signal handling. Consider tini as init for proper signal forwarding.',
  'compose-init': 'migrate service with a command, no ports. app depends_on migrate with condition: service_completed_successfully.',
  'compose-network': 'Two networks: frontend (public) and backend (internal: true). DB only on backend, no host ports. API on both.',
  'compose-profiles': 'Use profiles: [dev/ci/prod], YAML anchors for shared config, adminer only in dev profile.',
  'compose-secrets': 'Top-level secrets: block. file: for db_password, external: true for api_key. Mount to /run/secrets/. Never in environment.',
  'compose-depends-health': 'db needs healthcheck. app depends_on db with condition: service_healthy. Shared network.',
  'rootless-dind': 'Base: docker:dind-rootless. Non-root user ciuser. DOCKER_HOST to rootless socket. ENTRYPOINT starts dockerd-rootless.sh.',
  'volume-uid': 'user: "${USER_UID:-1000}:${USER_GID:-1000}" in compose. Build args for UID/GID. .env file for values.',
  'multi-stage-lint': 'Three stages: lint (run linter), build (compile), release (distroless + trivy scan). CI in Dockerfile.',
  // oRPC
  'orpc-basic-procedure': 'os.input(z.object({ name: z.string(), email: z.string().email() })) — Use os.input() with Zod schema. Chain .handler() to define the logic. Return a user with an auto-generated id.',
  'orpc-auth-middleware': 'Declare context: os.$context<{ headers: Headers }>(). Define middleware with .middleware(). Extract JWT from context.headers.get("authorization"). Parse user, inject via next({ context: { user } }). Throw ORPCError("UNAUTHORIZED") if invalid.',
  'orpc-typed-errors': 'Use os.errors({ NOT_FOUND: { data: z.object({ userId: z.number() }) }, FORBIDDEN: {} }). In handler, throw errors.NOT_FOUND({ data: { userId } }) when user missing. Throw errors.FORBIDDEN() for permission issues.',
  'orpc-combined-context': 'Initial: os.$context<{ env: { DB_URL: string } }>(). Middleware: create client from context.env.DB_URL, connect before next(), inject { db: client }, disconnect in finally{} for cleanup.',
  'orpc-client-setup': 'new RPCLink({ url: "...", headers: {...} }). createORPCClient(link) typed as RouterClient<typeof router>. The client gets full autocomplete for all procedures.',
  'orpc-lazy-router': 'os.lazy(() => import("./post.router").then(m => m.postRouter)) — defers loading until first call. Eager routers load immediately. Export top-level router with both eager and lazy sub-routers.',
  // Advanced React
  'usetransition-tab-switch': 'Import useTransition. Destructure [isPending, startTransition]. Wrap setTab in startTransition: startTransition(() => setTab(t)). Show a loading state when isPending is true.',
  'usedeferredvalue-search': 'Import useDeferredValue. const deferredQuery = useDeferredValue(query). Use deferredQuery in the filter, not query. React keeps showing old results while computing new ones.',
  'error-boundary-class': 'class ErrorBoundary extends Component. static getDerivedStateFromError sets hasError: true. componentDidCatch logs. Render fallback when hasError. Wrap BuggyWidget in <ErrorBoundary>.',
  'useimperativehandle-ref': 'Use useImperativeHandle(ref, () => ({ focus() { inputRef.current.focus() }, clear() { inputRef.current.value = "" } })). Keep a separate internal ref for the input.',
  'useid-aria-label': 'const id = useId(). Replace hardcoded id="email" with id={id} and htmlFor="email" with htmlFor={id}. Each instance gets a unique ID.',
  'suspense-lazy-split': 'const HeavyChart = lazy(() => import("./HeavyChart")). Wrap in <Suspense fallback={<p>Loading...</p>}>. Remove the static import.',
  'react-memo-when': 'const MemoChild = React.memo(ExpensiveChild). Use <MemoChild> instead of <ExpensiveChild>. But beware: inline objects/arrays still break memo — pair with useMemo/useCallback.',
  'useoptimistic-form': 'const [optimisticTodos, addOptimistic] = useOptimistic(todos, (state, newTodo) => [...state, newTodo]). Update optimistically, then call addTodo. React rolls back on failure. Use useFormStatus for button pending state.',
  // Data Fetching
  'reactquery-basic-setup': 'useQuery({ queryKey: ["user", userId], queryFn: () => fetch(...).then(r => r.json()) }). Destructure { data, isLoading, isError }. Wrap app in QueryClientProvider.',
  'reactquery-optimistic-mutation': 'useMutation with onMutate (optimistic cache update via setQueryData), onError (rollback), onSettled (invalidateQueries). Use useQueryClient() to get the client.',
  'reactquery-dependent-query': 'Add enabled: !!projectId to the tasks query. It only fetches when a project is selected. Use placeholderData for smooth transitions.',
  'reactquery-infinite-scroll': 'useInfiniteQuery with getNextPageParam: (lastPage) => lastPage.nextCursor. fetchNextPage() on button click. hasNextPage controls visibility. data.pages.flatMap().',
  'reactquery-cache-invalidation': 'In mutation onSuccess: queryClient.invalidateQueries({ queryKey: ["posts"] }). Use useQueryClient() to access the client. This triggers background refetch.',
  'reactquery-prefetch': 'onMouseEnter: queryClient.prefetchQuery({ queryKey: ["article", id], queryFn: ... }). Check getQueryData first to skip cached items. Set staleTime on the article query.',
  // Testing
  'testing-render-query': 'render(<Greeting name="Alice" />). screen.getByText("Hello, Alice"). expect(element).toBeDefined(). Test both name and no-name cases.',
  'testing-user-event': 'Import userEvent from @testing-library/user-event. await user.click(screen.getByText("+")). Check count updated. Test disabled state with toBeDisabled().',
  'testing-async-waitfor': 'Mock fetch with vi.fn().mockResolvedValue({ json: () => ({ name: "Alice" }) }). Use waitFor(() => screen.getByText("Alice")) or findByText("Alice"). Test loading and error states.',
  'testing-mocking-modules': 'vi.mock("./email-service"). In test: expect(sendEmail).toHaveBeenCalledWith("test@test.com", "Hello from the app"). beforeEach clears mocks.',
  'testing-custom-hook': 'const { result } = renderHook(() => useCounter(5)). act(() => result.current.increment()). expect(result.current.count).toBe(6). Test clamp at 0.',
  'testing-snapshot-tradeoffs': 'expect(container).toMatchSnapshot() for quick regression. But also write specific assertions for name, email, avatar src, and admin badge presence/absence. Comment on trade-offs.',
  // Messaging — RabbitMQ
  'amqp-connection': 'connect() with amqp.connect(url, { heartbeat: 60 }). Create channel, set prefetch(10). Wrap in try/catch. On close/error: reconnect with setTimeout.',
  'amqp-exchange-types': 'ch.assertExchange(\'orders\', \'topic\', { durable: true }). Bind queues with ch.bindQueue(q, exchange, pattern). patterns: "order.us.*", "order.eu.*", "order.#".',
  'amqp-dead-letter': 'Create orders.dlx exchange (direct). Create orders.dead queue bound to it. Main queue: arguments: { "x-dead-letter-exchange": "orders.dlx" }.',
  'amqp-consumer-ack': 'ch.consume(queue, handler, { noAck: false }). In handler: ch.ack(msg) on success. ch.nack(msg, false, false) to discard poison. ch.nack(msg, false, true) to requeue.',
  // Messaging — Kafka
  'kafka-producer-config': 'new Kafka({ clientId, brokers }). Producer config: { acks: -1, idempotent: true, compression: CompressionTypes.GZIP }. Send with key for partitioning.',
  'kafka-consumer-group': 'consumer({ groupId: \'order-processor\' }). subscribe({ topic: \'orders\', fromBeginning: false }). eachMessage: process + commitOffsets. Graceful shutdown on SIGTERM.',
  'kafka-topic-config': 'admin.createTopics({ topics: [{ topic: \'orders\', numPartitions: 6, replicationFactor: 3, configEntries: [{ name: \'retention.ms\', value: \'604800000\' }] }] }).',
  'kafka-transactions': 'producer: { transactionalId, maxInFlightRequests: 1 }. consumer isolationLevel: read_committed. Flow: transaction().begin() → send → sendOffsets → commit(). abort() on error.',
};
