import { useState, useEffect, useRef, useCallback } from 'react';

const SANDBOX_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    height: 100%;
    background: #0f172a;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  #root { padding: 16px; min-height: 100%; }
  h1, h2, h3, h4 { color: #f1f5f9; margin-bottom: 0.5em; }
  h1 { font-size: 1.5em; } h2 { font-size: 1.25em; }
  p { margin-bottom: 0.75em; color: #cbd5e1; }
  ul, ol { padding-left: 1.5em; margin-bottom: 0.75em; }
  li { color: #cbd5e1; margin-bottom: 0.25em; }
  code { background: #1e293b; color: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-family: "Fira Code", "JetBrains Mono", "Cascadia Code", Menlo, monospace; font-size: 0.9em; }
  pre { background: #1e293b; color: #e2e8f0; padding: 10px 14px; border-radius: 6px; font-family: "Fira Code", "JetBrains Mono", "Cascadia Code", Menlo, monospace; font-size: 0.85em; overflow-x: auto; margin-bottom: 0.75em; }
  button { background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 5px; font-size: 0.9em; cursor: pointer; }
  button:hover { background: #2563eb; }
  input, textarea { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 4px; padding: 6px 10px; font-size: 0.9em; }
  input:focus, textarea:focus { outline: none; border-color: #3b82f6; }
</style>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</head>
<body><div id="root"></div>
<script>
window.addEventListener('error', function(e) {
  parent.postMessage({ type: 'SANDBOX_ERROR', message: e.message || String(e.error) }, '*');
  e.preventDefault();
});
window.addEventListener('message', function handler(event) {
  if (event.data.type === 'EXECUTE') {
    try {
      var R = window.React;
      var RD = window.ReactDOM;
      var factory = new Function('React', 'ReactDOM',
        'useState', 'useEffect', 'useRef', 'useMemo',
        'useReducer', 'useCallback', 'useContext', 'useLayoutEffect',
        event.data.code);
      var Component = factory(R, RD,
        R.useState, R.useEffect, R.useRef, R.useMemo,
        R.useReducer, R.useCallback, R.useContext, R.useLayoutEffect);
      if (Component) {
        var root = document.getElementById('root');
        RD.createRoot(root).render(R.createElement(Component));
        parent.postMessage({ type: 'SANDBOX_SUCCESS' }, '*');
      }
    } catch (err) {
      parent.postMessage({ type: 'SANDBOX_ERROR', message: err.message }, '*');
    }
  }
});
window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');
</script></body></html>`;

const COMPONENT_NAMES = ['Counter', 'UserProfile', 'TodoList', 'SignupForm', 'Search'];

export default function Sandbox({ code }) {
  const iframeRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const readyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Single message handler for all iframe messages
  useEffect(() => {
    const handler = (event) => {
      if (!event.data?.type) return;
      if (event.data.type === 'SANDBOX_READY') {
        readyRef.current = true;
      }
      if (!mountedRef.current) return;
      if (event.data.type === 'SANDBOX_ERROR') {
        setStatus('error');
        setError(event.data.message);
      } else if (event.data.type === 'SANDBOX_SUCCESS') {
        setStatus('success');
        setError(null);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Execute code when it changes — retry until sandbox is ready
  const execute = useCallback((retries = 20) => {
    const iframe = iframeRef.current;
    if (!iframe || !mountedRef.current) return;

    if (!readyRef.current) {
      if (retries > 0) {
        setTimeout(() => execute(retries - 1), 150);
      } else {
        setStatus('error');
        setError('Sandbox failed to initialize. Try reloading.');
      }
      return;
    }

    try {
      const Babel = window.Babel;
      if (!Babel) {
        setTimeout(() => execute(retries - 1), 150);
        return;
      }

      // Strip imports/exports for sandbox execution
      let processed = code
        .replace(/^import\s+.*?from\s+['"].*?['"]\s*;?\s*$/gm, '')
        .replace(/^import\s+['"].*?['"]\s*;?\s*$/gm, '')
        .replace(/^export\s+default\s+/gm, '')
        .replace(/^export\s+/gm, '');

      const result = Babel.transform(processed, {
        presets: ['react'],
        filename: 'C.jsx',
        compact: true,
      });

      const exportMatch = code.match(/export\s+default\s+function\s+(\w+)/);
      const compName = exportMatch ? exportMatch[1]
        : COMPONENT_NAMES.find(n => code.includes(`function ${n}`))
        || 'App';

      const wrapped = `${result.code}\nreturn ${compName};`;

      setStatus('running');
      iframe.contentWindow.postMessage({ type: 'EXECUTE', code: wrapped }, '*');
    } catch (err) {
      if (mountedRef.current) {
        setStatus('error');
        setError(err.message);
      }
    }
  }, [code]);

  useEffect(() => {
    if (!code) {
      setStatus('idle');
      setError(null);
      return;
    }
    setStatus('transpiling');
    setError(null);
    execute();
  }, [code, execute]);

  return (
    <div style={{
      border: '1px solid #1e293b',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#1a1a2e',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '6px 14px',
        fontSize: 12,
        color: '#64748b',
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>🔬 Preview</span>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 4,
          background:
            status === 'idle' ? 'transparent' :
            status === 'transpiling' ? '#f59e0b20' :
            status === 'running' ? '#3b82f620' :
            status === 'success' ? '#22c55e20' :
            '#ef444420',
          color:
            status === 'idle' ? '#64748b' :
            status === 'transpiling' ? '#f59e0b' :
            status === 'running' ? '#60a5fa' :
            status === 'success' ? '#4ade80' :
            '#f87171',
        }}>
          {status === 'idle' ? '⏳ waiting' :
           status === 'transpiling' ? '⟳ babel' :
           status === 'running' ? '▶ running' :
           status === 'success' ? '✓ rendered' :
           '✗ error'}
        </span>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <iframe
          ref={iframeRef}
          srcDoc={SANDBOX_HTML}
          title="sandbox"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#1a1a2e',
            display: 'block',
          }}
        />

        {error && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '10px 14px',
            background: '#7f1d1dee',
            color: '#fca5a5',
            fontSize: 12,
            fontFamily: 'monospace',
            maxHeight: '40%',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            borderTop: '1px solid #991b1b',
            lineHeight: 1.5,
          }}>
            <div style={{
              fontWeight: 700,
              marginBottom: 5,
              color: '#f87171',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              ⚠ Error
            </div>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
