const repo = "LaplaceYoung/MYmd";
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersReducedMotion = reducedMotionQuery.matches;
const lowEndDevice = (navigator.hardwareConcurrency || 8) <= 4;
const enableHighMotion = !prefersReducedMotion && !lowEndDevice;

const highlightContent = {
  light: {
    title: "轻量启动，快速进入写作状态",
    desc: "打开即写，保留核心能力密度，避免重型软件带来的学习与切换负担。",
    head: "启动路径",
    list: ["打开文件或新建文档", "直接进入编辑区", "关键工具始终可达"]
  },
  flow: {
    title: "写作到发布一条链路",
    desc: "从编辑、保存到导出与下载页跳转，交付路径明确且可复用。",
    head: "交付闭环",
    list: ["编辑与预览同步", "保存与导出路径稳定", "版本发布入口直接可达"]
  },
  consistency: {
    title: "统一交互降低学习成本",
    desc: "工具栏、侧栏与状态反馈遵循同一节奏，减少认知跳转。",
    head: "交互一致性",
    list: ["按钮语义稳定", "反馈时机明确", "模式切换成本低"]
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

  const duration = 760;
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

function initScrollProgress() {
  const bar = document.getElementById("scroll-progress-bar");
  if (!bar) return;

  let ticking = false;

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const percent = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
    bar.style.transform = `scaleX(${percent / 100})`;
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

function initSectionSpy() {
  const sectionIds = ["hero", "features", "highlights", "release"];
  const navLinks = Array.from(document.querySelectorAll("[data-nav-target]"));

  function activate(target) {
    navLinks.forEach((link) => {
      const isCurrent = link.getAttribute("data-nav-target") === target;
      link.classList.toggle("is-current", isCurrent);
    });
  }

  navLinks.forEach((link) => {
    const target = link.getAttribute("data-nav-target");
    if (!target) return;

    link.addEventListener("click", (event) => {
      const anchor = document.getElementById(target);
      if (!anchor) return;
      event.preventDefault();
      anchor.scrollIntoView({ behavior: enableHighMotion ? "smooth" : "auto", block: "start" });
      activate(target);
    });
  });

  if (typeof IntersectionObserver === "undefined") {
    activate("hero");
    return;
  }

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      let best = null;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!best || entry.intersectionRatio > best.intersectionRatio) {
          best = entry;
        }
      });

      if (!best || !best.target?.id) return;
      activate(best.target.id);
    },
    {
      threshold: [0.2, 0.4, 0.6],
      rootMargin: "-16% 0px -55% 0px"
    }
  );

  sections.forEach((section) => observer.observe(section));
  activate("hero");
}

function initHighlightSwitch() {
  const buttons = Array.from(document.querySelectorAll(".highlight-btn"));
  const titleEl = document.getElementById("highlight-title");
  const descEl = document.getElementById("highlight-desc");
  const headEl = document.getElementById("proof-head");
  const listEl = document.getElementById("proof-list");
  const panelEl = document.getElementById("highlight-panel");

  if (!titleEl || !descEl || !headEl || !listEl || !panelEl || buttons.length === 0) return;

  function render(key) {
    const data = highlightContent[key];
    if (!data) return;

    panelEl.classList.add("is-swapping");

    const commit = () => {
      titleEl.textContent = data.title;
      descEl.textContent = data.desc;
      headEl.textContent = data.head;
      listEl.innerHTML = data.list.map((item) => `<li>${item}</li>`).join("");
      panelEl.classList.remove("is-swapping");
    };

    if (!enableHighMotion) {
      commit();
      return;
    }

    window.setTimeout(commit, 120);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      render(button.dataset.highlight || "light");
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
      const rotateX = (0.5 - y) * 2.6;
      const rotateY = (x - 0.5) * 2.6;
      card.style.transform = `perspective(980px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
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
      const offset = Math.max(-14, Math.min(14, -normalized * intensity));
      el.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });

    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateParallax);
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
      button.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
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
    const stars = Number(data.stargazers_count ?? 0);
    const starsWrap = document.getElementById("stars-wrap");
    const starsEl = document.getElementById("stars-count");

    if (starsWrap && stars < 100) {
      starsWrap.style.display = "none";
    }

    if (starsEl) {
      animateNumber(starsEl, stars);
    }
  } catch {
    const starsWrap = document.getElementById("stars-wrap");
    if (starsWrap) starsWrap.style.display = "none";
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
  initScrollProgress();
  initSectionSpy();
  initHighlightSwitch();
  initTiltCards();
  initParallax();
  initMagneticButtons();

  await Promise.allSettled([loadRepoStats(), loadLatestRelease()]);
}

void bootstrap();
