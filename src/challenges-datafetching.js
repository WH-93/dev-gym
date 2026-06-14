/**
 * Training Drills — Data Fetching Section
 *
 * React Query / TanStack Query patterns: queries, mutations,
 * cache invalidation, optimistic updates, pagination, prefetching.
 * Real-world data fetching that every production React app needs.
 */

var dataFetchingChallenges = [
  // ─── BASIC USEQUERY ────────────────────────────────────────────────
  {
    id: 'reactquery-basic-setup',
    area: 'Data Fetching',
    title: 'useQuery — Replace useEffect + useState with Query',
    difficulty: '★★☆',
    description: `A component fetches user data using useEffect + useState + fetch. It works but:
- No caching — refetches on every mount
- No background refetch on window focus
- No retry on failure
- Loading/error states are manual

Fix: Replace the useEffect + useState pattern with useQuery from @tanstack/react-query:
- Pass a queryKey (['user', userId]) and queryFn
- Destructure { data, isLoading, isError, error }
- The query is cached, retried, and background-refetched automatically

Also wrap the app in QueryClientProvider with a QueryClient.`,
    starterCode: `import { useState, useEffect } from 'react'

// Manual fetch — no caching, no retry, no refetch on focus
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(data => { setUser(data); setLoading(false) })
      .catch(err => { setError(err); setLoading(false) })
  }, [userId])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  return <h1>{user.name}</h1>
}

// App with provider:
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// const queryClient = new QueryClient()
// <QueryClientProvider client={queryClient}><UserProfile userId={1} /></QueryClientProvider>`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('useQuery')) errors.push('Import and use useQuery from @tanstack/react-query');
      if (!code.includes('queryKey')) errors.push('Define a queryKey — at minimum [\'user\', userId] for cache identification');
      if (!code.includes('queryFn')) errors.push('Define a queryFn that calls fetch and returns the parsed JSON');
      if (!code.includes('isLoading')) errors.push('Destructure isLoading from useQuery instead of manual loading state');
      if (!code.includes('QueryClientProvider')) errors.push('Wrap the app in QueryClientProvider with a new QueryClient');
      if (!code.includes('QueryClient')) errors.push('Create a QueryClient instance for the provider');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ useQuery replaces useEffect + useState. Automatic caching, retry, and background refetch.' };
    }
  },
  // ─── MUTATION + OPTIMISTIC ─────────────────────────────────────────
  {
    id: 'reactquery-optimistic-mutation',
    area: 'Data Fetching',
    title: 'useMutation — Optimistic Update Before Server Confirms',
    difficulty: '★★★',
    description: `A todo list calls an async addTodo() API. The user clicks "Add", waits for the server, then sees the new item. Feels slow.

Fix: Use useMutation for the POST request with onMutate for optimistic update:
- onMutate: immediately add the new todo to the cache (optimistic)
- onError: roll back to the previous cache state
- onSettled: invalidate the query to refetch fresh data

The UI updates instantly. If the server fails, it rolls back. Key: queryClient.setQueryData and queryClient.invalidateQueries.

Use the mutation's isPending for button loading state.`,
    starterCode: `import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

async function addTodo(text) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ text }),
    headers: { 'Content-Type': 'application/json' }
  })
  return res.json()
}

function TodoList() {
  const [text, setText] = useState('')
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(r => r.json())
  })

  // BUG: No mutation — just calls addTodo without cache management
  async function handleAdd() {
    if (!text.trim()) return
    await addTodo(text)
    setText('')
    // Need to refetch — but there is no way to do it with just useQuery
  }

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="New todo" />
      <button onClick={handleAdd}>Add</button>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('useMutation')) errors.push('Import and use useMutation from @tanstack/react-query');
      if (!code.includes('onMutate')) errors.push('Use onMutate for the optimistic update: immediately add the new item to cache');
      if (!code.includes('onError')) errors.push('Use onError to roll back the optimistic update on failure');
      if (!code.includes('onSettled')) errors.push('Use onSettled to invalidateQueries — refetch fresh data after mutation completes');
      if (!code.includes('setQueryData')) errors.push('Use queryClient.setQueryData to update the cache optimistically');
      if (!code.includes('invalidateQueries')) errors.push('Use queryClient.invalidateQueries in onSettled to ensure fresh data');
      if (!code.includes('useQueryClient')) errors.push('Import useQueryClient to access the queryClient in the component');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ useMutation with optimistic update: onMutate adds instantly, onError rolls back, onSettled refetches.' };
    }
  },
  // ─── DEPENDENT QUERIES ─────────────────────────────────────────────
  {
    id: 'reactquery-dependent-query',
    area: 'Data Fetching',
    title: 'Dependent Queries — Chain Fetches Where B Needs A',
    difficulty: '★★★',
    description: `A user selects a project from a dropdown, then the app fetches that project's tasks. Currently, when the user switches projects, the tasks for the OLD project flash briefly before the new ones load.

Fix: Use the \x60enabled\x60 option on the tasks query — only fetch tasks when a projectId is selected. The old tasks cache is preserved. When the user goes back to a previous project, the tasks appear instantly from cache.

Also pass the selected project data as placeholderData for a smoother transition. Add a loading skeleton while the tasks query is fetching.`,
    starterCode: `import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

function ProjectTasks() {
  const [projectId, setProjectId] = useState(null)

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json())
  })

  // BUG: Always fetches — even when projectId is null
  // Shows stale tasks from previous project briefly
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => fetch(\`/api/projects/\${projectId}/tasks\`).then(r => r.json()),
  })

  return (
    <div>
      <select onChange={e => setProjectId(Number(e.target.value))} value={projectId || ''}>
        <option value="">Select project...</option>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {tasks.length === 0 && <p>No tasks</p>}
      <ul>{tasks.map(t => <li key={t.id}>{t.title}</li>)}</ul>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('enabled:')) errors.push('Add enabled: !!projectId to the tasks query so it only fetches when a project is selected');
      if (!code.includes('!!projectId') && !code.includes('projectId !== null') && !code.includes('projectId != null')) errors.push('The enabled condition should check that projectId is truthy (or not null)');
      if (!code.includes('placeholderData')) errors.push('Use placeholderData to show previous project tasks while the new ones load');
      if (code.includes('/api/projects/undefined') || code.includes('/api/projects/null')) errors.push('Ensure the fetch URL does not include undefined or null when projectId is empty');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Dependent query: enabled prevents fetch when projectId is null. placeholderData smooths transitions. Old project tasks load instantly from cache.' };
    }
  },
  // ─── INFINITE SCROLL ───────────────────────────────────────────────
  {
    id: 'reactquery-infinite-scroll',
    area: 'Data Fetching',
    title: 'useInfiniteQuery — Cursor-Based Pagination',
    difficulty: '★★★',
    description: `A feed of posts loads the first 10 items, then shows a "Load More" button. Clicking it appends the next 10. Currently uses useState to manage pages manually, with no cache or retry.

Fix: Use useInfiniteQuery:
- getNextPageParam reads the cursor from the last page response
- fetchNextPage loads the next page
- hasNextPage controls whether the "Load More" button shows
- isFetchingNextPage shows a loading indicator during fetch
- data.pages is a flat array of all loaded pages — flatten with flatMap

The query key differentiates by feed type.`,
    starterCode: `import { useState, useEffect } from 'react'

function PostFeed() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  // BUG: Manual page management — no cache, no retry, no deduplication
  useEffect(() => {
    setLoading(true)
    fetch(\`/api/posts?page=\${page}&limit=10\`)
      .then(r => r.json())
      .then(data => {
        setPosts(prev => [...prev, ...data.items])
        setHasMore(data.nextCursor !== null)
        setLoading(false)
      })
  }, [page])

  return (
    <div>
      {posts.map(p => <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #334155' }}>{p.title}</div>)}
      {loading && <p>Loading...</p>}
      {hasMore && !loading && <button onClick={() => setPage(p => p + 1)}>Load More</button>}
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('useInfiniteQuery')) errors.push('Import and use useInfiniteQuery from @tanstack/react-query');
      if (!code.includes('getNextPageParam')) errors.push('Define getNextPageParam to extract the cursor from the last page response');
      if (!code.includes('fetchNextPage')) errors.push('Call fetchNextPage() in the Load More button onClick');
      if (!code.includes('hasNextPage')) errors.push('Use hasNextPage to conditionally show the Load More button');
      if (!code.includes('isFetchingNextPage')) errors.push('Show a loading state while the next page is fetching');
      if (!code.includes('data.pages')) errors.push('Flatten data.pages with flatMap to get all loaded items');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ useInfiniteQuery: cursor-based pagination with getNextPageParam, fetchNextPage, hasNextPage, isFetchingNextPage.' };
    }
  },
  // ─── CACHE INVALIDATION ────────────────────────────────────────────
  {
    id: 'reactquery-cache-invalidation',
    area: 'Data Fetching',
    title: 'Cache Invalidation — When and How to Refetch',
    difficulty: '★★★',
    description: `After a user creates a new post, the post list is stale — it shows old data. The createPost mutation succeeds but the list query still has the old cache.

Fix: In the mutation's onSuccess, call queryClient.invalidateQueries({ queryKey: ['posts'] }). This marks the posts query as stale and triggers a background refetch.

Also:
- Invalidate only the affected query (or query families)
- Use exact: true when invalidating a specific query
- Understand staleTime: how long before data is considered stale
- Understand gcTime: how long inactive cache data is kept before garbage collection`,
    starterCode: `import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'

function PostManager() {
  const [title, setTitle] = useState('')
  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(r => r.json())
  })

  const createPost = useMutation({
    mutationFn: (newPost) => fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(newPost),
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json()),
    // BUG: onSuccess is missing — cache is never invalidated
    // The post list shows stale data after creating a new post
  })

  async function handleCreate() {
    if (!title.trim()) return
    await createPost.mutateAsync({ title })
    setTitle('')
  }

  return (
    <div>
      <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New post title" />
      <button onClick={handleCreate} disabled={createPost.isPending}>
        {createPost.isPending ? 'Creating...' : 'Create Post'}
      </button>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('onSuccess')) errors.push('Add onSuccess to the mutation to handle cache invalidation');
      if (!code.includes('invalidateQueries')) errors.push('Call queryClient.invalidateQueries in onSuccess to refetch stale data');
      if (!code.includes("['posts']") && !code.includes('"posts"')) errors.push('Invalidate the posts query specifically: invalidateQueries({ queryKey: [\'posts\'] })');
      if (!code.includes('useQueryClient')) errors.push('Import useQueryClient to access the query client in the component');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Cache invalidation: onSuccess invalidates [\'posts\'], triggering a background refetch. The list always shows fresh data.' };
    }
  },
  // ─── PREFETCHING ───────────────────────────────────────────────────
  {
    id: 'reactquery-prefetch',
    area: 'Data Fetching',
    title: 'Prefetching — Load Data Before the User Clicks',
    difficulty: '★★★',
    description: `A list of articles shows titles. When the user hovers over a title, nothing happens. When they click, there is a 200ms loading spinner while the article content loads.

Fix: Use queryClient.prefetchQuery on mouseEnter. When the user hovers over an article, the content loads in the background. When they click, it's already in the cache — instant.

Key: prefetch only when the data is NOT already cached. Check queryClient.getQueryData first. Don't waste bandwidth on cached data.

Also: set a staleTime so the prefetched data stays fresh for a reasonable window (e.g., 30 seconds).`,
    starterCode: `import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

function ArticleList() {
  const [selectedId, setSelectedId] = useState(null)
  const queryClient = useQueryClient()

  const { data: articles = [] } = useQuery({
    queryKey: ['articles'],
    queryFn: () => fetch('/api/articles').then(r => r.json())
  })

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', selectedId],
    queryFn: () => fetch(\`/api/articles/\${selectedId}\`).then(r => r.json()),
    enabled: !!selectedId,
  })

  // BUG: No prefetch. User hovers, clicks, waits 200ms for content.
  function handleHover(id) {
    // Nothing — the opportunity to prefetch is wasted
  }

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div>
        <h3>Articles</h3>
        {articles.map(a => (
          <div
            key={a.id}
            onMouseEnter={() => handleHover(a.id)}
            onClick={() => setSelectedId(a.id)}
            style={{ cursor: 'pointer', padding: 8, borderBottom: '1px solid #334155',
              background: selectedId === a.id ? '#1e293b' : 'transparent' }}
          >
            {a.title}
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        {isLoading && <p>Loading article...</p>}
        {article && <div><h2>{article.title}</h2><p>{article.body}</p></div>}
      </div>
    </div>
  )
}`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('prefetchQuery')) errors.push('Call queryClient.prefetchQuery on mouseEnter to load article data in the background');
      if (!code.includes('getQueryData')) errors.push('Check queryClient.getQueryData before prefetching — skip if already cached');
      if (!code.includes('onMouseEnter') && !code.includes('handleHover')) errors.push('Use onMouseEnter or a hover handler to trigger the prefetch');
      if (!code.includes("['article'") && !code.includes('"article"')) errors.push('Prefetch with the correct queryKey: [\'article\', id]');
      if (!code.includes('staleTime')) errors.push('Set staleTime on the article query so prefetched data isn\'t immediately considered stale');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Prefetch: onMouseEnter triggers prefetchQuery, getQueryData skips cached items, staleTime keeps prefetched data fresh.' };
    }
  }
];

export default dataFetchingChallenges;
