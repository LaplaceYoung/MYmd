const repo = "LaplaceYoung/MYmd";

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

function animateNumber(element, target) {
  if (!Number.isFinite(target)) {
    element.textContent = "--";
    return;
  }

  const duration = 900;
  const startTime = performance.now();
  const startValue = 0;

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(startValue + (target - startValue) * eased);
    element.textContent = value.toLocaleString("en-US");

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
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

function initAos() {
  if (window.AOS && typeof window.AOS.init === "function") {
    window.AOS.init({
      duration: 700,
      once: true,
      offset: 56,
      easing: "ease-out-cubic"
    });
  }
}

function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function initTiltCards() {
  const cards = document.querySelectorAll(".tilt-card");

  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 6;
      const rotateX = (0.5 - (y / rect.height)) * 6;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    });
  });
}

function burstParticles(origin, stage) {
  const colors = ["#4ef5c6", "#78b7ff", "#ffd76c", "#ff8ea8", "#d8f4ff"];

  for (let i = 0; i < 34; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";

    const angle = (Math.PI * 2 * i) / 34;
    const speed = 28 + Math.random() * 96;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;

    particle.style.left = `${origin.x}px`;
    particle.style.top = `${origin.y}px`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty("--x", `${dx}px`);
    particle.style.setProperty("--y", `${dy}px`);

    stage.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 800);
  }
}

function initLaunchButton() {
  const button = document.getElementById("celebrate-btn");
  const stage = document.getElementById("particle-stage");

  if (!(button instanceof HTMLButtonElement) || !(stage instanceof HTMLDivElement)) {
    return;
  }

  button.addEventListener("click", (event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    burstParticles(
      {
        x: rect.left + rect.width / 2 - stageRect.left,
        y: rect.top + rect.height / 2 - stageRect.top
      },
      stage
    );
  });
}

async function bootstrap() {
  setYear();
  initAos();
  initIcons();
  initTiltCards();
  initLaunchButton();

  await Promise.allSettled([loadRepoStats(), loadLatestRelease()]);
}

void bootstrap();
