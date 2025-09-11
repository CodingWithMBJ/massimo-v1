// ---------- Utils ----------
function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const header = document.getElementById("header");
  const nav = document.getElementById("nav");

  // ---------- Theme ----------
  const themeButton = document.getElementById("themeBtn");
  const themeIndicator = document.getElementById("themeIndicator");

  const savedTheme = localStorage.getItem("theme");
  const savedTod = localStorage.getItem("tod");

  body.classList.toggle("light-theme", savedTheme === "light-theme");
  body.classList.toggle("dark-theme", savedTheme !== "light-theme");

  themeIndicator?.classList.toggle("day", savedTod === "day");
  themeIndicator?.classList.toggle("night", savedTod !== "day");

  themeButton?.addEventListener("click", () => {
    const isDark = body.classList.contains("dark-theme");
    body.classList.toggle("dark-theme", !isDark);
    body.classList.toggle("light-theme", isDark);

    const isNight = themeIndicator?.classList.contains("night") ?? true;
    themeIndicator?.classList.toggle("night", !isNight);
    themeIndicator?.classList.toggle("day", isNight);

    localStorage.setItem("theme", isDark ? "light-theme" : "dark-theme");
    localStorage.setItem("tod", isNight ? "day" : "night");
  });

  // ---------- Navigation & Socials ----------
  fetch("/assets/data/navLinks.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const navLinks = data?.navLinks ?? data?.Links?.[0]?.navLinks ?? [];
      const socialLinks =
        data?.socialLinks ?? data?.Links?.[1]?.socialLinks ?? [];

      const navUl = document.getElementById("nav-ul");
      const socialUl =
        document.getElementById("social-ul") ||
        document.querySelector(".social-bio .social-ul");

      // Build Nav
      if (navUl) {
        navUl.innerHTML = "";
        const frag = document.createDocumentFragment();
        navLinks.forEach(({ name, href, icon }) => {
          const li = document.createElement("li");
          li.className = "nav-li";

          const a = document.createElement("a");
          a.className = "nav-li-a";
          a.href = href;

          if (icon) {
            const i = document.createElement("i");
            i.className = icon;
            a.appendChild(i);
          }

          const span = document.createElement("span");
          span.className = "link-name";
          span.textContent = name;

          a.appendChild(span);
          li.appendChild(a);
          frag.appendChild(li);
        });
        navUl.appendChild(frag);

        // Close mobile menu on click
        navUl.addEventListener("click", (e) => {
          const anchor = e.target.closest("a");
          if (!anchor) return;
          nav?.classList.remove("opened");
          const menuBtn = document.getElementById("menuBtn");
          if (menuBtn) {
            menuBtn.classList.remove("opened");
            menuBtn.setAttribute("aria-expanded", "false");
          }
          // If anchor is a hash link, set active immediately for mobile UX
          if (anchor.hash) {
            navUl
              .querySelectorAll(".nav-li-a.active")
              .forEach((el) => el.classList.remove("active"));
            anchor.classList.add("active");
          }
        });

        // Active-link highlight via IntersectionObserver
        const sections = navLinks
          .map(({ href }) =>
            typeof href === "string" && href.startsWith("#")
              ? document.querySelector(href)
              : null
          )
          .filter(Boolean);

        if (sections.length) {
          const obs = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const id = entry.target.id;
                const link = navUl.querySelector(`a[href="#${id}"]`);
                if (!link) return;
                if (entry.isIntersecting) {
                  navUl
                    .querySelectorAll(".nav-li-a.active")
                    .forEach((el) => el.classList.remove("active"));
                  link.classList.add("active");
                }
              });
            },
            { root: null, rootMargin: "0px", threshold: 0.5 }
          );
          sections.forEach((sec) => obs.observe(sec));

          // Also set active based on current hash on load
          if (location.hash) {
            const current = navUl.querySelector(
              `a[href="${CSS.escape(location.hash)}"]`
            );
            current?.classList.add("active");
          }
        }
      }

      // Build Socials
      if (socialUl) {
        socialUl.innerHTML = "";
        const frag = document.createDocumentFragment();
        socialLinks.forEach(({ name, href, icon }) => {
          const li = document.createElement("li");
          li.className = "social-li";

          const a = document.createElement("a");
          a.className = "social-li-a";
          a.href = href;
          a.target = "_blank";
          a.rel = "noopener noreferrer";

          if (icon) {
            const i = document.createElement("i");
            i.className = `${icon} social-icon`;
            a.appendChild(i);
          }

          const span = document.createElement("span");
          span.className = "social-text";
          span.textContent = name;

          a.append(span);
          li.appendChild(a);
          frag.appendChild(li);
        });
        socialUl.appendChild(frag);
      }
    })
    .catch((err) => console.error("Nav fetch error:", err));

  // ---------- Experience ----------
  fetch("/assets/data/experiences.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];
      if (!jobs.length) return;

      const tabsUl = document.getElementById("companyTabs");
      const panel = document.getElementById("jobPanel");
      if (!tabsUl || !panel) return;

      tabsUl.innerHTML = "";
      const tabsFrag = document.createDocumentFragment();

      jobs.forEach((job, idx) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "company-tab" + (idx === 0 ? " active" : "");
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        btn.id = `company-tab-${idx}`;
        btn.textContent =
          job.companyAlias || job.company || `Company ${idx + 1}`;
        btn.addEventListener("click", () => selectJob(idx));
        li.appendChild(btn);
        tabsFrag.appendChild(li);
      });

      tabsUl.appendChild(tabsFrag);
      tabsUl.setAttribute("role", "tablist");
      panel.setAttribute("role", "tabpanel");

      function renderJob(job, idx) {
        const {
          title = "",
          company = "",
          location = "",
          duration = [],
          tasks = [],
        } = job;
        const d0 = duration?.[0] ?? {};
        const start = d0.startDate || "";
        const end = d0["stillEmployed?"] ? "Present" : d0.endDate || "";
        const period = [start, end].filter(Boolean).join(" – ");

        const taskObject = tasks?.[0] ?? {};
        const taskList = Object.values(taskObject).filter(Boolean);

        panel.setAttribute("aria-labelledby", `company-tab-${idx}`);
        panel.innerHTML = `
          <header class="job-header">
            <h3 class="job-title">${escapeHTML(title)} <span class="at">@</span>
              <span class="company-name">${escapeHTML(company)}</span></h3>
            <p class="job-meta">
              ${
                location
                  ? `<span class="job-location">${escapeHTML(location)}</span>`
                  : ""
              }
              ${
                period
                  ? `${
                      location ? " · " : ""
                    }<time class="job-duration">${escapeHTML(period)}</time>`
                  : ""
              }
            </p>
          </header>
          <ul class="task-list">
            ${taskList
              .map((t) => `<li class="task-item">${escapeHTML(t)}</li>`)
              .join("")}
          </ul>
        `;
      }

      function selectJob(index) {
        document.querySelectorAll(".company-tab").forEach((b, i) => {
          const active = i === index;
          b.classList.toggle("active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        renderJob(jobs[index], index);
      }

      // optional: left/right arrow key navigation for tabs
      tabsUl.addEventListener("keydown", (e) => {
        const tabs = [...tabsUl.querySelectorAll(".company-tab")];
        if (!tabs.length) return;
        const current = document.activeElement;
        const idx = tabs.indexOf(current);
        if (idx < 0) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const ni = (idx + 1) % tabs.length;
          tabs[ni].focus();
          tabs[ni].click();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const pi = (idx - 1 + tabs.length) % tabs.length;
          tabs[pi].focus();
          tabs[pi].click();
        }
      });

      selectJob(0);
    })
    .catch((err) => console.error("Experience fetch error:", err));

  // ---------- Skills (theme-safe masks + FA) ----------
  fetch("/assets/data/skills.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const container = document.getElementById("skillsContainer");
      if (!container) return;

      const groups = Array.isArray(data?.Skills) ? data.Skills : [];
      if (!groups.length) return;

      container.innerHTML = "";
      const frag = document.createDocumentFragment();

      // Build a single chip (supports mask, FA classes, or img)
      const makeSkillChip = ({ name = "", logo = "", mask = "" }) => {
        const li = document.createElement("li");
        li.className = "skill-chip";

        if (mask) {
          const span = document.createElement("span");
          span.className = "si-icon";
          span.style.setProperty("--si", `url("${mask}")`);
          span.setAttribute("role", "img");
          span.setAttribute("aria-label", `${name} logo`);
          li.appendChild(span);
        } else if (
          logo &&
          /\bfa-(solid|regular|brands)\b|\bfa-\w+/.test(logo)
        ) {
          // e.g. "fa-brands fa-java"
          const i = document.createElement("i");
          const classes = logo.split(/\s+/);
          if (!classes.some((c) => /fa-(solid|regular|brands)/.test(c))) {
            classes.unshift("fa-solid");
          }
          i.className = classes.join(" ");
          i.style.marginRight = "0.5rem";
          li.appendChild(i);
        } else if (
          logo &&
          (/^https?:\/\//i.test(logo) ||
            /^[./]/.test(logo) ||
            logo.startsWith("/"))
        ) {
          const img = document.createElement("img");
          img.className = "skill-logo";
          img.src = logo;
          img.alt = `${name} logo`;
          img.loading = "lazy";
          li.appendChild(img);
        }

        const label = document.createElement("span");
        label.className = "skill-name";
        label.textContent = name;
        li.appendChild(label);

        return li;
      };

      // Render groups
      groups.forEach((groupObj) => {
        const [groupName, groupVal] = Object.entries(groupObj)[0] || [];
        if (!groupName || !Array.isArray(groupVal)) return;

        // Parent group card
        const groupCard = document.createElement("article");
        groupCard.className = "skillCard";

        const h2 = document.createElement("h2");
        h2.className = "skill-heading";
        h2.textContent = groupName;
        groupCard.appendChild(h2);

        // If it's Soft Skills (flat list)
        const isSoft =
          groupName.toLowerCase().includes("soft") &&
          groupVal.every((it) => typeof it === "object" && "name" in it);

        if (isSoft) {
          const ul = document.createElement("ul");
          ul.className = "skill-list";
          groupVal.forEach((skill) => ul.appendChild(makeSkillChip(skill)));
          groupCard.appendChild(ul);
          frag.appendChild(groupCard);
          return;
        }

        // Technical skills: nested subcategory cards
        groupVal.forEach((subcategoryObj) => {
          const [subName, skillsArr] = Object.entries(subcategoryObj)[0] || [];
          if (!subName || !Array.isArray(skillsArr)) return;

          const subCard = document.createElement("section");
          subCard.className = "skillCard sub-skillCard"; // includes .skillCard for shared styles

          const h3 = document.createElement("h3");
          h3.className = "skill-heading";
          h3.textContent = subName;
          subCard.appendChild(h3);

          const ul = document.createElement("ul");
          ul.className = "skill-list";
          skillsArr.forEach((skill) => ul.appendChild(makeSkillChip(skill)));
          subCard.appendChild(ul);

          groupCard.appendChild(subCard);
        });

        frag.appendChild(groupCard);
      });

      container.appendChild(frag);
    })
    .catch((err) => console.error("Skills fetch error:", err));

  // ---------- Projects (single container) ----------
  (function projectsSingle() {
    const container =
      document.getElementById("project-card-container") ||
      document.querySelector("[data-projects]");
    if (!container) return;

    const desktopMQ = window.matchMedia("(min-width: 1024px)");

    function resetAllFlips(root = document) {
      root
        .querySelectorAll(".flip-inner.flipped")
        .forEach((el) => el.classList.remove("flipped"));
      root
        .querySelectorAll(".infoBox[aria-pressed='true']")
        .forEach((btn) => btn.setAttribute("aria-pressed", "false"));
    }

    if (desktopMQ.matches) resetAllFlips();

    const onMQChange = (e) => {
      if (e.matches) resetAllFlips(container);
    };
    if (desktopMQ.addEventListener)
      desktopMQ.addEventListener("change", onMQChange);
    else desktopMQ.addListener(onMQChange);

    function wireFlip(root) {
      if (!root || root.dataset.flipBound === "1") return;
      root.dataset.flipBound = "1";

      const toggle = (btn) => {
        const card = btn.closest(".projectCard");
        const inner = card?.querySelector(".flip-inner");
        if (!inner) return;

        // Disable flip on desktop
        if (desktopMQ.matches) {
          inner.classList.remove("flipped");
          btn.setAttribute("aria-pressed", "false");
          return;
        }

        const flipped = inner.classList.toggle("flipped");
        btn.setAttribute("aria-pressed", flipped ? "true" : "false");
      };

      root.addEventListener("click", (e) => {
        const btn = e.target.closest(".infoBox");
        if (btn && root.contains(btn)) toggle(btn);
      });

      root.addEventListener("keydown", (e) => {
        const btn = e.target.closest(".infoBox");
        if (!btn || !root.contains(btn)) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(btn);
        }
      });
    }

    const projectCardHTML = (p) => {
      const {
        name = "",
        description = "",
        image = "",
        liveLink = "",
        sourceCode = "",
        techStack = [],
      } = p;
      return `
        <section class="projectCard">
          <h3 class="project-title">${escapeHTML(name)}</h3>
          <article class="flip" aria-live="polite">
            <section class="flip-inner">
              <article class="flip-front">
                <img src="${escapeHTML(image)}" alt="${escapeHTML(
        name
      )}" class="project-img" />
              </article>
              <article class="flip-back">
                <section class="description-flex">
                  <p class="description">${escapeHTML(description)}</p>
                  <ul class="tech-list">
                    ${techStack
                      .map((t) => `<li class="tech-item">${escapeHTML(t)}</li>`)
                      .join("")}
                  </ul>
                </section>
              </article>
            </section>
          </article>
          <article class="links-flex">
            <button class="infoBox" type="button" aria-pressed="false" title="More info">
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
              <span class="sr-only">Toggle details</span>
            </button>
            <a href="${escapeHTML(
              sourceCode
            )}" class="githubLink" aria-label="Source code on GitHub" target="_blank" rel="noopener noreferrer">
              <i class="fa-brands fa-github" aria-hidden="true"></i>
            </a>
            <a href="${escapeHTML(
              liveLink
            )}" class="siteLink" aria-label="Open live site" target="_blank" rel="noopener noreferrer">
              <i class="fa-solid fa-square-arrow-up-right" aria-hidden="true"></i>
            </a>
          </article>
        </section>
      `;
    };

    fetch("/assets/data/projects.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const projects = Array.isArray(data.projects) ? data.projects : [];
        if (!projects.length) return;

        const maxAttr = parseInt(container.dataset.max || "0", 10);
        const list = maxAttr > 0 ? projects.slice(0, maxAttr) : projects;

        container.innerHTML = list.map(projectCardHTML).join("");
        wireFlip(container);
        if (desktopMQ.matches) resetAllFlips(container);
      })
      .catch((err) => console.error("Project fetch error:", err));
  })();
});
