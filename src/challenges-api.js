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
