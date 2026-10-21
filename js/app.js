const STORE_KEY = "folio-display-v1";
const CONTENT_KEY = "folio-content-v1";
const NAV = {
  about: ["index.html", "nav.about"],
  research: ["research.html", "nav.research"],
  publications: ["publications.html", "nav.publications"],
  talks: ["talks.html", "nav.talks"],
  teaching: ["teaching.html", "nav.teaching"],
};
const ACTIVE = { home: "about", project: "research", paper: "publications" };
const ORDERED = /^\d+\.\s+/;
const BULLET = /^[-*]\s+/;

const state = { pubFilter: "all", talkFilter: "all", teachFilter: "all" };
let actionsBound = false;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function localized(map, lang) {
  if (!map) return "";
  if (typeof map === "string") return map;
  const value = map[lang];
  if (typeof value === "string" && value.trim()) return value;
  return typeof map.en === "string" ? map.en : "";
}

function isLocalHost() {
  return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

function blankLocal() {
  return {
    publications: {},
    addedPublications: [],
    talkEdits: {},
    addedTalks: [],
    courses: [],
    courseEdits: {},
    news: [],
    newsEdits: {},
    aboutSections: [],
    aboutEdits: {},
    keywords: { en: [], fr: [] },
    keywordEdits: { en: {}, fr: {} },
    projects: [],
    projectEdits: {},
    style: { accent: "", ink: "", bg: "", frame: "", fontSize: "", extra: "" },
  };
}

function normalizeLocal(data) {
  const blank = blankLocal();
  if (!data || typeof data !== "object" || Array.isArray(data)) return blank;
  const style = data.style && typeof data.style === "object" ? data.style : {};
  return {
    publications: data.publications && typeof data.publications === "object" && !Array.isArray(data.publications) ? data.publications : {},
    addedPublications: Array.isArray(data.addedPublications) ? data.addedPublications : [],
    talkEdits: data.talkEdits && typeof data.talkEdits === "object" && !Array.isArray(data.talkEdits) ? data.talkEdits : {},
    addedTalks: Array.isArray(data.addedTalks) ? data.addedTalks : [],
    courses: Array.isArray(data.courses) ? data.courses : [],
    courseEdits: data.courseEdits && typeof data.courseEdits === "object" && !Array.isArray(data.courseEdits) ? data.courseEdits : {},
    news: Array.isArray(data.news) ? data.news : [],
    newsEdits: data.newsEdits && typeof data.newsEdits === "object" && !Array.isArray(data.newsEdits) ? data.newsEdits : {},
    aboutSections: Array.isArray(data.aboutSections) ? data.aboutSections : [],
    aboutEdits: data.aboutEdits && typeof data.aboutEdits === "object" && !Array.isArray(data.aboutEdits) ? data.aboutEdits : {},
    keywords: {
      en: Array.isArray(data.keywords?.en) ? data.keywords.en : [],
      fr: Array.isArray(data.keywords?.fr) ? data.keywords.fr : [],
    },
    keywordEdits: {
      en: data.keywordEdits?.en && typeof data.keywordEdits.en === "object" ? data.keywordEdits.en : {},
      fr: data.keywordEdits?.fr && typeof data.keywordEdits.fr === "object" ? data.keywordEdits.fr : {},
    },
    projects: Array.isArray(data.projects) ? data.projects : [],
    projectEdits: data.projectEdits && typeof data.projectEdits === "object" && !Array.isArray(data.projectEdits) ? data.projectEdits : {},
    style: { ...blank.style, ...style },
  };
}

function buildCss(style) {
  if (!style) return "";
  const hex = /^#[0-9a-fA-F]{6}$/;
  const root = [];
  if (hex.test(style.accent || "")) {
    root.push(`--accent: ${style.accent};`);
    root.push(`--accent-soft: color-mix(in srgb, ${style.accent} 16%, white);`);
  }
  if (hex.test(style.ink || "")) root.push(`--ink: ${style.ink};`);
  if (hex.test(style.bg || "")) root.push(`--bg: ${style.bg};`);
  const frame = Number(style.frame);
  if (frame >= 36 && frame <= 80) root.push(`--frame: ${frame}rem;`);
  const lines = [];
  if (root.length) lines.push(`:root {\n  ${root.join("\n  ")}\n}`);
  if (hex.test(style.accent || "")) {
    lines.push(`[data-mode="dark"] {\n  --accent-soft: color-mix(in srgb, ${style.accent} 24%, black);\n}`);
  }
  const size = Number(style.fontSize);
  if (size >= 0.9 && size <= 1.4) lines.push(`body { font-size: ${size}rem; }`);
  const extra = String(style.extra || "").replace(/<\/style/gi, "");
  if (extra.trim()) lines.push(extra.trim());
  return lines.length ? `${lines.join("\n\n")}\n` : "";
}

function applyCustomStyle() {
  const css = buildCss(SITE.local?.style);
  let node = document.getElementById("folio-custom");
  if (!css) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement("style");
    node.id = "folio-custom";
    document.head.appendChild(node);
  }
  node.textContent = css;
}

function dropCourse(list, university, year, courseName) {
  if (!Array.isArray(list)) return;
  list.forEach((block) => {
    if (block.university !== university || block.year !== year) return;
    (block.semesters || []).forEach((semester) => {
      semester.courses = (semester.courses || []).filter((course) => course.course !== courseName);
    });
    block.semesters = (block.semesters || []).filter((semester) => (semester.courses || []).length);
  });
}

function applyCourseEdits(content, edits) {
  Object.values(edits || {}).forEach((edit) => {
    const source = edit?.source;
    if (!source?.course) return;
    ["en", "fr"].forEach((lang) => {
      dropCourse(content.teaching?.[lang], source.university, source.year, source.course);
      const label = lang === "fr" ? (edit.semesterFr || edit.semesterEn || "Semestre") : (edit.semesterEn || "Semester");
      const level = lang === "fr" ? (edit.levelFr || edit.levelEn || "") : (edit.levelEn || "");
      insertCourse(content.teaching?.[lang], edit.university, edit.year, label, {
        course: edit.course,
        lecturer: edit.lecturer,
        hours: edit.hours,
        department: edit.department,
        level,
      });
    });
  });
}

function applyAboutEdit(section, edit, lang) {
  const title = lang === "fr" ? edit.titleFr : edit.titleEn;
  const paragraphs = lang === "fr" ? edit.paragraphsFr : edit.paragraphsEn;
  const items = lang === "fr" ? edit.itemsFr : edit.itemsEn;
  const next = { title: title || "" };
  if (items?.length) next.items = items;
  else next.paragraphs = paragraphs || [];
  if (!next.title && !(next.paragraphs || next.items || []).length) return section;
  return next;
}

function applyKeywordEdits(words, edits) {
  return (words || []).map((word) => (edits && Object.prototype.hasOwnProperty.call(edits, word) ? edits[word] : word)).filter(Boolean);
}

function applyProjectEdit(project, edit) {
  const next = structuredClone(project);
  ["en", "fr"].forEach((lang) => {
    if (!edit[lang]) return;
    next[lang] = { ...(next[lang] || {}), title: edit[lang].title, summary: edit[lang].summary };
    if (edit.replaceBody) next[lang].sections = edit[lang].sections || [];
  });
  return next;
}

function insertCourse(list, university, year, label, course) {
  if (!Array.isArray(list) || !course.course) return;
  let block = list.find((item) => item.university === university && item.year === year);
  if (!block) {
    block = { university, year, semesters: [] };
    list.unshift(block);
  }
  let semester = block.semesters.find((item) => item.label === label);
  if (!semester) {
    semester = { label, courses: [] };
    block.semesters.unshift(semester);
  }
  semester.courses.unshift(course);
}

function newsItem(item, lang) {
  const text = item?.[lang] || {};
  if (item.type === "text") {
    if (!String(text.body || "").trim()) return null;
    return { type: "text", body: text.body };
  }
  if (item.type === "link") {
    if (!item.href) return null;
    return { type: "link", href: item.href, label: text.label || item.href, prefix: text.prefix || "" };
  }
  if (item.type === "publication") {
    if (!item.pubId) return null;
    return { type: "publication", id: item.pubId, prefix: text.prefix || "" };
  }
  if (item.type === "talk") {
    if (!String(text.title || "").trim()) return null;
    return {
      type: "talk",
      title: text.title,
      event: text.event || "",
      date: text.date || "",
      location: text.location || "",
      href: item.href || "",
      prefix: text.prefix || "",
    };
  }
  return null;
}

function applyLocal(content, local) {
  if (!local) return;
  const known = new Set(content.publications.map((item) => item.id));
  content.publications = content.publications.map((item) => (
    local.publications?.[item.id] ? structuredClone(local.publications[item.id]) : item
  ));
  const added = (local.addedPublications || []).filter((item) => item?.id && !known.has(item.id));
  content.publications = [...added.map((item) => structuredClone(item)), ...content.publications];

  content.talks = content.talks.map((item) => (
    local.talkEdits?.[item.title] ? structuredClone(local.talkEdits[item.title]) : item
  ));
  content.talks = [...(local.addedTalks || []).map((item) => structuredClone(item)), ...content.talks];

  applyCourseEdits(content, local.courseEdits);

  [...(local.courses || [])].reverse().forEach((course) => {
    insertCourse(content.teaching.en, course.university, course.year, course.semesterEn || "Semester", {
      course: course.course,
      lecturer: course.lecturer,
      hours: course.hours,
      department: course.department,
      level: course.levelEn || "",
    });
    insertCourse(content.teaching.fr, course.university, course.year, course.semesterFr || course.semesterEn || "Semestre", {
      course: course.course,
      lecturer: course.lecturer,
      hours: course.hours,
      department: course.department,
      level: course.levelFr || course.levelEn || "",
    });
  });

  const newsEn = [];
  const newsFr = [];
  Object.entries(local.newsEdits || {}).forEach(([index, edit]) => {
    const place = Number(index);
    const en = newsItem(edit, "en");
    const fr = newsItem(edit, "fr");
    if (en && content.announcement?.en?.items) content.announcement.en.items[place] = en;
    if (fr && content.announcement?.fr?.items) content.announcement.fr.items[place] = fr;
  });
  (local.news || []).forEach((item) => {
    const en = newsItem(item, "en");
    const fr = newsItem(item, "fr");
    if (en) newsEn.push(en);
    if (fr) newsFr.push(fr);
  });
  if (content.announcement?.en) content.announcement.en.items = [...newsEn, ...(content.announcement.en.items || [])];
  if (content.announcement?.fr) content.announcement.fr.items = [...newsFr, ...(content.announcement.fr.items || [])];

  Object.entries(local.aboutEdits || {}).forEach(([index, edit]) => {
    const place = Number(index);
    if (content.about?.en?.sections?.[place]) content.about.en.sections[place] = applyAboutEdit(content.about.en.sections[place], edit, "en");
    if (content.about?.fr?.sections?.[place]) content.about.fr.sections[place] = applyAboutEdit(content.about.fr.sections[place], edit, "fr");
  });
  (local.aboutSections || []).forEach((section) => {
    const en = (section.paragraphsEn || []).filter(Boolean);
    const fr = (section.paragraphsFr || []).filter(Boolean);
    if (content.about?.en?.sections && (section.titleEn || en.length)) {
      content.about.en.sections.push({ title: section.titleEn || "", paragraphs: en });
    }
    if (content.about?.fr?.sections && (section.titleFr || fr.length)) {
      content.about.fr.sections.push({ title: section.titleFr || "", paragraphs: fr });
    }
  });

  if (Array.isArray(content.keywords?.en)) content.keywords.en = applyKeywordEdits(content.keywords.en, local.keywordEdits?.en);
  if (Array.isArray(content.keywords?.fr)) content.keywords.fr = applyKeywordEdits(content.keywords.fr, local.keywordEdits?.fr);
  (local.keywords?.en || []).forEach((word) => {
    if (word && Array.isArray(content.keywords?.en) && !content.keywords.en.includes(word)) content.keywords.en.push(word);
  });
  (local.keywords?.fr || []).forEach((word) => {
    if (word && Array.isArray(content.keywords?.fr) && !content.keywords.fr.includes(word)) content.keywords.fr.push(word);
  });

  content.projects = content.projects.map((project) => (
    local.projectEdits?.[project.slug] ? applyProjectEdit(project, local.projectEdits[project.slug]) : project
  ));
  const slugs = new Set(content.projects.map((item) => item.slug));
  (local.projects || []).forEach((project) => {
    if (!project?.slug || slugs.has(project.slug)) return;
    content.projects.unshift(structuredClone(project));
    slugs.add(project.slug);
  });
}

function mergeDisplay(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === "object") {
    const merged = {};
    for (const key of Object.keys(base)) merged[key] = mergeDisplay(base[key], over?.[key]);
    return merged;
  }
  return over === undefined ? base : over;
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(path);
  return response.json();
}

async function loadOptional(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(path);
  return response.json();
}

function showError(message) {
  const main = document.getElementById("content");
  if (main) main.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
}

function applyAppearance() {
  const appearance = SITE.display.appearance || {};
  let mode = appearance.mode || "light";
  if (mode === "system") {
    mode = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.accent = appearance.accent || "forest";
  document.documentElement.dataset.density = appearance.density || "regular";
  document.documentElement.dataset.mode = mode;
  applyCustomStyle();
}

function initAnalytics() {
  if (window.self !== window.top) return;
  const cfg = SITE.display.analytics;
  if (!cfg?.enabled) return;
  if (cfg.provider === "clarity" && cfg.clarityProjectId && !window.clarity) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = `https://www.clarity.ms/tag/${i}`;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", cfg.clarityProjectId);
  }
  if (cfg.provider === "google" && cfg.googleAnalyticsId && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.googleAnalyticsId);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.googleAnalyticsId)}`;
    document.head.appendChild(script);
  }
}

function monogram(name) {
  const parts = String(name).replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderChrome() {
  const lang = getLang();
  document.documentElement.lang = lang;
  const profile = SITE.content.profile;
  const page = document.body.dataset.page;
  const active = ACTIVE[page] || page;
  const links = (SITE.display.navigation?.items || [])
    .filter((item) => item.enabled && NAV[item.id])
    .map((item) => {
      const [href, key] = NAV[item.id];
      const current = item.id === active ? ` aria-current="page"` : "";
      return `<li><a href="${href}"${current}>${escapeHtml(t(key))}</a></li>`;
    })
    .join("");

  document.getElementById("topbar").innerHTML = `
    <div class="frame topbar-inner">
      <a class="brand" href="index.html">${escapeHtml(profile.name)}</a>
      <button type="button" class="menu-btn" aria-expanded="false" aria-controls="nav-list" aria-label="${escapeHtml(t("a11y.openMenu"))}">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-list" id="nav-list">
        ${links}
        <li><button type="button" class="lang-btn" id="lang-toggle">${escapeHtml(t("lang.switchTo"))}</button></li>
      </ul>
    </div>`;

  const skip = document.querySelector(".skip");
  if (skip) skip.textContent = t("a11y.skip");

  const year = new Date().getFullYear();
  const updated = SITE.display.footer?.showUpdated && profile.lastUpdated
    ? `<p class="fine">${escapeHtml(t("footer.updated"))} ${escapeHtml(profile.lastUpdated)}</p>`
    : "";
  document.getElementById("colophon").innerHTML = `
    <div class="frame footer-inner">
      <p>© ${year} ${escapeHtml(profile.name)}</p>
      ${updated}
    </div>`;

  const titleKey = {
    home: null,
    research: "research.title",
    publications: "pub.title",
    talks: "talks.title",
    teaching: "teaching.title",
    studio: "studio.title",
  }[page];
  if (page !== "paper" && page !== "project") {
    document.title = titleKey ? `${t(titleKey)} — ${profile.name}` : profile.name;
  }
}

const SOCIAL_ICONS = {
  email: `<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M4.4 7.2 12 12.3l7.6-5.1"/>`,
  scholar: `<path d="M3 10.2 12 5.2l9 5-9 5-9-5z"/><path d="M7.2 12.4V16c0 1.5 2.1 2.8 4.8 2.8s4.8-1.3 4.8-2.8v-3.6"/>`,
  orcid: `<circle cx="12" cy="12" r="8.2"/><path d="M8.7 9.1h.1M8.7 11.4V16M11.4 11.4h2a1.8 1.8 0 0 1 0 3.6h-2"/>`,
  github: `<path d="M12 2.2A9.8 9.8 0 0 0 2.2 12.1c0 4.4 2.8 8.1 6.7 9.4.5.1.7-.2.7-.5v-1.7c-2.7.6-3.3-1.2-3.3-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.5-1.1-4.5-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1a9.6 9.6 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.5 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5a9.8 9.8 0 0 0 6.7-9.4A9.8 9.8 0 0 0 12 2.2z"/>`,
  linkedin: `<path d="M5.7 9.2H3.2V20.5h2.5V9.2zM4.4 3.6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM20.8 20.5h-2.5v-5.5c0-1.5-.5-2.5-1.9-2.5-1 0-1.6.7-1.8 1.4-.1.2-.1.6-.1.9v5.7h-2.5s.1-9.3 0-10.3h2.5v1.5c.4-.7 1.3-1.7 3.1-1.7 2.3 0 4 1.5 4 4.7v5.8z"/>`,
};

function socialIcon(name) {
  const filled = name === "github" || name === "linkedin";
  const attrs = filled
    ? `fill="currentColor"`
    : `fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true" ${attrs}>${SOCIAL_ICONS[name]}</svg>`;
}

function socialSquare(href, label, name, extra = "") {
  const marks = { cv: "CV", hal: "HAL" };
  const body = marks[name] ? `<span class="social-mark">${marks[name]}</span>` : socialIcon(name);
  return `<a class="social-sq" href="${escapeHtml(href)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${extra}>${body}</a>`;
}

function socialLinks() {
  const home = SITE.display.home;
  if (!home.showSocial) return "";
  const profile = SITE.content.profile;
  const flags = home.social || {};
  const items = [];
  if (flags.email && profile.email) items.push(socialSquare(`mailto:${profile.email}`, t("home.email"), "email"));
  if (flags.scholar && profile.social?.scholar) items.push(socialSquare(profile.social.scholar, t("social.scholar"), "scholar", ` target="_blank" rel="noopener noreferrer"`));
  if (flags.orcid && profile.social?.orcid) items.push(socialSquare(profile.social.orcid, t("social.orcid"), "orcid", ` target="_blank" rel="noopener noreferrer"`));
  if (flags.github && profile.social?.github) items.push(socialSquare(profile.social.github, t("social.github"), "github", ` target="_blank" rel="noopener noreferrer"`));
  if (flags.linkedin && profile.social?.linkedin) items.push(socialSquare(profile.social.linkedin, t("social.linkedin"), "linkedin", ` target="_blank" rel="noopener noreferrer"`));
  if (flags.cv && profile.cv) items.push(socialSquare(profile.cv, t("social.cv"), "cv", ` download`));
  if (flags.halCv && profile.halCv) items.push(socialSquare(profile.halCv, t("social.halCv"), "hal", ` target="_blank" rel="noopener noreferrer"`));
  if (!items.length) return "";
  return `<div class="social">${items.join("")}</div>`;
}

function renderIdentity() {
  const lang = getLang();
  const profile = SITE.content.profile;
  const hero = profile.hero?.[lang] || profile.hero?.en || {};
  const lines = SITE.display.home.showRole
    ? [hero.label, hero.role, hero.affiliation].filter((line) => typeof line === "string" && line.trim())
    : [];
  const photo = SITE.display.home.showPhoto && profile.photo
    ? `<img class="portrait" src="${escapeHtml(profile.photo)}" alt="${escapeHtml(profile.name)}">`
    : "";
  return `<header class="identity">
    <div>
      <h1>${escapeHtml(profile.name)}</h1>
      ${lines.map((line) => `<p class="role">${escapeHtml(line)}</p>`).join("")}
      ${socialLinks()}
    </div>
    ${photo}
  </header>`;
}

function renderAbout() {
  const data = SITE.content.about[getLang()] || SITE.content.about.en;
  return (data?.sections || []).map((section) => {
    const title = section.title ? `<h2 class="subhead">${escapeHtml(section.title)}</h2>` : "";
    const paragraphs = (section.paragraphs || []).map((paragraph) => `<div class="reading"><p>${paragraph}</p></div>`).join("");
    const items = section.items?.length
      ? `<ul class="reading">${section.items.map((item) => `<li>${item}</li>`).join("")}</ul>`
      : "";
    return `${title}${paragraphs}${items}`;
  }).join("");
}

function renderNewsItem(item) {
  if (item.type === "text") {
    return `<li><span class="news-k"></span><span class="reading">${formatBody(item.body || "")}</span></li>`;
  }
  if (item.type === "publication") {
    const pub = SITE.content.publications.find((entry) => entry.id === item.id);
    if (!pub) return "";
    const url = pub.links?.hal || pub.links?.doi || pub.links?.arxiv || pub.links?.code || "";
    const title = url
      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pub.title)}</a>`
      : escapeHtml(pub.title);
    const meta = [pub.authors, pub.venue].filter(Boolean).join(", ");
    return `<li><span class="news-k">${escapeHtml(item.prefix || "")}</span><span><span class="news-title">${title}</span>${meta ? `<span class="news-meta">${escapeHtml(meta)}</span>` : ""}</span></li>`;
  }
  if (item.type === "talk") {
    const title = item.href
      ? `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title || "")}</a>`
      : escapeHtml(item.title || "");
    const meta = [item.event, item.prefix ? item.date : "", item.location].filter(Boolean).join(" · ");
    return `<li><span class="news-k">${escapeHtml(item.prefix || item.date || "")}</span><span><span class="news-title">${title}</span>${meta ? `<span class="news-meta">${escapeHtml(meta)}</span>` : ""}</span></li>`;
  }
  if (item.type === "link" && item.href) {
    const label = item.label || item.text || item.href;
    return `<li><span class="news-k">${escapeHtml(item.prefix || "")}</span><span><a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></span></li>`;
  }
  return "";
}

function renderNews() {
  if (SITE.content.announcement?.enabled === false) return "";
  const block = SITE.content.announcement?.[getLang()] || SITE.content.announcement?.en;
  const items = (block?.items || []).map(renderNewsItem).filter(Boolean);
  if (!items.length) return "";
  const title = block.title ? `<h2 class="subhead">${escapeHtml(block.title)}</h2>` : "";
  return `<section>${title}<ul class="news">${items.join("")}</ul></section>`;
}

function renderInterests() {
  if (SITE.content.keywords?.enabled === false) return "";
  const words = SITE.content.keywords?.[getLang()] || SITE.content.keywords?.en || [];
  if (!words.length) return "";
  return `<section><h2 class="subhead">${escapeHtml(t("home.interests"))}</h2><ul class="interests">${words.map((word) => `<li>${escapeHtml(word)}</li>`).join("")}</ul></section>`;
}

function renderContact() {
  const profile = SITE.content.profile;
  const contact = profile.contact?.[getLang()] || profile.contact?.en || {};
  const office = (contact.officeLines || []).map((line) => escapeHtml(line)).join("<br>");
  const note = contact.note ? `<div class="reading"><p>${escapeHtml(contact.note)}</p></div>` : "";
  return `<section id="contact"><h2 class="subhead">${escapeHtml(t("home.contact"))}</h2><div class="contact">
    <p><span class="label">${escapeHtml(t("home.email"))}</span> <a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a></p>
    <p><span class="label">${escapeHtml(t("home.office"))}</span> <span>${office}</span></p>
  </div>${note}</section>`;
}

function visiblePubs() {
  const hidden = new Set(SITE.display.publications?.hiddenIds || []);
  return SITE.content.publications.filter((pub) => !hidden.has(pub.id));
}

function visibleProjects() {
  const hidden = new Set(SITE.display.research?.hiddenSlugs || []);
  const shown = new Set(SITE.display.research?.shownSlugs || []);
  return SITE.content.projects.filter((project) => {
    if (hidden.has(project.slug)) return false;
    if (shown.has(project.slug)) return true;
    return project.visible !== false;
  });
}

function visibleTalks() {
  const hidden = new Set(SITE.display.talks?.hiddenTitles || []);
  return SITE.content.talks.filter((talk) => !hidden.has(talk.title));
}

function selectedPublications() {
  const pubs = visiblePubs();
  const home = SITE.display.home;
  if (home.selectedMode === "pinned" && home.selectedIds?.length) {
    const byId = new Map(pubs.map((pub) => [pub.id, pub]));
    return home.selectedIds.map((id) => byId.get(id)).filter(Boolean);
  }
  const index = new Map(SITE.content.publications.map((pub, i) => [pub.id, i]));
  return [...pubs]
    .sort((a, b) => b.year - a.year || index.get(a.id) - index.get(b.id))
    .slice(0, home.selectedCount || 4);
}

function authorHtml(authors) {
  return escapeHtml(authors);
}

function bibAuthors(authors) {
  return String(authors || "")
    .split(/\s*,\s*|\s+and\s+/i)
    .map((name) => name.trim())
    .filter(Boolean)
    .join(" and ");
}

function buildBibtex(pub) {
  const types = { journal: "article", proceeding: "inproceedings", thesis: "phdthesis", preprint: "misc" };
  const entry = types[pub.category] || "misc";
  const fields = [["title", pub.title], ["author", bibAuthors(pub.authors)]];
  if (pub.category === "journal") fields.push(["journal", pub.venue]);
  else if (pub.category === "proceeding") fields.push(["booktitle", pub.venue]);
  else if (pub.category === "thesis") fields.push(["school", pub.venue]);
  else if (pub.venue) fields.push(["howpublished", pub.venue]);
  ["volume", "number", "pages", "year"].forEach((key) => fields.push([key, pub[key]]));
  const url = pub.links?.doi || pub.links?.hal || pub.links?.arxiv || "";
  if (url) fields.push(["url", url]);
  const body = fields
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `  ${key} = {${value}}`)
    .join(",\n");
  return `@${entry}{${pub.id},\n${body}\n}`;
}

function chipLink(url, label, externalLink = true) {
  if (!url) return "";
  const extra = externalLink ? ` target="_blank" rel="noopener noreferrer"` : "";
  return `<a class="chip" href="${escapeHtml(url)}"${extra}>${escapeHtml(label)}</a>`;
}

function pubActions(pub, uid, withOverview = true, withAbstract = true) {
  const cfg = SITE.display.publications;
  const lang = getLang();
  const parts = [];
  if (cfg.showHal) parts.push(chipLink(pub.links?.hal, "HAL"));
  if (cfg.showArxiv) parts.push(chipLink(pub.links?.arxiv, "arXiv"));
  if (cfg.showDoi) parts.push(chipLink(pub.links?.doi, "DOI"));
  if (cfg.showCode) parts.push(chipLink(pub.links?.code, "Code"));
  const overview = pub.overview?.[lang]?.sections?.length || pub.overview?.en?.sections?.length;
  if (withOverview && cfg.showOverview && overview) {
    parts.push(chipLink(`paper.html?id=${encodeURIComponent(pub.id)}`, t("pub.overview"), false));
  }
  const abstract = localized(pub.abstract, lang);
  let panels = "";
  if (withAbstract && cfg.showAbstract && abstract.trim()) {
    parts.push(`<button type="button" class="chip" data-fold="abs-${uid}" aria-expanded="false">${escapeHtml(t("pub.abstract"))}</button>`);
    panels += `<div class="fold abstract reading" id="abs-${uid}" hidden>${formatBody(escapeHtml(abstract))}</div>`;
  }
  if (cfg.showBibtex) {
    const bib = buildBibtex(pub);
    parts.push(`<button type="button" class="chip" data-fold="bib-${uid}" aria-expanded="false">${escapeHtml(t("pub.bib"))}</button>`);
    panels += `<div class="fold" id="bib-${uid}" hidden><button type="button" class="chip" data-copy="bibtext-${uid}">${escapeHtml(t("pub.copy"))}</button><pre id="bibtext-${uid}"><code>${escapeHtml(bib)}</code></pre></div>`;
  }
  return { chips: parts.filter(Boolean).join(""), panels };
}

function itemTitle(text, num) {
  const body = num == null
    ? `<span class="title-text">${text}</span>`
    : `<span class="title-index">${num}</span><span class="title-sep" aria-hidden="true">-</span><span class="title-text">${text}</span>`;
  return `<h3 class="entry-title">${body}</h3>`;
}

function pubArticle(pub, uid, num = null) {
  const meta = pub.venue ? `${authorHtml(pub.authors)}, <em>${escapeHtml(pub.venue)}</em>` : authorHtml(pub.authors);
  const actions = pubActions(pub, uid);
  return `<article class="entry" id="pub-${escapeHtml(pub.id)}">${itemTitle(escapeHtml(pub.title), num)}<p class="entry-meta">${meta}</p><div class="chips">${actions.chips}</div>${actions.panels}</article>`;
}

function sortByYear(items, indexOf) {
  return [...items].sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0) || indexOf(a) - indexOf(b));
}

function bibGroup(label, items, renderItem) {
  if (!items.length) return "";
  return `<section class="bib-group"><h2 class="bib-cat">${escapeHtml(label)}</h2><div class="bib-list">${items.map(renderItem).join("")}</div></section>`;
}

function pageHead(title) {
  return `<header class="page-head"><h1>${escapeHtml(title)}</h1></header>`;
}

function listLines(text, pattern) {
  const lines = String(text || "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length || !lines.every((line) => pattern.test(line))) return null;
  return lines;
}

function listHtml(lines, tag, pattern) {
  return `<${tag}>${lines.map((line) => `<li>${line.replace(pattern, "")}</li>`).join("")}</${tag}>`;
}

function formatBodyBlock(block) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return "";
  if (lines.every((line) => ORDERED.test(line))) return listHtml(lines, "ol", ORDERED);
  if (lines.every((line) => BULLET.test(line))) return listHtml(lines, "ul", BULLET);
  if (lines.length === 1) return `<p>${lines[0]}</p>`;
  return lines.map((line) => `<p>${line}</p>`).join("");
}

function formatBody(text) {
  if (!text) return "";
  return String(text).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).map(formatBodyBlock).join("");
}

function figure(inner, caption, size) {
  const known = ["small", "medium", "large", "full"];
  const sizeClass = known.includes(size) ? size : "medium";
  return `<figure class="figure size-${sizeClass}">${inner}${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
}

function renderVideo(src) {
  const match = String(src).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (match) {
    return `<div class="video"><iframe src="https://www.youtube.com/embed/${match[1]}" title="Video" allowfullscreen loading="lazy"></iframe></div>`;
  }
  return `<video class="video-file" controls preload="metadata" src="${escapeHtml(src)}"></video>`;
}

function renderBlock(block) {
  if (block.type === "text") return `<div class="reading">${formatBody(block.body)}</div>`;
  if (block.type === "math") return `<div class="math-display">$$${escapeHtml(block.tex || "")}$$</div>`;
  if (block.type === "image") {
    return figure(`<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}">`, block.caption, block.size);
  }
  if (block.type === "gallery") {
    const images = block.images || [];
    const grid = images.map((image) => `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || "")}">`).join("");
    return figure(`<div class="gallery">${grid}</div>`, block.caption, block.size);
  }
  if (block.type === "video") {
    return figure(renderVideo(block.src), block.caption, "full");
  }
  return "";
}

function renderBlocks(blocks) {
  let html = "";
  let pending = null;
  const flush = () => {
    if (!pending) return;
    const pattern = pending.type === "ol" ? ORDERED : BULLET;
    html += `<div class="reading">${listHtml(pending.lines, pending.type, pattern)}</div>`;
    pending = null;
  };
  (blocks || []).forEach((block) => {
    if (block.type === "text") {
      const ordered = listLines(block.body, ORDERED);
      const bullets = ordered ? null : listLines(block.body, BULLET);
      const type = ordered ? "ol" : bullets ? "ul" : "";
      const lines = ordered || bullets;
      if (type) {
        if (pending?.type === type) pending.lines.push(...lines);
        else {
          flush();
          pending = { type, lines: [...lines] };
        }
        return;
      }
    }
    flush();
    html += renderBlock(block);
  });
  flush();
  return html;
}

function sectionBlocks(section) {
  if (section.blocks?.length) return section.blocks;
  if (section.body) return [{ type: "text", body: section.body }];
  return [];
}

function renderSection(section) {
  const heading = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : "";
  return `<section class="block">${heading}${renderBlocks(sectionBlocks(section))}</section>`;
}

function typeset(root) {
  if (!root || typeof renderMathInElement !== "function") return;
  const options = {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    throwOnError: false,
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
  };
  root.querySelectorAll(".reading, .math-display, .lede").forEach((node) => {
    try { renderMathInElement(node, options); } catch (error) { console.error(error); }
  });
}

function watchImages(root) {
  root.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      const fallback = document.createElement("div");
      if (img.classList.contains("portrait")) {
        fallback.className = "portrait fallback";
        fallback.textContent = monogram(SITE.content.profile.name);
      } else {
        fallback.className = "fig-fallback";
        fallback.textContent = img.alt || "";
      }
      img.replaceWith(fallback);
    });
  });
}

function finish(root) {
  typeset(root);
  watchImages(root);
}

function renderHome() {
  const parts = [renderIdentity()];
  (SITE.display.home.sections || []).forEach((section) => {
    if (!section.enabled) return;
    if (section.id === "about") parts.push(`<div class="about">${renderAbout()}</div>`);
    if (section.id === "news") parts.push(renderNews());
    if (section.id === "interests") parts.push(renderInterests());
    if (section.id === "selected") {
      const pubs = selectedPublications();
      if (!pubs.length) return;
      parts.push(`<section><div class="subhead-row"><h2 class="subhead">${escapeHtml(t("home.selected"))}</h2><a href="publications.html">${escapeHtml(t("home.all"))}</a></div><div class="bib-list">${pubs.map((pub) => pubArticle(pub, `home-${pub.id}`)).join("")}</div></section>`);
    }
    if (section.id === "contact") parts.push(renderContact());
  });
  const root = document.getElementById("content");
  root.innerHTML = parts.join("");
  finish(root);
}

function renderResearch() {
  const lang = getLang();
  const parts = [pageHead(t("research.title"))];
  if (SITE.display.research.showThemes) {
    const themes = (SITE.content.research?.[lang] || SITE.content.research?.en)?.themes || [];
    if (themes.length) {
      parts.push(`<h2 class="subhead">${escapeHtml(t("research.themes"))}</h2>`);
      parts.push(themes.map((theme) => `<article class="theme"><h3>${escapeHtml(theme.title)}</h3><p>${escapeHtml(theme.body)}</p></article>`).join(""));
    }
  }
  if (SITE.display.research.showProjects) {
    const projects = visibleProjects();
    parts.push(`<h2 class="subhead">${escapeHtml(t("research.projects"))}</h2>`);
    parts.push(projects.map((project, index) => {
      const data = project[lang] || project.en;
      return `<a class="project-row" href="project.html?p=${encodeURIComponent(project.slug)}"><span class="idx">${String(index + 1).padStart(2, "0")}</span><span><span class="project-title">${escapeHtml(data.title)}</span><span class="project-summary">${escapeHtml(data.summary)}</span></span></a>`;
    }).join(""));
  }
  const root = document.getElementById("content");
  root.innerHTML = parts.join("");
  finish(root);
}

function renderProject() {
  const slug = new URLSearchParams(location.search).get("p");
  const project = SITE.content.projects.find((item) => item.slug === slug);
  const root = document.getElementById("content");
  if (!project) {
    root.innerHTML = pageHead(t("research.title")) + `<p class="error">${escapeHtml(t("project.missing"))}</p>`;
    return;
  }
  const lang = getLang();
  const data = project[lang] || project.en;
  document.title = `${data.title} — ${SITE.content.profile.name}`;
  const related = (data.relatedIds || [])
    .map((id) => SITE.content.publications.find((pub) => pub.id === id))
    .filter(Boolean);
  const relatedHtml = related.length
    ? `<h2 class="subhead">${escapeHtml(t("project.related"))}</h2><div class="bib-list">${related.map((pub) => pubArticle(pub, `rel-${pub.id}`)).join("")}</div>`
    : "";
  root.innerHTML = `
    <a class="back" href="research.html">${escapeHtml(t("project.back"))}</a>
    <header class="page-head"><h1>${escapeHtml(data.title)}</h1><p class="lede">${escapeHtml(data.summary)}</p></header>
    ${(data.sections || []).map(renderSection).join("")}
    ${relatedHtml}`;
  finish(root);
}

function filters(kinds, current, labels) {
  return `<div class="filters">${kinds.map((kind) => {
    const on = kind === current;
    return `<button type="button" class="filter${on ? " is-on" : ""}" data-filter="${escapeHtml(kind)}" aria-pressed="${on}">${escapeHtml(labels[kind])}</button>`;
  }).join("")}</div>`;
}

function groupPubs(pubs, mode) {
  const index = new Map(SITE.content.publications.map((pub, i) => [pub.id, i]));
  const byDate = (a, b) => b.year - a.year || index.get(a.id) - index.get(b.id);
  if (mode === "category") {
    const order = ["journal", "preprint", "proceeding", "thesis", "other"];
    const groups = new Map(order.map((key) => [key, []]));
    pubs.forEach((pub) => {
      const key = pub.category || "other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(pub);
    });
    return [...groups]
      .filter(([, items]) => items.length)
      .map(([key, items]) => ({ label: t(`pub.${key}`), named: true, items: items.sort(byDate) }));
  }
  const sorted = [...pubs].sort(byDate);
  const byYear = new Map();
  sorted.forEach((pub) => {
    if (!byYear.has(pub.year)) byYear.set(pub.year, []);
    byYear.get(pub.year).push(pub);
  });
  return [...byYear].map(([year, items]) => ({ label: String(year), named: false, items }));
}

function renderGroups(groups, article, emptyKey = "pub.empty") {
  if (!groups.length) return `<p class="error">${escapeHtml(t(emptyKey))}</p>`;
  return groups.map((group) => {
    const heading = group.label ? `<h2 class="year-label">${escapeHtml(String(group.label))}</h2>` : "";
    return `<section class="year-block${group.named ? " named" : ""}">${heading}<div>${group.items.map((item, index) => article(item, index)).join("")}</div></section>`;
  }).join("");
}

function renderPublications() {
  const pubs = visiblePubs();
  const order = new Map(SITE.content.publications.map((pub, i) => [pub.id, i]));
  const present = ["journal", "preprint", "proceeding", "thesis", "other"].filter((kind) => pubs.some((pub) => (pub.category || "other") === kind));
  const filter = present.includes(state.pubFilter) ? state.pubFilter : "all";
  state.pubFilter = filter;
  const shown = (filter === "all" ? pubs : pubs.filter((pub) => (pub.category || "other") === filter))
    .sort((a, b) => b.year - a.year || order.get(a.id) - order.get(b.id));
  const labels = { all: t("pub.all") };
  present.forEach((kind) => { labels[kind] = t(`pub.${kind}`); });
  const numbered = filter === "journal" || filter === "proceeding";
  const list = shown.length
    ? `<div class="bib-list">${shown.map((pub, index) => pubArticle(pub, pub.id, numbered ? index + 1 : null)).join("")}</div>`
    : `<p class="error">${escapeHtml(t("pub.empty"))}</p>`;
  const root = document.getElementById("content");
  root.innerHTML = pageHead(t("pub.title")) + filters(["all", ...present], filter, labels) + list;
  finish(root);
}

function talkType(talk) {
  return talk.type === "invited" ? "conference" : (talk.type || "other");
}

function talkMeta(talk) {
  const lang = getLang();
  let month = talk.month;
  if (typeof month === "number") month = UI[lang].months[month - 1] || "";
  const date = month || "";
  return [talk.event, date, talk.location].filter((part) => part != null && part !== "").map((part) => escapeHtml(part)).join(" · ");
}

function talkArticle(talk, index, num) {
  const links = [];
  if (talk.links?.slides) links.push(chipLink(talk.links.slides, t("talks.slides")));
  if (talk.links?.video) links.push(chipLink(talk.links.video, t("talks.video")));
  if (talk.links?.poster) links.push(chipLink(talk.links.poster, t("talks.poster")));
  if (talk.links?.website) links.push(chipLink(talk.links.website, t("talks.website")));
  const abstract = localized(talk.abstract, getLang());
  let panel = "";
  if (SITE.display.talks.showAbstract && abstract.trim()) {
    links.push(`<button type="button" class="chip" data-fold="talk-${index}" aria-expanded="false">${escapeHtml(t("talks.abstract"))}</button>`);
    panel = `<div class="fold reading" id="talk-${index}" hidden>${formatBody(escapeHtml(abstract))}</div>`;
  }
  return `<article class="entry">${itemTitle(escapeHtml(talk.title), num)}<p class="entry-meta">${talkMeta(talk)}</p><div class="chips">${links.join("")}</div>${panel}</article>`;
}

function groupTalks(talks) {
  const index = new Map(SITE.content.talks.map((talk, i) => [talk.title, i]));
  const sorted = [...talks].sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0) || index.get(a.title) - index.get(b.title));
  if (SITE.display.talks.groupBy === "type") {
    const order = ["conference", "seminar", "workshop", "other"];
    const groups = new Map(order.map((key) => [key, []]));
    sorted.forEach((talk) => {
      const key = talkType(talk);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(talk);
    });
    return [...groups].filter(([, items]) => items.length).map(([key, items]) => ({ label: t(`talks.${key}`), named: true, items }));
  }
  return [{ label: "", named: true, items: sorted }];
}

function renderTalks() {
  const talks = visibleTalks();
  const present = ["conference", "seminar", "workshop", "other"].filter((kind) => talks.some((talk) => talkType(talk) === kind));
  const filter = present.includes(state.talkFilter) ? state.talkFilter : "all";
  state.talkFilter = filter;
  const shown = filter === "all" ? talks : talks.filter((talk) => talkType(talk) === filter);
  const labels = { all: t("talks.all") };
  present.forEach((kind) => { labels[kind] = t(`talks.${kind}`); });
  let count = 0;
  const root = document.getElementById("content");
  root.innerHTML = pageHead(t("talks.title"))
    + filters(["all", ...present], filter, labels)
    + renderGroups(groupTalks(shown), (talk) => talkArticle(talk, count++), "talks.empty");
  finish(root);
}

function teachingYears(rows) {
  const seen = [];
  rows.forEach((row) => {
    const year = String(row.year || "");
    if (year && !seen.includes(year)) seen.push(year);
  });
  const start = (year) => {
    const match = String(year).match(/\d{4}/);
    return match ? Number(match[0]) : 0;
  };
  return seen.sort((a, b) => start(b) - start(a) || String(b).localeCompare(String(a)));
}

function renderTeaching() {
  const rows = SITE.content.teaching[getLang()] || SITE.content.teaching.en || [];
  const years = teachingYears(rows);
  const filter = years.includes(state.teachFilter) ? state.teachFilter : "all";
  state.teachFilter = filter;
  const shown = filter === "all" ? rows : rows.filter((row) => row.year === filter);
  const labels = { all: t("teaching.all") };
  years.forEach((year) => { labels[year] = year; });
  const flags = SITE.display.teaching;
  const html = shown.map((institution) => {
    const semesters = (institution.semesters || []).map((semester) => {
      const courses = (semester.courses || []).map((course) => {
        const meta = [
          flags.showLecturer ? ["teaching.lecturer", course.lecturer] : null,
          flags.showHours ? ["teaching.hours", course.hours] : null,
          flags.showDepartment ? ["teaching.department", course.department] : null,
          flags.showLevel ? ["teaching.level", course.level] : null,
        ].filter((pair) => pair && pair[1]);
        return `<article class="course"><h3>${escapeHtml(course.course)}</h3>${meta.map(([key, value]) => `<p><span>${escapeHtml(t(key))}</span> ${escapeHtml(value)}</p>`).join("")}</article>`;
      }).join("");
      return `<h3 class="semester">${escapeHtml(semester.label)}</h3>${courses}`;
    }).join("");
    return `<section class="inst"><header class="inst-head"><h2>${escapeHtml(institution.university)}</h2><p>${escapeHtml(institution.year)}</p></header>${semesters}</section>`;
  }).join("") || `<p class="error">${escapeHtml(t("teaching.empty"))}</p>`;
  const root = document.getElementById("content");
  root.innerHTML = pageHead(t("teaching.title")) + filters(["all", ...years], filter, labels) + html;
  finish(root);
}

function renderPaper() {
  const id = new URLSearchParams(location.search).get("id");
  const pub = SITE.content.publications.find((item) => item.id === id);
  const lang = getLang();
  const overview = pub?.overview?.[lang] || pub?.overview?.en;
  const root = document.getElementById("content");
  if (!pub || !overview?.sections?.length) {
    root.innerHTML = `<p class="error">${escapeHtml(t("paper.missing"))}</p>`;
    return;
  }
  document.title = `${pub.title} — ${SITE.content.profile.name}`;
  const paper = SITE.display.paper || {};
  const abstract = localized(pub.abstract, lang);
  const actions = pubActions(pub, `paper-${pub.id}`, false, false);
  const abstractHtml = SITE.display.publications.showAbstract && abstract.trim()
    ? `<h2 class="subhead">${escapeHtml(t("pub.abstract"))}</h2><div class="reading">${formatBody(escapeHtml(abstract))}</div>`
    : "";
  root.innerHTML = `
    <a class="back" href="publications.html">${escapeHtml(t("paper.back"))}</a>
    <article class="font-${escapeHtml(paper.font || "serif")} math-${escapeHtml(paper.mathFont || "katex")} size-${escapeHtml(paper.size || "m")}">
      <header class="page-head">
        <p class="kind">${escapeHtml(t(`pub.${pub.category || "other"}`))}</p>
        <h1>${escapeHtml(pub.title)}</h1>
        <p class="entry-meta">${authorHtml(pub.authors)}</p>
        ${pub.venue ? `<p class="entry-meta"><em>${escapeHtml(pub.venue)}</em></p>` : ""}
        <div class="chips">${actions.chips}</div>
        ${actions.panels}
      </header>
      ${abstractHtml}
      ${overview.sections.map(renderSection).join("")}
    </article>`;
  finish(root);
}

function renderCurrentPage() {
  const page = document.body.dataset.page;
  const y = window.scrollY;
  if (page === "home") renderHome();
  else if (page === "research") renderResearch();
  else if (page === "project") renderProject();
  else if (page === "publications") renderPublications();
  else if (page === "talks") renderTalks();
  else if (page === "teaching") renderTeaching();
  else if (page === "paper") renderPaper();
  if (page === "publications" || page === "talks" || page === "teaching") window.scrollTo(0, y);
}

function bindActions() {
  if (actionsBound) return;
  actionsBound = true;
  document.body.addEventListener("click", async (event) => {
    if (event.target.closest("#lang-toggle")) {
      setLanguage(getLang() === "en" ? "fr" : "en");
      return;
    }
    const menu = event.target.closest(".menu-btn");
    if (menu) {
      const list = document.getElementById("nav-list");
      const open = list.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
      return;
    }
    if (event.target.closest("#nav-list a")) {
      document.getElementById("nav-list")?.classList.remove("open");
    }
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      const page = document.body.dataset.page;
      if (page === "publications") state.pubFilter = filter.dataset.filter;
      if (page === "talks") state.talkFilter = filter.dataset.filter;
      if (page === "teaching") state.teachFilter = filter.dataset.filter;
      renderCurrentPage();
      return;
    }
    const fold = event.target.closest("[data-fold]");
    if (fold) {
      const panel = document.getElementById(fold.dataset.fold);
      if (!panel) return;
      const willOpen = panel.hasAttribute("hidden");
      panel.toggleAttribute("hidden", !willOpen);
      fold.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) typeset(panel);
      return;
    }
    const copy = event.target.closest("[data-copy]");
    if (copy) {
      const node = document.getElementById(copy.dataset.copy);
      if (!node) return;
      const original = copy.textContent;
      try { await navigator.clipboard.writeText(node.textContent); }
      catch { /* clipboard may be unavailable */ }
      copy.textContent = t("pub.copied");
      setTimeout(() => { copy.textContent = original; }, 1400);
    }
  });
}

function setLanguage(lang) {
  localStorage.setItem("folio-lang", lang);
  renderChrome();
  if (document.body.dataset.page === "studio" && typeof renderStudio === "function") renderStudio();
  else renderCurrentPage();
}

function saveDisplay(next) {
  localStorage.setItem(STORE_KEY, JSON.stringify(next));
  SITE.display = next;
  applyAppearance();
  renderChrome();
}

function downloadDisplay(next) {
  const blob = new Blob([`${JSON.stringify(next, null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "display.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function resetDisplay() {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(CONTENT_KEY);
  location.reload();
}

function touchLocal() {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(SITE.local));
  applyCustomStyle();
}

function syncContent() {
  SITE.content = structuredClone(SITE.files);
  applyLocal(SITE.content, SITE.local);
  touchLocal();
}

async function saveToDisk() {
  const css = buildCss(SITE.local.style) || "/* Réglages écrits depuis la page locale Affichage. */\n";
  const response = await fetch("/__folio/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display: SITE.display, local: SITE.local, css }),
  });
  if (!response.ok) throw new Error("save");
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(CONTENT_KEY);
  SITE.fileDisplay = structuredClone(SITE.display);
  SITE.localFile = structuredClone(SITE.local);
}

async function init() {
  if (location.protocol === "file:") {
    showError(t("errors.file"));
    return;
  }
  try {
    const names = ["profile", "about", "keywords", "announcement", "research", "projects", "teaching", "publications", "talks"];
    const content = {};
    const [fileDisplay, fileLocal, loaded] = await Promise.all([
      loadJson("content/display.json"),
      loadOptional("content/local.json"),
      Promise.all(names.map(async (name) => [name, await loadJson(`content/${name}.json`)])),
    ]);
    loaded.forEach(([name, data]) => { content[name] = data; });
    let saved = null;
    let draftLocal = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { saved = null; }
    try { draftLocal = JSON.parse(localStorage.getItem(CONTENT_KEY) || "null"); } catch { draftLocal = null; }
    const local = draftLocal ? normalizeLocal(draftLocal) : normalizeLocal(fileLocal);
    const files = structuredClone(content);
    applyLocal(content, local);
    window.SITE = {
      content,
      files,
      local,
      localFile: normalizeLocal(fileLocal),
      fileDisplay,
      display: saved ? mergeDisplay(fileDisplay, saved) : fileDisplay,
    };
  } catch (error) {
    console.error(error);
    showError(`${t("errors.load")} (${error.message || ""})`.trim());
    return;
  }
  try {
    applyAppearance();
    bindActions();
    renderChrome();
    initAnalytics();
    if (document.body.dataset.page === "studio" && typeof renderStudio === "function") renderStudio();
    else renderCurrentPage();
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (SITE.display.appearance?.mode === "system") applyAppearance();
    });
  } catch (error) {
    console.error(error);
    showError(`${t("errors.render")} ${error.message || ""}`.trim());
  }
}

window.folio = {
  t, getLang, saveDisplay, downloadDisplay, resetDisplay, escapeHtml,
  isLocalHost, syncContent, touchLocal, saveToDisk, buildCss,
};

document.addEventListener("DOMContentLoaded", init);
