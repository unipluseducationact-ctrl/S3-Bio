(function initBioEmbed() {
  const STANDALONE_ROUTES = {
    "summary.html": "table",
    "notes.html": "ions",
    "lab.html": "tools",
    "flashcards.html": "worksheet",
    "flashcards-study.html": "worksheet",
    "quiz.html": "settings",
    "virtual-osmosis-lab.html": "tools/virtual-osmosis-lab.html",
    "membrane-animation.html": "tools/membrane-animation.html",
    "endosymbiotic-animation.html": "tools/endosymbiotic-animation.html",
  };

  if (window.self === window.top) {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "";
    const route = STANDALONE_ROUTES[page];
    if (route) {
      const inFoodNutrition = path.includes("/food-nutrition/");
      const root = new URL(inFoodNutrition ? "../../../" : "../../", window.location.href);
      window.location.replace(`${root.href}#${route}`);
      return;
    }
  }

  if (window.self !== window.top) {
    document.documentElement.classList.add("bio-embed");
  }
})();
