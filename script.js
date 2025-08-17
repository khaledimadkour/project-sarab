// Ball color: #00FF00
// String color: #1b642aff
// Ball color:
// String color:

document.addEventListener("DOMContentLoaded", () => {
  // === THEME TOGGLER ===
  const modeToggle = document.getElementById("mode-toggle");
  const body = document.body;
  const header = document.querySelector("header");
  const icon = modeToggle.querySelector("i");

  // Animation control flags
  let animateStrings = false;

  // Canvas references
  const stringsCanvas = document.getElementById("bg");
  const stringsCtx = stringsCanvas.getContext("2d");

  // ---- STRINGS & BALLS VARIABLES ----
  const NUM_STRINGS =14;
  const MIN_BALLS_PER_STRING = 1;
  const MAX_BALLS_PER_STRING = 3;
  const BASE_LINE_WIDTH = 1.2;

  let W = 0,
    H = 0,
    DPR = Math.max(1, window.devicePixelRatio || 1);
  let strings = [];
  let balls = [];
  let lastTimeStrings = performance.now();

  function resizeStrings() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = Math.max(300, Math.floor(innerWidth));
    H = Math.max(200, Math.floor(innerHeight));
    stringsCanvas.style.width = W + "px";
    stringsCanvas.style.height = H + "px";
    stringsCanvas.width = Math.floor(W * DPR);
    stringsCanvas.height = Math.floor(H * DPR);
    stringsCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStringsAndBalls();
  }

  // Ensure strings don't intersect by spacing their base Y positions evenly and using amplitude < half spacing
  function buildStringsAndBalls() {
    strings = [];
    balls = [];
    const padding = 40; // top & bottom padding
    const usableH = Math.max(80, H - padding * 2);
    const spacing = usableH / (NUM_STRINGS - 1 || 1);

    for (let i = 0; i < NUM_STRINGS; i++) {
      const baseY = padding + i * spacing;
      // amplitude small enough to avoid crossing neighbors
      const amplitude = Math.min(spacing * 0.36, 60);
      // choose a gentle frequency (waves across screen).
      const waves = 1.0 + (i % 3) * 0.4 + i * 0.02;
      const freq = (Math.PI * 2 * waves) / W; // rad per px
      const phase = Math.random() * Math.PI * 2;
      // gently vary stroke width slightly by index
      const lineWidth = BASE_LINE_WIDTH + (i % 4) / 8;

      // small per-line vertical offset (to avoid rigid parallel look)
      const yOffset = Math.sin(i * 0.7 + Math.random() * 2) * spacing * 0.06;

      const s = {
        baseY,
        amplitude,
        freq,
        phase,
        lineWidth,
        yOffset,
        drawProgress: 0,
        drawSpeed: 0.3 + Math.random() * 0.3, // Increased speed
      };
      strings.push(s);

      // assign 0..2 balls to this string
      const ballsCount =
        MIN_BALLS_PER_STRING +
        Math.floor(
          Math.random() * (MAX_BALLS_PER_STRING - MIN_BALLS_PER_STRING + 1)
        );
      for (let b = 0; b < ballsCount; b++) {
        const radius = 2 + Math.random() * 6; // 2..8 px
        const speed = 20 + Math.random() * 140; // px per second
        // choose a direction for the ball
        const direction = Math.random() < 0.5 ? 1 : -1; // 1 for right, -1 for left
        // choose starting x based on direction
        const x = direction === 1 ? -radius : W + radius;
        balls.push({ stringIndex: i, x, radius, speed, direction });
      }
    }
  }

  function stringY(s, x) {
    return s.baseY + s.yOffset + Math.sin(x * s.freq + s.phase) * s.amplitude;
  }

  // draw a smooth string across canvas
  function drawStringDark(s, string_color) {
    stringsCtx.beginPath();
    const pts = [];
    const step = Math.max(8, Math.floor(W / 120));
    for (let x = 0; x <= W; x += step) {
        pts.push([x, stringY(s, x)]);
    }
    if (pts[pts.length - 1][0] !== W) pts.push([W, stringY(s, W)]);

    const currentDrawLength = s.drawProgress * W;
    let drawnLength = 0;

    stringsCtx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
        const [x1, y1] = pts[i - 1];
        const [x2, y2] = pts[i];
        const segmentLength = Math.sqrt(
            Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
        );

        if (drawnLength + segmentLength > currentDrawLength) {
            const remainingLength = currentDrawLength - drawnLength;
            const t = remainingLength / segmentLength;
            const endX = x1 + (x2 - x1) * t;
            const endY = y1 + (y2 - y1) * t;
            stringsCtx.lineTo(endX, endY);
            break;
        }

        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        stringsCtx.quadraticCurveTo(x1, y1, cx, cy);
        drawnLength += segmentLength;
    }

    // <<< GLOW LINES ADDED HERE >>>
    stringsCtx.shadowBlur = 12;
    stringsCtx.shadowColor = string_color;

    stringsCtx.lineCap = "round";
    stringsCtx.lineJoin = "round";
    stringsCtx.strokeStyle = string_color;
    stringsCtx.lineWidth = s.lineWidth;
    stringsCtx.stroke();

    stringsCtx.shadowBlur = 0; // reset to prevent affecting other drawings
}

function drawStringLight(s, string_color) {
    stringsCtx.beginPath();
    const numSteps = 120;
    const stepSize = W / numSteps;
    const endStep = numSteps - Math.floor(s.drawProgress * numSteps);

    stringsCtx.moveTo(W, stringY(s, W));

    for (let i = numSteps; i >= endStep; i--) {
        const x = i * stepSize;
        const y = stringY(s, x);
        stringsCtx.lineTo(x, y);
    }

    // <<< GLOW LINES ADDED HERE >>>
    stringsCtx.shadowBlur = 12;
    stringsCtx.shadowColor = string_color;

    stringsCtx.lineCap = "round";
    stringsCtx.lineJoin = "round";
    stringsCtx.strokeStyle = string_color;
    stringsCtx.lineWidth = s.lineWidth;
    stringsCtx.stroke();

    stringsCtx.shadowBlur = 0; // reset to prevent affecting other drawings
}


let lastTime = performance.now();
let currentBallColor = "#00FF00";
let currentStringColor = "#1b642aff";
let light = false;
let animationFrameId;

function animateStringsFn(now) {
  const dt = Math.min(50, now - lastTime) / 1000;
  lastTime = now;

  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    s.drawProgress = Math.min(1, s.drawProgress + dt * s.drawSpeed);
  }

  stringsCtx.clearRect(0, 0, W, H);

  for (let i = 0; i < strings.length; i++) {
    if (light) {

      drawStringLight(strings[i], currentStringColor);
    } else {
      drawStringDark(strings[i], currentStringColor);

    }
  }

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    const s = strings[ball.stringIndex];
    if (s.drawProgress >= 1) {
      ball.x += ball.speed * ball.direction * dt;

      if (ball.direction === 1 && ball.x - ball.radius > W) {
        ball.x = -ball.radius;
      } else if (ball.direction === -1 && ball.x + ball.radius < 0) {
        ball.x = W + ball.radius;
      }

      const y = stringY(s, ball.x);
      stringsCtx.beginPath();
      stringsCtx.arc(ball.x, y, ball.radius, 0, Math.PI * 2);
      stringsCtx.fillStyle = currentBallColor;
      stringsCtx.fill();
      stringsCtx.save();
      stringsCtx.shadowBlur = Math.min(18, ball.radius * 3);
      stringsCtx.shadowColor = currentBallColor;
      stringsCtx.fill();
      stringsCtx.restore();
    }
  }

  animationFrameId = requestAnimationFrame(animateStringsFn);
}

function applyTheme() {
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  
  if (isDarkMode) {
    body.classList.add("dark-mode");
    header.classList.add("dark-mode");
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");

    currentBallColor = "#00FF00";
    currentStringColor = "#1b642aff";
    light = false;
  } else {
    body.classList.remove("dark-mode");
    header.classList.remove("dark-mode");
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
    
    currentBallColor = "#EB455F";
    currentStringColor = "#d4cc89ff";
    light = true;
  }

  resizeStrings();
}

  // ---- TOGGLE CLICK ----
  modeToggle.addEventListener("click", () => {
    const isDarkMode = !body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
    applyTheme();
  });

  // ---- INIT ----
  window.addEventListener("resize", () => {
    if (animateStrings) resizeStrings();
  });

  applyTheme();
animationFrameId = requestAnimationFrame(animateStringsFn);
  });

//!-----------------------------------------------------( Text Scambler Effect )---------------------------------------------------------------------------------------\\

class TextScrambler {
  constructor(el, slow) {
    this.slow = slow;
    this.el = el;
    this.chars = "!<>-_\\/[]{}—=+*^?#________@%&$0123456789";
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => (this.resolve = resolve));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      var start, end;
      if (this.slow) {
        start = Math.floor(Math.random() * 30); // slower start
        end = start + Math.floor(Math.random() * 40); // slower finish
      } else {
        start = Math.floor(Math.random() * 20); // slower start
        end = start + Math.floor(Math.random() * 30); // slower finish
      }
      this.queue.push({ from, to, start, end, char: "" });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = "";
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".scramble");
  elements.forEach((el, index) => {
    const fx = new TextScrambler(el, true);
    setTimeout(() => {
      fx.setText(el.getAttribute("data-text"));
    }, index * 500); // Delay each element’s animation slightly
  });

  const elements_fast = document.querySelectorAll(".scramble-fast");
  elements_fast.forEach((el_fast, index_fast) => {
    const fx_fast = new TextScrambler(el_fast, false);
    setTimeout(() => {
      fx_fast.setText(el_fast.getAttribute("data-text"));
    }, index_fast * 500); // Delay each element’s animation slightly
  });
});
