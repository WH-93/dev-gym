/**
 * Dev Gym — API Drills
 *
 * Express/REST pattern challenges with mock req/res validation.
 * Each challenge provides a handler function that receives (req, res)
 * and is validated against expected request/response behavior.
 */

var apiChallenges = [
  // ─── BASIC JSON RESPONSE ──────────────────────────────────────────
  {
    id: 'api-basic-json',
    area: 'API',
    title: 'Basic JSON Response',
    difficulty: '★☆☆',
    description: 'Write a handler that returns a 200 status with a JSON object { status: "ok", version: "1.0" }. Use res.status(200).json({...}).',
    starterCode: 'function handler(req, res) {\n  // Return { status: "ok", version: "1.0" } with status 200\n  \n}',
    requestSpec: { method: 'GET', path: '/api/health' },
    expectedResponse: { status: 200, body: { status: 'ok', version: '1.0' } },
    solutionCheck: function(code) {
      var result = require('./APIRunner').validateAPIResponse(code, this.requestSpec, this.expectedResponse);
      return result;
    }
  },
  // ─── ROUTE PARAMS ─────────────────────────────────────────────────
  {
    id: 'api-route-params',
    area: 'API',
    title: 'Route Parameters',
    difficulty: '★★☆',
    description: 'Write a handler for GET /api/users/:userId that reads req.params.userId and returns { id: userId, name: "User " + userId }.',
    starterCode: 'function handler(req, res) {\n  // Read userId from req.params.userId\n  // Return { id: userId, name: "User " + userId }\n  var userId = \n}',
    requestSpec: { method: 'GET', path: '/api/users/42', params: { userId: '42' } },
    expectedResponse: { status: 200, body: { id: '42', name: 'User 42' } },
    solutionCheck: function(code) {
      return validateAPIResponse(code, this.requestSpec, this.expectedResponse);
    }
  },
  // ─── REQUEST BODY PARSING ─────────────────────────────────────────
  {
    id: 'api-request-body',
    area: 'API',
    title: 'POST Body Parsing',
    difficulty: '★★☆',
    description: 'Write a handler for POST /api/users that reads req.body (name + email) and returns 201 with { id: 1, ...body }. Do not include the email in the response.',
    starterCode: 'function handler(req, res) {\n  // Read name and email from req.body\n  // Return 201 with { id: 1, name: ... } (omit email)\n  \n}',
    requestSpec: { method: 'POST', path: '/api/users', body: { name: 'Alice', email: 'alice@example.com' } },
    expectedResponse: { status: 201, body: { id: 1, name: 'Alice' } },
    solutionCheck: function(code) {
      return validateAPIResponse(code, this.requestSpec, this.expectedResponse);
    }
  },
  // ─── QUERY PARAMETERS ─────────────────────────────────────────────
  {
    id: 'api-query-params',
    area: 'API',
    title: 'Query String Filtering',
    difficulty: '★★☆',
    description: 'Write a handler for GET /api/search?q=term that reads req.query.q and returns { results: [], query: req.query.q }. Return 400 if query is missing.',
    starterCode: 'function handler(req, res) {\n  // Read req.query.q\n  // If missing, return 400: { error: "Missing query parameter: q" }\n  // Otherwise return 200: { results: [], query: ... }\n  \n}',
    requestSpec: { method: 'GET', path: '/api/search?q=react+hooks', query: { q: 'react hooks' } },
    expectedResponse: { status: 200, body: { results: [], query: 'react hooks' } },
    solutionCheck: function(code) {
      return validateAPIResponse(code, this.requestSpec, this.expectedResponse);
    }
  },
  // ─── ERROR HANDLING ───────────────────────────────────────────────
  {
    id: 'api-error-handling',
    area: 'API',
    title: 'Structured Error Responses',
    difficulty: '★★★',
    description: 'Write a handler that validates req.body.title is present (non-empty string). If missing, return 400 with { error: "VALIDATION_ERROR", message: "Title is required" }. If valid, return 201 with { id: 1, title }.',
    starterCode: 'function handler(req, res) {\n  // Check req.body.title is a non-empty string\n  // If missing: 400 with structured error\n  // If valid: 201 with { id: 1, title: ... }\n  \n}',
    requestSpec: { method: 'POST', path: '/api/posts', body: { title: '' } },
    expectedResponse: { status: 400, body: { error: 'VALIDATION_ERROR', message: 'Title is required' } },
    solutionCheck: function(code) {
      return validateAPIResponse(code, this.requestSpec, this.expectedResponse);
    }
  },
  // ─── AUTH MIDDLEWARE ──────────────────────────────────────────────
  {
    id: 'api-auth-middleware',
    area: 'API',
    title: 'Auth Header Check',
    difficulty: '★★★',
    description: 'Write a handler that checks req.headers.authorization. If it equals "Bearer secret-token", return 200 with { data: "protected" }. Otherwise return 401 with { error: "Unauthorized" }.',
    starterCode: 'function handler(req, res) {\n  // Check req.headers.authorization\n  // If "Bearer secret-token" → 200 { data: "protected" }\n  // Otherwise → 401 { error: "Unauthorized" }\n  \n}',
    requestSpec: { method: 'GET', path: '/api/protected', headers: { authorization: 'Bearer secret-token' } },
    expectedResponse: { status: 200, body: { data: 'protected' } },
    solutionCheck: function(code) {
      return validateAPIResponse(code, this.requestSpec, this.expectedResponse);
    }
  },
  // ─── ZOD VALIDATION (tshirt-shop-api #4) ─────────────────────────
  {
    id: 'api-zod-validation',
    area: 'API',
    title: 'Request Validation with Zod',
    difficulty: '★★★',
    description: 'Validate req.body against a schema: name (string, min 2 chars), price (positive number). If validation fails, return 400 with { error: "VALIDATION_ERROR", details: [...] }. If valid, return 201 with { id: 1, ...validatedData }.',
    starterCode: '// Simulated Zod: check constraints manually\nfunction handler(req, res) {\n  // Validate req.body.name is string with length >= 2\n  // Validate req.body.price is positive number\n  // If invalid → 400 with structured error\n  // If valid → 201 with created product\n  \n}',
    requestSpec: { method: 'POST', path: '/api/products', body: { name: 'T-Shirt', price: 29.99 } },
    expectedResponse: { status: 201, body: { id: 1, name: 'T-Shirt', price: 29.99 } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── JWT TOKEN PARSING (tshirt-shop-api #5) ──────────────────────
  {
    id: 'api-jwt-auth',
    area: 'API',
    title: 'JWT Token Parsing',
    difficulty: '★★★',
    description: 'Extract a JWT token from req.headers.authorization ("Bearer <token>"). Split on space, take the second part. Verify token is a non-empty string. If missing or invalid, return 401. If valid, store decoded user in req.user and return 200 with { user: { id, role } }.',
    starterCode: 'function handler(req, res) {\n  // Read Authorization header\n  // Split "Bearer <token>" — check Bearer prefix\n  // If no token → 401 { error: "Missing token" }\n  // If token is "valid.jwt.token" → return user from payload\n  // req.user = { id: 1, role: "admin" }\n  \n}',
    requestSpec: { method: 'GET', path: '/api/me', headers: { authorization: 'Bearer valid.jwt.token' } },
    expectedResponse: { status: 200, body: { user: { id: 1, role: 'admin' } } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── RATE LIMITING + HEADERS (tshirt-shop-api #9) ────────────────
  {
    id: 'api-rate-limit',
    area: 'API',
    title: 'Rate Limiting with Headers',
    difficulty: '★★★',
    description: 'Check a simulated rate-limit counter (passed as req.headers["x-request-count"]). If count > 100, return 429 with { error: "Rate limit exceeded" } and set Retry-After: 60 header. Otherwise return 200 with remaining count. Set X-RateLimit-Remaining header.',
    starterCode: 'function handler(req, res) {\n  // Read req.headers["x-request-count"]\n  // If count > 100 → 429 + Retry-After: 60 + error body\n  // Otherwise → 200 with { remaining: 100 - count }\n  // Always set X-RateLimit-Remaining header\n  \n}',
    requestSpec: { method: 'GET', path: '/api/data', headers: { 'x-request-count': '45' } },
    expectedResponse: { status: 200, body: { remaining: 55 } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── ROLE-BASED AUTHORIZATION (tshirt-shop-api #11) ──────────────
  {
    id: 'api-role-auth',
    area: 'API',
    title: 'Role-Based Authorization',
    difficulty: '★★★',
    description: 'Read req.body.role ("admin" | "user" | "viewer"). admin can DELETE (return 200 { deleted: true }). user can only PATCH (return 200 { updated: true }). viewer gets 403. Return 403 with { error: "Forbidden" } for unauthorized roles. Read action from req.body.action.',
    starterCode: 'function handler(req, res) {\n  // Read req.body.role and req.body.action\n  // admin + DELETE → 200 { deleted: true }\n  // user + PATCH → 200 { updated: true }\n  // viewer or wrong action → 403 { error: "Forbidden" }\n  \n}',
    requestSpec: { method: 'POST', path: '/api/admin/resource', body: { role: 'admin', action: 'DELETE' } },
    expectedResponse: { status: 200, body: { deleted: true } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── INPUT SANITIZATION (tshirt-shop-api #10) ───────────────────
  {
    id: 'api-input-sanitize',
    area: 'API',
    title: 'Input Sanitization',
    difficulty: '★★★',
    description: 'Sanitize req.body.comment by trimming whitespace and escaping HTML entities. Replace < with &lt;, > with &gt;, & with &amp;, " with &quot;. Return 200 with { sanitized: ... }. If comment is empty after trimming, return 400.',
    starterCode: 'function handler(req, res) {\n  // Read req.body.comment\n  // Trim whitespace\n  // Escape HTML: < → &lt;, > → &gt;, & → &amp;, " → &quot;\n  // If empty after trim → 400 { error: "Comment required" }\n  // Otherwise → 200 { sanitized: ... }\n  \n}',
    requestSpec: { method: 'POST', path: '/api/comments', body: { comment: '<script>alert("xss")</script>' } },
    expectedResponse: { status: 200, body: { sanitized: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── HEALTH CHECK (tshirt-shop-api #12) ──────────────────────────
  {
    id: 'api-health-check',
    area: 'API',
    title: 'Health Check Endpoint',
    difficulty: '★★☆',
    description: 'Return a health check: 200 with { status: "healthy", uptime: 3600, checks: { db: "ok", cache: "ok" } }. If query param "verbose" is set, include memory usage.',
    starterCode: 'function handler(req, res) {\n  // Always return 200 with status, uptime, checks\n  // If req.query.verbose → add memory: { rss: "128MB", heap: "64MB" }\n  // Otherwise keep response minimal\n  \n}',
    requestSpec: { method: 'GET', path: '/api/health', query: {} },
    expectedResponse: { status: 200, body: { status: 'healthy', uptime: 3600, checks: { db: 'ok', cache: 'ok' } } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── STRUCTURED LOGGING (tshirt-shop-api #13) ────────────────────
  {
    id: 'api-structured-logging',
    area: 'API',
    title: 'Structured Logging Middleware',
    difficulty: '★★★',
    description: 'Create a log entry: { timestamp, method, path, status: 200 }. Store on req.log. Return 200 with { logged: true, log: req.log }.',
    starterCode: 'function handler(req, res) {\n  // Create log: { timestamp: new Date().toISOString(), method: req.method, path: req.path, status: 200 }\n  // Set req.log\n  // Return 200 with { logged: true, log: req.log }\n  \n}',
    requestSpec: { method: 'GET', path: '/api/items' },
    expectedResponse: { status: 200, body: { logged: true } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── ETAG CACHING (tshirt-shop-api #19) ──────────────────────────
  {
    id: 'api-etag-caching',
    area: 'API',
    title: 'Response Caching with ETags',
    difficulty: '★★★',
    description: 'Generate an ETag from req.query.version. If If-None-Match matches, return 304 with ETag header and no body. Otherwise return 200 with data and ETag header.',
    starterCode: 'function handler(req, res) {\n  // Generate ETag from req.query.version || "v1"\n  // If If-None-Match matches → 304, no body, set ETag header\n  // Otherwise → 200 with { data: "fresh" }, set ETag header\n  \n}',
    requestSpec: { method: 'GET', path: '/api/cached?version=v1', query: { version: 'v1' }, headers: {} },
    expectedResponse: { status: 200, body: { data: 'fresh' } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── FULL-TEXT SEARCH (tshirt-shop-api #18) ──────────────────────
  {
    id: 'api-fulltext-search',
    area: 'API',
    title: 'Full-Text Search',
    difficulty: '★★★',
    description: 'Read req.query.q. Search items: ["Red T-Shirt", "Blue Jeans", "Black Hoodie", "White Sneakers"] for case-insensitive matches. Return { results, count }. Return 400 if q is missing.',
    starterCode: 'var items = ["Red T-Shirt", "Blue Jeans", "Black Hoodie", "White Sneakers"];\nfunction handler(req, res) {\n  // Read req.query.q\n  // If missing/empty → 400\n  // Filter items case-insensitive\n  // Return 200 with { results, count }\n  \n}',
    requestSpec: { method: 'GET', path: '/api/search?q=shirt', query: { q: 'shirt' } },
    expectedResponse: { status: 200, body: { results: ['Red T-Shirt'], count: 1 } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
  // ─── PAGINATION ──────────────────────────────────────────────────
  {
    id: 'api-pagination',
    area: 'API',
    title: 'Cursor Pagination',
    difficulty: '★★★',
    description: 'Cursor pagination: read cursor (default 0) and limit (default 10). Return sliced items ["A","B","C","D","E","F","G","H"] with nextCursor and total.',
    starterCode: 'var items = ["A", "B", "C", "D", "E", "F", "G", "H"];\nfunction handler(req, res) {\n  // Read cursor (default 0) and limit (default 10)\n  // Slice from cursor\n  // Return { items: sliced, nextCursor, total }\n  \n}',
    requestSpec: { method: 'GET', path: '/api/items?cursor=0&limit=3', query: { cursor: '0', limit: '3' } },
    expectedResponse: { status: 200, body: { items: ['A', 'B', 'C'], nextCursor: '3', total: 8 } },
    solutionCheck: function(code) { return validateAPIResponse(code, this.requestSpec, this.expectedResponse); }
  },
];

// Helper — imported in the challenges so solutionCheck can use it
function validateAPIResponse(code, requestSpec, expected) {
  // Borrow the validation from APIRunner module
  var cleaned = code
    .replace(/^(import|export)\s+.*$/gm, '')
    .replace(/module\.exports\s*=?\s*/g, '')
    .trim();

  var handlerMatch = cleaned.match(/function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*\}/);
  var handler;
  if (handlerMatch) {
    eval('handler = ' + handlerMatch[0]);
  } else {
    return { pass: false, message: 'Could not find a handler function. Define: function handler(req, res) { ... }' };
  }

  if (typeof handler !== 'function') {
    return { pass: false, message: 'Code must define a function named handler(req, res)' };
  }

  try {
    var res = {
      _status: 200, _body: null, _headers: {}, _finished: false,
      status: function(code) { this._status = code; return this; },
      json: function(data) { this._body = data; this._finished = true; return this; },
      send: function(data) { this._body = data; this._finished = true; return this; },
      setHeader: function(k, v) { this._headers[k.toLowerCase()] = v; return this; },
      getHeader: function(k) { return this._headers[k.toLowerCase()]; },
    };

    var req = {
      method: requestSpec.method || 'GET',
      path: requestSpec.path || '/',
      headers: requestSpec.headers || {},
      query: requestSpec.query || {},
      params: requestSpec.params || {},
      body: requestSpec.body || null,
      get: function(header) { return this.headers[header.toLowerCase()]; },
    };

    handler(req, res);

    var errors = [];
    if (expected.status && res._status !== expected.status) {
      errors.push('Status: expected ' + expected.status + ', got ' + res._status);
    }
    if (expected.body !== undefined && JSON.stringify(res._body) !== JSON.stringify(expected.body)) {
      errors.push('Body: expected ' + JSON.stringify(expected.body).substring(0, 60) + ', got ' + JSON.stringify(res._body).substring(0, 60));
    }

    return {
      pass: errors.length === 0,
      message: errors.length === 0 ? '✓ Response matches expected: ' + res._status + ' OK' : errors.join('\n'),
    };
  } catch (e) {
    return { pass: false, message: 'Runtime error: ' + (e.message || String(e)) };
  }
}

// Wire solutionCheck to use the inline validateAPIResponse
apiChallenges.forEach(function(c) {
  var orig = c.solutionCheck;
  c.solutionCheck = function(code) {
    return validateAPIResponse(code, c.requestSpec, c.expectedResponse);
  };
});

export default apiChallenges;
