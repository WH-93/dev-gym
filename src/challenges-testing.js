/**
 * Training Drills — Testing Section
 *
 * React Testing Library, Vitest, mocking, and test patterns.
 * "How would you test this?" is the most common senior interview question
 * that separates people who've only written code from people who've shipped it.
 */

var testingChallenges = [
  // ─── BASIC RENDER + QUERY ──────────────────────────────────────────
  {
    id: 'testing-render-query',
    area: 'Testing',
    title: 'Render and Query — Your First RTL Test',
    difficulty: '★★☆',
    description: `Write a test for a Greeting component that renders "Hello, {name}" when passed a name prop, and "Hello, Stranger" when no name is passed.

Use:
- render() from @testing-library/react
- screen.getByText() to find the greeting
- expect() from vitest

Test both cases: with name and without name.`,
    starterCode: `// Component to test
function Greeting({ name }) {
  return <h1>Hello, {name || 'Stranger'}</h1>
}

// Write the tests:
// import { render, screen } from '@testing-library/react'
// import { describe, it, expect } from 'vitest'

// describe('Greeting', () => {
//   it('renders with a name', () => {
//     ...
//   })
//   it('renders fallback when no name', () => {
//     ...
//   })
// })`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('render(')) errors.push('Call render(<Greeting ... />) to mount the component');
      if (!code.includes('screen.getByText')) errors.push('Use screen.getByText() to find the rendered text');
      if (!code.includes("'Hello, Stranger'") && !code.includes('"Hello, Stranger"')) errors.push('Test the fallback: when no name prop, expect "Hello, Stranger"');
      if (!code.includes('expect(')) errors.push('Use expect() from vitest for assertions');
      if (!code.includes('describe(')) errors.push('Wrap tests in describe("Greeting", () => { ... })');
      if (!code.includes('it(') && !code.includes('test(')) errors.push('Define individual tests with it() or test()');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ RTL test: render, screen.getByText, expect assertions for both cases.' };
    }
  },
  // ─── USER INTERACTION ─────────────────────────────────────────────
  {
    id: 'testing-user-event',
    area: 'Testing',
    title: 'Simulating User Interactions with userEvent',
    difficulty: '★★☆',
    description: `Test a Counter component with increment and decrement buttons.
- Initial count should be 0
- Clicking "+" increments to 1
- Clicking "-" decrements to -1
- Clicking "Reset" after changes returns to 0

Use userEvent.click() from @testing-library/user-event (NOT fireEvent — userEvent is more realistic, simulating actual browser events).

Also test that the reset button is disabled when count is already 0.`,
    starterCode: `// Component to test
function Counter() {
  const [count, setCount] = React.useState(0)
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <button onClick={() => setCount(0)} disabled={count === 0}>Reset</button>
    </div>
  )
}

// Write tests using userEvent:
// import { render, screen } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { describe, it, expect } from 'vitest'`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('userEvent')) errors.push('Import userEvent from @testing-library/user-event');
      if (!code.includes('userEvent.click') && !code.includes('user.click')) errors.push('Use userEvent.click() — not fireEvent — for realistic interaction simulation');
      if (!code.includes('screen.getByText(\'+\')') && !code.includes('screen.getByRole')) errors.push('Find buttons by text or role');
      if (!code.includes('data-testid')) errors.push('Query the count display using data-testid or text content');
      if (!code.includes('disabled')) errors.push('Test that the Reset button is disabled when count === 0');
      if (!code.includes("toBeDisabled") && !code.includes('disabled')) errors.push('Use toBeDisabled() matcher or check the disabled attribute');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ userEvent.click() simulates real interactions. Tests cover increment, decrement, reset, and disabled state.' };
    }
  },
  // ─── ASYNC TESTING ─────────────────────────────────────────────────
  {
    id: 'testing-async-waitfor',
    area: 'Testing',
    title: 'Testing Async Behavior — waitFor and findBy',
    difficulty: '★★★',
    description: `Test a UserProfile component that fetches user data and shows a loading state, then the user name.

The component:
- Shows "Loading..." while fetching
- Fetches from /api/users/1
- Displays user.name when loaded
- Shows "User not found" on error

Test the loading state, the success state, and the error state. Mock fetch with vi.fn().

Use waitFor() for assertions that depend on async state changes, and findByText() as a shortcut for waitFor + getByText.`,
    starterCode: `// Component to test
function UserProfile({ userId }) {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(data => { setUser(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [userId])

  if (loading) return <p>Loading...</p>
  if (error) return <p>User not found</p>
  return <h1>{user.name}</h1>
}

// Write async tests:
// import { render, screen, waitFor } from '@testing-library/react'
// import { vi, describe, it, expect } from 'vitest'

// Mock fetch before each test:
// globalThis.fetch = vi.fn()`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('vi.fn()')) errors.push('Mock fetch with vi.fn() to control responses');
      if (!code.includes('mockResolvedValue') && !code.includes('mockImplementation')) errors.push('Use mockResolvedValue or mockImplementation to return test data from the mock fetch');
      if (!code.includes('waitFor(') && !code.includes('findBy')) errors.push('Use waitFor() or findByText() for async assertions — state changes are not synchronous');
      if (!code.includes("'Loading...'") && !code.includes('"Loading..."')) errors.push('Assert that Loading... appears before the data loads');
      if (!code.includes('mockRejectedValue') && !code.includes('reject')) errors.push('Test the error case: mock fetch to reject, assert "User not found" appears');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Async testing: vi.fn() mock, waitFor for state changes, loading + success + error states covered.' };
    }
  },
  // ─── MOCKING ───────────────────────────────────────────────────────
  {
    id: 'testing-mocking-modules',
    area: 'Testing',
    title: 'Mocking Modules and Functions',
    difficulty: '★★★',
    description: `A NotificationSender calls an imported sendEmail() function. Test that:
- The component renders the form correctly
- Clicking "Send" calls sendEmail with the right arguments
- sendEmail is NOT actually called in the test (it's mocked)
- The button is disabled while sending

Use vi.mock() to mock the entire module, and vi.fn() for individual functions. Use toHaveBeenCalledWith() to verify argument passing.

Key distinction: vi.mock() mocks a module (all exports), vi.fn() creates a single mock function you can spy on.`,
    starterCode: `// Component to test
// import { sendEmail } from './email-service'

function NotificationSender() {
  const [email, setEmail] = React.useState('')
  const [sending, setSending] = React.useState(false)

  async function handleSend() {
    setSending(true)
    await sendEmail(email, 'Hello from the app')
    setSending(false)
    setEmail('')
  }

  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
      <button onClick={handleSend} disabled={sending || !email}>
        {sending ? 'Sending...' : 'Send'}
      </button>
    </div>
  )
}

// Write the mock + tests:
// import { render, screen } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { vi, describe, it, expect, beforeEach } from 'vitest'
// import { sendEmail } from './email-service'

// vi.mock('./email-service')  // <-- mocks the whole module`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('vi.mock(')) errors.push('Use vi.mock("./email-service") to mock the module');
      if (!code.includes('toHaveBeenCalledWith')) errors.push('Assert sendEmail was called with the right arguments using toHaveBeenCalledWith()');
      if (!code.includes('toHaveBeenCalled')) errors.push('Assert sendEmail was called at all');
      if (!code.includes('beforeEach(')) errors.push('Use beforeEach to clear mocks between tests (vi.clearAllMocks)');
      if (!code.includes("disabled") || !code.includes("toBeDisabled")) errors.push('Test that the button is disabled while sending');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Module mocking: vi.mock for sendEmail, toHaveBeenCalledWith for arg verification, button disabled during send.' };
    }
  },
  // ─── CUSTOM HOOK TESTING ──────────────────────────────────────────
  {
    id: 'testing-custom-hook',
    area: 'Testing',
    title: 'Testing Custom Hooks with renderHook',
    difficulty: '★★★',
    description: `Test a useCounter custom hook that:
- Starts at 0 (or a custom initial value)
- increment() adds 1
- decrement() subtracts 1
- reset() returns to initial value
- Cannot go below 0 (clamped)

Use renderHook() from @testing-library/react. This renders the hook in isolation — no component needed.

Use act() from react when calling state-updating functions, and result.current to read the hook's return value.`,
    starterCode: `// Hook to test
function useCounter(initialValue = 0) {
  const [count, setCount] = React.useState(initialValue)

  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => Math.max(0, c - 1))
  const reset = () => setCount(initialValue)

  return { count, increment, decrement, reset }
}

// Write tests:
// import { renderHook, act } from '@testing-library/react'
// import { describe, it, expect } from 'vitest'

// describe('useCounter', () => {
//   it('starts at the initial value', () => ...)
//   it('increments', () => ...)
//   it('decrements but not below 0', () => ...)
// })`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('renderHook(')) errors.push('Use renderHook(() => useCounter()) to render the hook in isolation');
      if (!code.includes('result.current')) errors.push('Access the hook return value via result.current.{count, increment, ...}');
      if (!code.includes('act(')) errors.push('Wrap state-updating function calls in act()');
      if (!code.includes('useCounter(5)') && !code.includes('useCounter(10)')) errors.push('Test with a custom initial value (not just 0)');
      if (!code.includes('decrement') || !code.includes('max') || !code.includes("can't go below") || !code.includes('not below')) errors.push('Test that decrement clamps at 0');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Custom hook test: renderHook isolates the hook, act() wraps state changes, result.current reads the return value.' };
    }
  },
  // ─── SNAPSHOT TESTING ─────────────────────────────────────────────
  {
    id: 'testing-snapshot-tradeoffs',
    area: 'Testing',
    title: 'Snapshot Testing — When to Use and When to Avoid',
    difficulty: '★★☆',
    description: `Write a snapshot test for a UserCard component, then write a BETTER test that replaces the snapshot with specific assertions.

Snapshot: toMatchSnapshot() captures the entire rendered output. Useful for catching unintended UI changes, but:
- Snapshots break on ANY markup change — noisy
- PR reviewers skip snapshot diffs — they become wallpaper
- A passing snapshot doesn't mean the UI is correct — just unchanged

Better: specific assertions. Instead of a 30-line snapshot, assert:
- User name is rendered
- Email is rendered
- Avatar has the correct src
- Role badge appears for 'admin' users and is absent for 'user' role

Show BOTH approaches and comment on why the specific version is better.`,
    starterCode: `// Component to test
function UserCard({ user }) {
  return (
    <div data-testid="user-card">
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {user.role === 'admin' && <span data-testid="admin-badge">Admin</span>}
    </div>
  )
}

const testUser = { name: 'Alice', email: 'alice@example.com', avatar: '/alice.jpg', role: 'user' }

// Write BOTH a snapshot test AND specific assertion tests.
// Explain in a comment why the specific version is superior.`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('toMatchSnapshot')) errors.push('Write one snapshot test using toMatchSnapshot() — show the pattern even though it has trade-offs');
      if (!code.includes('data-testid')) errors.push('Query by data-testid in the specific assertions test');
      if (!code.includes("Alice") && !code.includes('alice')) errors.push('Assert the user name is rendered');
      if (!code.includes('admin') || !code.includes('role')) errors.push('Test both cases: admin badge appears for role="admin", absent for role="user"');
      if (!code.includes('src') || !code.includes('avatar')) errors.push('Assert the avatar img has the correct src');
      // Check for a comment explaining trade-offs
      if (!code.includes('wallpaper') && !code.includes('noisy') && !code.includes('trade-off') && !code.includes('specific')) {
        // Not a hard fail, but mention it
      }
      return { pass: errors.length === 0, message: errors.length === 0 ? '✓ Both patterns shown: snapshot for quick regression, specific assertions for meaningful verification. The specific version survives refactors and PR reviewers actually read it.' : errors.join('\n') };
    }
  }
];

export default testingChallenges;
