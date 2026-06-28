/**
 * Endosymbiotic animation — 7 steps matching textbook diagram logic.
 *
 * 1. Proto-eukaryote
 * 2. Membrane infolding begins
 * 3. Nucleus + ER established (①)
 * 4. Aerobic bacterium engulfed → mitochondrion (②)
 * 5. Modern heterotrophic eukaryote (lower branch)
 * 6. Photosynthetic bacterium engulfed → chloroplast (③)
 * 7. Modern photosynthetic eukaryote (upper branch)
 */

const ASSET_BASE = "./assets/endosymbiotic";

export const STEPS = [
  { id: "proto", badge: null, en: "Proto-eukaryote — DNA is free in the cytoplasm, not inside a nucleus.", zh: "原真核生物——DNA 游離在細胞質中，尚未形成細胞核。", duration: 2800 },
  { id: "infolding", badge: null, en: "The plasma membrane folds inward, forming internal compartments.", zh: "質膜向內凹陷，開始形成內部區隔。", duration: 3200 },
  { id: "nucleus_er", badge: 1, en: "Infoldings develop into a nucleus and endoplasmic reticulum.", zh: "內陷的質膜演化為細胞核與內質網。", duration: 3600 },
  { id: "mito_engulf", badge: 2, en: "The ancestral eukaryote engulfs an aerobic bacterium; it becomes a mitochondrion.", zh: "祖先真核生物吞噬需氧菌，後者演化為粒線體。", duration: 5200 },
  { id: "heterotroph", badge: null, en: "One lineage becomes a modern heterotrophic eukaryote with mitochondria.", zh: "其中一條演化路線成為具粒線體的現代異養真核生物。", duration: 3000 },
  { id: "chloro_engulf", badge: 3, en: "Another lineage engulfs a photosynthetic bacterium; it becomes a chloroplast.", zh: "另一條路線吞噬光合菌，後者演化為葉綠體。", duration: 5200 },
  { id: "photo_final", badge: null, en: "This lineage becomes a modern photosynthetic eukaryote with mitochondria and chloroplasts.", zh: "最終演化為同時具粒線體與葉綠體的現代光合真核生物。", duration: 3000 },
];

/** Fixed slot positions (% of scene) — matches textbook left-to-right + branch layout */
const POS = {
  proto: { x: 11, y: 54, s: 16 },
  early: { x: 30, y: 54, s: 16 },
  mito: { x: 49, y: 54, s: 16 },
  hetero: { x: 76, y: 78, s: 17.5 },
  chloroEng: { x: 64, y: 27, s: 16 },
  photo: { x: 86, y: 27, s: 17.5 },
};

/**
 * Bacterium entry paths — coordinates as % of scene.
 * `inside` targets clear cytoplasm pockets (avoid nucleus / ER / existing organelles).
 */
const BAC_MITO = {
  start: { x: 66, y: 53 },
  membrane: { x: 53.8, y: 59.2 },
  inside: { x: 51.8, y: 57.0 },
  rot: -28,
};
const BAC_CHLORO = {
  start: { x: 79.5, y: 39.5 },
  membrane: { x: 70.2, y: 35.2 },
  inside: { x: 67.2, y: 33.4 },
  rot: 20,
};
/** Organelle resting slots — aligned with `inside` points, offset from cell centre */
const MITO_SLOT = { dx: 2.8, dy: 3.0, s: 0.17, rot: -22 };
const CHLORO_SLOT = { dx: 3.2, dy: 6.4, s: 0.17, rot: 14 };

function isEngulfStep(stepId) {
  return stepId === "mito_engulf" || stepId === "chloro_engulf";
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpPt(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function prog(stepIdx, localT) {
  return clamp(localT / STEPS[stepIdx].duration, 0, 1);
}

function actorStyle(x, y, size, opacity = 1, extra = "") {
  return `left:${x}%;top:${y}%;width:${size}%;opacity:${opacity};${extra}`;
}

export class EndosymbioticAnimation {
  constructor(root, hooks = {}) {
    this.root = root;
    this.hooks = hooks;
    this.stepIndex = 0;
    this.localT = 0;
    this.playing = true;
    this.lastTs = 0;
    this.raf = null;

    root.innerHTML = `
      <div class="endo-scene">
        <h2 class="endo-title">The ENDOSYMBIOTIC THEORY</h2>
        <svg class="endo-arrows" viewBox="0 0 1000 440" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <marker id="endo-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#333"/>
            </marker>
          </defs>
          <g class="endo-arrow-group" data-id="a1"></g>
          <g class="endo-arrow-group" data-id="a2"></g>
          <g class="endo-arrow-group" data-id="branch-down"></g>
          <g class="endo-arrow-group" data-id="branch-up"></g>
          <g class="endo-arrow-group" data-id="a-chloro"></g>
        </svg>
        <div class="endo-layer" data-id="proto-1"></div>
        <div class="endo-layer" data-id="cell-2"></div>
        <div class="endo-layer" data-id="nucleus-2"></div>
        <div class="endo-layer" data-id="cell-3"></div>
        <div class="endo-layer" data-id="nucleus-3"></div>
        <div class="endo-layer" data-id="mito-3"></div>
        <div class="endo-layer" data-id="bac-mito"></div>
        <div class="endo-layer" data-id="hetero-cell"></div>
        <div class="endo-layer" data-id="chloro-host"></div>
        <div class="endo-layer" data-id="bac-chloro"></div>
        <div class="endo-layer" data-id="chloro-org"></div>
        <div class="endo-layer" data-id="photo-cell"></div>
        <div class="endo-labels">
          <span class="endo-label" data-id="lbl-proto">Proto-eukaryote</span>
          <span class="endo-label" data-id="lbl-hetero">Modern heterotrophic eukaryote</span>
          <span class="endo-label" data-id="lbl-photo">Modern photosynthetic eukaryote</span>
        </div>
      </div>`;

    this._initLayers();
    this._initArrows();
    this._tick = this._tick.bind(this);
    this._applyFrame();
    this._emitStep();
    this.raf = requestAnimationFrame(this._tick);
  }

  _initLayers() {
    const map = {
      "proto-1": `${ASSET_BASE}/proto-eukaryote.png`,
      "cell-2": `${ASSET_BASE}/proto-eukaryote.png`,
      "nucleus-2": `${ASSET_BASE}/nucleus-er.png`,
      "cell-3": `${ASSET_BASE}/proto-eukaryote.png`,
      "nucleus-3": `${ASSET_BASE}/nucleus-er.png`,
      "mito-3": `${ASSET_BASE}/mitochondrion.png`,
      "bac-mito": `${ASSET_BASE}/aerobic-bacterium.png`,
      "hetero-cell": `${ASSET_BASE}/heterotrophic-cell.png`,
      "chloro-host": `${ASSET_BASE}/heterotrophic-cell.png`,
      "bac-chloro": `${ASSET_BASE}/photosynthetic-bacterium.png`,
      "chloro-org": `${ASSET_BASE}/chloroplast.png`,
      "photo-cell": `${ASSET_BASE}/photosynthetic-cell.png`,
    };
    this.layers = {};
    for (const [id, src] of Object.entries(map)) {
      const el = this.root.querySelector(`[data-id="${id}"]`);
      el.innerHTML = `<img src="${src}" alt="" draggable="false"/>`;
      this.layers[id] = el;
    }
    this.arrows = {};
    this.root.querySelectorAll(".endo-arrow-group").forEach((g) => {
      this.arrows[g.dataset.id] = g;
    });
    this.labels = {};
    this.root.querySelectorAll(".endo-label").forEach((el) => {
      this.labels[el.dataset.id] = el;
    });
  }

  _initArrows() {
    const mk = (g, d) => {
      g.innerHTML = `<path d="${d}" fill="none" stroke="#333" stroke-width="2.2" marker-end="url(#endo-arrowhead)"/>`;
    };
    mk(this.arrows.a1, "M 175 238 L 245 238");
    mk(this.arrows.a2, "M 355 238 L 425 238");
    mk(this.arrows["branch-down"], "M 525 238 L 565 238 L 565 335 L 680 335");
    mk(this.arrows["branch-up"], "M 525 238 L 565 238 L 565 115 L 680 115");
    mk(this.arrows["a-chloro"], "M 700 115 L 770 115");
  }

  _hideAll() {
    Object.values(this.layers).forEach((el) => {
      el.classList.remove("endo-layer--on");
      el.style.opacity = "0";
    });
    Object.values(this.arrows).forEach((g) => (g.style.opacity = "0"));
    Object.values(this.labels).forEach((el) => {
      el.classList.remove("endo-label--on");
      el.style.opacity = "0";
    });
  }

  _clearScene() {
    Object.values(this.layers).forEach((el) => {
      el.classList.remove("endo-layer--on");
      el.style.cssText = "opacity:0;";
    });
    Object.values(this.arrows).forEach((g) => (g.style.opacity = "0"));
    Object.values(this.labels).forEach((el) => {
      el.classList.remove("endo-label--on");
      el.style.opacity = "0";
    });
  }

  _setLayer(id, visible, x, y, size, opacity = 1, rot = 0) {
    const el = this.layers[id];
    if (!el) return;
    if (!visible) {
      el.style.cssText = "opacity:0;";
      el.classList.remove("endo-layer--on");
      return;
    }
    el.style.cssText = actorStyle(x, y, size, opacity, `transform:translate(-50%,-50%) rotate(${rot}deg);`);
    el.classList.toggle("endo-layer--on", true);
  }

  _setArrow(id, opacity) {
    const g = this.arrows[id];
    if (g) g.style.opacity = String(opacity);
  }

  _setLabel(id, x, y, opacity) {
    const el = this.labels[id];
    if (!el) return;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.opacity = String(opacity);
    el.classList.toggle("endo-label--on", opacity > 0.05);
  }

  _placeCell(slot, layerId) {
    this._setLayer(layerId, true, slot.x, slot.y, slot.s);
  }

  _placeNucleus(slot, layerId, opacity = 1) {
    this._setLayer(layerId, true, slot.x, slot.y, slot.s * 0.62, opacity);
  }

  _bacPath(path, t) {
    if (t <= 0.5) return lerpPt(path.start, path.membrane, easeInOut(t / 0.5));
    return lerpPt(path.membrane, path.inside, easeInOut((t - 0.5) / 0.5));
  }

  /** Animate bacterium sliding into cytoplasm, then organelle replaces it */
  _drawBacteriumEntry(bacId, path, cellSlot, p) {
    const enterT = easeInOut(clamp((p - 0.03) / 0.8, 0, 1));
    if (enterT <= 0.01) return;
    const pt = this._bacPath(path, enterT);
    const sz = cellSlot.s * lerp(0.32, 0.21, enterT);
    const bacOp = p < 0.88 ? 1 : 1 - (p - 0.88) / 0.1;
    this._setLayer(bacId, bacOp > 0.02, pt.x, pt.y, sz, bacOp, path.rot);
  }

  _drawOrganelle(orgId, cellSlot, orgSlot, p, startAt = 0.88) {
    if (p < startAt) return;
    const orgOp = easeOut(clamp((p - startAt) / 0.1, 0, 1));
    this._setLayer(
      orgId,
      true,
      cellSlot.x + orgSlot.dx,
      cellSlot.y + orgSlot.dy,
      cellSlot.s * orgSlot.s,
      orgOp,
      orgSlot.rot,
    );
  }

  _drawLeftChain(i, p) {
    // Step 1 — proto-eukaryote (always kept once shown)
    if (i >= 0) {
      this._placeCell(POS.proto, "proto-1");
      this._setLabel("lbl-proto", POS.proto.x, POS.proto.y + 12, 1);
    }

    // Steps 2–3 — second cell: infolding then nucleus + ER
    if (i >= 1) {
      this._placeCell(POS.early, "cell-2");
      this._setArrow("a1", i === 1 ? easeOut(clamp(p, 0, 0.45)) : 1);

      let nucOp = 0;
      if (i === 1) nucOp = easeOut(clamp(p / 0.85, 0, 0.55));
      else if (i >= 2) nucOp = 1;
      this._placeNucleus(POS.early, "nucleus-2", nucOp);
    }

    // Steps 4+ — third cell on main line (ancestor with nucleus + ER)
    if (i >= 3) {
      this._placeCell(POS.mito, "cell-3");
      this._placeNucleus(POS.mito, "nucleus-3");
      this._setArrow("a2", i === 3 ? easeOut(clamp(p, 0, 0.35)) : 1);

      const mitoStep = 3;
      const mitoDone = i > mitoStep || p >= 0.88;

      if (i === mitoStep && !mitoDone) {
        this._drawBacteriumEntry("bac-mito", BAC_MITO, POS.mito, p);
        this._drawOrganelle("mito-3", POS.mito, MITO_SLOT, p);
      } else if (mitoDone) {
        const m = POS.mito;
        this._setLayer(
          "mito-3",
          true,
          m.x + MITO_SLOT.dx,
          m.y + MITO_SLOT.dy,
          m.s * MITO_SLOT.s,
          1,
          MITO_SLOT.rot,
        );
      }
    }
  }

  _applyFrame() {
    const i = this.stepIndex;
    const p = prog(i, this.localT);

    this._hideAll();
    this._drawLeftChain(i, p);

    // Step 5 — lower branch: modern heterotrophic eukaryote
    if (i >= 4) {
      const op = i === 4 ? easeOut(p) : 1;
      this._setLayer("hetero-cell", true, POS.hetero.x, POS.hetero.y, POS.hetero.s, op);
      this._setLabel("lbl-hetero", POS.hetero.x, POS.hetero.y + 13, op);
      this._setArrow("branch-down", i === 4 ? easeOut(p) : 1);
    }

    // Step 6 — upper branch: eukaryote with mitochondria engulfs photosynthetic bacterium
    if (i >= 5) {
      this._placeCell(POS.chloroEng, "chloro-host");
      this._setArrow("branch-up", i === 5 ? easeOut(clamp(p, 0, 0.4)) : 1);

      const chloroStep = 5;
      const chloroDone = i > chloroStep || p >= 0.88;

      if (i === chloroStep && !chloroDone) {
        this._drawBacteriumEntry("bac-chloro", BAC_CHLORO, POS.chloroEng, p);
        this._drawOrganelle("chloro-org", POS.chloroEng, CHLORO_SLOT, p);
      } else if (chloroDone && i === chloroStep) {
        this._setLayer(
          "chloro-org",
          true,
          POS.chloroEng.x + CHLORO_SLOT.dx,
          POS.chloroEng.y + CHLORO_SLOT.dy,
          POS.chloroEng.s * CHLORO_SLOT.s,
          1,
          CHLORO_SLOT.rot,
        );
      }
    }

    // Step 7 — upper branch terminus: modern photosynthetic eukaryote
    if (i >= 6) {
      const op = i === 6 ? easeOut(p) : 1;
      this._setLayer("photo-cell", true, POS.photo.x, POS.photo.y, POS.photo.s, op);
      this._setLabel("lbl-photo", POS.photo.x, POS.photo.y + 13, op);
      this._setArrow("a-chloro", i === 6 ? easeOut(clamp(p, 0, 0.45)) : 1);
    }
  }

  _emitStep() {
    if (this.hooks.onStep) this.hooks.onStep(STEPS[this.stepIndex], this.stepIndex);
  }

  _tick(ts) {
    if (!this.lastTs) this.lastTs = ts;
    const dt = ts - this.lastTs;
    this.lastTs = ts;

    if (this.playing) {
      this.localT += dt;
      const step = STEPS[this.stepIndex];
      if (this.localT >= step.duration) {
        if (this.stepIndex < STEPS.length - 1) {
          this.stepIndex += 1;
          this.localT = 0;
          this._emitStep();
        } else {
          this.localT = step.duration;
          this.playing = false;
          if (this.hooks.onComplete) this.hooks.onComplete();
        }
      }
    }

    this._applyFrame();

    if (this.hooks.onProgress) {
      let elapsed = 0;
      for (let j = 0; j < this.stepIndex; j++) elapsed += STEPS[j].duration;
      elapsed += this.localT;
      const total = STEPS.reduce((s, st) => s + st.duration, 0);
      this.hooks.onProgress(elapsed / total, this.stepIndex);
    }

    this.raf = requestAnimationFrame(this._tick);
  }

  _navToStep(index) {
    this.stepIndex = clamp(index, 0, STEPS.length - 1);
    const id = STEPS[this.stepIndex].id;
    // Engulf steps always start at t=0 so bacterium entry animation can play
    this.localT = isEngulfStep(id) ? 0 : STEPS[this.stepIndex].duration;
    this._emitStep();
  }

  play() {
    const last = STEPS.length - 1;
    if (this.stepIndex === last && this.localT >= STEPS[last].duration) {
      this.restart();
      return;
    }
    // Replay engulf animation if step already finished
    if (isEngulfStep(STEPS[this.stepIndex].id) && this.localT >= STEPS[this.stepIndex].duration * 0.5) {
      this.localT = 0;
    }
    this.playing = true;
  }
  pause() {
    this.playing = false;
  }
  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }
  restart() {
    const scene = this.root.querySelector(".endo-scene");
    if (scene) scene.classList.add("endo-scene--reset");
    this.stepIndex = 0;
    this.localT = 0;
    this.lastTs = 0;
    this.playing = true;
    this._clearScene();
    this._applyFrame();
    this._emitStep();
    requestAnimationFrame(() => scene?.classList.remove("endo-scene--reset"));
  }
  next() {
    if (this.stepIndex < STEPS.length - 1) {
      this._navToStep(this.stepIndex + 1);
      if (isEngulfStep(STEPS[this.stepIndex].id)) this.playing = true;
    } else {
      this.localT = STEPS[this.stepIndex].duration;
    }
  }
  prev() {
    if (this.stepIndex > 0) {
      this._navToStep(this.stepIndex - 1);
    }
  }
  goToStep(index) {
    this._navToStep(index);
  }
  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.root.innerHTML = "";
  }
}
