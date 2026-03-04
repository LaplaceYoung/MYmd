const repo = "LaplaceYoung/MYmd";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

function initReveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (items.length === 0) return;

  items.forEach((item) => {
    const delay = Number(item.getAttribute("data-delay") ?? 0);
    item.style.setProperty("--delay", `${delay}ms`);
  });

  if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
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
      threshold: 0.2,
      rootMargin: "0px 0px -6% 0px"
    }
  );

  items.forEach((item) => observer.observe(item));
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

async function loadLatestRelease() {
  try {
    const data = await fetchJson(`https://api.github.com/repos/${repo}/releases/latest`);

    const versionEl = document.getElementById("latest-version");
    const releaseCtaEl = document.getElementById("release-cta");
    const releaseLinkEl = document.getElementById("release-link");

    if (versionEl && data.tag_name) {
      versionEl.textContent = data.tag_name;
    }

    if (data.html_url) {
      if (releaseCtaEl) {
        releaseCtaEl.setAttribute("href", data.html_url);
      }
      if (releaseLinkEl) {
        releaseLinkEl.setAttribute("href", data.html_url);
      }
    }
  } catch {
    // Keep fallback values when GitHub API is unavailable.
  }
}

async function bootstrap() {
  setYear();
  initReveal();
  await loadLatestRelease();
}

void bootstrap();
