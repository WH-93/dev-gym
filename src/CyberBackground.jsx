import React, { useEffect, useRef } from 'react';

/*
  CyberBackground — Ghost in the Shell inspired p5.js canvas.
  Sparse green digital rain, faint geometric grid, scanning line.
  Subtle. Not distracting. Background only.

  Props:
    paramsRef — React ref to mutable { opacity, hueShift }
                opacity:   0-1 multiplier on overall visibility
                hueShift:  0-360 hue rotation from green (0 = green, 120 = blue, 240 = red)
*/

var CONFIG = {
  rainCount: 50,
  rainMinSpeed: 0.4,
  rainMaxSpeed: 1.4,
  rainCharSize: 12,
  gridSpacing: 80,
  gridAlpha: 0.015,
  scanSpeed: 0.25,
  scanAlpha: 0.015,
  scanHeight: 1,
  seed: 42,
};

var BASE_HUE = 120; // green in HSB(360)

// ── Hash PRNG ──────────────────────────────────
function makePRNG(seed) {
  var s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Digital rain drop ──────────────────────────
function createDrop(w, h, rng) {
  return {
    x: Math.floor(rng() * Math.floor(w / CONFIG.rainCharSize)) * CONFIG.rainCharSize,
    y: -(rng() * h),
    speed: CONFIG.rainMinSpeed + rng() * (CONFIG.rainMaxSpeed - CONFIG.rainMinSpeed),
    chars: [],
    charCount: 4 + Math.floor(rng() * 18),
    alpha: 0.08 + rng() * 0.14,
    brightIdx: -1,
  };
}

// ── p5 instance mode sketch ─────────────────────
function gitsSketch(p, paramsRef) {
  var w, h;
  var drops = [];
  var scanY = 0;
  var frameCount = 0;
  var rng;
  var gridGraphics;
  var scanGraphics;

  // Current effective hue shift (read from ref each frame)
  var getHueShift = function () {
    if (paramsRef && paramsRef.current) return paramsRef.current.hueShift;
    return 0;
  };

  // Convert green hue+shift to RGB with brightness
  var rainColor = function (brightness, alpha) {
    var hue = (BASE_HUE + getHueShift()) % 360;
    // Simple HSB->RGB for green-range hues
    var s = 1.0, b = brightness;
    var h = hue / 60;
    var i = Math.floor(h);
    var f = h - i;
    var p = b * (1 - s);
    var q = b * (1 - s * f);
    var t = b * (1 - s * (1 - f));
    var r, g, bl;
    switch (i % 6) {
      case 0: r = b; g = t; bl = p; break;
      case 1: r = q; g = b; bl = p; break;
      case 2: r = p; g = b; bl = t; break;
      case 3: r = p; g = q; bl = b; break;
      case 4: r = t; g = p; bl = b; break;
      case 5: r = b; g = p; bl = q; break;
      default: r = 0; g = 1; bl = 0;
    }
    var op = alpha;
    return { r: r * 255, g: g * 255, b: bl * 255, a: op };
  };

  p.setup = function () {
    w = p.windowWidth;
    h = p.windowHeight;
    p.createCanvas(w, h);
    p.colorMode(p.RGB, 255, 255, 255, 1);
    p.noStroke();

    rng = makePRNG(CONFIG.seed);

    buildGrid();
    buildScanBuffer();
    for (var i = 0; i < CONFIG.rainCount; i++) {
      drops.push(createDrop(w, h, rng));
    }
  };

  function buildGrid() {
    gridGraphics = p.createGraphics(w, h);
    gridGraphics.stroke(10, 42, 26);
    gridGraphics.strokeWeight(0.5);
    gridGraphics.noFill();

    for (var gx = CONFIG.gridSpacing; gx < w; gx += CONFIG.gridSpacing) {
      var dl = 6;
      for (var gy = 0; gy < h; gy += dl * 2) {
        gridGraphics.line(gx, gy, gx, gy + dl);
      }
    }
    for (var gy = CONFIG.gridSpacing; gy < h; gy += CONFIG.gridSpacing) {
      var dl = 4;
      for (var gx = 0; gx < w; gx += dl * 2) {
        gridGraphics.line(gx, gy, gx + dl, gy);
      }
    }
  }

  function buildScanBuffer() {
    scanGraphics = p.createGraphics(w, h);
    scanGraphics.noStroke();
  }

  p.draw = function () {
    p.background(0, 0.025);
    frameCount++;

    // Grid overlay
    p.push();
    p.tint(255, CONFIG.gridAlpha);
    p.image(gridGraphics, 0, 0);
    p.pop();

    // Digital rain
    p.textFont('monospace');
    p.textSize(CONFIG.rainCharSize);

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      var cs = CONFIG.rainCharSize;

      d.brightIdx += 0.12;
      if (d.brightIdx >= d.charCount) d.brightIdx = -1;

      for (var j = 0; j < d.charCount; j++) {
        var cy = d.y - j * cs;
        if (cy < -cs || cy > h + cs) continue;

        var ch = String.fromCharCode(0x30A0 + Math.floor(Math.abs(Math.sin(d.x * 0.1 + frameCount * 0.02 + j)) * 96));
        var col;

        if (j === Math.floor(d.brightIdx)) {
          // Leading bright character — full green with glow
          col = rainColor(1.0, d.alpha * 1.8);
          p.fill(col.r, col.g, col.b, col.a);
          // Subtle glow halo behind
          var glowCol = rainColor(1.0, d.alpha * 0.04);
          p.fill(glowCol.r, glowCol.g, glowCol.b, glowCol.a);
          p.text(ch, d.x - 1, cy - 1);
          p.fill(col.r, col.g, col.b, col.a);
          p.text(ch, d.x, cy);
        } else {
          var dist = d.brightIdx - j;
          if (dist > 0) {
            // Trail — fading
            col = rainColor(0.6, d.alpha * Math.max(0.04, 1 - dist / d.charCount));
          } else {
            // Ahead of bright — very dim
            col = rainColor(0.3, d.alpha * 0.05);
          }
          p.fill(col.r, col.g, col.b, col.a);
          p.text(ch, d.x, cy);
        }
      }

      d.y += d.speed;

      if (d.y > h + d.charCount * cs + 40) {
        d.y = -(d.charCount * cs);
        d.x = Math.floor(rng() * Math.floor(w / cs)) * cs;
        d.speed = CONFIG.rainMinSpeed + rng() * (CONFIG.rainMaxSpeed - CONFIG.rainMinSpeed);
        d.charCount = 4 + Math.floor(rng() * 18);
        d.alpha = 0.08 + rng() * 0.14;
        d.brightIdx = -1;
      }
    }

    // Scanning line — offscreen buffer, clear per frame = no trail
    scanY += CONFIG.scanSpeed;
    if (scanY > h) scanY = 0;
    scanGraphics.clear();

    var scanCol = rainColor(1.0, CONFIG.scanAlpha);
    scanGraphics.fill(scanCol.r, scanCol.g, scanCol.b, scanCol.a);
    scanGraphics.rect(0, scanY, w, CONFIG.scanHeight);

    var scanY2 = h - ((scanY + h * 0.37) % h);
    var scanCol2 = rainColor(0.8, CONFIG.scanAlpha * 0.5);
    scanGraphics.fill(scanCol2.r, scanCol2.g, scanCol2.b, scanCol2.a);
    scanGraphics.rect(0, scanY2, w, 1);

    p.image(scanGraphics, 0, 0);
  };

  p.windowResized = function () {
    w = p.windowWidth;
    h = p.windowHeight;
    p.resizeCanvas(w, h);
    buildGrid();
    buildScanBuffer();

    drops = [];
    for (var i = 0; i < CONFIG.rainCount; i++) {
      drops.push(createDrop(w, h, rng));
    }
  };
}

// ── React component ─────────────────────────────
export default function CyberBackground(_props) {
  var containerRef = useRef(null);
  var instanceRef = useRef(null);
  var paramsRef = _props.paramsRef;
  var opacity = _props.opacity != null ? _props.opacity : 1.0;

  useEffect(function () {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.3/p5.min.js';
    script.async = true;

    script.onload = function () {
      if (containerRef.current && typeof window.p5 !== 'undefined') {
        window.p5.disableFriendlyErrors = true;
        instanceRef.current = new window.p5(
          function (p) { gitsSketch(p, paramsRef); },
          containerRef.current
        );
      }
    };

    document.head.appendChild(script);

    return function () {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return React.createElement('div', {
    ref: containerRef,
    className: 'cyber-bg',
    style: { opacity: opacity, display: opacity < 0.005 ? 'none' : 'block' },
  });
}
