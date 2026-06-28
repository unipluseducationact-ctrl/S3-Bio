/**
 * Canvas renderer for osmosis simulator presets.
 */

const C = {
  waterFill: "#7ec8f5",
  waterStroke: "#004e9f",
  soluteFill: "#006d37",
  soluteStroke: "#004d2a",
  soluteLeak: "#c9242c",
  membrane: "#ffffff",
  membraneStroke: "#004e9f",
  beakerFill: "rgba(215, 227, 255, 0.55)",
  bagFill: "rgba(170, 199, 255, 0.65)",
  bathFill: "rgba(215, 227, 255, 0.5)",
  cellFill: "rgba(200, 230, 255, 0.75)",
  primary: "#004e9f",
  secondary: "#006d37",
  label: "#191c1e",
  muted: "#414753",
};

export class OsmosisRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = 1;
  }

  resize(width, height) {
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.width = width;
    this.height = height;
  }

  draw(engine) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    const layout = engine.getLayout();
    ctx.fillStyle = "#eef4fb";
    ctx.fillRect(0, 0, w, h);

    if (layout.type === "chamber") this._drawChamber(ctx, engine, layout);
    else if (layout.type === "dialysis") this._drawDialysis(ctx, engine, layout);
    else this._drawCell(ctx, engine, layout);

    for (const p of engine.particles) {
      this._drawParticle(ctx, p);
    }

    this._drawLegend(ctx);
    this._drawStatusOverlay(ctx, engine, layout);
  }

  _drawParticle(ctx, p) {
    if (p.type === "water") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = C.waterFill;
      ctx.strokeStyle = C.waterStroke;
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
    } else {
      const size = p.radius;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = p.leaking ? C.soluteLeak : C.soluteFill;
      ctx.strokeStyle = p.leaking ? "#93000a" : C.soluteStroke;
      ctx.lineWidth = 1.5;
      ctx.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
      ctx.strokeRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
      ctx.restore();
    }
  }

  _drawLegend(ctx) {
    const x = 12;
    const y = this.height - 52;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(0,78,159,0.2)";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, 200, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + 18, y + 16, 5, 0, Math.PI * 2);
    ctx.fillStyle = C.waterFill;
    ctx.strokeStyle = C.waterStroke;
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.label;
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillText("H₂O · water", x + 30, y + 20);

    ctx.save();
    ctx.translate(x + 18, y + 34);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = C.soluteFill;
    ctx.strokeStyle = C.soluteStroke;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeRect(-5, -5, 10, 10);
    ctx.restore();
    ctx.fillText("Solute · cannot cross", x + 30, y + 38);
  }

  _drawChamber(ctx, engine, layout) {
    const { top, bottom, membraneY } = layout;
    const pad = 20;
    const gx = pad;
    const gy = pad;
    const gw = this.width - pad * 2;
    const gh = this.height - pad * 2;

    ctx.fillStyle = C.beakerFill;
    ctx.strokeStyle = C.membraneStroke;
    ctx.lineWidth = 3;
    roundRect(ctx, gx, gy, gw, gh, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(96, 165, 250, 0.4)";
    ctx.fillRect(top.x, top.y, top.w, Math.max(4, membraneY - top.y));

    ctx.fillStyle = "rgba(37, 99, 235, 0.35)";
    ctx.fillRect(bottom.x, membraneY, bottom.w, bottom.y + bottom.h - membraneY);

    ctx.fillStyle = C.membrane;
    ctx.fillRect(top.x + 4, membraneY - 3, top.w - 8, 6);
    ctx.strokeStyle = C.membraneStroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(top.x + 4, membraneY - 3, top.w - 8, 6);

    this._label(ctx, `Compartment A (top) — ${engine.molarityA.toFixed(2)} M`, top.x + 8, top.y + 20);
    this._label(ctx, `Compartment B (bottom) — ${engine.molarityB.toFixed(2)} M`, bottom.x + 8, bottom.y + 20);
    this._labelMuted(ctx, "Differentially permeable membrane", gx + 8, membraneY - 14);
  }

  _drawDialysis(ctx, engine, layout) {
    const { beaker, bag, capillary, stem } = layout;
    const stats = engine.getStats();

    ctx.fillStyle = C.bathFill;
    ctx.strokeStyle = C.membraneStroke;
    ctx.lineWidth = 2.5;
    roundRect(ctx, beaker.x, beaker.y, beaker.w, beaker.h, 8);
    ctx.fill();
    ctx.stroke();

    this._label(ctx, `Outside beaker (Y) — dilute · ${engine.molarityB.toFixed(2)} M`, beaker.x + 10, beaker.y - 8);

    ctx.fillStyle = C.bagFill;
    ctx.strokeStyle = C.secondary;
    ctx.lineWidth = 2.5;
    roundRect(ctx, bag.x, bag.y, bag.w, bag.h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.secondary;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bag.x + 6, bag.y + 6, bag.w - 12, bag.h - 12);
    ctx.setLineDash([]);

    this._label(ctx, `Inside tubing (X) — concentrated · ${engine.molarityA.toFixed(2)} M`, bag.x, bag.y - 8);

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.strokeStyle = C.membraneStroke;
    ctx.lineWidth = 2;
    ctx.fillRect(capillary.x, capillary.y, capillary.w, capillary.h);
    ctx.strokeRect(capillary.x, capillary.y, capillary.w, capillary.h);

    if (capillary.fillH > 2) {
      const fillTop = capillary.y + capillary.h - capillary.fillH;
      ctx.fillStyle = C.bagFill;
      ctx.fillRect(capillary.x + 2, fillTop, capillary.w - 4, capillary.fillH);
    }

    ctx.fillStyle = C.membrane;
    ctx.fillRect(stem.x, stem.y, stem.w, stem.h);
    ctx.strokeRect(stem.x, stem.y, stem.w, stem.h);

    this._labelMuted(ctx, "Capillary tube (level rises when water enters X)", capillary.x + capillary.w + 8, capillary.y + 20);

    if (!stats.isEquilibrium && stats.membraneIntact) {
      this._drawFlowArrow(ctx, beaker.x + beaker.w * 0.75, beaker.y + beaker.h * 0.4, bag.x + bag.w / 2, bag.y + bag.h * 0.35, stats.netDirection.includes("Y → X"));
    }
  }

  _drawCell(ctx, engine, layout) {
    const { bath, cell } = layout;
    const stats = engine.getStats();

    ctx.fillStyle = C.bathFill;
    ctx.strokeStyle = C.membraneStroke;
    ctx.lineWidth = 2.5;
    roundRect(ctx, bath.x, bath.y, bath.w, bath.h, 10);
    ctx.fill();
    ctx.stroke();

    this._label(ctx, `Bath — ${engine.molarityB.toFixed(2)} M`, bath.x + 10, bath.y + 18);

    ctx.fillStyle = C.cellFill;
    ctx.beginPath();
    ctx.arc(cell.cx, cell.cy, cell.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.membraneStroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    this._label(ctx, `Cell — ${engine.molarityA.toFixed(2)} M`, cell.cx - 42, cell.cy - cell.r - 12);

    if (stats.tonicity !== "—") {
      this._label(ctx, stats.tonicity, cell.cx - 50, cell.cy + cell.r + 22);
    }
  }

  _drawFlowArrow(ctx, x1, y1, x2, y2, forward) {
    if (!forward) {
      [x1, x2] = [x2, x1];
      [y1, y2] = [y2, y1];
    }
    ctx.strokeStyle = C.primary;
    ctx.fillStyle = C.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle - 0.4), y2 - size * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - size * Math.cos(angle + 0.4), y2 - size * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.font = "600 10px Inter, sans-serif";
    ctx.fillText("Net H₂O", (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 6);
  }

  _drawStatusOverlay(ctx, engine, layout) {
    const stats = engine.getStats();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    roundRect(ctx, 8, 8, 200, layout.type === "cell" ? 58 : 44, 8);
    ctx.fill();

    ctx.fillStyle = C.primary;
    ctx.font = "500 11px SF Mono, Monaco, Consolas, monospace";
    ctx.fillText(`Net H₂O: ${stats.netDirection}`, 16, 26);
    if (layout.type === "cell" && stats.tonicity !== "—") {
      ctx.fillText(stats.tonicity, 16, 42);
    }
    if (!engine.membraneIntact) {
      ctx.fillStyle = C.soluteLeak;
      ctx.fillText("Membrane damaged", 16, layout.type === "cell" ? 56 : 40);
    }
    if (stats.isEquilibrium) {
      ctx.fillStyle = C.secondary;
      ctx.font = "600 11px Inter, sans-serif";
      ctx.fillText("Equilibrium", this.width - 100, 24);
    }
  }

  _label(ctx, text, x, y) {
    ctx.fillStyle = C.label;
    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillText(text, x, y);
  }

  _labelMuted(ctx, text, x, y) {
    ctx.fillStyle = C.muted;
    ctx.font = "500 10px Inter, sans-serif";
    ctx.fillText(text, x, y);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
