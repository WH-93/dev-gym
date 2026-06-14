/**
 * API Runner — executes Express-style handler functions in the browser
 * using mock req/res objects. Validates request/response patterns
 * without needing a server or Node.js runtime.
 */

import React, { useState, useEffect } from 'react';

// ─── Mock Express objects ──────────────────────────────────────────

function createMockReq(spec) {
  return {
    method: spec.method || 'GET',
    path: spec.path || '/',
    headers: spec.headers || {},
    query: spec.query || {},
    params: spec.params || {},
    body: spec.body || null,
    get: function(header) {
      return this.headers[header.toLowerCase()];
    },
  };
}

function createMockRes() {
  // Use a plain object with methods — no class needed
  var res = {
    _status: 200,
    _body: null,
    _headers: {},
    _finished: false,
  };

  res.status = function(code) {
    this._status = code;
    return this;
  };
  res.json = function(data) {
    this._body = data;
    this._finished = true;
    return this;
  };
  res.send = function(data) {
    this._body = data;
    this._finished = true;
    return this;
  };
  res.setHeader = function(key, value) {
    this._headers[key.toLowerCase()] = value;
    return this;
  };
  res.getHeader = function(key) {
    return this._headers[key.toLowerCase()];
  };

  return res;
}

// ─── Run handler safely ────────────────────────────────────────────

function runHandler(userCode, requestSpec) {
  try {
    // Create the handler function from user code
    // User code should export a function: function handler(req, res) { ... }
    // We strip module syntax and eval the function
    var cleaned = userCode
      .replace(/^(import|export)\s+.*$/gm, '')
      .replace(/module\.exports\s*=?\s*/g, '')
      .trim();

    // Try to find a named handler function
    var handlerMatch = cleaned.match(/function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*\}/);
    var handler;
    if (handlerMatch) {
      eval('handler = ' + handlerMatch[0]);
    } else {
      // Try to evaluate as a plain expression
      handler = eval('(' + cleaned + ')');
    }

    if (typeof handler !== 'function') {
      return { error: 'Could not find a handler function. Define: function handler(req, res) { ... }' };
    }

    var req = createMockReq(requestSpec);
    var res = createMockRes();
    handler(req, res);

    return {
      status: res._status,
      body: res._body,
      headers: res._headers,
      finished: res._finished,
    };
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// ─── Format JSON for display ───────────────────────────────────────

function formatJSON(obj) {
  if (obj === null || obj === undefined) return '—';
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

// ─── Export ────────────────────────────────────────────────────────

export function validateAPIResponse(code, requestSpec, expected) {
  var result = runHandler(code, requestSpec);
  if (result.error) {
    return { pass: false, message: 'Runtime error: ' + result.error, result: result };
  }

  var errors = [];

  if (expected.status && result.status !== expected.status) {
    errors.push('Status: expected ' + expected.status + ', got ' + result.status);
  }

  if (expected.body !== undefined && JSON.stringify(result.body) !== JSON.stringify(expected.body)) {
    errors.push('Body mismatch');
  }

  if (expected.contentType && result.headers['content-type'] !== expected.contentType) {
    errors.push('Content-Type: expected ' + expected.contentType + ', got ' + result.headers['content-type']);
  }

  return {
    pass: errors.length === 0,
    message: errors.length === 0
      ? '✓ Response matches expected: ' + result.status + ' ' + JSON.stringify(result.body).substring(0, 50)
      : errors.join('\n'),
    result: result,
  };
}

// ─── Component ─────────────────────────────────────────────────────

export default function APIRunner({ code, requestSpec, expectedResponse, onCheck }) {
  var [result, setResult] = useState(null);
  var [lastCheck, setLastCheck] = useState(null);

  useEffect(function() {
    setResult(null);
    setLastCheck(null);
  }, [code, requestSpec]);

  var handleRun = function() {
    var validation = validateAPIResponse(code, requestSpec, expectedResponse);
    setResult(validation.result);
    setLastCheck(validation);
    if (onCheck) onCheck(validation);
  };

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }
  },
    // Run button
    React.createElement('button', {
      onClick: handleRun,
      style: { padding: '8px 18px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 6,
        background: lastCheck && lastCheck.pass ? '#166534' : '#3b82f6', color: 'white', cursor: 'pointer',
        alignSelf: 'flex-start' }
    }, lastCheck ? (lastCheck.pass ? '✓ Pass' : '✗ Retry') : '▶ Run'),

    // Request display
    React.createElement('div', { style: { background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' } },
      React.createElement('div', { style: { padding: '6px 12px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #1e293b', fontWeight: 700 } },
        'Request'
      ),
      React.createElement('div', { style: { padding: 10, fontFamily: 'monospace', fontSize: 12, color: '#cbd5e1' } },
        React.createElement('div', null,
          React.createElement('span', { style: { color: '#818cf8', fontWeight: 600 } }, requestSpec.method || 'GET'),
          ' ',
          React.createElement('span', { style: { color: '#e2e8f0' } }, requestSpec.path || '/')
        ),
        requestSpec.body && React.createElement('pre', { style: { margin: '8px 0 0', color: '#94a3b8', fontSize: 11, whiteSpace: 'pre-wrap' } },
          formatJSON(requestSpec.body)
        )
      )
    ),

    // Response display
    result && React.createElement('div', { style: { background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden', flex: 1 } },
      React.createElement('div', { style: { padding: '6px 12px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #1e293b',
        display: 'flex', justifyContent: 'space-between' } },
        React.createElement('span', { style: { fontWeight: 700 } }, 'Response'),
        result.error
          ? React.createElement('span', { style: { color: '#ef4444' } }, 'ERROR')
          : React.createElement('span', { style: { color: '#4ade80' } },
              result.status + ' ' + (result.status >= 400 ? 'Error' : result.status >= 300 ? 'Redirect' : 'OK'))
      ),
      React.createElement('div', { style: { padding: 10, fontFamily: 'monospace', fontSize: 12 } },
        result.error
          ? React.createElement('pre', { style: { color: '#fca5a5', whiteSpace: 'pre-wrap', margin: 0 } }, result.error)
          : React.createElement('pre', { style: { color: '#94a3b8', whiteSpace: 'pre-wrap', margin: 0 } },
              formatJSON(result.body))
      )
    ),

    // Check result
    lastCheck && React.createElement('div', {
      style: { padding: '8px 12px', borderRadius: 6, fontSize: 13,
        background: lastCheck.pass ? '#052e16' : '#450a0a',
        color: lastCheck.pass ? '#4ade80' : '#f87171',
        border: '1px solid ' + (lastCheck.pass ? '#166534' : '#7f1d1d') }
    },
      lastCheck.message
    )
  );
}
