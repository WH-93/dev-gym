import React from 'react';

/*
  PictorialHint — renders inline diagrams for the CPA framework's Pictorial layer.
  7 diagram types, pure HTML/CSS, zero dependencies.
  
  diagram spec:
    { type: 'lifecycle'|'dataflow'|'layers'|'flow'|'statemachine'|'beforeafter'|'treeprops',
      title: '...',
      ...type-specific fields }
*/

// ── Lifecycle Timeline ──────────────────────────
function LifecycleDiagram(_ref) {
  var stages = _ref.stages || [];
  var label = _ref.label;

  return React.createElement('div', { className: 'diagram-lifecycle' },
    label && React.createElement('div', { className: 'diagram-label' }, label),
    React.createElement('div', { className: 'diagram-lifecycle-track' },
      stages.map(function (s, i) {
        return React.createElement('div', { key: i, className: 'diagram-lifecycle-node' },
          React.createElement('div', { className: 'diagram-lifecycle-point' + (s.warn ? ' is-warn' : '') + (s.good ? ' is-good' : '') }),
          React.createElement('div', { className: 'diagram-lifecycle-name' }, s.name),
          s.detail && React.createElement('div', { className: 'diagram-lifecycle-detail' }, s.detail)
        );
      })
    )
  );
}

// ── Dataflow / Middleware Chain ─────────────────
function DataflowDiagram(_ref) {
  var layers = _ref.layers || [];
  var label = _ref.label;
  var flow = _ref.flow || '→';

  return React.createElement('div', { className: 'diagram-dataflow' },
    label && React.createElement('div', { className: 'diagram-label' }, label),
    React.createElement('div', { className: 'diagram-dataflow-chain' },
      layers.map(function (l, i) {
        return React.createElement(
          React.Fragment,
          { key: i },
          i > 0 && React.createElement('span', { className: 'diagram-dataflow-arrow' }, flow),
          React.createElement('div', {
            className: 'diagram-dataflow-layer' + (l.highlight ? ' is-highlight' : '') + (l.error ? ' is-error' : ''),
          },
            React.createElement('div', { className: 'diagram-dataflow-layer-name' }, l.name),
            l.detail && React.createElement('div', { className: 'diagram-dataflow-layer-detail' }, l.detail)
          )
        );
      })
    )
  );
}

// ── Layer Stack (Docker, architecture) ──────────
function LayersDiagram(_ref) {
  var layers = _ref.layers || [];
  var label = _ref.label;

  return React.createElement('div', { className: 'diagram-layers' },
    label && React.createElement('div', { className: 'diagram-label' }, label),
    React.createElement('div', { className: 'diagram-layers-stack' },
      layers.map(function (l, i) {
        return React.createElement('div', {
          key: i,
          className: 'diagram-layers-row' + (l.highlight ? ' is-highlight' : '') + (l.warn ? ' is-warn' : ''),
          style: l.indent ? { marginLeft: (l.indent * 12) + 'px' } : {},
        },
          React.createElement('div', { className: 'diagram-layers-row-name' }, l.name),
          l.detail && React.createElement('div', { className: 'diagram-layers-row-detail' }, l.detail)
        );
      })
    )
  );
}

// ── Flow / Sequence (Messaging, Kafka) ──────────
function FlowDiagram(_ref) {
  var nodes = _ref.nodes || [];
  var label = _ref.label;
  var direction = _ref.direction || 'down';

  return React.createElement('div', { className: 'diagram-flow' },
    label && React.createElement('div', { className: 'diagram-label' }, label),
    React.createElement('div', { className: 'diagram-flow-' + direction },
      nodes.map(function (n, i) {
        return React.createElement(
          React.Fragment,
          { key: i },
          i > 0 && React.createElement('div', { className: 'diagram-flow-connector' },
            n.edgeLabel && React.createElement('span', { className: 'diagram-flow-edge-label' }, n.edgeLabel)
          ),
          React.createElement('div', {
            className: 'diagram-flow-node' + (n.highlight ? ' is-highlight' : '') + (n.error ? ' is-error' : ''),
          },
            React.createElement('div', { className: 'diagram-flow-node-name' }, n.name),
            n.detail && React.createElement('div', { className: 'diagram-flow-node-detail' }, n.detail)
          )
        );
      })
    )
  );
}

// ── State Machine ───────────────────────────────
function StateMachineDiagram(_ref) {
  var states = _ref.states || [];
  var transitions = _ref.transitions || [];
  var label = _ref.label;

  return React.createElement('div', { className: 'diagram-statemachine' },
    label && React.createElement('div', { className: 'diagram-label' }, label),
    React.createElement('div', { className: 'diagram-statemachine-grid' },
      states.map(function (s, i) {
        return React.createElement('div', {
          key: i,
          className: 'diagram-statemachine-state' + (s.active ? ' is-active' : ''),
        },
          React.createElement('div', { className: 'diagram-statemachine-state-name' }, s.name),
          s.detail && React.createElement('div', { className: 'diagram-statemachine-state-detail' }, s.detail)
        );
      })
    ),
    transitions.length > 0 && React.createElement('div', { className: 'diagram-statemachine-transitions' },
      transitions.map(function (t, i) {
        return React.createElement('div', { key: i, className: 'diagram-statemachine-transition' },
          t.from, ' ', React.createElement('span', { className: 'diagram-statemachine-arrow' }, '→'), ' ', t.to,
          t.label && React.createElement('span', { className: 'diagram-statemachine-trans-label' }, ' (' + t.label + ')')
        );
      })
    )
  );
}

// ── Before/After Comparison ─────────────────────
function BeforeAfterDiagram(_ref) {
  var before = _ref.before;
  var after = _ref.after;
  var label = _ref.label;

  return React.createElement('div', { className: 'diagram-beforeafter' },
    label && React.createElement('div', { className: 'diagram-label' }, label),
    React.createElement('div', { className: 'diagram-beforeafter-pair' },
      React.createElement('div', { className: 'diagram-beforeafter-col is-before' },
        React.createElement('div', { className: 'diagram-beforeafter-col-label' }, before.label || 'Before'),
        React.createElement('pre', { className: 'diagram-beforeafter-code' }, before.code)
      ),
      React.createElement('div', { className: 'diagram-beforeafter-arrow-col' },
        React.createElement('span', { className: 'diagram-beforeafter-big-arrow' }, '→')
      ),
      React.createElement('div', { className: 'diagram-beforeafter-col is-after' },
        React.createElement('div', { className: 'diagram-beforeafter-col-label' }, after.label || 'After'),
        React.createElement('pre', { className: 'diagram-beforeafter-code' }, after.code)
      )
    ),
    before.issue && React.createElement('div', { className: 'diagram-beforeafter-issue' },
      '❌ ', before.issue
    ),
    after.fix && React.createElement('div', { className: 'diagram-beforeafter-fix' },
      '✓ ', after.fix
    )
  );
}

// ── Component Tree / Props Flow ──────────────────
function TreePropsDiagram(_ref) {
  var nodes = _ref.nodes || [];
  var label = _ref.label;

  return React.createElement('div', { className: 'diagram-treeprops' },
    label && React.createElement('div', { className: 'diagram-label' }, label),
    React.createElement('div', { className: 'diagram-treeprops-tree' },
      nodes.map(function (n, i) {
        return React.createElement('div', {
          key: i,
          className: 'diagram-treeprops-node',
          style: { marginLeft: (n.depth || 0) * 24 + 'px' },
        },
          i > 0 && React.createElement('div', { className: 'diagram-treeprops-branch' }),
          React.createElement('div', {
            className: 'diagram-treeprops-node-box' + (n.highlight ? ' is-highlight' : ''),
          },
            React.createElement('div', { className: 'diagram-treeprops-node-name' }, n.name),
            n.props && React.createElement('div', { className: 'diagram-treeprops-node-props' },
              Object.keys(n.props).map(function (k) {
                return React.createElement('span', { key: k, className: 'diagram-treeprops-prop' },
                  k, ': ', React.createElement('em', null, String(n.props[k]))
                );
              })
            ),
            n.note && React.createElement('div', { className: 'diagram-treeprops-node-note' }, n.note)
          )
        );
      })
    )
  );
}

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════

export default function PictorialHint(_ref) {
  var diagram = _ref.diagram;
  if (!diagram) return null;

  switch (diagram.type) {
    case 'lifecycle':    return React.createElement(LifecycleDiagram, diagram);
    case 'dataflow':     return React.createElement(DataflowDiagram, diagram);
    case 'layers':       return React.createElement(LayersDiagram, diagram);
    case 'flow':         return React.createElement(FlowDiagram, diagram);
    case 'statemachine': return React.createElement(StateMachineDiagram, diagram);
    case 'beforeafter':  return React.createElement(BeforeAfterDiagram, diagram);
    case 'treeprops':    return React.createElement(TreePropsDiagram, diagram);
    default:             return null;
  }
}
