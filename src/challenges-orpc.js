/**
 * Training Drills — oRPC Extension
 *
 * Challenges based on oRPC (https://orpc.dev/) — end-to-end type-safe
 * RPC with OpenAPI support. Covers procedure definition, middleware,
 * error handling, context injection, client creation, and lazy routing.
 */

var orpcChallenges = [
  // ─── PROCEDURE DEFINITION WITH ZOD ──────────────────────────────────
  {
    id: 'orpc-basic-procedure',
    area: 'oRPC',
    title: 'Define a Type-Safe Procedure with Zod',
    difficulty: '★★☆',
    description: `Define a createUser procedure that:
- Uses Zod to validate input: { name: string, email: string (email format) }
- Returns the created user with an auto-generated id
- Uses os.input() and os.handler() correctly

The procedure must be exportable and part of a router.`,
    starterCode: `import { os } from '@orpc/server'
import { z } from 'zod'

// Define the procedure here
// export const createUser = os
//   .input(...)
//   .handler(...)

// export const router = { user: { create: createUser } }`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('os.input')) errors.push('Use os.input() with a Zod schema');
      if (!code.includes('z.object')) errors.push('Define input with z.object({ name: z.string(), email: z.string().email() })');
      if (!code.includes('.email()')) errors.push('Email field should use z.string().email()');
      if (!code.includes('.handler')) errors.push('Add .handler() to define the procedure logic');
      if (!code.includes('createUser')) errors.push('Export the procedure as createUser');
      if (!code.includes('router')) errors.push('Export a router object with the procedure');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Type-safe procedure with Zod validation and handler defined.' };
    }
  },
  // ─── AUTH MIDDLEWARE ────────────────────────────────────────────────
  {
    id: 'orpc-auth-middleware',
    area: 'oRPC',
    title: 'Authentication Middleware with Context Injection',
    difficulty: '★★★',
    description: `Create an authentication middleware that:
- Declares required context via os.$context<{ headers: Headers }>()
- Extracts a JWT from the Authorization header
- Parses the user from the JWT
- Injects the user into context via next({ context: { user } })
- Throws ORPCError('UNAUTHORIZED') if no valid token

Then apply it to a getProfile procedure.`,
    starterCode: `import { ORPCError, os } from '@orpc/server'
import { z } from 'zod'

// Middleware: parse JWT, inject user into context
// const base = os.$context<{ headers: Headers }>()

// const requireAuth = base.middleware(async ({ context, next }) => {
//   ... extract token, parse user, inject or throw
// })

// const getProfile = base
//   .use(requireAuth)
//   .handler(async ({ context }) => {
//     return { profile: context.user }
//   })

// export const router = { user: { profile: getProfile } }`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('$context')) errors.push('Use os.$context<{ headers: Headers }>() to declare required context');
      if (!code.includes('.middleware')) errors.push('Define middleware with .middleware()');
      if (!code.includes('next({') && !code.includes('next ( {')) errors.push('Call next({ context: { user } }) to inject user into context');
      if (!code.includes("'UNAUTHORIZED'") && !code.includes('\"UNAUTHORIZED\"')) errors.push('Throw new ORPCError("UNAUTHORIZED") when auth fails');
      if (!code.includes('ORPCError')) errors.push('Import and use ORPCError for typed errors');
      if (!code.includes('requireAuth')) errors.push('Name the middleware requireAuth for clarity');
      if (!code.includes('.use(requireAuth)')) errors.push('Apply middleware with .use(requireAuth) on the procedure');
      if (!code.includes('parseJWT') && !code.includes('jwt') && !code.includes('verify')) errors.push('Parse/verify the JWT from context.headers before injecting user');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Auth middleware: declared context, JWT parsing, user injection, UNAUTHORIZED error.' };
    }
  },
  // ─── TYPE-SAFE ERRORS ──────────────────────────────────────────────
  {
    id: 'orpc-typed-errors',
    area: 'oRPC',
    title: 'Type-Safe Error Handling with .errors()',
    difficulty: '★★★',
    description: `Define type-safe errors for a deleteUser procedure:
- NOT_FOUND: when user doesn't exist (include userId in data)
- FORBIDDEN: when user lacks permission
- Use os.errors() to define error types with Zod schemas
- Throw errors via the errors object (not raw ORPCError)
- The procedure takes { userId: number } as input`,
    starterCode: `import { os } from '@orpc/server'
import { z } from 'zod'

// const base = os.errors({
//   NOT_FOUND: { data: z.object({ userId: z.number() }) },
//   FORBIDDEN: {},
// })

// const deleteUser = base
//   .input(z.object({ userId: z.number() }))
//   .handler(async ({ input, errors }) => {
//     // check if user exists, throw errors.NOT_FOUND(...) if not
//     // check permissions, throw errors.FORBIDDEN(...) if not
//   })

// export const router = { user: { delete: deleteUser } }`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('.errors(')) errors.push('Define error types with os.errors({ NOT_FOUND: ..., FORBIDDEN: ... })');
      if (!code.includes('NOT_FOUND')) errors.push('Define NOT_FOUND error with data: z.object({ userId: z.number() })');
      if (!code.includes('FORBIDDEN')) errors.push('Define FORBIDDEN error');
      if (!code.includes('errors.NOT_FOUND')) errors.push('Throw errors.NOT_FOUND({ data: { userId } }) when user not found');
      if (!code.includes('.input(')) errors.push('Define input with z.object({ userId: z.number() })');
      if (!code.includes('errors.FORBIDDEN')) errors.push('Throw errors.FORBIDDEN() when user lacks permission');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Type-safe errors: .errors() definitions, Zod-validated error data, typed throw calls.' };
    }
  },
  // ─── COMBINED CONTEXT ──────────────────────────────────────────────
  {
    id: 'orpc-combined-context',
    area: 'oRPC',
    title: 'Combined Initial + Execution Context',
    difficulty: '★★★',
    description: `Set up a procedure that uses both initial context and execution context:
- Initial context (os.$context): { env: { DB_URL: string } } — provided explicitly
- Execution context (middleware): opens a DB connection, injects { db: Client }
- The middleware must connect BEFORE next() and disconnect in finally
- The handler uses context.db to query something
- Both context types must flow through to the handler`,
    starterCode: `import { os } from '@orpc/server'
import { Client } from 'some-db'

// const base = os.$context<{ env: { DB_URL: string } }>()

// const dbProvider = base.middleware(async ({ context, next }) => {
//   ... create client, connect, inject, disconnect in finally
// })

// const listItems = base
//   .use(dbProvider)
//   .handler(async ({ context }) => {
//     // context.db and context.env are both available
//   })

// export const router = { items: { list: listItems } }`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('$context')) errors.push('Declare initial context with os.$context<{ env: { DB_URL: string } }>()');
      if (!code.includes('DB_URL')) errors.push('Initial context must include DB_URL in env');
      if (!code.includes('.middleware')) errors.push('Define dbProvider middleware with .middleware()');
      if (!code.includes('new Client(')) errors.push('Create a DB client from context.env.DB_URL');
      if (!code.includes('finally')) errors.push('Disconnect the client in a finally block for cleanup');
      if (!code.includes('.connect()')) errors.push('Call client.connect() before next()');
      if (!code.includes('.disconnect()')) errors.push('Call client.disconnect() in finally');
      if (!code.includes('next({') || !code.includes('context')) errors.push('Inject { db: client } into context via next({ context: { db: client } })');
      if (!code.includes('.use(dbProvider)')) errors.push('Apply middleware with .use(dbProvider)');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Combined context: initial env context + execution db context with proper cleanup.' };
    }
  },
  // ─── CLIENT SETUP ──────────────────────────────────────────────────
  {
    id: 'orpc-client-setup',
    area: 'oRPC',
    title: 'Type-Safe Client with createORPCClient',
    difficulty: '★★☆',
    description: `Create a fully type-safe oRPC client:
- Import RouterClient type from @orpc/server
- Import createORPCClient from @orpc/client
- Import RPCLink from @orpc/client/fetch
- Create the link with a base URL and auth header
- Export a typed client: RouterClient<typeof router>
- Show calling a procedure: client.user.findById({ id: 1 })

The client must preserve full type inference from the router.`,
    starterCode: `// import type { RouterClient } from '@orpc/server'
// import { createORPCClient } from '@orpc/client'
// import { RPCLink } from '@orpc/client/fetch'
// import type { router } from './router'  // assume defined elsewhere

// Create the link, then the typed client

// export const client: RouterClient<typeof router> = ...`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('RouterClient')) errors.push('Import RouterClient type from @orpc/server');
      if (!code.includes('createORPCClient')) errors.push('Import createORPCClient from @orpc/client');
      if (!code.includes('RPCLink')) errors.push('Import RPCLink from @orpc/client/fetch');
      if (!code.includes('new RPCLink')) errors.push('Create a new RPCLink instance with url and headers');
      if (!code.includes('RouterClient<typeof router>')) errors.push('Type the client as RouterClient<typeof router> for full type safety');
      if (!code.includes('url:')) errors.push('RPCLink must include a url option pointing to the server');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Typed client: RPCLink with URL, createORPCClient, RouterClient<typeof router>.' };
    }
  },
  // ─── NESTED LAZY ROUTER ────────────────────────────────────────────
  {
    id: 'orpc-lazy-router',
    area: 'oRPC',
    title: 'Nested Router with Lazy Loading',
    difficulty: '★★★',
    description: `Structure a router with nested sub-routers and lazy loading:
- Top-level router: { user, post, health }
- user sub-router: { profile, settings } (eager — small)
- post sub-router: { list, create, delete } (lazy — large module)
- Use os.lazy() for the post router to defer loading
- The lazy loader returns a Promise of the sub-router
- health is a simple procedure that returns { status: 'ok' }

Lazy loading improves cold start by deferring large module imports.`,
    starterCode: `import { os } from '@orpc/server'

// Eager sub-routers
// const userRouter = { profile: ..., settings: ... }

// Lazy sub-router for posts (large module with many deps)
// const postRouter = os.lazy(() => import('./post.router').then(m => m.postRouter))

// Health check procedure
// const health = os.handler(async () => ({ status: 'ok' }))

// export const router = { user: userRouter, post: postRouter, health }`,
    solutionCheck: function(code) {
      var errors = [];
      if (!code.includes('os.lazy')) errors.push('Use os.lazy() for the post router to defer loading');
      if (!code.includes('import(')) errors.push('os.lazy should use a dynamic import: () => import("./post.router")');
      if (!code.includes('.then(')) errors.push('Chain .then(m => m.postRouter) to extract the router from the module');
      if (!code.includes('userRouter')) errors.push('Define an eager userRouter sub-router');
      if (!code.includes('postRouter')) errors.push('Define a lazy postRouter using os.lazy()');
      if (!code.includes('health') && !code.includes('status')) errors.push('Define a health check procedure returning { status: "ok" }');
      if (!code.includes('export const router')) errors.push('Export the top-level router with all sub-routers');
      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Nested router with eager userRouter, lazy postRouter via os.lazy(), and health endpoint.' };
    }
  }
];

export default orpcChallenges;
