const repo = "LaplaceYoung/MYmd";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lowEndDevice = (navigator.hardwareConcurrency || 8) <= 4;
const enableMotion = !reducedMotion && !lowEndDevice;

const highlightContent = {
  light: {
    title: "轻量启动，打开就写",
    desc: "降低从“打开工具”到“进入写作状态”的切换损耗。",
    list: ["本地文件直接打开", "首次上手路径短", "关键动作入口集中"]
  },
  flow: {
    title: "写作到交付形成闭环",
    desc: "编辑、审阅、导出、发布在同一套动作里完成。",
    list: ["编辑和预览无缝切换", "导出动作可预测", "版本发布入口直达"]
  },
  team: {
    title: "一致交互降低协作成本",
    desc: "清晰的信息分层让团队更快达成文档共识。",
    list: ["模式切换语义统一", "状态反馈及时", "文档结构可追踪"]
  }
};

const demoModeMeta = {
  wysiwyg: "WYSIWYG",
  split: "Split",
  source: "Source"
};

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function animateNumber(element, target) {
  if (!Number.isFinite(target)) {
    element.textContent = "--";
    return;
  }

  if (!enableMotion) {
    element.textContent = target.toLocaleString("en-US");
    return;
  }

  const duration = 720;
  const start = performance.now();

  const frame = (now) => {
    const ratio = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - ratio, 3);
    element.textContent = Math.round(target * eased).toLocaleString("en-US");
    if (ratio < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function initReveal() {
  const nodes = Array.from(document.querySelectorAll(".reveal"));
  nodes.forEach((node) => {
    const delay = Number(node.getAttribute("data-delay") || 0);
    node.style.setProperty("--delay", `${delay}ms`);
  });

  if (!enableMotion || typeof IntersectionObserver === "undefined") {
    nodes.forEach((node) => node.classList.add("is-visible"));
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
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  nodes.forEach((node) => observer.observe(node));
}

function initScrollProgress() {
  const bar = document.getElementById("scroll-progress-bar");
  if (!bar) return;

  let ticking = false;

  const update = () => {
    const top = window.scrollY || document.documentElement.scrollTop || 0;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, top / max));
    bar.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!(toggle instanceof HTMLButtonElement) || !(nav instanceof HTMLElement)) return;

  toggle.addEventListener("click", () => {
    const nextOpen = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", nextOpen);
    toggle.setAttribute("aria-expanded", nextOpen ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initSectionSpy() {
  const sectionIds = ["hero", "workflow", "features", "proof", "release"];
  const navLinks = Array.from(document.querySelectorAll("[data-nav-target]"));

  const activate = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-current", link.getAttribute("data-nav-target") === id);
    });
  };

  navLinks.forEach((link) => {
    const target = link.getAttribute("data-nav-target");
    if (!target) return;

    link.addEventListener("click", (event) => {
      const section = document.getElementById(target);
      if (!section) return;
      event.preventDefault();
      section.scrollIntoView({ behavior: enableMotion ? "smooth" : "auto", block: "start" });
      activate(target);
    });
  });

  if (typeof IntersectionObserver === "undefined") {
    activate("hero");
    return;
  }

  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      let best = null;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
      });
      if (best?.target?.id) activate(best.target.id);
    },
    {
      threshold: [0.2, 0.4, 0.6],
      rootMargin: "-12% 0px -58% 0px"
    }
  );

  sections.forEach((section) => observer.observe(section));
  activate("hero");
}

function initHighlightSwitch() {
  const tabs = Array.from(document.querySelectorAll(".proof-tab"));
  const titleEl = document.getElementById("proof-title");
  const descEl = document.getElementById("proof-desc");
  const listEl = document.getElementById("proof-list");

  if (!titleEl || !descEl || !listEl || tabs.length === 0) return;

  const render = (key) => {
    const content = highlightContent[key];
    if (!content) return;
    titleEl.textContent = content.title;
    descEl.textContent = content.desc;
    listEl.innerHTML = content.list.map((item) => `<li>${item}</li>`).join("");
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      render(tab.dataset.highlight || "light");
    });
  });
}

function initHeroModes() {
  const bodyEl = document.getElementById("demo-body");
  const badgeEl = document.getElementById("window-badge");
  const buttons = Array.from(document.querySelectorAll("[data-demo-mode]"));
  if (!bodyEl || !badgeEl || buttons.length === 0) return;

  const order = ["wysiwyg", "split", "source"];
  let index = 0;
  let timer = null;

  const apply = (mode) => {
    if (!demoModeMeta[mode]) return;
    bodyEl.setAttribute("data-mode", mode);
    badgeEl.textContent = demoModeMeta[mode];
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.demoMode === mode);
    });
  };

  const next = () => {
    index = (index + 1) % order.length;
    apply(order[index]);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.demoMode || "wysiwyg";
      const modeIndex = order.indexOf(mode);
      index = modeIndex >= 0 ? modeIndex : 0;
      apply(order[index]);
      if (timer) {
        window.clearInterval(timer);
        timer = window.setInterval(next, 2600);
      }
    });
  });

  apply(order[index]);
  if (enableMotion) timer = window.setInterval(next, 2600);
}

function initCelebrateBurst() {
  const button = document.getElementById("celebrate-btn");
  const layer = document.getElementById("burst-layer");
  if (!(button instanceof HTMLButtonElement) || !layer) return;

  const palette = ["#14b8a6", "#0f766e", "#22d3ee", "#34d399", "#99f6e4"];

  button.addEventListener("click", (event) => {
    const rect = button.getBoundingClientRect();
    const baseX = rect.left + rect.width / 2;
    const baseY = rect.top + rect.height / 2;

    for (let i = 0; i < 24; i += 1) {
      const burst = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 24;
      const distance = 60 + Math.random() * 80;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      burst.className = "burst";
      burst.style.left = `${baseX}px`;
      burst.style.top = `${baseY}px`;
      burst.style.background = palette[i % palette.length];
      burst.style.setProperty("--tx", `${tx}px`);
      burst.style.setProperty("--ty", `${ty}px`);
      layer.appendChild(burst);
      window.setTimeout(() => burst.remove(), 980);
    }

    if (event.currentTarget instanceof HTMLButtonElement) {
      event.currentTarget.blur();
    }
  });
}

function initMagneticButtons() {
  if (!enableMotion) return;
  const buttons = Array.from(document.querySelectorAll(".btn"));
  buttons.forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const offsetX = event.clientX - (rect.left + rect.width / 2);
      const offsetY = event.clientY - (rect.top + rect.height / 2);
      button.style.transform = `translate(${offsetX * 0.04}px, ${offsetY * 0.04}px)`;
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}

function initLiftCards() {
  if (!enableMotion) return;
  const cards = Array.from(document.querySelectorAll(".lift-card"));
  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 2.4;
      const rotateY = (x - 0.5) * 2.4;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
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
    const stars = Number(data.stargazers_count ?? 0);
    const starsWrap = document.getElementById("stars-wrap");
    const starsEl = document.getElementById("stars-count");

    if (starsWrap && stars < 100) starsWrap.style.display = "none";
    if (starsEl) animateNumber(starsEl, stars);
  } catch {
    const starsWrap = document.getElementById("stars-wrap");
    if (starsWrap) starsWrap.style.display = "none";
  }
}

async function loadLatestRelease() {
  try {
    const data = await fetchJson(`https://api.github.com/repos/${repo}/releases/latest`);
    const nodes = [
      document.getElementById("latest-version"),
      document.getElementById("release-version-inline")
    ].filter(Boolean);

    if (data.tag_name) {
      nodes.forEach((node) => {
        node.textContent = data.tag_name;
      });
    }

    if (data.html_url) {
      const cta = document.getElementById("release-cta");
      const link = document.getElementById("release-link");
      if (cta) cta.setAttribute("href", data.html_url);
      if (link) link.setAttribute("href", data.html_url);
    }
  } catch {
    // keep fallback values
  }
}

async function bootstrap() {
  setYear();
  initReveal();
  initScrollProgress();
  initMobileNav();
  initSectionSpy();
  initHighlightSwitch();
  initHeroModes();
  initCelebrateBurst();
  initMagneticButtons();
  initLiftCards();

  await Promise.allSettled([loadRepoStats(), loadLatestRelease()]);
}

void bootstrap();
