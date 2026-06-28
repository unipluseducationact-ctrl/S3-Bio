/**
 * Back navigation from interactive tool sub-pages to the tools hub (lab.html).
 * Bilingual labels follow parent document lang when embedded in S3 Bio.
 */
(function initBioToolBack() {
  const DEFAULT_HUB = "./lab.html";

  const BACK_STRINGS = {
    en: "Back to tools",
    zh: "返回互动工具",
    "zh-Hant": "返回互動工具",
  };

  const scriptEl =
    document.currentScript ||
    document.querySelector('script[src*="tool-back.js"]');

  const CUSTOM_BACK = {
    en: scriptEl?.dataset?.backEn,
    zh: scriptEl?.dataset?.backZh,
    "zh-Hant": scriptEl?.dataset?.backZhHant,
  };

  const SCRIPT_CONFIG = {
    hubHref: scriptEl?.dataset?.hub || DEFAULT_HUB,
    variant: scriptEl?.dataset?.variant || "light",
    position: scriptEl?.dataset?.position || "top-left",
    layout: scriptEl?.dataset?.layout || "fixed",
    slot: scriptEl?.dataset?.slot || "#bio-tool-back-slot",
  };

  function resolveLang() {
    try {
      const parentLang = window.parent.document.documentElement.lang;
      if (parentLang && BACK_STRINGS[parentLang]) return parentLang;
    } catch (_) {
      /* cross-origin */
    }
    const local = document.documentElement.lang;
    if (local && BACK_STRINGS[local]) return local;
    return "en";
  }

  function applyLang(btn, lang) {
    const copy =
      CUSTOM_BACK[lang] || CUSTOM_BACK.en || BACK_STRINGS[lang] || BACK_STRINGS.en;
    btn.textContent = copy;
    btn.setAttribute("aria-label", copy);
  }

  function mountBackButton() {
    if (document.querySelector(".bio-tool-back-btn")) return;

    const { hubHref, variant, position, layout, slot } = SCRIPT_CONFIG;
    const wrap = document.createElement("div");
    wrap.className = "bio-tool-back-wrap";
    const inline = layout === "inline";
    if (inline) {
      wrap.classList.add("bio-tool-back-wrap--inline");
    } else if (position === "top-right") {
      wrap.classList.add("bio-tool-back-wrap--top-right");
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bio-tool-back-btn";
    if (variant === "dark") {
      btn.classList.add("bio-tool-back-btn--dark");
    } else if (variant === "ghost") {
      btn.classList.add("bio-tool-back-btn--ghost");
    }
    applyLang(btn, resolveLang());
    btn.addEventListener("click", () => {
      window.location.href = hubHref;
    });

    wrap.appendChild(btn);
    const slotEl = inline ? document.querySelector(slot) : null;
    if (slotEl) {
      slotEl.appendChild(wrap);
    } else {
      document.body.prepend(wrap);
    }
    document.body.classList.add("bio-has-tool-back");
    if (inline) {
      document.body.classList.add("bio-has-tool-back--inline");
    } else if (position === "top-right") {
      document.body.classList.add("bio-has-tool-back--top-right");
    }

    try {
      const observer = new MutationObserver(() => applyLang(btn, resolveLang()));
      observer.observe(window.parent.document.documentElement, {
        attributes: true,
        attributeFilter: ["lang"],
      });
    } catch (_) {
      /* not same-origin */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountBackButton);
  } else {
    mountBackButton();
  }
})();
