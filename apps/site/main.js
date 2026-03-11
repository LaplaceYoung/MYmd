const repo = "LaplaceYoung/MYmd";

const i18nDict = {
  zh: {
    nav_version: "MYmd / v1.3.0",
    nav_workflow: "上手路径",
    nav_spec: "核心能力",
    nav_modules: "使用场景",
    nav_download: "下载 Windows 版",
    hero_tag: "像 Word 一样顺手，但更适合 Markdown",
    hero_t1: "打开就写。",
    hero_t2: "三分钟上手的",
    hero_t3: "本地知识写作。",
    hero_desc:
      "MYmd 把复杂度放在后面。先写作，再搜索，再建立链接，逐步形成你的本地知识库。",
    btn_dl: "下载 EXE",
    btn_src: "查看源码",
    code_1: "新建文档并开始输入",
    code_2: "按 Ctrl+P 搜索标题与内容",
    code_3: "输入 [[ 建立文档连接",
    code_4: "继续完成你的第一篇笔记...",
    flow_tag: "上手路径",
    flow_title: "四步进入稳定写作节奏。",
    flow_1_t: "打开 / 接入",
    flow_1_d:
      "像 Word 一样直接打开本地文件，支持最近文件恢复和工作区浏览，不需要额外导入流程。",
    flow_2_t: "专注写作",
    flow_2_d:
      "WYSIWYG、分屏、源码三种模式随时切换，自动保存持续托底，不打断你的思路。",
    flow_3_t: "搜索与整理",
    flow_3_d:
      "TOC 大纲、全局搜索、替换和反向链接让长文校对更轻松，知识回溯更直接。",
    flow_4_t: "导出与交付",
    flow_4_d:
      "支持保存、另存为和导出 HTML，让草稿到交付形成稳定闭环。",
    spec_tag: "核心能力",
    spec_title: "你每天会用到的能力。",
    spec_desc: "保留 Markdown 的自由，同时维持低学习成本的原生体验。",
    f1_t: "编辑效率 (Editor)",
    f1_d: "多标签并行编辑、快捷键映射、后台自动保存和未保存离开保护。",
    f2_t: "技术方言 (Markup)",
    f2_d: "内建 KaTeX、Mermaid 与代码高亮，技术文档可以在同一编辑流程内完成。",
    f3_t: "拓扑知识 (Topology)",
    f3_d: "文件树、全局检索、文档级反向链接与后续知识连接能力逐步增强。",
    f4_t: "环境独立 (Air-Gapped)",
    f4_d: "local-first 架构，数据保留在本地文件系统，在离线环境下也能稳定使用。",
    rls_tag: "下载与版本",
    rls_title: "获取可直接安装的稳定版。",
    btn_dl_full: "下载最新安装包",
    log_1: "> 正在打开本地工作环境...",
    log_2: "> 文件读写权限检测通过",
    log_3: "> 正在加载所见即所得编辑器...",
    log_4: "> 正在同步排版与索引状态...",
    log_5: "> 现在可以开始写作了。",
  },
  en: {
    nav_version: "MYmd / v1.3.0",
    nav_workflow: "Onboarding",
    nav_spec: "Core Features",
    nav_modules: "Use Cases",
    nav_download: "Download for Windows",
    hero_tag: "As natural as Word, but built for Markdown",
    hero_t1: "Open and write.",
    hero_t2: "A 3-minute onboarding",
    hero_t3: "for local knowledge writing.",
    hero_desc:
      "MYmd keeps complexity in the background. Start writing first, then search, link, and grow your local knowledge flow naturally.",
    btn_dl: "Download EXE",
    btn_src: "View Source",
    code_1: "Create a note and start typing",
    code_2: "Press Ctrl+P to search notes and headings",
    code_3: "Type [[ to create a wiki-style link",
    code_4: "Continue your first writing session...",
    flow_tag: "Onboarding",
    flow_title: "A stable writing workflow in 4 steps.",
    flow_1_t: "Open & Start",
    flow_1_d:
      "Open local files like in Word, with recent-file recovery and workspace browsing out of the box.",
    flow_2_t: "Focus Writing",
    flow_2_d:
      "Switch between WYSIWYG, split view, and source mode anytime. Auto-save quietly protects your progress.",
    flow_3_t: "Search & Organize",
    flow_3_d:
      "TOC outline, global search, replace, and backlinks make long-form editing and review much easier.",
    flow_4_t: "Export & Deliver",
    flow_4_d:
      "Save, save as, and export to HTML to move from draft to delivery in one predictable flow.",
    spec_tag: "Core Features",
    spec_title: "What you will use every day.",
    spec_desc:
      "Keep Markdown freedom with a native, low-learning-curve experience.",
    f1_t: "Editor Efficacy",
    f1_d: "Multi-tab editing, reliable shortcuts, auto-save in background, and unsaved-exit protection.",
    f2_t: "Tech Dialects",
    f2_d: "Built-in KaTeX, Mermaid, and syntax highlighting for technical docs in one streamlined editor.",
    f3_t: "Topology",
    f3_d: "File tree, global search, backlinks, and gradual knowledge-linking features as your notes grow.",
    f4_t: "Air-Gapped",
    f4_d: "Local-first architecture keeps files on your machine and stays reliable even when offline.",
    rls_tag: "Download & Release",
    rls_title: "Get the stable installer build.",
    btn_dl_full: "Download Latest Installer",
    log_1: "> Opening local workspace...",
    log_2: "> File read/write permission check passed",
    log_3: "> Loading WYSIWYG editor engine...",
    log_4: "> Syncing layout and index status...",
    log_5: "> Ready. Start writing now.",
  },
};

let currentLang = "zh";

function updateI18n() {
  const dict = i18nDict[currentLang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Set html lang attribute
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
}

function initI18n() {
  const btn = document.getElementById("lang-toggle");
  if (!btn) return;

  // Toggle Logic
  btn.addEventListener("click", () => {
    currentLang = currentLang === "zh" ? "en" : "zh";
    updateI18n();
    btn.textContent = currentLang === "zh" ? "EN / ZH" : "ZH / EN";
  });

  // Initial render
  updateI18n();
  btn.textContent = currentLang === "zh" ? "EN / ZH" : "ZH / EN";
}

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function initMobileMenu() {
  const toggle = document.getElementById("mobile-toggle");
  const close = document.getElementById("mobile-close");
  const menu = document.getElementById("mobile-menu");
  const links = document.querySelectorAll(".mobile-link");

  if (!toggle || !close || !menu) return;

  const openMenu = () => {
    menu.classList.add("is-active");
    menu.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    menu.classList.remove("is-active");
    menu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", openMenu);
  close.addEventListener("click", closeMenu);
  links.forEach((link) => link.addEventListener("click", closeMenu));
}

// Radical design uses "hard" instant reveals without long sweeping animations
function initReveal() {
  const nodes = Array.from(document.querySelectorAll(".reveal"));
  nodes.forEach((node) => {
    const delay = Number(node.getAttribute("data-delay") || 0);
    node.style.setProperty("--delay", `${delay}ms`);
  });

  if (typeof IntersectionObserver === "undefined") {
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
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );

  nodes.forEach((node) => observer.observe(node));
}

function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;

  const update = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) {
      bar.style.width = "0%";
      return;
    }
    const progress = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
    bar.style.width = `${progress.toFixed(2)}%`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function initTiltCards() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const cards = document.querySelectorAll("[data-tilt]");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 6;
      const rotateX = (0.5 - py) * 6;

      card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    });
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadRepoStats() {
  try {
    const data = await fetchJson(`https://api.github.com/repos/${repo}`);
    const stars = Number(data.stargazers_count ?? 0);
    const starsEl = document.getElementById("stars-count");

    if (starsEl) starsEl.textContent = stars.toLocaleString("en-US");
  } catch {
    const starsWrap = document.getElementById("stars-wrap");
    if (starsWrap) starsWrap.style.display = "none";
  }
}

async function loadLatestRelease() {
  try {
    const data = await fetchJson(
      `https://api.github.com/repos/${repo}/releases/latest`,
    );
    const versionNode = document.getElementById("latest-version");

    if (data.tag_name && versionNode) {
      versionNode.textContent = data.tag_name;
    }

    if (data.html_url) {
      // Find download links and update targets
      document.querySelectorAll('a[href*="/releases/latest"]').forEach((a) => {
        a.setAttribute("href", data.html_url);
      });
    }
  } catch {
    // Keep fallback metrics
  }
}

async function bootstrap() {
  initI18n();
  initMobileMenu();
  setYear();
  initReveal();
  initScrollProgress();
  initTiltCards();
  await Promise.allSettled([loadRepoStats(), loadLatestRelease()]);
}

void bootstrap();
