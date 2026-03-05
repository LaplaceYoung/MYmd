const repo = "LaplaceYoung/MYmd";

const i18nDict = {
  zh: {
    nav_version: "APP / v1.3.0",
    nav_workflow: "工作流.",
    nav_spec: "规格.",
    nav_modules: "模块.",
    nav_download: "下载 / WIN",
    hero_tag: "[ 系统就绪 ]",
    hero_t1: "本地优先。",
    hero_t2: "严肃的",
    hero_t3: "文档交付。",
    hero_desc:
      "MYmd 是面向长文写作、知识库与技术文档场景的桌面端排版工业载体。丢掉繁琐的网络同步，回归纯文本的绝对控制权。",
    btn_dl: "[ 下载 EXE ]",
    btn_src: "[ 查阅源码 ]",
    code_1: "核心编辑器编译完成。",
    code_2: "DOM 同步连接建立。",
    code_3: "KaTeX 渲染引擎运行中。",
    code_4: "等待安装包生成...",
    flow_tag: "[ 阶段01 : 生产管线 ]",
    flow_title: "四步交付闭环。",
    flow_1_t: "打开 / 接入",
    flow_1_d:
      "原生级别的桌面文件接入。支持工作区浏览与最近文件快速恢复，摒弃多余的导入导出屏障。",
    flow_2_t: "极致专注",
    flow_2_d:
      "WYSIWYG 引擎与 Raw Source 无缝切换。无感知自动保存 (Auto-save) 机制持续为您做数据兜底。",
    flow_3_t: "大纲与校验",
    flow_3_d:
      "TOC 大纲视图、全词汇搜索替换、反向链接追踪，极大提高超长篇结构化文档的后期校对效率。",
    flow_4_t: "输出发布",
    flow_4_d:
      "保存 / 另存为 / 快速导出 HTML。一键进入静态化部署与分发环节，形成稳定工作流。",
    spec_tag: "[ 阶段02 : 核心规格 ]",
    spec_title: "工业级编辑特性。",
    spec_desc: "为技术文档密集型输出环境而设计，去除无效复杂度。",
    f1_t: "编辑效率 (Editor)",
    f1_d: "多标签并列、严格快捷键映射、全自动后台保存、未保存离开防御中断。",
    f2_t: "技术方言 (Markup)",
    f2_d: "全量内建支持 KaTeX 数学公式渲染、Mermaid 流程/时序图实时生成、代码块语法高亮。",
    f3_t: "拓扑知识 (Topology)",
    f3_d: "沉浸式文件树漫游、全局字符串高速检索、文献与段落级反向链接追踪。",
    f4_t: "环境独立 (Air-Gapped)",
    f4_d: "完全摒弃云端授信。全盘本地化处理，文件系统交互穿透，无网络依赖情况下的 100% 可用性。",
    rls_tag: "[ 部署与分发 ]",
    rls_title: "获取稳定版本。",
    btn_dl_full: "[ 启动下载流程 ]",
    log_1: "> Booting local environment... (启动本地环境)",
    log_2: "> Checking FS read/write permissions... OK (文件读写检查)",
    log_3: "> Mounting WYSIWYG Editor kernel... (挂载所见即所得内核)",
    log_4: "> Syncing layout engine... (同步排版引擎)",
    log_5: "> SYSTEM READY FOR WRITING. (系统就绪，可以写作)",
  },
  en: {
    nav_version: "APP / v1.3.0",
    nav_workflow: "WORKFLOW.",
    nav_spec: "SPEC.",
    nav_modules: "MODULES.",
    nav_download: "GET BINARY / WIN",
    hero_tag: "[ SYS_READY ]",
    hero_t1: "Local-First.",
    hero_t2: "Industrial",
    hero_t3: "Publishing.",
    hero_desc:
      "MYmd is an industrial-grade desktop publisher for long-form writing, knowledge bases, and technical documentation. Drop the cloud sync constraints; take absolute control over pure text.",
    btn_dl: "[ DOWNLOAD_EXE ]",
    btn_src: "[ READ_SOURCE ]",
    code_1: "Core editing routines compiled.",
    code_2: "DOM sync established.",
    code_3: "Math parsing via KaTeX running.",
    code_4: "Awaiting installer package...",
    flow_tag: "[ PHASE_01: WORKFLOW ]",
    flow_title: "Four-Step Pipeline.",
    flow_1_t: "Open & Access",
    flow_1_d:
      "Native desktop file access. Supports workspace browsing and rapid recent file recovery without redundant import barriers.",
    flow_2_t: "Deep Focus",
    flow_2_d:
      "Seamless toggle between WYSIWYG and Raw Source. Auto-save mechanism continuously prevents data loss in the background.",
    flow_3_t: "Outline & Audit",
    flow_3_d:
      "TOC outline, global search & replace, and backlink tracing drastically improve proofreading efficiency for ultra-long documents.",
    flow_4_t: "Export & Publish",
    flow_4_d:
      "Save / Save As / Export to HTML. One-click entry into static deployment streams, creating a solid workflow.",
    spec_tag: "[ PHASE_02: SPECIFICATIONS ]",
    spec_title: "Industrial Logic.",
    spec_desc:
      "Designed for technical documentation density, stripping out invalid complexities.",
    f1_t: "Editor Efficacy",
    f1_d: "Multi-tab handling, strict shortcut mapping, auto-background save, and unsaved-exit defense interceptions.",
    f2_t: "Tech Dialects",
    f2_d: "Built-in KaTeX math rendering, real-time Mermaid flowchart/sequence generation, and code block syntax highlighting.",
    f3_t: "Topology",
    f3_d: "Immersive file tree roaming, high-speed global string search, and document/paragraph level backlink tracing.",
    f4_t: "Air-Gapped",
    f4_d: "Zero cloud trust. 100% processing done locally with filesystem penetration. Full availability without network dependencies.",
    rls_tag: "[ DEPLOYMENT ]",
    rls_title: "Get Stable Release.",
    btn_dl_full: "[ INITIATE_DOWNLOAD ]",
    log_1: "> Booting local environment...",
    log_2: "> Checking FS read/write permissions... OK",
    log_3: "> Mounting WYSIWYG Editor kernel...",
    log_4: "> Syncing layout engine...",
    log_5: "> SYSTEM READY FOR WRITING.",
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
  await Promise.allSettled([loadRepoStats(), loadLatestRelease()]);
}

void bootstrap();
