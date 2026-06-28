/**
 * Osmosis simulation engine — teaching-grade water potential model.
 */

const PSI_K = 0.4;
const EQUILIBRIUM_EPS = 0.02;
const MAX_VOLUME_OFFSET = 0.22;

export function calcPsiSolute(molarity) {
  return -PSI_K * molarity;
}

export function calcPsiPressure(pressureMpa) {
  return pressureMpa * 0.1;
}

export function calcPsiTotal(molarity, pressureMpa) {
  return calcPsiSolute(molarity) + calcPsiPressure(pressureMpa);
}

const PRESET_DEFAULTS = {
  chamber: { molarityA: 0.2, molarityB: 1.0 },
  dialysis: { molarityA: 1.0, molarityB: 0.15 },
  cell: { molarityA: 0.35, molarityB: 0.85 },
};

export class OsmosisEngine {
  constructor() {
    this.width = 400;
    this.height = 500;
    this.preset = "chamber";
    this.running = false;
    this.membraneIntact = true;
    this.temperature = 25;
    this.pressureMpa = 0.2;
    this.molarityA = 0.2;
    this.molarityB = 1.0;
    this.particles = [];
    this.volumeOffset = 0;
    this.capillaryLevel = 0;
    this.cellRadiusFactor = 1;
    this.simTime = 0;
    this.equilibriumTime = null;
    this.fluxRate = 0;
    this.netCrossings = 0;
    this.fluxWindow = 0;
  }

  setPreset(preset) {
    this.preset = preset;
    const d = PRESET_DEFAULTS[preset] || PRESET_DEFAULTS.chamber;
    this.molarityA = d.molarityA;
    this.molarityB = d.molarityB;
    this.reset();
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;
  }

  setParams(p) {
    if (p.temperature != null) this.temperature = p.temperature;
    if (p.pressureMpa != null) this.pressureMpa = p.pressureMpa;
    if (p.membraneIntact != null) this.membraneIntact = p.membraneIntact;
    if (p.molarityA != null) this.molarityA = p.molarityA;
    if (p.molarityB != null) this.molarityB = p.molarityB;
  }

  psiForSide(side) {
    const m = side === "a" ? this.molarityA : this.molarityB;
    return calcPsiTotal(m, this.pressureMpa);
  }

  getLayout() {
    const w = this.width;
    const h = this.height;
    const pad = 28;

    if (this.preset === "chamber") {
      const membraneY = h * 0.5 + this.volumeOffset * h * 0.35;
      return {
        type: "chamber",
        membraneY,
        top: { x: pad, y: pad, w: w - pad * 2, h: membraneY - pad - 4, id: "a" },
        bottom: { x: pad, y: membraneY + 4, w: w - pad * 2, h: h - pad - membraneY - 4, id: "b" },
      };
    }

    if (this.preset === "dialysis") {
      const beakerTop = pad + 72;
      const beakerH = h - beakerTop - pad;
      const beaker = { x: pad + 20, y: beakerTop, w: w - pad * 2 - 40, h: beakerH, id: "b" };
      const bagW = beaker.w * 0.42;
      const bagH = beaker.h * 0.62;
      const bag = {
        x: w / 2 - bagW / 2,
        y: beaker.y + beaker.h - bagH - 8,
        w: bagW,
        h: bagH,
        id: "a",
      };
      const capBottom = bag.y;
      const capTop = pad + 16;
      const capH = capBottom - capTop;
      const fillH = capH * this.capillaryLevel;
      return {
        type: "dialysis",
        beaker,
        bag,
        capillary: { x: w / 2 - 8, y: capTop, w: 16, h: capH, fillH },
        stem: { x: w / 2 - 4, y: capBottom - 4, w: 8, h: 12 },
      };
    }

    const cx = w / 2;
    const cy = h * 0.54;
    const baseR = Math.min(w, h) * 0.17;
    const r = baseR * this.cellRadiusFactor;
    return {
      type: "cell",
      bath: { x: pad, y: pad + 36, w: w - pad * 2, h: h - pad * 2 - 36, id: "b" },
      cell: { cx, cy, r, id: "a" },
    };
  }

  reset() {
    this.volumeOffset = 0;
    this.capillaryLevel = 0;
    this.cellRadiusFactor = 1;
    this.simTime = 0;
    this.equilibriumTime = null;
    this.fluxRate = 0;
    this.netCrossings = 0;
    this.fluxWindow = 0;
    this.particles = [];
    this.seedParticles();
  }

  tempFactor() {
    return 0.7 + (this.temperature / 100) * 0.6;
  }

  seedParticles() {
    const layout = this.getLayout();
    this.particles = [];

    if (layout.type === "chamber") {
      this._seedRegion(layout.top, "a", 55, 12);
      this._seedRegion(layout.bottom, "b", 55, 28);
    } else if (layout.type === "dialysis") {
      this._seedDialysis(layout);
    } else {
      this._seedCell(layout);
    }
  }

  _seedDialysis(layout) {
    const { beaker, bag } = layout;
    this._seedRegion(bag, "a", 40, 22);
    for (let i = 0; i < 55; i++) {
      let p = this._makeParticle(beaker, "b", "water");
      let tries = 0;
      while (this._inBag(p.x, p.y, bag) && tries < 40) {
        p = this._makeParticle(beaker, "b", "water");
        tries++;
      }
      this.particles.push(p);
    }
    const soluteN = Math.round(14 * (0.5 + this.molarityB));
    for (let i = 0; i < soluteN; i++) {
      let p = this._makeParticle(beaker, "b", "solute");
      let tries = 0;
      while (this._inBag(p.x, p.y, bag) && tries < 40) {
        p = this._makeParticle(beaker, "b", "solute");
        tries++;
      }
      this.particles.push(p);
    }
  }

  _inBag(x, y, bag) {
    return x > bag.x + 4 && x < bag.x + bag.w - 4 && y > bag.y + 4 && y < bag.y + bag.h - 4;
  }

  _seedRegion(rect, regionId, waterCount, soluteCount) {
    const molarity = regionId === "a" ? this.molarityA : this.molarityB;
    const soluteN = Math.round(soluteCount * (0.5 + molarity));
    for (let i = 0; i < waterCount; i++) {
      this.particles.push(this._makeParticle(rect, regionId, "water"));
    }
    for (let i = 0; i < soluteN; i++) {
      this.particles.push(this._makeParticle(rect, regionId, "solute"));
    }
  }

  _makeParticle(rect, regionId, type) {
    let x, y;
    if (rect.cx != null) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * rect.r * 0.82;
      x = rect.cx + Math.cos(angle) * dist;
      y = rect.cy + Math.sin(angle) * dist;
    } else {
      x = rect.x + 10 + Math.random() * (rect.w - 20);
      y = rect.y + 10 + Math.random() * (rect.h - 20);
    }
    const speed = type === "water" ? 1.2 : 0.55;
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      type,
      region: regionId,
      radius: type === "water" ? 3.5 : 6,
      leaking: false,
    };
  }

  _seedCell(layout) {
    const { cell, bath } = layout;
    for (let i = 0; i < 38; i++) {
      this.particles.push(this._makeParticle(cell, "a", "water"));
    }
    const soluteCell = Math.round(12 * (0.5 + this.molarityA));
    for (let i = 0; i < soluteCell; i++) {
      this.particles.push(this._makeParticle(cell, "a", "solute"));
    }
    for (let i = 0; i < 60; i++) {
      let p;
      let tries = 0;
      do {
        p = this._makeParticle(bath, "b", "water");
        tries++;
      } while (this._dist(p.x, p.y, cell.cx, cell.cy) < cell.r + 10 && tries < 50);
      this.particles.push(p);
    }
    const soluteBath = Math.round(14 * (0.5 + this.molarityB));
    for (let i = 0; i < soluteBath; i++) {
      let p;
      let tries = 0;
      do {
        p = this._makeParticle(bath, "b", "solute");
        tries++;
      } while (this._dist(p.x, p.y, cell.cx, cell.cy) < cell.r + 10 && tries < 50);
      this.particles.push(p);
    }
  }

  _dist(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  isEquilibrium() {
    return Math.abs(this.psiForSide("a") - this.psiForSide("b")) < EQUILIBRIUM_EPS;
  }

  step(dt) {
    if (!this.running) return;

    const layout = this.getLayout();
    const tf = this.tempFactor();
    this.simTime += dt;
    this.fluxWindow += dt;
    let crossings = 0;

    const psiA = this.psiForSide("a");
    const psiB = this.psiForSide("b");
    const membraneOk = this.membraneIntact;

    for (const p of this.particles) {
      const speedMul = p.type === "water" ? tf : tf * 0.5;
      p.x += p.vx * speedMul;
      p.y += p.vy * speedMul;

      if (Math.random() < 0.02) {
        p.vx += (Math.random() - 0.5) * 0.35;
        p.vy += (Math.random() - 0.5) * 0.35;
      }

      const maxV = p.type === "water" ? 2.5 : 1.2;
      const v = Math.hypot(p.vx, p.vy);
      if (v > maxV) {
        p.vx = (p.vx / v) * maxV;
        p.vy = (p.vy / v) * maxV;
      }

      if (layout.type === "chamber") {
        crossings += this._stepChamber(p, layout, psiA, psiB, membraneOk);
      } else if (layout.type === "dialysis") {
        crossings += this._stepDialysis(p, layout, psiA, psiB, membraneOk);
      } else {
        crossings += this._stepCell(p, layout, psiA, psiB, membraneOk);
      }
    }

    this.netCrossings += crossings;
    if (this.fluxWindow >= 0.5) {
      this.fluxRate = (this.netCrossings / this.fluxWindow) * 2.5;
      this.netCrossings = 0;
      this.fluxWindow = 0;
    }

    if (membraneOk && !this.isEquilibrium()) {
      const drive = (psiA - psiB) * 0.0008 * tf;
      if (layout.type === "chamber") {
        this.volumeOffset = Math.max(
          -MAX_VOLUME_OFFSET,
          Math.min(MAX_VOLUME_OFFSET, this.volumeOffset + drive)
        );
      } else if (layout.type === "dialysis") {
        const intoBag = psiB > psiA ? 1 : -1;
        this.capillaryLevel = Math.max(
          0,
          Math.min(1, this.capillaryLevel + intoBag * Math.abs(drive) * 12)
        );
      } else {
        const swell = psiB > psiA ? 1 : -1;
        this.cellRadiusFactor = Math.max(
          0.65,
          Math.min(1.35, this.cellRadiusFactor + swell * Math.abs(drive) * 8)
        );
      }
    }

    if (this.isEquilibrium() && this.equilibriumTime == null) {
      this.equilibriumTime = this.simTime;
      this.fluxRate *= 0.3;
    }

  }

  _tryWaterCross(p, fromRegion, toRegion, psiFrom, psiTo, membraneOk) {
    if (p.type !== "water" || !membraneOk) return 0;

    const gradient = psiTo - psiFrom;
    const towardLower = gradient < 0 ? toRegion : fromRegion;
    const targetIsLower = toRegion === towardLower;
    let prob = 0.035 * this.tempFactor();
    if (targetIsLower) {
      prob += Math.min(0.14, Math.abs(gradient) * 0.16);
    } else {
      prob *= 0.12;
    }

    if (Math.random() < prob) {
      p.region = toRegion;
      return targetIsLower ? 1 : -1;
    }
    return 0;
  }

  _trySoluteLeak(p, toRegion, membraneOk) {
    if (p.type !== "solute" || membraneOk) return false;
    if (Math.random() < 0.006) {
      p.leaking = true;
      p.region = toRegion;
      return true;
    }
    return false;
  }

  _pushInsideCircle(p, cx, cy, maxR) {
    const d = this._dist(p.x, p.y, cx, cy);
    if (d > maxR && d > 0.001) {
      const scale = maxR / d;
      p.x = cx + (p.x - cx) * scale;
      p.y = cy + (p.y - cy) * scale;
      const nx = (p.x - cx) / maxR;
      const ny = (p.y - cy) / maxR;
      const dot = p.vx * nx + p.vy * ny;
      if (dot > 0) {
        p.vx -= 2 * dot * nx;
        p.vy -= 2 * dot * ny;
      }
    }
  }

  _pushOutsideCircle(p, cx, cy, minR) {
    const d = this._dist(p.x, p.y, cx, cy);
    if (d < minR && d > 0.001) {
      const scale = minR / d;
      p.x = cx + (p.x - cx) * scale;
      p.y = cy + (p.y - cy) * scale;
      const nx = (p.x - cx) / minR;
      const ny = (p.y - cy) / minR;
      const dot = p.vx * nx + p.vy * ny;
      if (dot < 0) {
        p.vx -= 2 * dot * nx;
        p.vy -= 2 * dot * ny;
      }
    }
  }

  _stepChamber(p, layout, psiA, psiB, membraneOk) {
    const { top, bottom, membraneY } = layout;
    const inTop = p.region === "a";
    const rect = inTop ? top : bottom;

    if (p.type === "solute") {
      p.x = Math.max(rect.x + p.radius, Math.min(rect.x + rect.w - p.radius, p.x));
      if (inTop) {
        p.y = Math.max(rect.y + p.radius, Math.min(membraneY - 8, p.y));
      } else {
        p.y = Math.max(membraneY + 8, Math.min(rect.y + rect.h - p.radius, p.y));
      }
      if (!membraneOk) {
        if (inTop && p.y > membraneY - 10) this._trySoluteLeak(p, "b", false);
        if (!inTop && p.y < membraneY + 10) this._trySoluteLeak(p, "a", false);
      }
      return 0;
    }

    p.x = Math.max(rect.x + p.radius, Math.min(rect.x + rect.w - p.radius, p.x));
    if (inTop) {
      p.y = Math.max(rect.y + p.radius, Math.min(membraneY - 6, p.y));
      if (p.y >= membraneY - 10) {
        return this._tryWaterCross(p, "a", "b", psiA, psiB, membraneOk);
      }
    } else {
      p.y = Math.max(membraneY + 6, Math.min(rect.y + rect.h - p.radius, p.y));
      if (p.y <= membraneY + 10) {
        return this._tryWaterCross(p, "b", "a", psiB, psiA, membraneOk);
      }
    }
    return 0;
  }

  _stepDialysis(p, layout, psiA, psiB, membraneOk) {
    const { beaker, bag } = layout;
    const inBag = p.region === "a";

    if (p.type === "solute") {
      if (inBag) {
        p.x = Math.max(bag.x + p.radius, Math.min(bag.x + bag.w - p.radius, p.x));
        p.y = Math.max(bag.y + p.radius, Math.min(bag.y + bag.h - p.radius, p.y));
        if (!membraneOk) {
          const nearWall =
            p.x < bag.x + 12 || p.x > bag.x + bag.w - 12 || p.y > bag.y + bag.h - 14;
          if (nearWall) this._trySoluteLeak(p, "b", false);
        }
      } else {
        p.x = Math.max(beaker.x + p.radius, Math.min(beaker.x + beaker.w - p.radius, p.x));
        p.y = Math.max(beaker.y + p.radius, Math.min(beaker.y + beaker.h - p.radius, p.y));
        if (this._inBag(p.x, p.y, bag)) {
          this._pushOutOfBag(p, bag);
        }
      }
      return 0;
    }

    if (inBag) {
      p.x = Math.max(bag.x + p.radius, Math.min(bag.x + bag.w - p.radius, p.x));
      p.y = Math.max(bag.y + p.radius, Math.min(bag.y + bag.h - p.radius, p.y));
      const onMembrane =
        p.x < bag.x + 14 ||
        p.x > bag.x + bag.w - 14 ||
        p.y > bag.y + bag.h - 16;
      if (onMembrane) {
        return this._tryWaterCross(p, "a", "b", psiA, psiB, membraneOk);
      }
    } else {
      p.x = Math.max(beaker.x + p.radius, Math.min(beaker.x + beaker.w - p.radius, p.x));
      p.y = Math.max(beaker.y + p.radius, Math.min(beaker.y + beaker.h - p.radius, p.y));
      if (this._inBag(p.x, p.y, bag)) {
        const nearMembrane = p.y < bag.y + bag.h * 0.75;
        if (nearMembrane) {
          return this._tryWaterCross(p, "b", "a", psiB, psiA, membraneOk);
        }
        this._pushOutOfBag(p, bag);
      }
    }
    return 0;
  }

  _pushOutOfBag(p, bag) {
    const cx = bag.x + bag.w / 2;
    const cy = bag.y + bag.h / 2;
    const dx = p.x - cx;
    const dy = p.y - cy;
    if (Math.abs(dx) > Math.abs(dy)) {
      p.x = dx > 0 ? bag.x + bag.w + 6 : bag.x - 6;
    } else {
      p.y = dy > 0 ? bag.y + bag.h + 6 : bag.y - 6;
    }
  }

  _stepCell(p, layout, psiA, psiB, membraneOk) {
    const { cell, bath } = layout;
    const d = this._dist(p.x, p.y, cell.cx, cell.cy);
    const membraneBand = 10;

    if (p.type === "solute") {
      if (p.region === "a") {
        this._pushInsideCircle(p, cell.cx, cell.cy, cell.r - p.radius - 1);
        if (!membraneOk && d > cell.r - membraneBand) {
          this._trySoluteLeak(p, "b", false);
        }
      } else {
        p.x = Math.max(bath.x + p.radius, Math.min(bath.x + bath.w - p.radius, p.x));
        p.y = Math.max(bath.y + p.radius, Math.min(bath.y + bath.h - p.radius, p.y));
        if (d < cell.r + p.radius) {
          this._pushOutsideCircle(p, cell.cx, cell.cy, cell.r + p.radius + 2);
        }
      }
      return 0;
    }

    if (p.region === "a") {
      this._pushInsideCircle(p, cell.cx, cell.cy, cell.r - p.radius - 1);
      if (d >= cell.r - membraneBand) {
        const crossed = this._tryWaterCross(p, "a", "b", psiA, psiB, membraneOk);
        if (p.region === "b") {
          this._pushOutsideCircle(p, cell.cx, cell.cy, cell.r + p.radius + 3);
        }
        return crossed;
      }
    } else {
      p.x = Math.max(bath.x + p.radius, Math.min(bath.x + bath.w - p.radius, p.x));
      p.y = Math.max(bath.y + p.radius, Math.min(bath.y + bath.h - p.radius, p.y));
      if (d <= cell.r + membraneBand && d >= cell.r - membraneBand) {
        const crossed = this._tryWaterCross(p, "b", "a", psiB, psiA, membraneOk);
        if (p.region === "a") {
          this._pushInsideCircle(p, cell.cx, cell.cy, cell.r - p.radius - 2);
        }
        return crossed;
      }
      if (d < cell.r) {
        this._pushOutsideCircle(p, cell.cx, cell.cy, cell.r + p.radius + 2);
      }
    }
    return 0;
  }

  getStats() {
    const psiA = this.psiForSide("a");
    const psiB = this.psiForSide("b");
    const psiS = calcPsiSolute((this.molarityA + this.molarityB) / 2);
    const psiTotal = (psiA + psiB) / 2;
    let tonicity = "—";
    if (this.preset === "cell") {
      const diff = psiB - psiA;
      if (Math.abs(diff) < EQUILIBRIUM_EPS) tonicity = "Isotonic";
      else if (diff > 0) tonicity = "Hypotonic bath";
      else tonicity = "Hypertonic bath";
    }
    let netDirection = "";
    if (Math.abs(psiA - psiB) < EQUILIBRIUM_EPS) netDirection = "Equilibrium";
    else if (psiA > psiB) netDirection = "A → B";
    else netDirection = "B → A";

    if (this.preset === "dialysis") {
      if (Math.abs(psiA - psiB) < EQUILIBRIUM_EPS) netDirection = "Equilibrium";
      else if (psiB > psiA) netDirection = "Y → X (into tubing)";
      else netDirection = "X → Y (out of tubing)";
    }

    return {
      psiS,
      psiTotal,
      psiA,
      psiB,
      fluxRate: this.membraneIntact ? this.fluxRate : 0,
      equilibriumTime: this.equilibriumTime,
      simTime: this.simTime,
      tonicity,
      netDirection,
      isEquilibrium: this.isEquilibrium(),
      membraneIntact: this.membraneIntact,
    };
  }
}
