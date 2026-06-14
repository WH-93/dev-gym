import { useState, useRef, useEffect } from 'react';

// simple YAML / Dockerfile syntax highlighting tokenizer
function highlightLine(line) {
  const parts = [];
  let i = 0;

  // Comment
  const commentIdx = line.search(/#.*/);
  const beforeComment = commentIdx === -1 ? line : line.slice(0, commentIdx);
  const comment = commentIdx === -1 ? '' : line.slice(commentIdx);

  const tokens = [];

  // Keywords
  const kwMatch = beforeComment.match(/^((FROM|RUN|CMD|ENTRYPOINT|COPY|ADD|WORKDIR|ENV|EXPOSE|VOLUME|USER|LABEL|ARG|STOPSIGNAL|ONBUILD|HEALTHCHECK|SHELL|MAINTAINER)\b)/i);
  if (kwMatch) {
    tokens.push({ text: kwMatch[1], cls: 'keyword' });
    let rest = beforeComment.slice(kwMatch[1].length);
    tokens.push(...tokenizeRest(rest));
  } else {
    // YAML keys
    const yamlKey = beforeComment.match(/^(\s*[\w_-]+)(:)/);
    if (yamlKey) {
      tokens.push({ text: yamlKey[1], cls: 'key' });
      tokens.push({ text: yamlKey[2], cls: 'punctuation' });
      const rest = beforeComment.slice(yamlKey[0].length);
      tokens.push(...tokenizeRest(rest));
    } else {
      tokens.push(...tokenizeRest(beforeComment));
    }
  }

  if (comment) tokens.push({ text: comment, cls: 'comment' });

  return tokens;
}

function tokenizeRest(rest) {
  const t = [];
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+\b|\b(true|false|yes|no|on|off)\b|:\d+|image:|tag:|latest|alpine|slim|buster|bookworm|jammy)/gi;
  let last = 0;
  let m;
  while ((m = re.exec(rest)) !== null) {
    if (m.index > last) t.push({ text: rest.slice(last, m.index), cls: 'plain' });
    const val = m[0];
    if (/^["'`]/.test(val)) t.push({ text: val, cls: 'string' });
    else if (/^\d+$/.test(val)) t.push({ text: val, cls: 'number' });
    else if (/^(true|false|yes|no|on|off)$/i.test(val)) t.push({ text: val, cls: 'boolean' });
    else if (/^:/) { t.push({ text: val, cls: 'punctuation' }); }
    else t.push({ text: val, cls: 'string' });
    last = m.index + m[0].length;
  }
  if (last < rest.length) t.push({ text: rest.slice(last), cls: 'plain' });
  return t;
}

export default function Sandbox({ code, onChange, readOnly }) {
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  // Sync scroll between textarea and highlighted overlay
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  // Build highlighted lines
  const lines = code.split('\n');
  const highlighted = lines.map((line, i) => {
    const tokens = highlightLine(line);
    return (
      <div key={i} className="sandbox-line" data-line={i + 1}>
        {tokens.map((t, j) => (
          <span key={j} className={`hl-${t.cls}`}>{t.text}</span>
        ))}
      </div>
    );
  });

  return (
    <div className="sandbox-container">
      <div className="sandbox-gutter">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="gutter-line">{i + 1}</div>
        ))}
      </div>
      <div className="sandbox-editor-wrapper">
        <div ref={overlayRef} className="sandbox-overlay" aria-hidden="true">
          {highlighted}
        </div>
        <textarea
          ref={textareaRef}
          className="sandbox-textarea"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readOnly}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          wrap="off"
        />
      </div>
    </div>
  );
}
