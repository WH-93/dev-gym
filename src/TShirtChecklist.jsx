import React, { useState, useEffect } from 'react';

/*
  TShirtChecklist — reads tshirt-checklist.json, persists ticks to localStorage.
  Displays grouped by phase with progress bars.
*/

var LS_KEY = 'tshirt-checklist-done';

export default function TShirtChecklist() {
  var [phases, setPhases] = useState(null);
  var [completed, setCompleted] = useState(function () {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { return {}; }
  });
  var [expandedPhases, setExpandedPhases] = useState({});
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  // Load checklist data
  useEffect(function () {
    fetch('/tshirt-checklist.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var phaseKeys = Object.keys(data.phases);
        // Build initial expanded state (first unfinished phase expanded)
        var expanded = {};
        var setFirst = false;
        for (var i = 0; i < phaseKeys.length; i++) {
          var pk = phaseKeys[i];
          var phaseIssues = data.phases[pk].issues;
          var allDone = phaseIssues.every(function (iss) { return completed[iss.number]; });
          if (!allDone && !setFirst) {
            expanded[pk] = true;
            setFirst = true;
          }
        }
        setExpandedPhases(expanded);
        setPhases(data);
        setLoading(false);
      })
      .catch(function (e) {
        setError('Failed to load checklist: ' + e.message);
        setLoading(false);
      });
  }, []);

  // Persist
  useEffect(function () {
    localStorage.setItem(LS_KEY, JSON.stringify(completed));
  }, [completed]);

  var toggleIssue = function (num) {
    setCompleted(function (prev) {
      var next = {};
      var keys = Object.keys(prev);
      for (var i = 0; i < keys.length; i++) { next[keys[i]] = prev[keys[i]]; }
      next[num] = !prev[num];
      return next;
    });
  };

  var togglePhase = function (key) {
    setExpandedPhases(function (prev) {
      var next = {};
      var kk = Object.keys(prev);
      for (var i = 0; i < kk.length; i++) { next[kk[i]] = prev[kk[i]]; }
      next[key] = !prev[key];
      return next;
    });
  };

  // Compute stats
  var totalIssues = 0;
  var doneIssues = 0;
  if (phases) {
    var pk = Object.keys(phases.phases);
    for (var j = 0; j < pk.length; j++) {
      var issues = phases.phases[pk[j]].issues;
      for (var k = 0; k < issues.length; k++) {
        totalIssues++;
        if (completed[issues[k].number]) doneIssues++;
      }
    }
  }

  if (loading) {
    return React.createElement('div', { className: 'checklist-loading' }, 'Loading checklist...');
  }

  if (error) {
    return React.createElement('div', { className: 'checklist-error' }, error);
  }

  if (!phases) return null;

  return React.createElement(
    'div',
    { className: 'checklist-board' },

    // Header
    React.createElement(
      'div',
      { className: 'checklist-header' },
      React.createElement('span', { className: 'checklist-title' }, '\u229E tshirt-shop-api'),
      React.createElement(
        'span',
        { className: 'checklist-progress' },
        doneIssues + '/' + totalIssues + ' done'
      )
    ),

    // Phases
    Object.keys(phases.phases).map(function (phaseKey) {
      var phase = phases.phases[phaseKey];
      var phaseDone = phase.issues.filter(function (iss) { return completed[iss.number]; }).length;
      var phaseTotal = phase.issues.length;
      var pct = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;
      var allDone = phaseDone === phaseTotal;
      var isExpanded = expandedPhases[phaseKey];

      return React.createElement(
        'div',
        {
          key: phaseKey,
          className: 'checklist-phase' + (allDone ? ' is-done' : ''),
        },

        // Phase header
        React.createElement(
          'button',
          {
            className: 'checklist-phase-header',
            onClick: function () { togglePhase(phaseKey); },
            style: { borderLeftColor: phase.color },
          },
          React.createElement(
            'span',
            { className: 'checklist-phase-label' },
            React.createElement('span', { className: 'checklist-chevron' }, isExpanded ? '▾' : '▸'),
            ' ',
            phase.label
          ),
          React.createElement(
            'span',
            { className: 'checklist-phase-count' },
            phaseDone + '/' + phaseTotal
          )
        ),

        // Progress bar
        React.createElement(
          'div',
          { className: 'checklist-bar-track' },
          React.createElement('div', {
            className: 'checklist-bar-fill' + (allDone ? ' is-full' : ''),
            style: { width: pct + '%', background: phase.color },
          })
        ),

        // Issues (when expanded)
        isExpanded &&
          React.createElement(
            'div',
            { className: 'checklist-issues' },
            phase.issues.map(function (issue) {
              var isDone = completed[issue.number];
              return React.createElement(
                'label',
                {
                  key: issue.number,
                  className: 'checklist-issue' + (isDone ? ' is-checked' : ''),
                },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: isDone,
                  onChange: function () { toggleIssue(issue.number); },
                  className: 'checklist-checkbox',
                }),
                React.createElement('span', { className: 'checklist-issue-num' }, '#' + issue.number),
                React.createElement('span', { className: 'checklist-issue-title' }, issue.title)
              );
            })
          )
      );
    })
  );
}
