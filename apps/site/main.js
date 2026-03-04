const repo = "LaplaceYoung/MYmd";
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersReducedMotion = reducedMotionQuery.matches;
const lowEndDevice = (navigator.hardwareConcurrency || 8) <= 4;
const enableHighMotion = !prefersReducedMotion && !lowEndDevice;

const modeContent = {
  wysiwyg: {
    title: "Write and format in one flow",
    items: [
      "Fast input with live visual feedback",
      "Instant word stats and reading estimate",
      "Keyboard and context menu stay consistent"
    ]
  },
  split: {
    title: "Review in split mode",
    items: [
      "Edit source and preview side-by-side",
      "Perfect for technical docs and specification review",
      "Search and structure stay synchronized"
    ]
  },
  source: {
    title: "Source-first focus mode",
    items: [
      "Pure Markdown editing for speed",
      "Great for template-driven writing and bulk updates",
      "Works well with autosave and versioned delivery"
    ]
  }
};

const highlightContent = {
  speed: {
    title: "Fast startup, practical depth",
    desc: "MYmd keeps the path from launch to writing short while preserving the core tools needed for technical docs."
  },
  flow: {
    title: "Clean path from draft to delivery",
    desc: "File workflow, export, and release entry points are kept explicit so you can ship documents without friction."
  },
  consistency: {
    title: "Consistent interaction system",
    desc: "Toolbar actions, side panels, and state feedback follow one interaction rhythm across the whole workspace."
  }
};

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function animateNumber(element, target) {
  if (!Number.isFinite(target)) {
    element.textContent = "--";
    return;
  }

  if (!enableHighMotion) {
    element.textContent = target.toLocaleString("en-US");
    return;
  }

  const duration = 720;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(target * easeOutCubic(progress));
    element.textContent = value.toLocaleString("en-US");
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function initReveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (items.length === 0) return;

  items.forEach((item) => {
    const delay = Number(item.getAttribute("data-delay") ?? 0);
    item.style.setProperty("--delay", `${delay}ms`);
  });

  if (!enableHighMotion || typeof IntersectionObserver === "undefined") {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  items.forEach((item) => observer.observe(item));
}

function initRibbonTabs() {
  const tabs = Array.from(document.querySelectorAll("[data-ribbon-tab]"));
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((node) => node.classList.remove("is-active"));
      tab.classList.add("is-active");
    });
  });
}

function initModeSwitch() {
  const buttons = Array.from(document.querySelectorAll(".mode-btn"));
  const titleEl = document.getElementById("stage-mode-title");
  const listEl = document.getElementById("stage-mode-list");
  const canvas = document.getElementById("stage-canvas");

  if (!titleEl || !listEl || !canvas || buttons.length === 0) return;

  function render(modeKey) {
    const data = modeContent[modeKey];
    if (!data) return;

    canvas.classList.add("is-swapping");

    const commit = () => {
      titleEl.textContent = data.title;
      listEl.innerHTML = data.items.map((item) => `<li>${item}</li>`).join("");
      canvas.classList.remove("is-swapping");
    };

    if (!enableHighMotion) {
      commit();
      return;
    }

    window.setTimeout(commit, 130);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      render(button.dataset.mode || "wysiwyg");
    });
  });
}

function initHighlightSwitch() {
  const buttons = Array.from(document.querySelectorAll(".highlight-btn"));
  const titleEl = document.getElementById("highlight-title");
  const descEl = document.getElementById("highlight-desc");
  const panelEl = document.getElementById("highlight-panel");

  if (!titleEl || !descEl || !panelEl || buttons.length === 0) return;

  function render(key) {
    const data = highlightContent[key];
    if (!data) return;

    panelEl.classList.add("is-swapping");

    const commit = () => {
      titleEl.textContent = data.title;
      descEl.textContent = data.desc;
      panelEl.classList.remove("is-swapping");
    };

    if (!enableHighMotion) {
      commit();
      return;
    }

    window.setTimeout(commit, 130);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      render(button.dataset.highlight || "speed");
    });
  });
}

function initTiltCards() {
  if (!enableHighMotion) return;

  const cards = Array.from(document.querySelectorAll(".tilt-card"));

  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 3.6;
      const rotateY = (x - 0.5) * 3.6;
      card.style.transform = `perspective(980px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-1px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function initParallax() {
  if (!enableHighMotion) return;

  const targets = Array.from(document.querySelectorAll("[data-parallax]"));
  if (targets.length === 0) return;

  let ticking = false;

  function updateParallax() {
    const vh = window.innerHeight || 1;

    targets.forEach((el) => {
      const intensity = Number(el.getAttribute("data-parallax") ?? 0);
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const normalized = (center - vh / 2) / vh;
      const offset = Math.max(-16, Math.min(16, -normalized * intensity));
      el.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });

    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateParallax);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateParallax();
}

function initMagneticButtons() {
  if (!enableHighMotion) return;

  const buttons = Array.from(document.querySelectorAll(".magnetic"));

  buttons.forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      button.style.transform = `translate(${x * 0.06}px, ${y * 0.06}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function loadRepoStats() {
  try {
    const data = await fetchJson(`https://api.github.com/repos/${repo}`);
    const starsEl = document.getElementById("stars-count");
    if (starsEl) animateNumber(starsEl, Number(data.stargazers_count ?? 0));
  } catch {
    // keep fallback
  }
}

async function loadLatestRelease() {
  try {
    const data = await fetchJson(`https://api.github.com/repos/${repo}/releases/latest`);

    const latestVersionEls = [
      document.getElementById("latest-version"),
      document.getElementById("release-version-inline")
    ].filter(Boolean);

    const releaseCtaEl = document.getElementById("release-cta");
    const releaseLinkEl = document.getElementById("release-link");

    if (data.tag_name) {
      latestVersionEls.forEach((node) => {
        node.textContent = data.tag_name;
      });
    }

    if (data.html_url) {
      if (releaseCtaEl) releaseCtaEl.setAttribute("href", data.html_url);
      if (releaseLinkEl) releaseLinkEl.setAttribute("href", data.html_url);
    }
  } catch {
    // keep fallback
  }
}

async function bootstrap() {
  setYear();
  initReveal();
  initRibbonTabs();
  initModeSwitch();
  initHighlightSwitch();
  initTiltCards();
  initParallax();
  initMagneticButtons();

  await Promise.allSettled([loadRepoStats(), loadLatestRelease()]);
}

void bootstrap();
