/**
 * BioUni+ overlay draw / highlight tool — self-contained module.
 * Include draw-tool.css + draw-tool.js on any osmosis page.
 */
(function initBioDrawTool() {
  "use strict";

  if (window.__bioDrawToolInit) return;
  window.__bioDrawToolInit = true;

  const HIGHLIGHTER_WIDTH_PX = 14;
  const PEN_WIDTH_MIN = 1;
  const PEN_WIDTH_MAX = 14;
  const DEFAULT_PEN_WIDTH = 3;
  const DRAW_HIGHLIGHTER_ALPHA = 0.12;
  const HIGHLIGHTER_ALPHA_MIN = 0.05;
  const HIGHLIGHTER_ALPHA_MAX = 0.5;

  const COLOR_PALETTE = [
    "#ffffff", "#000000", "#ef4444", "#f97316", "#facc15",
    "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
    "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
    "#92400e", "#78716c", "#64748b", "#1e293b", "#fcd34d",
  ];

  const PEN_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg>';
  const HIGHLIGHTER_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 2.5c.83-.83 2.17-.83 3 0l1 1c.83.83.83 2.17 0 3L9.5 18.5 5 20l1.5-4.5L17.5 2.5zM6 19h2v2H6v-2z"/></svg>';
  const ERASER_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.14 3c-.51 0-1.02.2-1.41.59l-2.13 2.13 5.66 5.66 2.13-2.13c.78-.78.78-2.05 0-2.83l-3.54-3.54a1.994 1.994 0 0 0-1.41-.58zm-4.24 4.24L3 15.25V19h3.75L14.65 11l-3.75-3.76zM5 17v-.92l9.06-9.06.92.92L5.92 17H5z"/></svg>';
  const FAB_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg>';

  let drawCanvas;
  let drawCtx;
  let fab;
  let toolbar;
  let widthWrap;
  let widthLabel;
  let widthInput;
  let opacityWrap;
  let opacityLabel;
  let opacityInput;

  let drawActive = false;
  let drawing = false;
  let drawToolbarOpen = false;
  let drawColor = "#ef4444";
  let drawLineWidth = DEFAULT_PEN_WIDTH;
  let drawTool = "pen";
  let drawHighlighterAlpha = DRAW_HIGHLIGHTER_ALPHA;
  let drawDpr = Math.max(1, window.devicePixelRatio || 1);
  let lastPt = null;
  let activePointerId = null;

  function buildDom() {
    drawCanvas = document.createElement("canvas");
    drawCanvas.id = "drawCanvas";
    drawCanvas.setAttribute("aria-hidden", "true");

    fab = document.createElement("button");
    fab.type = "button";
    fab.className = "draw-tool-fab";
    fab.id = "drawToolFab";
    fab.setAttribute("aria-label", "Toggle draw mode");
    fab.setAttribute("aria-pressed", "false");
    fab.innerHTML = FAB_ICON;

    toolbar = document.createElement("div");
    toolbar.className = "draw-tool-toolbar";
    toolbar.id = "drawToolToolbar";
    toolbar.hidden = true;
    toolbar.setAttribute("role", "region");
    toolbar.setAttribute("aria-label", "Draw tools");

    const colorDots = COLOR_PALETTE.map((color) => {
      const active = color === drawColor ? " active" : "";
      return `<button type="button" class="color-dot${active}" data-color="${color}" style="background:${color}" aria-label="Color ${color}"></button>`;
    }).join("");

    toolbar.innerHTML = [
      '<div class="draw-tool-toolbar__header">',
      '  <h2 class="draw-tool-toolbar__title">Draw &amp; highlight</h2>',
      '  <button type="button" class="draw-tool-close" id="drawToolClose" aria-label="Close draw mode">&times;</button>',
      "</div>",
      '<div class="draw-tool-tools">',
      `  <button type="button" class="draw-tool-btn is-active" data-draw-tool="pen" aria-pressed="true">${PEN_ICON} Pen</button>`,
      `  <button type="button" class="draw-tool-btn" data-draw-tool="highlighter" aria-pressed="false">${HIGHLIGHTER_ICON} Highlight</button>`,
      `  <button type="button" class="draw-tool-btn" data-draw-tool="eraser" aria-pressed="false">${ERASER_ICON} Eraser</button>`,
      "</div>",
      `<div class="draw-tool-colors" role="group" aria-label="Colors">${colorDots}</div>`,
      '<div class="draw-tool-width" id="drawWidthWrap">',
      `  <label for="drawWidth" id="drawWidthLabel">Width: ${drawLineWidth}px</label>`,
      `  <input type="range" id="drawWidth" min="${PEN_WIDTH_MIN}" max="${PEN_WIDTH_MAX}" value="${drawLineWidth}" />`,
      "</div>",
      '<div class="draw-tool-opacity" id="drawOpacityWrap" hidden>',
      `  <label for="drawOpacity" id="drawOpacityLabel">Opacity / 透明度: ${Math.round(drawHighlighterAlpha * 100)}%</label>`,
      `  <input type="range" id="drawOpacity" min="${HIGHLIGHTER_ALPHA_MIN}" max="${HIGHLIGHTER_ALPHA_MAX}" step="0.01" value="${drawHighlighterAlpha}" />`,
      "</div>",
      '<div class="draw-tool-actions">',
      '  <button type="button" class="draw-tool-action draw-tool-action--danger" id="drawClearBtn">Clear</button>',
      "</div>",
    ].join("\n");

    document.body.appendChild(drawCanvas);
    document.body.appendChild(fab);
    document.body.appendChild(toolbar);

    drawCtx = drawCanvas.getContext("2d");
    widthWrap = toolbar.querySelector("#drawWidthWrap");
    widthLabel = toolbar.querySelector("#drawWidthLabel");
    widthInput = toolbar.querySelector("#drawWidth");
    opacityWrap = toolbar.querySelector("#drawOpacityWrap");
    opacityLabel = toolbar.querySelector("#drawOpacityLabel");
    opacityInput = toolbar.querySelector("#drawOpacity");
  }

  function updateOpacityLabel() {
    opacityLabel.textContent = `Opacity / 透明度: ${Math.round(drawHighlighterAlpha * 100)}%`;
  }

  function setDrawTool(t) {
    drawTool = t;
    toolbar.querySelectorAll("[data-draw-tool]").forEach((btn) => {
      const on = btn.dataset.drawTool === t;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    widthWrap.hidden = t === "highlighter";
    opacityWrap.hidden = t !== "highlighter";
    updateWidthLabel();
    updateOpacityLabel();
    drawCanvas.classList.toggle("draw-canvas--eraser", t === "eraser");
  }

  function updateWidthLabel() {
    if (drawTool === "eraser") {
      widthLabel.textContent = `Eraser: ${drawLineWidth}px`;
    } else {
      widthLabel.textContent = `Width: ${drawLineWidth}px`;
    }
  }

  function setHighlighterAlpha(alpha) {
    drawHighlighterAlpha = Math.min(
      HIGHLIGHTER_ALPHA_MAX,
      Math.max(HIGHLIGHTER_ALPHA_MIN, Number(alpha))
    );
    if (opacityInput) opacityInput.value = String(drawHighlighterAlpha);
    updateOpacityLabel();
  }

  function getCanvasPointFromClient(clientX, clientY) {
    const rect = drawCanvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (drawCanvas.width / rect.width);
    const y = (clientY - rect.top) * (drawCanvas.height / rect.height);
    return { x, y };
  }

  function syncDrawModeBodyClass() {
    document.body.classList.toggle("draw-mode-active", drawActive);
  }

  function resizeDrawCanvas({ preserve = true } = {}) {
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    drawDpr = Math.max(1, window.devicePixelRatio || 1);

    const prevW = drawCanvas.width;
    const prevH = drawCanvas.height;
    let snapshot = null;

    if (preserve && prevW > 0 && prevH > 0) {
      snapshot = document.createElement("canvas");
      snapshot.width = prevW;
      snapshot.height = prevH;
      snapshot.getContext("2d").drawImage(drawCanvas, 0, 0);
    }

    drawCanvas.style.width = `${cssW}px`;
    drawCanvas.style.height = `${cssH}px`;
    drawCanvas.width = Math.round(cssW * drawDpr);
    drawCanvas.height = Math.round(cssH * drawDpr);

    if (snapshot) {
      drawCtx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, drawCanvas.width, drawCanvas.height);
    }
  }

  function toggleDraw(force) {
    const next = typeof force === "boolean" ? force : !drawActive;
    drawActive = next;
    drawToolbarOpen = drawActive;
    toolbar.hidden = !drawToolbarOpen;
    drawCanvas.classList.toggle("is-active", drawActive);
    fab.classList.toggle("is-active", drawActive);
    fab.setAttribute("aria-pressed", String(drawActive));

    if (!drawActive) {
      drawing = false;
      lastPt = null;
      activePointerId = null;
    }

    syncDrawModeBodyClass();
  }

  function setDrawColor(c, el) {
    drawColor = c;
    toolbar.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("active"));
    if (el) el.classList.add("active");
  }

  function clearDraw() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawing = false;
    lastPt = null;
    activePointerId = null;
  }

  function applyDrawStyle() {
    drawCtx.lineCap = "round";
    drawCtx.lineJoin = "round";
    if (drawTool === "eraser") {
      drawCtx.globalCompositeOperation = "destination-out";
      drawCtx.strokeStyle = "rgba(0, 0, 0, 1)";
      drawCtx.globalAlpha = 1;
      drawCtx.lineWidth = drawLineWidth;
      return;
    }
    drawCtx.globalCompositeOperation = "source-over";
    drawCtx.strokeStyle = drawColor;
    drawCtx.globalAlpha = drawTool === "highlighter" ? drawHighlighterAlpha : 1;
    drawCtx.lineWidth = drawTool === "highlighter" ? HIGHLIGHTER_WIDTH_PX : drawLineWidth;
  }

  function drawTo(clientX, clientY, { start = false } = {}) {
    const pt = getCanvasPointFromClient(clientX, clientY);
    if (start || !lastPt) {
      drawCtx.beginPath();
      drawCtx.moveTo(pt.x, pt.y);
      drawCtx.lineTo(pt.x + 0.01, pt.y + 0.01);
      drawCtx.stroke();
    } else {
      drawCtx.lineTo(pt.x, pt.y);
      drawCtx.stroke();
    }
    lastPt = pt;
  }

  function onPointerDown(e) {
    if (!drawActive) return;
    e.preventDefault();
    drawing = true;
    activePointerId = e.pointerId;
    try {
      drawCanvas.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
    applyDrawStyle();
    drawTo(e.clientX, e.clientY, { start: true });
  }

  function onPointerMove(e) {
    if (!drawing || !drawActive || e.pointerId !== activePointerId) return;
    e.preventDefault();
    applyDrawStyle();
    drawTo(e.clientX, e.clientY);
  }

  function endStroke(e) {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    drawing = false;
    lastPt = null;
    activePointerId = null;
    try {
      drawCanvas.releasePointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  }

  function bindMouseTouchFallback() {
    let mouseDown = false;

    drawCanvas.addEventListener("mousedown", (e) => {
      if (!drawActive) return;
      e.preventDefault();
      mouseDown = true;
      applyDrawStyle();
      drawTo(e.clientX, e.clientY, { start: true });
    });

    drawCanvas.addEventListener("mousemove", (e) => {
      if (!mouseDown || !drawActive) return;
      e.preventDefault();
      applyDrawStyle();
      drawTo(e.clientX, e.clientY);
    });

    const stopMouse = () => {
      mouseDown = false;
      lastPt = null;
    };
    drawCanvas.addEventListener("mouseup", stopMouse);
    drawCanvas.addEventListener("mouseleave", stopMouse);

    drawCanvas.addEventListener(
      "touchstart",
      (e) => {
        if (!drawActive || !e.touches.length) return;
        e.preventDefault();
        const t = e.touches[0];
        applyDrawStyle();
        drawTo(t.clientX, t.clientY, { start: true });
      },
      { passive: false }
    );

    drawCanvas.addEventListener(
      "touchmove",
      (e) => {
        if (!drawActive || !e.touches.length) return;
        e.preventDefault();
        const t = e.touches[0];
        applyDrawStyle();
        drawTo(t.clientX, t.clientY);
      },
      { passive: false }
    );

    drawCanvas.addEventListener("touchend", () => {
      lastPt = null;
    });
  }

  function bindEvents() {
    fab.addEventListener("click", () => toggleDraw());
    toolbar.querySelector("#drawToolClose").addEventListener("click", () => toggleDraw(false));

    toolbar.querySelectorAll("[data-draw-tool]").forEach((btn) => {
      btn.addEventListener("click", () => setDrawTool(btn.dataset.drawTool));
    });

    toolbar.querySelectorAll(".color-dot").forEach((dot) => {
      dot.addEventListener("click", () => setDrawColor(dot.dataset.color, dot));
    });

    toolbar.querySelector("#drawClearBtn").addEventListener("click", clearDraw);

    widthInput.addEventListener("input", () => {
      drawLineWidth = Number(widthInput.value);
      updateWidthLabel();
    });

    opacityInput.addEventListener("input", () => {
      setHighlighterAlpha(Number(opacityInput.value));
    });

    document.addEventListener("selectstart", (e) => {
      if (drawActive) e.preventDefault();
    });

    if (window.PointerEvent) {
      drawCanvas.addEventListener("pointerdown", onPointerDown);
      drawCanvas.addEventListener("pointermove", onPointerMove);
      drawCanvas.addEventListener("pointerup", endStroke);
      drawCanvas.addEventListener("pointercancel", endStroke);
    } else {
      bindMouseTouchFallback();
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => resizeDrawCanvas({ preserve: true }), 100);
    });
  }

  function boot() {
    if (!document.body) return;
    buildDom();
    bindEvents();
    resizeDrawCanvas({ preserve: false });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.BioDrawTool = {
    toggle: toggleDraw,
    clear: clearDraw,
    setColor: setDrawColor,
    setTool: setDrawTool,
    setHighlighterAlpha,
  };
})();
