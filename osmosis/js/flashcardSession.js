/** Flashcard study session — per-round ratings → next-round frequency (non-accumulating) */

export const RATE_AGAIN = 1.7;
export const RATE_GOT_IT = 0.7;
export const RATE_NEUTRAL = 1.0;
export const RATE_MASTERED = 0.1;
export const GOT_IT_MASTER_COUNT = 3;

export const FC_STRINGS = {
  en: {
    roundLabel: "Round",
    cardsInRound: "cards this round",
    flipFirst: "Flip the card first, then rate or use Next",
    againMore: "Again → ×1.7 next round",
    gotItLess: "Got it → ×0.7 next round",
    nextNeutral: "Next → ×1.0 (no Again / Got it)",
    summaryTitle: "Round complete — nice work!",
    summaryRound: "You finished round {n}.",
    summaryStats: "This round: {got} got it · {again} again · {skip} next only",
    summaryKeepTitle: "More practice next round (higher rate)",
    summaryKeepEmpty: "None — great focus this round!",
    summaryConfidentTitle: "Lighter next round (lower rate)",
    summaryConfidentEmpty: "Keep going — use Again on anything still fuzzy.",
    summaryTip: "Rates reset each round (they don’t stack). Review the list, then start the next round.",
    summaryMasteredTitle: "You’ve covered every card this session!",
    summaryMasteredBody: "All cards are at low priority. Start a fresh session to run through the deck again.",
    btnNextRound: "Next round →",
    btnRestart: "Restart deck",
    masteredBadge: "Round complete",
    modeSequence: "Card sequence",
    modeRandom: "Random practice",
    modeSequenceHint: "Cards always 1 → 35; repeats cycle through again (never twice in a row)",
    modeRandomHint: "Shuffled each round · Again / Got it / Next rates",
    prev: "Prev",
    next: "Next",
    copiesNext: "×{n} next round",
    modeToggleLabel: "Study mode",
  },
  zh: {
    roundLabel: "第",
    cardsInRound: "张本轮",
    flipFirst: "请先翻转卡片，再评分或使用「下一张」",
    againMore: "再来 → 下轮 ×1.7",
    gotItLess: "懂了 → 下轮 ×0.7",
    nextNeutral: "下一张 → ×1.0（不选再来/懂了）",
    summaryTitle: "本轮完成 — 做得好！",
    summaryRound: "你已完成第 {n} 轮。",
    summaryStats: "本轮：懂了 {got} · 再来 {again} · 仅下一张 {skip}",
    summaryKeepTitle: "下轮多练（较高频率）",
    summaryKeepEmpty: "没有 — 本轮很棒！",
    summaryConfidentTitle: "下轮较少（较低频率）",
    summaryConfidentEmpty: "继续加油 — 不确定的请点「再来」。",
    summaryTip: "评分每轮重新计算（不会累积）。浏览列表后开始下一轮。",
    summaryMasteredTitle: "本轮所有卡片都已熟悉！",
    summaryMasteredBody: "可重新开始完整复习一轮。",
    btnNextRound: "下一轮 →",
    btnRestart: "重新开始",
    masteredBadge: "本轮完成",
    modeSequence: "顺序模式",
    modeRandom: "随机模式",
    modeSequenceHint: "始终 1→35；重复会再轮一遍（不会连续两张相同）",
    modeRandomHint: "每轮随机 · 再来/懂了/下一张 频率",
    prev: "上一张",
    next: "下一张",
    copiesNext: "下轮 ×{n}",
    modeToggleLabel: "学习模式",
  },
  "zh-Hant": {
    roundLabel: "第",
    cardsInRound: "張本輪",
    flipFirst: "請先翻轉卡片，再評分或使用「下一張」",
    againMore: "再來 → 下輪 ×1.7",
    gotItLess: "懂了 → 下輪 ×0.7",
    nextNeutral: "下一張 → ×1.0（不選再來/懂了）",
    summaryTitle: "本輪完成 — 做得好！",
    summaryRound: "你已完成第 {n} 輪。",
    summaryStats: "本輪：懂了 {got} · 再來 {again} · 僅下一張 {skip}",
    summaryKeepTitle: "下輪多練（較高頻率）",
    summaryKeepEmpty: "沒有 — 本輪很棒！",
    summaryConfidentTitle: "下輪較少（較低頻率）",
    summaryConfidentEmpty: "繼續加油 — 不確定的請點「再來」。",
    summaryTip: "評分每輪重新計算（不會累積）。瀏覽列表後開始下一輪。",
    summaryMasteredTitle: "本輪所有卡片都已熟悉！",
    summaryMasteredBody: "可重新開始完整複習一輪。",
    btnNextRound: "下一輪 →",
    btnRestart: "重新開始",
    masteredBadge: "本輪完成",
    modeSequence: "順序模式",
    modeRandom: "隨機模式",
    modeSequenceHint: "始終 1→35；重複會再輪一遍（不會連續兩張相同）",
    modeRandomHint: "每輪隨機 · 再來/懂了/下一張 頻率",
    prev: "上一張",
    next: "下一張",
    copiesNext: "下輪 ×{n}",
    modeToggleLabel: "學習模式",
  },
};

export function t(lang, key) {
  const pack = FC_STRINGS[lang] || FC_STRINGS.en;
  return pack[key] ?? FC_STRINGS.en[key] ?? key;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createCardStates(deck) {
  const map = new Map();
  deck.forEach((card) => {
    map.set(card.id, {
      id: card.id,
      /** Frequency for the *next* round (replaced each rating — never accumulates) */
      nextRate: RATE_NEUTRAL,
      totalGotIt: 0,
      roundAgain: 0,
      roundGotIt: 0,
      roundNeutral: 0,
    });
  });
  return map;
}

/** Expected copies from fractional rate (1.7 → usually 2, 0.7 → often 1, sometimes 0) */
export function rateToCopyCount(rate) {
  if (rate <= 0) return 0;
  const whole = Math.floor(rate);
  const frac = rate - whole;
  let copies = whole;
  if (frac > 0 && Math.random() < frac) copies += 1;
  return copies;
}

/** Deterministic preview for summary UI */
export function rateToExpectedCopies(rate) {
  if (rate <= 0) return 0;
  return Math.max(0, Math.round(rate));
}

/** How many times each card appears this round (rolled once per round). */
export function computeRoundCopyPlan(cardStates, deck, roundNum) {
  const sortedIds = [...new Set(deck.map((c) => c.id))].sort((a, b) => a - b);
  const plan = new Map();
  if (roundNum <= 1) {
    sortedIds.forEach((id) => plan.set(id, 1));
    return plan;
  }
  sortedIds.forEach((id) => {
    const st = cardStates.get(id);
    plan.set(id, st ? rateToCopyCount(st.nextRate) : 0);
  });
  return plan;
}

/**
 * Sequence: 1→N cycles for repeats, never the same card twice in a row.
 * Random: same multiset, shuffled.
 */
function buildSequenceInterleavedQueue(remaining, sortedIds) {
  let totalRemaining = [...remaining.values()].reduce((a, b) => a + b, 0);
  if (!totalRemaining) return [];

  const queue = [];
  const maxPasses = totalRemaining * Math.max(sortedIds.length, 1) + sortedIds.length;

  for (let pass = 0; pass < maxPasses && totalRemaining > 0; pass += 1) {
    let placedThisPass = false;
    for (const id of sortedIds) {
      if (remaining.get(id) <= 0) continue;
      const last = queue[queue.length - 1];
      if (last === id) continue;
      queue.push(id);
      remaining.set(id, remaining.get(id) - 1);
      totalRemaining -= 1;
      placedThisPass = true;
    }
    if (!placedThisPass) {
      for (const id of sortedIds) {
        if (remaining.get(id) <= 0) continue;
        queue.push(id);
        remaining.set(id, remaining.get(id) - 1);
        totalRemaining -= 1;
        break;
      }
    }
  }
  return queue;
}

/** Order only — uses an existing copy plan so mode switches keep the same cards. */
export function orderQueueFromCopyPlan(copyPlan, deck, mode) {
  const sortedIds = [...new Set(deck.map((c) => c.id))].sort((a, b) => a - b);
  const activeIds = sortedIds.filter((id) => (copyPlan.get(id) || 0) > 0);
  if (!activeIds.length) return [];

  const totalCopies = activeIds.reduce((sum, id) => sum + copyPlan.get(id), 0);
  const isFirstPass =
    activeIds.length === totalCopies && activeIds.every((id) => copyPlan.get(id) === 1);

  if (isFirstPass) {
    return mode === "sequence" ? [...activeIds] : shuffle([...activeIds]);
  }

  const remaining = new Map();
  activeIds.forEach((id) => remaining.set(id, copyPlan.get(id)));

  if (mode === "sequence") {
    return buildSequenceInterleavedQueue(remaining, activeIds);
  }

  const entries = [];
  activeIds.forEach((id) => {
    const n = copyPlan.get(id);
    for (let i = 0; i < n; i++) entries.push(id);
  });
  return shuffle(entries);
}

export function buildRoundQueue(cardStates, deck, mode, roundNum, existingCopyPlan = null) {
  const copyPlan =
    existingCopyPlan || computeRoundCopyPlan(cardStates, deck, roundNum);
  const queue = orderQueueFromCopyPlan(copyPlan, deck, mode);
  return {
    queue,
    copyPlan,
    mastered: queue.length === 0,
  };
}

export function setCardRate(cardStates, cardId, rate) {
  const st = cardStates.get(cardId);
  if (!st) return;
  st.nextRate = rate;
}

export function resolveRateAfterGotIt(st) {
  if (st.totalGotIt >= GOT_IT_MASTER_COUNT) return RATE_MASTERED;
  return RATE_GOT_IT;
}

export function applyAgain(cardStates, cardId) {
  const st = cardStates.get(cardId);
  if (!st) return;
  st.totalGotIt = 0;
  st.nextRate = RATE_AGAIN;
  st.roundAgain += 1;
}

export function applyGotIt(cardStates, cardId) {
  const st = cardStates.get(cardId);
  if (!st) return;
  st.totalGotIt += 1;
  st.nextRate = resolveRateAfterGotIt(st);
  st.roundGotIt += 1;
}

export function applyNeutral(cardStates, cardId) {
  const st = cardStates.get(cardId);
  if (!st) return;
  st.nextRate = RATE_NEUTRAL;
  st.roundNeutral += 1;
}

export function resetRoundStats(cardStates) {
  cardStates.forEach((st) => {
    st.roundAgain = 0;
    st.roundGotIt = 0;
    st.roundNeutral = 0;
  });
}

export function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function stripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || "";
}

export function renderRoundSummary({
  lang,
  roundNum,
  deck,
  cardStates,
  roundStats,
  mastered,
}) {
  const { gotIt, again, neutral = 0 } = roundStats;

  if (mastered) {
    return `
      <div class="fc-summary-panel">
        <h3 class="font-headline-lg text-headline-lg-mobile text-primary mb-2">${escHtml(t(lang, "summaryMasteredTitle"))}</h3>
        <p class="text-body-md text-on-surface-variant mb-6">${escHtml(t(lang, "summaryMasteredBody"))}</p>
        <button type="button" class="fc-btn-next w-full py-4 rounded-xl bg-primary text-on-primary font-label-bold text-body-md shadow-lg hover:opacity-90" data-action="restart">
          ${escHtml(t(lang, "btnRestart"))}
        </button>
      </div>`;
  }

  const keep = [];
  const confident = [];
  deck.forEach((card) => {
    const st = cardStates.get(card.id);
    if (!st) return;
    const label = `Card ${card.id} · ${card.subtopic}`;
    const preview = stripHtml(card.front).slice(0, 72);
    if (st.nextRate > RATE_NEUTRAL + 0.05 || st.roundAgain > 0) {
      keep.push({ label, preview, rate: st.nextRate });
    }
    if (
      st.nextRate <= RATE_MASTERED + 0.05 ||
      st.totalGotIt >= GOT_IT_MASTER_COUNT ||
      (st.roundGotIt > 0 && st.nextRate < RATE_NEUTRAL)
    ) {
      confident.push({ label, preview, rate: st.nextRate });
    }
  });
  keep.sort((a, b) => b.rate - a.rate);

  let html = `<div class="fc-summary-panel">
    <span class="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-bold text-body-sm mb-3">${escHtml(t(lang, "masteredBadge"))}</span>
    <h3 class="font-headline-lg text-headline-lg-mobile text-primary mb-2">${escHtml(t(lang, "summaryTitle"))}</h3>
    <p class="text-body-md text-on-surface mb-1">${escHtml(t(lang, "summaryRound").replace("{n}", String(roundNum)))}</p>
    <p class="text-body-sm text-on-surface-variant mb-5">${escHtml(
      t(lang, "summaryStats")
        .replace("{got}", String(gotIt))
        .replace("{again}", String(again))
        .replace("{skip}", String(neutral))
    )}</p>

    <div class="mb-4">
      <h4 class="font-label-bold text-on-surface text-body-sm mb-2">${escHtml(t(lang, "summaryKeepTitle"))}</h4>`;
  if (!keep.length) {
    html += `<p class="text-secondary font-label-bold text-body-sm">${escHtml(t(lang, "summaryKeepEmpty"))}</p>`;
  } else {
    html += '<ul class="space-y-2">';
    keep.slice(0, 12).forEach((item) => {
      html += `<li class="p-3 rounded-xl bg-tertiary/10 border border-tertiary/20 text-body-sm">
        <span class="font-label-bold text-tertiary block">${escHtml(item.label)}</span>
        <span class="text-on-surface-variant">${escHtml(item.preview)}…</span>
      </li>`;
    });
    if (keep.length > 12) html += `<li class="text-body-sm text-on-surface-variant">+${keep.length - 12} more</li>`;
    html += "</ul>";
  }

  html += `</div><div class="mb-5">
      <h4 class="font-label-bold text-on-surface text-body-sm mb-2">${escHtml(t(lang, "summaryConfidentTitle"))}</h4>`;
  if (!confident.length) {
    html += `<p class="text-body-sm text-on-surface-variant">${escHtml(t(lang, "summaryConfidentEmpty"))}</p>`;
  } else {
    html += '<ul class="space-y-2">';
    confident.slice(0, 8).forEach((item) => {
      html += `<li class="p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-body-sm">
        <span class="font-label-bold text-secondary block">${escHtml(item.label)}</span>
        <span class="text-on-surface-variant">${escHtml(item.preview)}…</span>
      </li>`;
    });
    html += "</ul>";
  }

  html += `</div>
    <p class="text-body-sm text-on-surface-variant italic mb-6 p-3 rounded-xl bg-primary-fixed/30 border border-primary/10">${escHtml(t(lang, "summaryTip"))}</p>
    <button type="button" class="fc-btn-next w-full py-4 rounded-xl bg-primary text-on-primary font-label-bold text-body-md shadow-lg hover:opacity-90" data-action="next-round">
      ${escHtml(t(lang, "btnNextRound"))}
    </button>
  </div>`;

  return html;
}
