/**
 * Lightweight live chamber preview for Interactive Tools hub cards.
 */

import { OsmosisEngine } from "./osmosisEngine.js";
import { OsmosisRenderer } from "./osmosisRenderer.js";

export function initOsmosisCoverPreviews() {
  const roots = document.querySelectorAll(".osmosis-cover-preview");
  if (!roots.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  roots.forEach((root) => {
    const canvas = root.querySelector("canvas");
    if (!canvas) return;

    const engine = new OsmosisEngine();
    engine.setPreset("chamber");
    engine.setParams({ molarityA: 0.2, molarityB: 1.0, membraneIntact: true });
    engine.running = !reducedMotion;

    const renderer = new OsmosisRenderer(canvas);
    let lastTime = 0;

    function resize() {
      const rect = root.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      const h = Math.max(200, Math.floor(rect.height));
      renderer.resize(w, h);
      engine.setSize(w, h);
      engine.seedParticles();
    }

    function loop(time) {
      requestAnimationFrame(loop);
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0.016;
      lastTime = time;
      if (engine.running) engine.step(dt);
      renderer.draw(engine);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resize();
    requestAnimationFrame(loop);
  });
}
