function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const main = document.getElementById("main");
  const header = document.getElementById("header");
  const headerContainer = document.querySelector(".header-container");
  const nav = document.getElementById("nav");

  //   let lastY = window.scrollY;
  //   let scrollTimeout;
  //   window.addEventListener("scroll", () => {
  //     const y = window.scrollY;

  //     if (y < lastY && y >= 100) {
  //       header.classList.add("scrollingUp");
  //       clearTimeout(scrollTimeout);
  //       scrollTimeout = setTimeout(
  //         () => header.classList.remove("scrollingUp"),
  //         3000
  //       );
  //     } else {
  //       header.classList.remove("scrollingUp");
  //     }

  //     if (y >= 100) header.classList.add("active");
  //     else header.classList.remove("active");

  //     lastY = y;
  //   });

  const themeButton = document.getElementById("themeBtn");
  const themeIndicator = document.getElementById("themeIndicator");

  body.classList.add("dark-theme");
  themeIndicator.classList.add("night");

  themeButton.addEventListener("click", () => {
    const dark = body.classList.contains("dark-theme");
    body.classList.toggle("dark-theme", !dark);
    body.classList.toggle("light-theme", dark);

    const night = themeIndicator.classList.contains("night");
    themeIndicator.classList.toggle("night", !night);
    themeIndicator.classList.toggle("day", night);

    localStorage.setItem("theme", dark ? "light-theme" : "dark-theme");
    localStorage.setItem("tod", night ? "day" : "night");
  });

  //   menuBtn.addEventListener("click", () => {
  //     const isOpened = menuBtn.classList.contains("opened");
  //     menuBtn.classList.toggle("opened", !isOpened);
  //     nav.classList.toggle("opened", !isOpened);
  //     menuBtn.setAttribute("aria-expanded", String(!isOpened));
  //   });

  fetch("/assets/data/navLinks.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const navLinks = data?.Links?.[0]?.navLinks ?? [];
      const socialLinks = data?.Links?.[1]?.socialLinks ?? [];

      const navUl = document.getElementById("nav-ul");

      // nav
      navLinks.forEach((link) => {
        const li = document.createElement("li");
        li.className = "nav-li";

        const a = document.createElement("a");
        a.className = "nav-li-a";
        a.href = link.href;

        const span = document.createElement("span");
        span.className = "link-name";
        span.textContent = link.name;

        if (link.icon) {
          const icon = document.createElement("i");
          icon.className = link.icon;
          a.appendChild(icon);
        }

        a.appendChild(span);
        li.appendChild(a);
        navUl.appendChild(li);
      });

      navUl.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          nav.classList.remove("opened");
          menuBtn.classList.remove("opened");
          menuBtn.setAttribute("aria-expanded", "false");
        });
      });

      socialLinks.forEach((link) => {
        const li = document.createElement("li");
        li.className = "social-li";

        const a = document.createElement("a");
        a.className = "social-li-a";
        a.href = link.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        const icon = document.createElement("i");
        if (link.icon) icon.className = `${link.icon} social-icon`;

        const span = document.createElement("span");
        span.className = "social-text";
        span.textContent = link.name;

        a.append(icon, span);
        li.appendChild(a);
      });
    })
    .catch((err) => console.error("Nav fetch error:", err));

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

      jobs.forEach((job, idx) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "company-tab" + (idx === 0 ? " active" : "");
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        btn.setAttribute("data-index", String(idx));
        btn.textContent =
          job.companyAlias || job.company || `Company ${idx + 1}`;
        btn.addEventListener("click", () => selectJob(idx));
        li.appendChild(btn);
        tabsUl.appendChild(li);
      });

      function renderJob(job) {
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
        renderJob(jobs[index]);
      }

      selectJob(0);
    })
    .catch((err) => console.error("Experience fetch error:", err));

  fetch("/assets/data/skills.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const container = document.getElementById("skillsContainer");
      if (!container) return;

      container.innerHTML = "";
      const frag = document.createDocumentFragment();

      // data.Skills is an array of objects like:
      // { "Technical Skills": [ { "Languages": [...] }, { "Database": [...] }, ... ] }
      // { "Soft Skills": [ {name: "..."} , ... ] }
      (data?.Skills ?? []).forEach((groupObj) => {
        const [groupName, groupVal] = Object.entries(groupObj)[0] || [];
        if (!groupName || !Array.isArray(groupVal)) return;

        // Group heading (e.g., "Technical Skills", "Soft Skills")
        const h2 = document.createElement("h2");
        h2.textContent = groupName;
        frag.appendChild(h2);

        // If this group is "Soft Skills", it's a flat array of {name, logo}
        const isSoftSkills =
          groupName.toLowerCase().includes("soft") &&
          groupVal.every((it) => typeof it === "object" && "name" in it);

        if (isSoftSkills) {
          const ul = document.createElement("ul");
          groupVal.forEach((skill) => {
            const li = document.createElement("li");
            li.textContent = skill.name;
            ul.appendChild(li);
          });
          frag.appendChild(ul);
          return;
        }

        // Otherwise, it's "Technical Skills": an array of subcategory objects
        groupVal.forEach((subcategoryObj) => {
          // Example: { "Languages": [ {name: "..."} , ... ] }
          const [subcategoryName, skillsArr] =
            Object.entries(subcategoryObj)[0] || [];
          if (!subcategoryName || !Array.isArray(skillsArr)) return;

          const h3 = document.createElement("h3");
          h3.textContent = subcategoryName;
          frag.appendChild(h3);

          const ul = document.createElement("ul");
          skillsArr.forEach((skill) => {
            if (!skill?.name) return;
            const li = document.createElement("li");
            li.textContent = skill.name;
            ul.appendChild(li);
          });
          frag.appendChild(ul);
        });
      });

      container.appendChild(frag);
    })
    .catch((err) => console.error("Skills fetch error:", err));

  (function projectsSingle() {
    const container =
      document.getElementById("project-card-container") ||
      document.querySelector("[data-projects]");
    if (!container) return;

    // If you already define escapeHTML globally elsewhere, this won't overwrite it.
    const escapeHTML =
      window.escapeHTML ||
      ((str) =>
        String(str ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;"));

    // Desktop breakpoint (matches your CSS @media min-width:1024px)
    const desktopMQ = window.matchMedia("(min-width: 1024px)");

    function resetAllFlips(root = document) {
      root.querySelectorAll(".flip-inner.flipped").forEach((el) => {
        el.classList.remove("flipped");
      });
      root.querySelectorAll(".infoBox[aria-pressed='true']").forEach((btn) => {
        btn.setAttribute("aria-pressed", "false");
      });
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

        // On desktop: never allow flip
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

        // Optional: limit how many cards to render via data-max on the container
        const maxAttr = parseInt(container.dataset.max || "0", 10);
        const list = maxAttr > 0 ? projects.slice(0, maxAttr) : projects;

        container.innerHTML = list.map(projectCardHTML).join("");
        wireFlip(container);
        if (desktopMQ.matches) resetAllFlips(container);
      })
      .catch((err) => console.error("Project fetch error:", err));
  })();
});
