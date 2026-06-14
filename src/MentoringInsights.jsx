import React, { useState, useEffect } from 'react';

/*
  MentoringInsights — loads mentoring-insights.json, displays cards.
  Each card: title, date, category badge, through-line, key insight, practice nudge.
  Expandable: first card open by default.
*/

export default function MentoringInsights() {
  var [data, setData] = useState(null);
  var [expanded, setExpanded] = useState({});
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  useEffect(function () {
    fetch('/mentoring-insights.json?' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) {
        setData(d);
        // Expand first card by default
        if (d.insights && d.insights.length > 0) {
          var ex = {};
          ex[0] = true;
          setExpanded(ex);
        }
        setLoading(false);
      })
      .catch(function (e) {
        setError('No insights loaded yet. Run extract-mentoring-insights.py to seed.');
        setLoading(false);
      });
  }, []);

  var toggleCard = function (idx) {
    setExpanded(function (prev) {
      var next = {};
      var keys = Object.keys(prev);
      for (var i = 0; i < keys.length; i++) { next[keys[i]] = prev[keys[i]]; }
      next[idx] = !prev[idx];
      return next;
    });
  };

  if (loading) {
    return React.createElement('div', { className: 'mentoring-loading' },
      'Loading insights...'
    );
  }

  if (error) {
    return React.createElement('div', { className: 'mentoring-error' },
      React.createElement('span', { className: 'mentoring-error-icon' }, '\u25C9'),
      React.createElement('p', null, error)
    );
  }

  if (!data || !data.insights || data.insights.length === 0) {
    return React.createElement('div', { className: 'mentoring-error' },
      React.createElement('span', { className: 'mentoring-error-icon' }, '\u25C9'),
      React.createElement('p', null, 'No insights yet. Start writing mentoring notes in Obsidian.')
    );
  }

  // Category badge color
  var catColors = {
    'mentoring': '#8b5cf6',
    'synthesis': '#06b6d4',
  };

  return React.createElement(
    'div',
    { className: 'mentoring-board' },

    // Header
    React.createElement(
      'div',
      { className: 'mentoring-header' },
      React.createElement('span', { className: 'mentoring-title' }, '\u25C9 Mentoring Insights'),
      React.createElement(
        'span',
        { className: 'mentoring-updated' },
        'Updated ' + (data.updated ? new Date(data.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—') +
        ' · ' + data.insights.length + ' notes'
      )
    ),

    // Cards
    data.insights.map(function (insight, idx) {
      var isOpen = expanded[idx];
      var catColor = catColors[insight.category] || '#64748b';

      return React.createElement(
        'div',
        {
          key: idx,
          className: 'mentoring-card' + (isOpen ? ' is-open' : ''),
        },

        // Card header (always visible)
        React.createElement(
          'button',
          {
            className: 'mentoring-card-header',
            onClick: function () { toggleCard(idx); },
          },
          React.createElement(
            'span',
            { className: 'mentoring-card-title-row' },
            React.createElement('span', { className: 'mentoring-chevron' }, isOpen ? '▾' : '▸'),
            React.createElement(
              'span',
              { className: 'mentoring-card-title' },
              insight.title
            )
          ),
          React.createElement(
            'span',
            { className: 'mentoring-card-meta' },
            React.createElement('span', {
              className: 'mentoring-cat-badge',
              style: { background: catColor },
            }, insight.category),
            insight.date && React.createElement('span', { className: 'mentoring-date' }, insight.date)
          )
        ),

        // Card body (expanded)
        isOpen &&
          React.createElement(
            'div',
            { className: 'mentoring-card-body' },

            insight.through_line &&
              React.createElement(
                'div',
                { className: 'mentoring-section' },
                React.createElement('div', { className: 'mentoring-section-label' }, 'Through-line'),
                React.createElement('div', { className: 'mentoring-section-text' }, insight.through_line)
              ),

            insight.key_insight &&
              React.createElement(
                'div',
                { className: 'mentoring-section' },
                React.createElement('div', { className: 'mentoring-section-label' }, 'Key Insight'),
                React.createElement('div', { className: 'mentoring-section-text' }, insight.key_insight)
              ),

            insight.heuristics && insight.heuristics.length > 0 &&
              React.createElement(
                'div',
                { className: 'mentoring-section' },
                React.createElement('div', { className: 'mentoring-section-label' }, 'Heuristics'),
                React.createElement(
                  'ul',
                  { className: 'mentoring-heuristics' },
                  insight.heuristics.map(function (h, hi) {
                    return React.createElement(
                      'li',
                      { key: hi },
                      React.createElement('strong', null, h.principle),
                      ' — ',
                      h.detail
                    );
                  })
                )
              ),

            insight.practice_nudge &&
              React.createElement(
                'div',
                { className: 'mentoring-section mentoring-practice' },
                React.createElement('div', { className: 'mentoring-section-label' }, 'Practice Nudge'),
                React.createElement('div', { className: 'mentoring-section-text' }, insight.practice_nudge)
              )
          )
      );
    })
  );
}
