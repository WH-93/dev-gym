/**
 * Hook Drills — Composition Extension
 *
 * Challenges based on Michael Chan's (@chantastic) video
 * "Component Composition vs Context" (youtube.com/watch?v=3XaXKiXtNjw)
 *
 * These challenges teach composition patterns as an alternative
 * to overusing React Context. When to use children, named slots,
 * render props, and compound components.
 *
 * IMPORTANT: same escaping rules — double-quote JS strings
 * for lines containing single quotes in the code content.
 */

var compositionChallenges = [
  {
    id: "composition-children-prop",
    title: "Composition — Fix Prop Drilling with children",
    hook: "Composition",
    concept: "Instead of passing props through black-box components, lift the leaf component up to where the data is in scope using the `children` prop",
    instruction: [
      'A user object passes through 4 levels of components — App →',
      'Dashboard → DashboardContent → WelcomeMessage. Dashboard and',
      'DashboardContent never use the user prop; they just pass it down.',
      '',
      'This is "prop drilling" — and the React docs recommend composition',
      'over context for this exact case. The `children` prop lets you',
      'compose elements at the level where data is in scope.',
      '',
      'Fix: Make Dashboard render {children} instead of importing',
      'DashboardContent internally. Do the same for DashboardContent —',
      'render {children}. Then lift WelcomeMessage up to App where user',
      'is already in scope and pass it as a child.'
    ].join('\n'),
    starterCode: [
      "import { useState } from 'react';",
      '',
      '// Broken: user prop passes through 4 levels.',
      '// Dashboard and DashboardContent never use it — they just forward.',
      '',
      'function Dashboard({ user }) {',
      '  // Gets user but never reads it — just passes it down',
      '  return (',
      '    <div style={{ border: \"1px solid #334155\", borderRadius: 8, padding: 16 }}>',
      '      <DashboardNav />',
      '      <DashboardContent user={user} />',
      '    </div>',
      '  );',
      '}',
      '',
      'function DashboardNav() {',
      '  return (',
      '    <nav style={{ padding: 8, borderBottom: \"1px solid #334155\", marginBottom: 12 }}>',
      '      <strong>Dashboard</strong>',
      '    </nav>',
      '  );',
      '}',
      '',
      'function DashboardContent({ user }) {',
      '  // Also never reads user — just passes it down',
      '  return (',
      '    <div style={{ padding: 8 }}>',
      '      <WelcomeMessage user={user} />',
      '      <p style={{ fontSize: 12, color: \"#ef4444\", marginTop: 8 }}>',
      '        Prop drilled through 4 levels! Dashboard & DashboardContent',
      '        never use user but must accept and forward it.',
      '      </p>',
      '    </div>',
      '  );',
      '}',
      '',
      'function WelcomeMessage({ user }) {',
      '  if (!user) return <p style={{ color: \"#888\" }}>Please log in.</p>;',
      "  return <h2>Welcome, {user.name}!</h2>;",
      '}',
      '',
      'export default function App() {',
      "  var [user, setUser] = useState(null);",
      '',
      '  function login() {',
      "    setUser({ name: 'Michael', role: 'developer' });",
      '  }',
      '',
      '  function logout() {',
      '    setUser(null);',
      '  }',
      '',
      '  return (',
      '    <div style={{ padding: 16, fontFamily: \"sans-serif\" }}>',
      '      <h1>Prop Drilling Example</h1>',
      '      {user ? (',
      '        <Dashboard user={user} />',
      '      ) : (',
      '        <div>',
      '          <p>Not logged in</p>',
      '          <button onClick={login}>Log in</button>',
      '        </div>',
      '      )}',
      '      {user && <button onClick={logout} style={{ marginTop: 8 }}>Log out</button>}',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasChildrenInDashboard = /function\s+Dashboard\s*\(\s*\{\s*children/.test(code) ||
        /Dashboard.*children/.test(code);
      var hasChildrenInContent = /function\s+DashboardContent\s*\(\s*\{\s*children/.test(code) ||
        /DashboardContent.*children/.test(code);
      var welcomeIsChildOfContent = /DashboardContent[^>]*>[\s\S]*<WelcomeMessage/.test(code);
      var noUserPropInDashboard = !/Dashboard\s*\(\s*\{\s*user/.test(code);
      var noUserPropInContent = !/DashboardContent\s*\(\s*\{\s*user/.test(code);
      var rendersChildren = /renderChildren|{children}/.test(code);

      return {
        pass: (hasChildrenInDashboard || rendersChildren) && noUserPropInDashboard && noUserPropInContent,
        message: (hasChildrenInDashboard || rendersChildren) && noUserPropInDashboard
          ? 'Composition eliminates prop drilling! Dashboard uses {children} instead of forwarding props it never uses.'
          : !noUserPropInDashboard
            ? 'Dashboard still receives a user prop. Remove it — Dashboard should only receive {children} and render them.'
            : 'Make Dashboard render {children} instead of hardcoding DashboardContent. Then lift WelcomeMessage up to App and pass it as a child of DashboardContent.'
      };
    }
  },
  {
    id: "composition-implicit-vs-explicit",
    title: "Composition — Implicit Context vs Explicit Props",
    hook: "Composition",
    concept: "Context creates implicit dependencies: a component that reads from context breaks when rendered outside its provider. Explicit props make dependencies visible and the component reusable anywhere.",
    instruction: [
      'WelcomeMessage reads the current user from context. But when',
      'we render it on the LoginScreen (outside the context provider),',
      'it crashes because there is no context value.',
      '',
      'Context = implicit dependency. The component signature says it',
      'takes no props, but it actually requires a specific context to',
      'exist. This is fragile and makes components non-reusable.',
      '',
      'Fix: Remove context from WelcomeMessage and accept user as an',
      'explicit prop. Now the component is honest about its dependencies,',
      'works anywhere, and is trivially testable.'
    ].join('\n'),
    starterCode: [
      "import { useState, createContext, useContext } from 'react';",
      '',
      'var UserContext = createContext();',
      '',
      'function WelcomeMessage() {',
      '  // BUG: Reads from context — but what if context is missing?',
      '  var user = useContext(UserContext);',
      '  // This crashes if rendered outside the provider!',
      "  return <h2>Welcome, {user.name}!</h2>;",
      '}',
      '',
      'function LoginScreen() {',
      '  // Also shows a welcome... but breaks!',
      '  return (',
      '    <div>',
      '      <WelcomeMessage />',
      '      <p>Please sign in to continue.</p>',
      '    </div>',
      '  );',
      '}',
      '',
      'export default function App() {',
      "  var [user, setUser] = useState(null);",
      '',
      '  function login() {',
      "    setUser({ name: 'Michael', role: 'developer' });",
      '  }',
      '',
      '  return (',
      '    <div style={{ padding: 16, fontFamily: \"sans-serif\" }}>',
      '      <h1>Implicit Dependency</h1>',
      '      {user ? (',
      '        <UserContext.Provider value={user}>',
      '          <WelcomeMessage />',
      '          <button onClick={function() { setUser(null); }} style={{ marginTop: 8 }}>Log out</button>',
      '        </UserContext.Provider>',
      '      ) : (',
      '        <LoginScreen />',
      '      )}',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasUserProp = /function\s+WelcomeMessage\s*\(\s*\{\s*user/.test(code) ||
        /WelcomeMessage.*user/.test(code);
      var noUseContext = !/useContext/.test(code);
      var passesUserExplicitly = /<WelcomeMessage\s+user=/.test(code);
      var userPropUsed = /user\.name/.test(code);

      return {
        pass: hasUserProp && noUseContext && passesUserExplicitly,
        message: hasUserProp && noUseContext && passesUserExplicitly
          ? 'Explicit props! WelcomeMessage is honest about its dependencies — works anywhere, no context required.'
          : !hasUserProp
            ? 'Give WelcomeMessage an explicit user prop: function WelcomeMessage({ user }). Remove useContext entirely.'
            : !noUseContext
              ? 'Remove useContext(UserContext) from WelcomeMessage. The user should come from props, not context.'
              : 'Pass user as a prop to WelcomeMessage in the login screen too: <WelcomeMessage user={...} />. Now it works everywhere.'
      };
    }
  },
  {
    id: "composition-black-box",
    title: "Composition — Break Open the Black Box",
    hook: "Composition",
    concept: "Components that internally import and render everything are 'black boxes' — not customizable, not composable. Use {children} to let parents decide what goes inside.",
    instruction: [
      'A PageLayout component internally renders Header, Sidebar, and',
      'Content. But what if a page doesn\'t want the Sidebar? Or needs',
      'a different header? The component is a black box — you get what',
      'you get.',
      '',
      'In production: Layout components should accept children or named',
      'slots. The parent decides what goes where, and the layout just',
      'handles positioning (grid, flexbox, spacing).',
      '',
      'Fix: PageLayout should render {children} instead of hardcoding',
      'its internals. Lift Header, Sidebar, and Content up to the page',
      'level where they can be composed (or omitted) freely.'
    ].join('\n'),
    starterCode: [
      "import { useState } from 'react';",
      '',
      '// Broken: PageLayout is a black box — you cannot customize',
      '// what goes inside. Every page gets Header + Sidebar + Content.',
      '',
      'function PageLayout({ title }) {',
      '  return (',
      '    <div style={{ display: \"flex\", flexDirection: \"column\", height: \"100%\" }}>',
      '      <Header title={title} />',
      '      <div style={{ display: \"flex\", flex: 1 }}>',
      '        <Sidebar />',
      '        <Content />',
      '      </div>',
      '    </div>',
      '  );',
      '}',
      '',
      'function Header({ title }) {',
      "  return <header style={{ padding: 12, background: '#1e293b', fontSize: 18 }}>{title}</header>;",
      '}',
      '',
      'function Sidebar() {',
      "  return <aside style={{ width: 150, padding: 12, borderRight: '1px solid #334155' }}>Sidebar</aside>;",
      '}',
      '',
      'function Content() {',
      "  return <main style={{ flex: 1, padding: 12 }}>Main content area</main>;",
      '}',
      '',
      'export default function App() {',
      "  var [page, setPage] = useState('dashboard');",
      '',
      '  // What if we wanted a page WITHOUT the sidebar?',
      '  // Can not — PageLayout always renders Sidebar.',
      '  return (',
      '    <div style={{ padding: 16, fontFamily: \"sans-serif\", height: 300 }}>',
      '      <button onClick={function() { setPage(\"dashboard\"); }}>Dashboard</button>',
      '      <button onClick={function() { setPage(\"settings\"); }} style={{ marginLeft: 8 }}>Settings</button>',
      '      <div style={{ marginTop: 8, height: 250, border: \"1px solid #334155\" }}>',
      "        <PageLayout title={page === 'dashboard' ? 'Dashboard' : 'Settings'} />",
      '      </div>',
      "      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>",
      '        Black box: Settings page gets a Sidebar whether it wants one or not.',
      '      </p>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasChildren = /children/.test(code);
      var rendersChildrenInLayout = /\{children\}/.test(code);
      var headerPassedAsChild = /<Header/.test(code) && /<PageLayout/.test(code);
      var sidebarIsOptional = /page\s*===/.test(code) &&
        (/Sidebar/.test(code) ? code.indexOf('Sidebar') > code.indexOf('return') : true);

      return {
        pass: hasChildren && rendersChildrenInLayout,
        message: hasChildren && rendersChildrenInLayout
          ? 'PageLayout now renders {children} — each page composes exactly what it needs. Settings page can skip the Sidebar entirely!'
          : !hasChildren
            ? 'Add {children} to PageLayout and render it instead of hardcoding Header, Sidebar, and Content. Lift those components up to where the page is rendered.'
            : 'PageLayout accepts children but does not render them? Make sure the return statement includes {children} in the layout structure.'
      };
    }
  },
  {
    id: "composition-named-slots",
    title: "Composition — Named Slots for Multi-Region Layouts",
    hook: "Composition",
    concept: "When a layout has multiple regions (header, sidebar, content, footer), a single {children} isn't enough. Use named props — each a renderable slot — so callers fill only the regions they need.",
    instruction: [
      'A DashboardLayout needs three regions: header, sidebar, and main.',
      'Passing everything as {children} lumps it together — you cannot',
      'control where each piece goes.',
      '',
      'In production: Named slots use prop names as region identifiers.',
      'header={<CustomHeader />} sidebar={<CustomSidebar />} — the layout',
      'places each in the correct grid/flexbox cell.',
      '',
      'Fix: DashboardLayout accepts `header`, `sidebar`, and `children`',
      '(for the main area) as props. Each page can pass different',
      'components or omit regions entirely.'
    ].join('\n'),
    starterCode: [
      "import { useState } from 'react';",
      '',
      '// Broken: single {children} — cannot control where things go.',
      '// Every page gets the same layout with no customization.',
      '',
      'function DashboardLayout({ children }) {',
      '  return (',
      '    <div>',
      "      <div style={{ padding: 12, background: '#1e293b', fontWeight: 700 }}>",
      '        Default Header',
      '      </div>',
      '      <div style={{ display: \"flex\" }}>',
      "        <div style={{ width: 120, padding: 8, borderRight: '1px solid #334155' }}>",
      '          Default Sidebar',
      '        </div>',
      '        <div style={{ flex: 1, padding: 12 }}>',
      '          {children}',
      '        </div>',
      '      </div>',
      '    </div>',
      '  );',
      '}',
      '',
      'export default function App() {',
      "  var [page, setPage] = useState('overview');",
      '',
      '  return (',
      '    <div style={{ padding: 16, fontFamily: \"sans-serif\" }}>',
      '      <button onClick={function() { setPage(\"overview\"); }}>Overview</button>',
      '      <button onClick={function() { setPage(\"analytics\"); }} style={{ marginLeft: 8 }}>Analytics</button>',
      '',
      '      <div style={{ marginTop: 12, border: \"1px solid #334155\", minHeight: 200 }}>',
      '        <DashboardLayout>',
      "          {page === 'overview'",
      '            ? <p>Overview: 5 active projects, 12 tasks due today</p>',
      '            : <p>Analytics: 1,240 page views, 3.2% conversion</p>',
      '          }',
      '        </DashboardLayout>',
      '      </div>',
      '',
      "      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>",
      '        Cannot customize the header or sidebar per page — stuck with defaults.',
      '      </p>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasHeaderSlot = /header/.test(code) && /DashboardLayout[^>]*header=/.test(code);
      var hasSidebarSlot = /sidebar/.test(code) && /DashboardLayout[^>]*sidebar=/.test(code);
      var rendersHeaderSlot = /\{header\}/.test(code);
      var rendersSidebarSlot = /\{sidebar\}/.test(code);

      return {
        pass: (hasHeaderSlot || rendersHeaderSlot) && (hasSidebarSlot || rendersSidebarSlot),
        message: (hasHeaderSlot || rendersHeaderSlot) && (hasSidebarSlot || rendersSidebarSlot)
          ? 'Named slots! Each page can now customize its header and sidebar independently — or leave them out entirely.'
          : !hasHeaderSlot && !rendersHeaderSlot
            ? 'Add a `header` prop to DashboardLayout and render it: {header || <DefaultHeader />}. Pass custom headers from the page level: header={<AnalyticsHeader />}.'
            : 'DashboardLayout needs BOTH header and sidebar slots. Add the sidebar slot too: {sidebar || <DefaultSidebar />}.'
      };
    }
  },
  {
    id: "composition-render-props",
    title: "Composition — Render Props for Data-Sharing Without Context",
    hook: "Composition",
    concept: "When a child needs data from a parent but you want to keep the parent reusable, a render prop (function as child) inverts control: the parent provides data, the child decides rendering.",
    instruction: [
      'A MouseTracker component tracks x/y coordinates. To use it,',
      'you used to pass a render function as a child that receives {x, y}.',
      '',
      'This is the "render props" pattern — the parent holds the logic,',
      'the child receives the data and decides what to render. No context,',
      'no prop drilling.',
      '',
      'Fix: Convert MouseTracker to call children as a function:',
      '{children({ x, y })}. Now any component wrapped inside can access',
      'the mouse position without context.'
    ].join('\n'),
    starterCode: [
      "import { useState, useEffect, useCallback } from 'react';",
      '',
      '// Broken: MouseTracker renders a default UI. Users cannot',
      '// customize what gets rendered with the mouse position.',
      '',
      'function MouseTracker() {',
      '  var [pos, setPos] = useState({ x: 0, y: 0 });',
      '',
      '  // Sets up mousemove tracking but only renders fixed JSX',
      '  useEffect(function() {',
      '    function handleMove(e) {',
      '      setPos({ x: e.clientX, y: e.clientY });',
      '    }',
      '    window.addEventListener(\"mousemove\", handleMove);',
      '    return function() { window.removeEventListener(\"mousemove\", handleMove); };',
      '  }, []);',
      '',
      '  return (',
      '    <div style={{ padding: 12, border: \"1px solid #334155\", borderRadius: 8 }}>',
      "      <p>Mouse: ({pos.x}, {pos.y})</p>",
      '    </div>',
      '  );',
      '}',
      '',
      'export default function App() {',
      '  return (',
      '    <div style={{ padding: 16, fontFamily: \"sans-serif\", height: 200 }}>',
      '      <h3>Mouse Tracker</h3>',
      '      <MouseTracker />',
      "      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>",
      '        Can only show coordinates. What if I want a dot at the mouse position?',
      '        Or a heatmap? MouseTracker dictates the UI.',
      '      </p>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var callsChildrenAsFn = /\{children\s*\(/.test(code) || /children\s*\(/.test(code);
      var passesPosToChildren = /children\s*\(\s*pos/.test(code) || /children\s*\(\s*\{\s*x/.test(code);
      var appUsesRenderProp = /<MouseTracker[^>]*>[^<]*\{/.test(code) || /<MouseTracker[^>]*>\s*\{/.test(code);

      return {
        pass: callsChildrenAsFn,
        message: callsChildrenAsFn
          ? 'Render props! MouseTracker provides {x, y} via children(position) — any consuming component decides what to render with that data.'
          : 'Replace the hardcoded JSX with {children(pos)}. Now wrap content in a function: <MouseTracker>{function(pos) { return <YourUI x={pos.x} y={pos.y} />; }}</MouseTracker>'
      };
    }
  },
  {
    id: "composition-compound-tabs",
    title: "Composition — Compound Components with Internal Context (Legit!)",
    hook: "Composition",
    concept: "Compound components use internal context to share state between a parent and its children — this IS a legitimate use of context. The key: the context is private to the component, not app-global.",
    instruction: [
      'A Tabs component manages which tab is active. Currently, each',
      'Tab receives an `isActive` prop manually — if you reorganize tabs,',
      'all the wiring breaks.',
      '',
      'Compound components feel like native HTML: <Tabs> contains <Tab>',
      'elements, and they coordinate via internal context. No prop passing',
      'between them. This is the pattern used by Reach UI, Radix, and',
      'React Aria.',
      '',
      'Fix: Create a private TabsContext. Tabs provides it; Tab reads',
      'from it. Now the API is: <Tabs><Tab>One</Tab><Tab>Two</Tab></Tabs>',
      '— clean, composable, and the context stays contained.'
    ].join('\n'),
    starterCode: [
      "import { useState } from 'react';",
      '',
      '// Broken: Tab needs isActive and onClick passed manually.',
      '// Adding/removing tabs requires updating all the wiring.',
      '',
      'function Tab({ label, isActive, onClick }) {',
      '  return (',
      '    <button',
      '      onClick={onClick}',
      '      style={{',
      '        padding: \"8px 16px\",',
      '        border: \"none\",',
      '        borderBottom: isActive ? \"2px solid #3b82f6\" : \"2px solid transparent\",',
      "        background: isActive ? '#1e293b' : 'transparent',",
      "        color: isActive ? '#f1f5f9' : '#64748b',",
      '        cursor: \"pointer\",',
      '        fontSize: 14,',
      '      }}',
      '    >',
      '      {label}',
      '    </button>',
      '  );',
      '}',
      '',
      'function TabPanel({ children, isActive }) {',
      '  if (!isActive) return null;',
      "  return <div style={{ padding: 16 }}>{children}</div>;",
      '}',
      '',
      'export default function App() {',
      "  var [activeTab, setActiveTab] = useState('overview');",
      '',
      '  // Manual wiring: each tab needs isActive + onClick wired up',
      '  return (',
      '    <div style={{ padding: 16, fontFamily: \"sans-serif\", maxWidth: 400 }}>',
      '      <h3>Manual Tab Wiring</h3>',
      '      <div>',
      "        <Tab label=\"Overview\" isActive={activeTab === 'overview'}",
      "          onClick={function() { setActiveTab('overview'); }} />",
      "        <Tab label=\"Analytics\" isActive={activeTab === 'analytics'}",
      "          onClick={function() { setActiveTab('analytics'); }} />",
      "        <Tab label=\"Settings\" isActive={activeTab === 'settings'}",
      "          onClick={function() { setActiveTab('settings'); }} />",
      '      </div>',
      "      <TabPanel isActive={activeTab === 'overview'}>Overview content</TabPanel>",
      "      <TabPanel isActive={activeTab === 'analytics'}>Analytics data</TabPanel>",
      "      <TabPanel isActive={activeTab === 'settings'}>Settings panel</TabPanel>",
      "      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>",
      '        Adding a 4th tab requires wiring isActive + onClick manually.',
      '        Each tab is tightly coupled to the parent logic.',
      '      </p>',
      '    </div>',
      '  );',
      '}',
    ].join('\n'),
    solutionCheck: function(code) {
      var hasContext = /createContext/.test(code);
      var hasProvider = /Provider/.test(code);
      var tabUsesContext = /useContext/.test(code);
      var tabsComponentExists = /function\s+Tabs/.test(code);
      var tabNoLongerHasOnClick = !/Tab[^P].*onClick/.test(code) || /Tab\s*\(\s*\{[^}]*label/.test(code);
      var tabsWrapsTabs = /<Tabs[^>]*>[\s\S]*<Tab/.test(code);
      var appHasNoActiveTabState = !/activeTab/.test(code);

      return {
        pass: hasContext && hasProvider && tabUsesContext && tabsComponentExists,
        message: hasContext && hasProvider && tabUsesContext
          ? 'Compound components with internal context! <Tabs> manages state privately — Tab reads it via context. Clean API, no prop passing.'
          : !hasContext
            ? 'Create a private TabsContext with createContext(). The Tabs component provides the active tab + onChange; Tab reads them via useContext.'
            : !tabUsesContext
              ? 'Have Tab read from TabsContext (useContext) instead of receiving isActive and onClick as props. The context carries both values.'
              : 'Wrap your tabs in a <Tabs> component that provides the context. Individual tabs should not need isActive or onClick props.'
      };
    }
  }
];

export default compositionChallenges;
