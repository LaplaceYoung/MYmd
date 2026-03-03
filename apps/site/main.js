const repo = "LaplaceYoung/MYmd";

async function loadRepoStats() {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`);
    if (!response.ok) return;

    const data = await response.json();
    const starsEl = document.getElementById("stars-count");
    if (starsEl) {
      starsEl.textContent = String(data.stargazers_count ?? "--");
    }
  } catch {
    // Keep fallback values when API is unavailable.
  }
}

async function loadLatestRelease() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest`
    );
    if (!response.ok) return;

    const data = await response.json();
    const versionEl = document.getElementById("latest-version");
    if (versionEl && data.tag_name) {
      versionEl.textContent = data.tag_name;
    }
  } catch {
    // Keep fallback values when API is unavailable.
  }
}

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

setYear();
void loadRepoStats();
void loadLatestRelease();
