/* site.js — load, layout, render */

const NAV = [
  ["home", "index.html", "nav.home"],
  ["research", "research.html", "nav.research"],
  ["publications", "publications.html", "nav.publications"],
  ["talks", "talks.html", "nav.talks"],
  ["teaching", "teaching.html", "nav.teaching"],
  ["contact", "index.html#contact", "nav.contact"],
];
const PUB_ORDER = ["journal", "preprint", "proceeding", "thesis"];
const TALK_ORDER = ["conference", "seminar", "workshop", "other"];

async function loadContent() {
  const files = ["profile", "about", "projects", "teaching", "publications", "talks"];
  const content = {};
  await Promise.all(files.map(async (name) => {
    const res = await fetch(`content/${name}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`content/${name}.json (${res.status})`);
    content[name] = await res.json();
  }));
  window.SITE_CONTENT = content;
}

function showError(msg) {
  const main = document.querySelector("main");
  if (main) main.innerHTML = `<section class="section"><div class="container"><p class="error">${msg}</p></div></section>`;
}

function renderLayout() {
  const lang = getLanguage();
  const { profile } = SITE_CONTENT;
  const active = document.body.dataset.navActive || document.body.dataset.page;
  const links = NAV.map(([page, href, key]) =>
    `<li><a href="${href}" class="${page === active ? "active" : ""}">${t(key, lang)}</a></li>`
  ).join("");

  document.getElementById("site-header").innerHTML = `
    <nav class="nav" aria-label="${t("meta.navLabel", lang)}">
      <a class="brand" href="index.html">${profile.name}</a> 
      
      <button class="menu-btn" aria-expanded="false" aria-controls="nav-menu" aria-label="${t("meta.openMenu", lang)}">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-menu" id="nav-menu">${links}
        <li><button type="button" class="lang-btn" id="lang-toggle">${t("lang.switchTo", lang)}</button></li>
      </ul>
    </nav>`;

  document.getElementById("site-footer").innerHTML = `
    <div class="container footer-inner">
      <p>&copy; ${new Date().getFullYear()} ${profile.name}</p>
      <p class="footer-meta">${t("footer.updated", lang)} ${profile.lastUpdated}${profile.siteUrl ? ` · <a href="${profile.siteUrl}">${profile.siteUrl.replace(/^https?:\/\//, "")}</a>` : ""}</p>
    </div>`;
}

function bindNav() {
  const btn = document.querySelector(".menu-btn");
  const menu = document.querySelector(".nav-menu");
  if (!btn || !menu) return;
  btn.onclick = () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  };
  menu.querySelectorAll("a").forEach((a) => {
    a.onclick = () => { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
  });
}

/* ── Badges & links ── */

function badgeLink(url, label, type = "default") {
  if (!url) return "";
  const upper = label.toUpperCase();
  if (url.startsWith("http") || url.startsWith("/"))
    return `<a class="badge badge-${type}" href="${url}" target="_blank" rel="noopener">${upper}</a>`;
  return `<a class="badge badge-${type}" href="${url}">${upper}</a>`;
}

function badgeBtn(label, targetId, type = "abs") {
  return `<button type="button" class="badge badge-${type} badge-btn" data-target="${targetId}">${label.toUpperCase()}</button>`;
}

function pubLinks(pub, lang, idx) {
  const L = t("publicationsPage", lang);
  const abstract = pub.abstract?.[lang] || pub.abstract?.en || "";
  const absId = `abs-${idx}`;
  const items = [
    badgeLink(pub.links?.hal || pub.links?.pdf, "HAL", "hal"),
    badgeLink(pub.links?.arxiv, "ARXIV", "arxiv"),
    badgeLink(pub.links?.doi, "DOI", "doi"),
    badgeLink(pub.links?.code, "CODE", "code"),
    abstract ? badgeBtn(L.abstract, absId) : "",
  ].filter(Boolean);
  return {
    html: items.length ? `<div class="badges">${items.join("")}</div>` : "",
    absId, abstract,
  };
}

function talkLinks(talk, lang, idx) {
  const L = t("talksPage", lang);
  const abstract = talk.abstract?.[lang] || talk.abstract?.en || "";
  const absId = `talk-abs-${idx}`;
  const items = [
    badgeLink(talk.links?.slides, L.slides, "slides"),
    badgeLink(talk.links?.video, L.video, "video"),
    badgeLink(talk.links?.poster, L.poster, "poster"),
    badgeLink(talk.links?.website, L.website, "website"),
    abstract ? badgeBtn(L.abstract, absId) : "",
  ].filter(Boolean);
  return { html: items.length ? `<div class="badges">${items.join("")}</div>` : "", absId, abstract };
}

function bindBadges(root) {
  root?.querySelectorAll(".badge-btn").forEach((btn) => {
    btn.onclick = () => {
      const panel = document.getElementById(btn.dataset.target);
      if (!panel) return;
      const open = panel.hidden;
      panel.hidden = !open;
      btn.classList.toggle("active", open);
    };
  });
}

function absPanel(id, text) {
  return text ? `<div class="abs-panel" id="${id}" hidden>${text}</div>` : "";
}

function itemIndex(year, num) {
  const inner = num != null
    ? `<span class="num">${num}</span>`
    : `<span class="year">${year}</span>`;
  return `<span class="item-index">${inner}</span>`;
}

function pubItem(pub, lang, idx, num) {
  const { html, absId, abstract } = pubLinks(pub, lang, idx);
  const authorsVenue = pub.venue
    ? `${pub.authors}, <em>${pub.venue}</em>`
    : pub.authors;
  return `<li class="item">
    ${itemIndex(pub.year, num)}
    <div class="item-body">
      <p class="title">${pub.title}</p>
      <p class="meta">${authorsVenue}</p>
      ${html}${absPanel(absId, abstract)}
    </div>
  </li>`;
}

function renderProfileActions(lang) {
  const { profile } = SITE_CONTENT;
  const parts = [`<a class="btn btn-cv" href="${profile.cv}" download>${t("hero.downloadCv", lang)}</a>`];
  if (profile.social.orcid)
    parts.push(`<a class="btn btn-profile btn-orcid" href="${profile.social.orcid}" target="_blank" rel="noopener">ORCID</a>`);
  if (profile.social.scholar)
    parts.push(`<a class="btn btn-profile btn-scholar" href="${profile.social.scholar}" target="_blank" rel="noopener">GOOGLE SCHOLAR</a>`);
  return `<div class="profile-actions">${parts.join("")}</div>`;
}

function findPublication(id) {
  return SITE_CONTENT.publications.find((p) => p.id === id);
}

/* ── Pages ── */

function renderProfileBar(lang) {
  const el = document.getElementById("profile-bar-root");
  if (!el) return;
  const { profile } = SITE_CONTENT;
  const h = profile.hero[lang] || profile.hero.en;
  const photo = profile.photo
    ? `<img class="profile-photo" src="${profile.photo}" alt="${profile.name}">`
    : "";

  el.innerHTML = `
    <div class="container profile-bar-inner">
      ${photo}
      <div class="profile-bar-text">
        <p class="profile-role">${h.label}</p>
        <h1 class="profile-name">${profile.name}</h1>
        ${renderProfileActions(lang)}
      </div>
    </div>`;
}

function renderHero(lang) {
  const el = document.getElementById("hero-root");
  if (!el) return;
  const { profile } = SITE_CONTENT;
  if (profile.showHero === false) { el.hidden = true; return; }
  const h = profile.hero[lang] || profile.hero.en;
  const photo = profile.photo ? `<img src="${profile.photo}" alt="${profile.name}">` : "";
  el.hidden = false;
  el.innerHTML = `
    <div class="hero-text">
      <p class="label">${h.label}</p>
      <h1>${profile.name}</h1>
      ${h.role ? `<p class="role">${h.role}</p>` : ""}
      ${h.affiliation ? `<p class="affiliation">${h.affiliation}</p>` : ""}
      ${renderProfileActions(lang)}
    </div>
    <div class="hero-photo">${photo}</div>`;
}

function renderAbout(lang) {
  const el = document.getElementById("about-root");
  if (!el) return;
  el.innerHTML = pickLang(SITE_CONTENT.about, lang).map((p) => `<p>${p}</p>`).join("");
}

function renderContact(lang) {
  const el = document.getElementById("contact-root");
  if (!el) return;
  const { profile } = SITE_CONTENT;
  const c = profile.contact[lang] || profile.contact.en;
  el.innerHTML = `
    <div class="contact-info">
      <div class="contact-block">
        <span class="contact-label">${t("contact.email", lang)}</span>
        <a href="mailto:${profile.email}">${profile.email}</a>
      </div>
      <div class="contact-block">
        <span class="contact-label">${t("contact.office", lang)}</span>
        <p>${c.officeLines.join("<br>")}</p>
      </div>
    </div>
    <div class="contact-aside">
      <p>${c.note}</p>
      ${renderProfileActions(lang)}
    </div>`;
}

function visibleProjects() {
  return SITE_CONTENT.projects.filter((p) => p.visible !== false);
}

function renderResearch(lang) {
  const el = document.getElementById("research-root");
  if (!el) return;
  const labels = t("researchPage", lang);
  el.innerHTML = visibleProjects().map((p, i) => {
    const data = p[lang] || p.en;
    return `
    <a class="project-card" href="project.html?p=${p.slug}" style="--delay:${i * 0.06}s">
      <span class="project-num">${String(i + 1).padStart(2, "0")}</span>
      <h3>${data.title}</h3>
      <p>${data.summary}</p>
      <span class="project-cta">${labels.explore} →</span>
    </a>`;
  }).join("");
}

function renderVideo(src) {
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) {
    return `<div class="video-wrap"><iframe src="https://www.youtube.com/embed/${yt[1]}" title="Video" allowfullscreen loading="lazy"></iframe></div>`;
  }
  return `<video class="block-video" controls preload="metadata" src="${src}"></video>`;
}

function renderBlock(block) {
  switch (block.type) {
    case "text":
      return `<div class="block-text">${block.body || ""}</div>`;
    case "math":
      return `<div class="block-math">$$${block.tex || ""}$$</div>`;
    case "image":
      return `<figure class="block-media">
        <img src="${block.src}" alt="${block.alt || ""}" loading="lazy">
        ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ""}
      </figure>`;
    case "video":
      return `<figure class="block-media">${renderVideo(block.src)}${block.caption ? `<figcaption>${block.caption}</figcaption>` : ""}</figure>`;
    default:
      return "";
  }
}

function renderSection(section) {
  const blocks = section.blocks || (section.body ? [{ type: "text", body: section.body }] : []);
  const heading = section.heading ? `<h2>${section.heading}</h2>` : "";
  return `<section class="project-block">${heading}${blocks.map(renderBlock).join("")}</section>`;
}

function renderMath(root) {
  if (typeof renderMathInElement !== "function") return;
  renderMathInElement(root, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    throwOnError: false,
  });
}

function renderProject(lang) {
  const el = document.getElementById("project-root");
  if (!el) return;
  const slug = new URLSearchParams(location.search).get("p");
  const project = SITE_CONTENT.projects.find((p) => p.slug === slug);
  if (!project) {
    el.innerHTML = `<p class="error">${lang === "fr" ? "Projet introuvable." : "Project not found."}</p>`;
    return;
  }
  const data = project[lang] || project.en;
  const labels = t("projectPage", lang);
  let idx = 0;
  const related = (data.relatedIds || []).map(findPublication).filter(Boolean)
    .map((pub) => pubItem(pub, lang, `rel-${idx++}`)).join("");

  el.innerHTML = `
    <a class="back-link" href="research.html">${labels.back}</a>
    <header class="project-header">
      <h1>${data.title}</h1>
      <p class="lead">${data.summary}</p>
    </header>
    <div class="project-sections">
      ${data.sections.map(renderSection).join("")}
    </div>
    ${related ? `<section class="project-related"><h2>${labels.related}</h2><ol class="list">${related}</ol></section>` : ""}`;
  bindBadges(el);
  renderMath(el);
}

function renderTeachingMeta(course, labels) {
  const items = [
    ["lecturer", course.lecturer],
    ["hours", course.hours],
    ["department", course.department],
    ["level", course.level],
  ].filter(([, value]) => value);
  if (!items.length) return "";
  return `<div class="teaching-meta">${items
    .map(([key, value]) => `<p class="meta">${labels[key]}: ${value}</p>`)
    .join("")}</div>`;
}

function renderTeachingCourse(course, labels) {
  const meta = renderTeachingMeta(course, labels);
  return `<li class="item teaching-item">
    <div class="item-body">
      <p class="title">${course.course}</p>
      ${meta}
    </div>
  </li>`;
}

function renderTeachingSemester(semester, labels) {
  return `<div class="teaching-semester">
    <h3 class="teaching-semester-head">${semester.label}</h3>
    <ol class="list">${(semester.courses || []).map((c) => renderTeachingCourse(c, labels)).join("")}</ol>
  </div>`;
}

function renderTeachingInstitution(institution, labels) {
  return `<section class="pub-group">
    <h2 class="pub-cat">${institution.university} — ${institution.year}</h2>
    ${(institution.semesters || []).map((s) => renderTeachingSemester(s, labels)).join("")}
  </section>`;
}

function renderTeaching(lang) {
  const el = document.getElementById("teaching-root");
  if (!el) return;
  const labels = t("teachingPage", lang);
  el.innerHTML = pickLang(SITE_CONTENT.teaching, lang)
    .map((inst) => renderTeachingInstitution(inst, labels)).join("");
}

function renderPublications(lang) {
  const el = document.getElementById("publications-root");
  if (!el) return;
  const labels = t("publicationsPage", lang);
  const groups = {};
  SITE_CONTENT.publications.forEach((pub) => {
    const cat = pub.category || "other";
    (groups[cat] ||= []).push(pub);
  });
  Object.values(groups).forEach((arr) => arr.sort((a, b) => b.year - a.year));

  let idx = 0;
  const groupHtml = (cat) => {
    if (!groups[cat]) return "";
    const numbered = cat !== "thesis";
    const items = groups[cat]
      .map((p, i) => pubItem(p, lang, idx++, numbered ? i + 1 : null))
      .join("");
    return `<section class="pub-group">
      <h2 class="pub-cat">${labels.categories[cat] || cat}</h2>
      <ol class="list">${items}</ol>
    </section>`;
  };

  el.innerHTML = `
    <div class="pub-layout">
      <div class="pub-col">${groupHtml("journal")}${groupHtml("preprint")}${groupHtml("thesis")}</div>
      <div class="pub-col">${groupHtml("proceeding")}</div>
    </div>`;
  bindBadges(el);
}

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
};

function talkDate(talk, lang) {
  let month = talk.month;
  if (typeof month === "number") month = MONTHS[lang]?.[month - 1] || "";
  return [month, talk.year].filter(Boolean).join(" ");
}

function talkItem(talk, lang, idx, num) {
  const { html, absId, abstract } = talkLinks(talk, lang, idx);
  const meta = [talk.event, talkDate(talk, lang), talk.location].filter(Boolean).join(" · ");
  return `<li class="item">
    ${itemIndex(talk.year, num)}
    <div class="item-body">
      <p class="title">${talk.title}</p>
      <p class="meta">${meta}</p>
      ${html}${absPanel(absId, abstract)}
    </div>
  </li>`;
}

function renderTalks(lang) {
  const el = document.getElementById("talks-root");
  if (!el) return;
  const labels = t("talksPage", lang);
  const groups = {};
  SITE_CONTENT.talks.forEach((talk) => {
    const type = talk.type || "other";
    (groups[type] ||= []).push(talk);
  });
  Object.values(groups).forEach((arr) =>
    arr.sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0))
  );

  let idx = 0;
  const groupHtml = (types, heading) => {
    const list = types
      .flatMap((type) => groups[type] || [])
      .sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0));
    if (!list.length) return "";
    const items = list.map((tk, i) => talkItem(tk, lang, idx++, i + 1)).join("");
    return `<section class="pub-group">
      <h2 class="pub-cat">${heading}</h2>
      <ol class="list">${items}</ol>
    </section>`;
  };

  el.innerHTML = `
    <div class="pub-layout">
      <div class="pub-col">${groupHtml(["invited", "conference"], labels.types.conference)}</div>
      <div class="pub-col">${groupHtml(["seminar"], labels.types.seminar)}${groupHtml(["workshop"], labels.types.workshop)}${groupHtml(["other"], labels.types.other)}</div>
    </div>`;
  bindBadges(el);
}

function renderPage(lang) {
  lang = lang || getLanguage();
  renderProfileBar(lang);
  renderHero(lang);
  renderAbout(lang);
  renderContact(lang);
  renderResearch(lang);
  renderProject(lang);
  renderTeaching(lang);
  renderPublications(lang);
  renderTalks(lang);
}

async function initSite() {
  try {
    await loadContent();
    renderLayout();
    bindNav();
    initI18n();
    renderPage();
  } catch (err) {
    console.error(err);
    showError(t("errors.loadFailed", getLanguage()));
  }
}

document.addEventListener("DOMContentLoaded", initSite);
