/**
 * Wires lab.html UI to osmosis engine and renderer.
 */

import { OsmosisEngine } from "./osmosisEngine.js";
import { OsmosisRenderer } from "./osmosisRenderer.js";

const PRESET_LABELS = {
  chamber: { a: "Molarity A (top)", b: "Molarity B (bottom)" },
  dialysis: { a: "Inside tubing X", b: "Outside beaker Y" },
  cell: { a: "Cell solute", b: "Bath solute" },
};

export function initOsmosisLab() {
  const simCanvas = document.getElementById("sim-canvas");
  if (!simCanvas) return;

  const engine = new OsmosisEngine();
  const renderer = new OsmosisRenderer(simCanvas);

  const els = {
    presetBtns: document.querySelectorAll("[data-preset]"),
    molarityA: document.getElementById("molarity-a"),
    molarityB: document.getElementById("molarity-b"),
    molarityALabel: document.getElementById("molarity-a-label"),
    molarityBLabel: document.getElementById("molarity-b-label"),
    molarityALabelText: document.getElementById("molarity-a-label-text"),
    molarityBLabelText: document.getElementById("molarity-b-label-text"),
    temperature: document.getElementById("temperature"),
    temperatureLabel: document.getElementById("temperature-label"),
    pressure: document.getElementById("pressure"),
    pressureLabel: document.getElementById("pressure-label"),
    membraneIntact: document.getElementById("membrane-intact"),
    startBtn: document.getElementById("start-btn"),
    resetBtn: document.getElementById("reset-btn"),
    examTip: document.getElementById("exam-tip"),
    tapWaterBtn: document.getElementById("preset-tap-water"),
    saltWaterBtn: document.getElementById("preset-salt-water"),
    cellQuickPresets: document.getElementById("cell-quick-presets"),
    simContainer: document.getElementById("sim-container"),
  };

  let running = false;
  let lastTime = 0;

  function resize() {
    const rect = els.simContainer.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(400, Math.floor(rect.height));
    renderer.resize(w, h);
    engine.setSize(w, h);
  }

  function updateSliderLabels() {
    els.molarityALabel.textContent = `${parseFloat(els.molarityA.value).toFixed(2)} M`;
    els.molarityBLabel.textContent = `${parseFloat(els.molarityB.value).toFixed(2)} M`;
    els.temperatureLabel.textContent = `${els.temperature.value} °C`;
    els.pressureLabel.textContent = `${parseFloat(els.pressure.value).toFixed(1)} MPa`;
  }

  function updatePresetLabels(preset) {
    const labels = PRESET_LABELS[preset] || PRESET_LABELS.chamber;
    els.molarityALabelText.textContent = labels.a;
    els.molarityBLabelText.textContent = labels.b;
    els.cellQuickPresets?.classList.toggle("hidden", preset !== "cell");
  }

  function syncParamsFromUI() {
    engine.setParams({
      molarityA: parseFloat(els.molarityA.value),
      molarityB: parseFloat(els.molarityB.value),
      temperature: parseFloat(els.temperature.value),
      pressureMpa: parseFloat(els.pressure.value),
      membraneIntact: els.membraneIntact.checked,
    });
    updateSliderLabels();
    updateExamTip();
  }

  function updateExamTip() {
    if (!els.examTip) return;
    const s = engine.getStats();
    if (!s.membraneIntact) {
      els.examTip.textContent =
        "Damaged membrane: solute leaks and the membrane is no longer differentially permeable — osmosis effectively stops.";
    } else if (s.isEquilibrium) {
      els.examTip.textContent =
        "At equilibrium, ψ is equal on both sides. Individual water molecules still move both ways, but there is no net movement.";
    } else {
      els.examTip.textContent = `Net water moves from higher ψ to lower ψ (${s.netDirection}). Only H₂O crosses the membrane; solute stays on its side.`;
    }
  }

  function setPreset(preset) {
    engine.setPreset(preset);
    els.molarityA.value = engine.molarityA;
    els.molarityB.value = engine.molarityB;
    els.presetBtns.forEach((btn) => {
      const active = btn.dataset.preset === preset;
      btn.classList.toggle("bg-primary", active);
      btn.classList.toggle("text-on-primary", active);
      btn.classList.toggle("text-on-surface-variant", !active);
    });
    updatePresetLabels(preset);
    syncParamsFromUI();
    resize();
    updateStartButton();
  }

  function updateStartButton() {
    if (running) {
      els.startBtn.innerHTML = `<span class="material-symbols-outlined group-hover:rotate-12 transition-transform">pause</span> Pause Simulation`;
    } else {
      els.startBtn.innerHTML = `<span class="material-symbols-outlined group-hover:rotate-12 transition-transform">play_arrow</span> Start Simulation`;
    }
  }

  function loop(time) {
    requestAnimationFrame(loop);
    const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0.016;
    lastTime = time;
    if (running) {
      engine.step(dt);
      if (Math.floor(engine.simTime * 2) !== Math.floor((engine.simTime - dt) * 2)) {
        updateExamTip();
      }
    }
    renderer.draw(engine);
  }

  els.presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => setPreset(btn.dataset.preset));
  });

  [els.molarityA, els.molarityB, els.temperature, els.pressure].forEach((el) => {
    el.addEventListener("input", () => {
      syncParamsFromUI();
      if (!running) engine.seedParticles();
    });
  });

  els.membraneIntact.addEventListener("change", syncParamsFromUI);

  els.startBtn.addEventListener("click", () => {
    running = !running;
    engine.running = running;
    updateStartButton();
  });

  els.resetBtn.addEventListener("click", () => {
    running = false;
    engine.running = false;
    engine.reset();
    syncParamsFromUI();
    updateStartButton();
  });

  els.tapWaterBtn?.addEventListener("click", () => {
    els.molarityB.value = "0.05";
    els.molarityA.value = "0.35";
    syncParamsFromUI();
    engine.seedParticles();
  });

  els.saltWaterBtn?.addEventListener("click", () => {
    els.molarityB.value = "1.5";
    els.molarityA.value = "0.35";
    syncParamsFromUI();
    engine.seedParticles();
  });

  const ro = new ResizeObserver(() => resize());
  ro.observe(els.simContainer);
  window.addEventListener("resize", resize);

  setPreset("chamber");
  requestAnimationFrame(loop);

  initMagnetButtons();
  initBackgroundParticles();
}

function initMagnetButtons() {
  document.querySelectorAll(".magnet-target").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) / 4}px, ${(e.clientY - rect.top - rect.height / 2) / 4}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

function initBackgroundParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [];

  function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#004e9f";
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", init);
  init();
  draw();
}

document.addEventListener("DOMContentLoaded", initOsmosisLab);
