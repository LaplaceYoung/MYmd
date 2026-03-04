const repo = "LaplaceYoung/MYmd";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function animateNumber(element, target) {
  if (!Number.isFinite(target)) {
    element.textContent = "--";
    return;
  }

  if (prefersReducedMotion) {
    element.textContent = target.toLocaleString("en-US");
    return;
  }

  const duration = 920;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(target * easeOutCubic(progress));
    element.textContent = value.toLocaleString("en-US");

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
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
    const forksEl = document.getElementById("forks-count");
    const issuesEl = document.getElementById("issues-count");

    if (starsEl) {
      animateNumber(starsEl, Number(data.stargazers_count ?? 0));
    }
    if (forksEl) {
      animateNumber(forksEl, Number(data.forks_count ?? 0));
    }
    if (issuesEl) {
      animateNumber(issuesEl, Number(data.open_issues_count ?? 0));
    }
  } catch {
    // Keep fallback values when API is unavailable.
  }
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
    // Keep fallback values when API is unavailable.
  }
}

function initReveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (items.length === 0) {
    return;
  }

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
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  items.forEach((item) => observer.observe(item));
}

function initMeshParallax() {
  if (prefersReducedMotion) {
    return;
  }

  const layer = document.querySelector(".bg-mesh");
  if (!(layer instanceof HTMLElement)) {
    return;
  }

  const blobs = Array.from(layer.querySelectorAll(".blob"));
  if (blobs.length === 0) {
    return;
  }

  let rafId = 0;

  function update(clientX, clientY) {
    const x = clientX / window.innerWidth - 0.5;
    const y = clientY / window.innerHeight - 0.5;

    blobs.forEach((blob, index) => {
      const depth = (index + 1) * 12;
      const tx = x * depth;
      const ty = y * depth;
      blob.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
  }

  window.addEventListener("pointermove", (event) => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      update(event.clientX, event.clientY);
    });
  });
}

function initTiltCards() {
  if (prefersReducedMotion) {
    return;
  }

  const cards = document.querySelectorAll(".tiltable");

  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rx = (0.5 - y / rect.height) * 5;
      const ry = (x / rect.width - 0.5) * 5;
      card.style.transform = `perspective(920px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "perspective(920px) rotateX(0deg) rotateY(0deg)";
    });
  });
}

function burstParticles(origin, stage) {
  const colors = ["#ff6a2f", "#ffb56f", "#0f8f88", "#6bc7c1", "#365f93"];

  for (let i = 0; i < 34; i += 1) {
    const particle = document.createElement("span");
    particle.className = "burst";

    const angle = (Math.PI * 2 * i) / 34;
    const spread = 28 + Math.random() * 88;
    const dx = Math.cos(angle) * spread;
    const dy = Math.sin(angle) * spread;

    particle.style.left = `${origin.x}px`;
    particle.style.top = `${origin.y}px`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty("--x", `${dx}px`);
    particle.style.setProperty("--y", `${dy}px`);

    stage.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 820);
  }
}

function initCelebrateButton() {
  const button = document.getElementById("celebrate-btn");
  const stage = document.getElementById("burst-layer");

  if (!(button instanceof HTMLButtonElement) || !(stage instanceof HTMLDivElement)) {
    return;
  }

  button.addEventListener("click", (event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const buttonRect = target.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    burstParticles(
      {
        x: buttonRect.left + buttonRect.width / 2 - stageRect.left,
        y: buttonRect.top + buttonRect.height / 2 - stageRect.top
      },
      stage
    );
  });
}

async function bootstrap() {
  setYear();
  initReveal();
  initMeshParallax();
  initTiltCards();
  initCelebrateButton();

  await Promise.allSettled([loadRepoStats(), loadLatestRelease()]);
}

void bootstrap();
