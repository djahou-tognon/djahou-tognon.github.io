const PREVIEW_PAGES = [
  ["index.html", "nav.about"],
  ["research.html", "nav.research"],
  ["publications.html", "nav.publications"],
  ["talks.html", "nav.talks"],
  ["teaching.html", "nav.teaching"],
];
const SWATCH = { forest: "#1f4e3d", ink: "#1e3a5f", wine: "#7a3142", clay: "#8a4b2f" };

function setPath(object, path, value) {
  const keys = path.split(".");
  let node = object;
  for (let i = 0; i < keys.length - 1; i += 1) node = node[keys[i]];
  node[keys.at(-1)] = value;
}

function fieldSelect(path, label, value, options) {
  const choices = options.map(([id, text]) => `<option value="${escapeHtml(id)}"${id === value ? " selected" : ""}>${escapeHtml(text)}</option>`).join("");
  return `<label class="field">${escapeHtml(label)}<select data-bind="${path}">${choices}</select></label>`;
}

function fieldCheck(path, label, checked) {
  return `<label class="check"><input type="checkbox" data-bind="${path}"${checked ? " checked" : ""}> <span>${escapeHtml(label)}</span></label>`;
}

function orderList(items, attr, labelFor) {
  return items.map((item) => `
    <li class="order-item">
      <label class="check">
        <input type="checkbox" data-${attr}="${escapeHtml(item.id)}"${item.enabled ? " checked" : ""}>
        <span>${escapeHtml(labelFor(item))}</span>
      </label>
      <button type="button" class="mini" data-move="-1" aria-label="${escapeHtml(t("studio.moveUp"))}">↑</button>
      <button type="button" class="mini" data-move="1" aria-label="${escapeHtml(t("studio.moveDown"))}">↓</button>
    </li>`).join("");
}

function projectShown(project, display) {
  if ((display.research.hiddenSlugs || []).includes(project.slug)) return false;
  if ((display.research.shownSlugs || []).includes(project.slug)) return true;
  return project.visible !== false;
}

function fieldText(id, label, value, type = "text") {
  return `<label class="field">${escapeHtml(label)}<input type="${type}" id="${id}" value="${escapeHtml(value ?? "")}"></label>`;
}

function fieldArea(id, label, value) {
  return `<label class="field">${escapeHtml(label)}<textarea id="${id}">${escapeHtml(value ?? "")}</textarea></label>`;
}

function slugify(text) {
  const slug = text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 56);
  return slug || "item";
}

function uniqueId(base, used) {
  let id = base || "item";
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function valueOf(id) {
  return document.getElementById(id)?.value.trim() ?? "";
}

function paragraphsOf(id) {
  return valueOf(id).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}

function wordsOf(id) {
  return valueOf(id).split("\n").map((part) => part.trim()).filter(Boolean);
}

function optionList(items, selected) {
  return items.map(([id, text]) => `<option value="${escapeHtml(id)}"${id === selected ? " selected" : ""}>${escapeHtml(text)}</option>`).join("");
}

function entryRow(label, action, id) {
  const labelKey = String(action).startsWith("restore") ? "studio.restore" : "studio.remove";
  return `<div class="entry"><span>${escapeHtml(label)}</span><button type="button" class="mini-text" data-action="${escapeHtml(action)}" data-id="${escapeHtml(id)}">${escapeHtml(t(labelKey))}</button></div>`;
}

function blankTalk() {
  return {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    title: "",
    event: "",
    location: "",
    type: "conference",
    abstract: { en: "", fr: "" },
    links: { slides: "", video: "", poster: "", website: "" },
  };
}

function courseKey(university, year, course) {
  return `${university}||${year}||${course}`;
}

function fileCourseRows() {
  const en = SITE.files.teaching?.en || [];
  const fr = SITE.files.teaching?.fr || [];
  const rows = [];
  en.forEach((block) => {
    (block.semesters || []).forEach((semester) => {
      (semester.courses || []).forEach((course) => {
        const twin = fr.find((item) => item.university === block.university && item.year === block.year);
        let french = null;
        let frenchLabel = "";
        (twin?.semesters || []).forEach((item) => {
          const found = (item.courses || []).find((entry) => entry.course === course.course);
          if (found) {
            french = found;
            frenchLabel = item.label;
          }
        });
        rows.push({
          key: courseKey(block.university, block.year, course.course),
          university: block.university,
          year: block.year,
          semesterEn: semester.label,
          semesterFr: frenchLabel,
          course: course.course,
          lecturer: course.lecturer || "",
          hours: course.hours || "",
          department: course.department || "",
          levelEn: course.level || "",
          levelFr: french?.level || "",
        });
      });
    });
  });
  return rows;
}

function sectionText(section) {
  if (section?.items?.length) return section.items.join("\n\n");
  return (section?.paragraphs || []).join("\n\n");
}

function newsFromFile(en, fr) {
  const left = en || {};
  const right = fr || {};
  return {
    type: left.type || right.type || "text",
    href: left.href || right.href || "",
    pubId: left.id || right.id || "",
    en: {
      body: left.body || "",
      label: left.label || "",
      prefix: left.prefix || "",
      title: left.title || "",
      event: left.event || "",
      date: left.date || "",
      location: left.location || "",
    },
    fr: {
      body: right.body || "",
      label: right.label || "",
      prefix: right.prefix || "",
      title: right.title || "",
      event: right.event || "",
      date: right.date || "",
      location: right.location || "",
    },
  };
}

function projectPlain(data) {
  return (data?.sections || []).map((section) => {
    const parts = [];
    if (section.heading) parts.push(section.heading);
    if (section.body) parts.push(section.body);
    (section.blocks || []).forEach((block) => {
      if (block.body) parts.push(block.body);
      if (block.tex) parts.push(`$$${block.tex}$$`);
    });
    return parts.filter(Boolean).join("\n\n");
  }).filter(Boolean).join("\n\n");
}

function renderTextPanel() {
  const { publications, talks } = SITE.content;
  const local = SITE.local;
  const pubOptions = [`<option value="">${escapeHtml(t("studio.newArticle"))}</option>`]
    .concat(publications.map((pub) => `<option value="${escapeHtml(pub.id)}">${escapeHtml(`${pub.year} — ${pub.title}`)}</option>`))
    .join("");
  const fileTitles = new Set(SITE.files.talks.map((talk) => talk.title));
  const talkOptions = [`<option value="">${escapeHtml(t("studio.newTalk"))}</option>`]
    .concat(SITE.files.talks.map((talk) => {
      const current = local.talkEdits[talk.title] || talk;
      return `<option value="${escapeHtml(`file:${talk.title}`)}">${escapeHtml(`${current.year} — ${current.title}`)}</option>`;
    }))
    .concat(local.addedTalks.map((talk) => `<option value="${escapeHtml(`add:${talk._localId}`)}">${escapeHtml(`${talk.year} — ${talk.title}`)}</option>`))
    .join("");
  const pubChoices = publications.map((pub) => `<option value="${escapeHtml(pub.id)}">${escapeHtml(pub.title)}</option>`).join("");
  const addedPubs = local.addedPublications.map((pub) => entryRow(`${pub.year} — ${pub.title}`, "remove-pub", pub.id)).join("");
  const editedPubs = Object.keys(local.publications).map((id) => {
    const pub = local.publications[id];
    return entryRow(`${pub.year} — ${pub.title}`, "restore-pub", id);
  }).join("");
  const addedTalks = local.addedTalks.map((talk) => entryRow(`${talk.year} — ${talk.title}`, "remove-talk", talk._localId)).join("");
  const editedTalks = Object.keys(local.talkEdits)
    .filter((title) => fileTitles.has(title))
    .map((title) => entryRow(local.talkEdits[title].title || title, "restore-talk", title))
    .join("");
  const courseOptions = [`<option value="">${escapeHtml(t("studio.newEntry"))}</option>`]
    .concat(fileCourseRows().map((course) => {
      const current = local.courseEdits[course.key] || course;
      return `<option value="${escapeHtml(`file:${course.key}`)}">${escapeHtml(`${current.year} — ${current.course}`)}</option>`;
    }))
    .concat(local.courses.map((course) => `<option value="${escapeHtml(`add:${course._localId}`)}">${escapeHtml(`${course.year} — ${course.course}`)}</option>`))
    .join("");
  const fileNews = SITE.files.announcement?.en?.items || [];
  const fileNewsFr = SITE.files.announcement?.fr?.items || [];
  const newsCount = Math.max(fileNews.length, fileNewsFr.length);
  const newsOptions = [`<option value="">${escapeHtml(t("studio.newEntry"))}</option>`]
    .concat(Array.from({ length: newsCount }, (_, index) => {
      const current = local.newsEdits[String(index)] || newsFromFile(fileNews[index], fileNewsFr[index]);
      const label = current.en?.prefix || current.en?.title || current.en?.body || current.fr?.prefix || current.type;
      return `<option value="${escapeHtml(`file:${index}`)}">${escapeHtml(label)}</option>`;
    }))
    .concat(local.news.map((item) => {
      const label = item.en?.title || item.en?.body || item.en?.label || item.fr?.title || item.pubId || item.type;
      return `<option value="${escapeHtml(`add:${item._localId}`)}">${escapeHtml(label)}</option>`;
    }))
    .join("");
  const fileAbout = SITE.files.about?.en?.sections || [];
  const fileAboutFr = SITE.files.about?.fr?.sections || [];
  const aboutCount = Math.max(fileAbout.length, fileAboutFr.length);
  const aboutOptions = [`<option value="">${escapeHtml(t("studio.newEntry"))}</option>`]
    .concat(Array.from({ length: aboutCount }, (_, index) => {
      const current = local.aboutEdits[String(index)];
      const label = current?.titleEn || fileAbout[index]?.title || fileAboutFr[index]?.title || t("studio.biography");
      return `<option value="${escapeHtml(`file:${index}`)}">${escapeHtml(label)}</option>`;
    }))
    .concat(local.aboutSections.map((section) => `<option value="${escapeHtml(`add:${section._localId}`)}">${escapeHtml(section.titleEn || section.titleFr || t("studio.biography"))}</option>`))
    .join("");
  const wordOptions = [`<option value="">${escapeHtml(t("studio.newEntry"))}</option>`];
  ["en", "fr"].forEach((lang) => {
    (SITE.files.keywords?.[lang] || []).forEach((word) => {
      const shown = local.keywordEdits?.[lang]?.[word] ?? word;
      if (!shown) return;
      wordOptions.push(`<option value="${escapeHtml(`file:${lang}:${word}`)}">${escapeHtml(`${lang.toUpperCase()} — ${shown}`)}</option>`);
    });
    (local.keywords?.[lang] || []).forEach((word) => {
      wordOptions.push(`<option value="${escapeHtml(`add:${lang}:${word}`)}">${escapeHtml(`${lang.toUpperCase()} — ${word}`)}</option>`);
    });
  });
  const projectOptions = [`<option value="">${escapeHtml(t("studio.newEntry"))}</option>`]
    .concat((SITE.files.projects || []).map((project) => {
      const current = local.projectEdits[project.slug] || project;
      return `<option value="${escapeHtml(`file:${project.slug}`)}">${escapeHtml(current.en?.title || current.fr?.title || project.slug)}</option>`;
    }))
    .concat(local.projects.map((project) => `<option value="${escapeHtml(`add:${project.slug}`)}">${escapeHtml(project.en?.title || project.fr?.title || project.slug)}</option>`))
    .join("");
  const addedCourses = local.courses.map((course) => entryRow(`${course.year} — ${course.course}`, "remove-course", course._localId)).join("");
  const editedCourses = Object.entries(local.courseEdits).map(([key, course]) => entryRow(`${course.year} — ${course.course}`, "restore-course", key)).join("");
  const addedNews = local.news.map((item) => entryRow(item.en?.title || item.en?.body || item.en?.label || item.fr?.title || item.pubId || item.type, "remove-news", item._localId)).join("");
  const editedNews = Object.entries(local.newsEdits).map(([index, item]) => entryRow(item.en?.prefix || item.en?.title || item.en?.body || item.type, "restore-news", index)).join("");
  const addedSections = local.aboutSections.map((section) => entryRow(section.titleEn || section.titleFr || t("studio.biography"), "remove-section", section._localId)).join("");
  const editedSections = Object.entries(local.aboutEdits).map(([index, section]) => entryRow(section.titleEn || section.titleFr || t("studio.biography"), "restore-section", index)).join("");
  const addedWords = [...local.keywords.en, ...local.keywords.fr].map((word) => entryRow(word, "remove-word", word)).join("");
  const editedWords = ["en", "fr"].flatMap((lang) => Object.entries(local.keywordEdits?.[lang] || {}).map(([word, next]) => entryRow(`${lang.toUpperCase()} — ${next || word}`, "restore-word", `${lang}:${word}`))).join("");
  const addedProjects = local.projects.map((project) => entryRow(project.en?.title || project.fr?.title || project.slug, "remove-project", project.slug)).join("");
  const editedProjects = Object.entries(local.projectEdits).map(([slug, project]) => entryRow(project.en?.title || project.fr?.title || slug, "restore-project", slug)).join("");

  return `
    <p class="hint">${escapeHtml(t("studio.textsLead"))}</p>
    <details data-detail="article"${sessionStorage.getItem("folio-detail") === "talk" || sessionStorage.getItem("folio-detail") === "course" || sessionStorage.getItem("folio-detail") === "news" || sessionStorage.getItem("folio-detail") === "about" || sessionStorage.getItem("folio-detail") === "interest" || sessionStorage.getItem("folio-detail") === "project" ? "" : " open"}>
      <summary>${escapeHtml(t("studio.article"))}</summary>
      <label class="field">${escapeHtml(t("studio.article"))}<select id="pub-pick">${pubOptions}</select></label>
      ${fieldText("pub-title", t("studio.titleEn").replace(", English", "").replace(", anglais", ""), "")}
      ${fieldText("pub-authors", t("studio.authors"), "")}
      <div class="split">
        ${fieldText("pub-year", t("studio.year"), "", "number")}
        <label class="field">${escapeHtml(t("studio.category"))}<select id="pub-category">${optionList([["journal", t("pub.journal")], ["proceeding", t("pub.proceeding")], ["preprint", t("pub.preprint")], ["thesis", t("pub.thesis")], ["other", t("pub.other")]], "journal")}</select></label>
      </div>
      ${fieldText("pub-venue", t("studio.venue"), "")}
      <div class="split">
        ${fieldText("pub-volume", t("studio.volume"), "")}
        ${fieldText("pub-number", t("studio.number"), "")}
        ${fieldText("pub-pages", t("studio.pages"), "")}
      </div>
      ${fieldArea("pub-abs-en", t("studio.abstractEn"), "")}
      ${fieldArea("pub-abs-fr", t("studio.abstractFr"), "")}
      ${fieldText("pub-hal", "HAL", "")}
      ${fieldText("pub-doi", "DOI", "")}
      ${fieldText("pub-arxiv", "arXiv", "")}
      ${fieldText("pub-code", "Code", "")}
      <input type="hidden" id="pub-origin">
      <button type="button" class="btn" id="pub-save" data-action="save-pub">${escapeHtml(t("studio.addArticle"))}</button>
      ${editedPubs}${addedPubs}
    </details>
    <details data-detail="talk"${sessionStorage.getItem("folio-detail") === "talk" ? " open" : ""}>
      <summary>${escapeHtml(t("studio.talk"))}</summary>
      <label class="field">${escapeHtml(t("studio.talk"))}<select id="talk-pick">${talkOptions}</select></label>
      ${fieldText("talk-title", t("studio.titleEn").replace(", English", "").replace(", anglais", ""), "")}
      ${fieldText("talk-event", t("studio.event"), "")}
      ${fieldText("talk-location", t("studio.place"), "")}
      <div class="split">
        ${fieldText("talk-year", t("studio.year"), "", "number")}
        ${fieldText("talk-month", t("studio.month"), "", "number")}
        <label class="field">${escapeHtml(t("studio.type"))}<select id="talk-type">${optionList([["conference", t("pub.proceeding")], ["seminar", t("talks.seminar")], ["invited", getLang() === "fr" ? "Invité" : "Invited"], ["other", t("pub.other")]], "conference")}</select></label>
      </div>
      ${fieldArea("talk-abs-en", t("studio.abstractEn"), "")}
      ${fieldArea("talk-abs-fr", t("studio.abstractFr"), "")}
      ${fieldText("talk-slides", t("studio.slides"), "")}
      ${fieldText("talk-video", t("studio.video"), "")}
      ${fieldText("talk-poster", t("studio.poster"), "")}
      ${fieldText("talk-website", t("studio.website"), "")}
      <button type="button" class="btn" data-action="save-talk">${escapeHtml(t("studio.addTalk"))}</button>
      ${editedTalks}${addedTalks}
    </details>
    <details data-detail="course"${sessionStorage.getItem("folio-detail") === "course" ? " open" : ""}>
      <summary>${escapeHtml(t("studio.course"))}</summary>
      <label class="field">${escapeHtml(t("studio.correctPick"))}<select id="course-pick">${courseOptions}</select></label>
      ${fieldText("course-name", t("studio.courseName"), "")}
      ${fieldText("course-university", t("studio.university"), "Sorbonne Université")}
      ${fieldText("course-year", t("studio.year"), "")}
      <div class="split">
        ${fieldText("course-sem-en", t("studio.semesterEn"), "")}
        ${fieldText("course-sem-fr", t("studio.semesterFr"), "")}
      </div>
      ${fieldText("course-lecturer", t("studio.lecturer"), "")}
      ${fieldText("course-hours", t("studio.hours"), "")}
      ${fieldText("course-department", t("studio.department"), "")}
      <div class="split">
        ${fieldText("course-level-en", t("studio.levelEn"), "")}
        ${fieldText("course-level-fr", t("studio.levelFr"), "")}
      </div>
      <button type="button" class="btn" id="course-save" data-action="save-course">${escapeHtml(t("studio.addCourse"))}</button>
      ${editedCourses}${addedCourses}
    </details>
    <details data-detail="news"${sessionStorage.getItem("folio-detail") === "news" ? " open" : ""}>
      <summary>${escapeHtml(t("studio.newsItem"))}</summary>
      <label class="field">${escapeHtml(t("studio.correctPick"))}<select id="news-pick">${newsOptions}</select></label>
      <label class="field">${escapeHtml(t("studio.newsKind"))}<select id="news-type">${optionList([["text", t("studio.newsText")], ["link", t("studio.newsLink")], ["publication", t("studio.newsPublication")], ["talk", t("studio.newsTalk")]], "text")}</select></label>
      <div class="split">
        ${fieldText("news-prefix-en", t("studio.prefixEn"), "")}
        ${fieldText("news-prefix-fr", t("studio.prefixFr"), "")}
      </div>
      ${fieldArea("news-body-en", t("studio.bodyEn"), "")}
      ${fieldArea("news-body-fr", t("studio.bodyFr"), "")}
      ${fieldText("news-label-en", t("studio.labelEn"), "")}
      ${fieldText("news-label-fr", t("studio.labelFr"), "")}
      ${fieldText("news-href", t("studio.website"), "")}
      <label class="field">${escapeHtml(t("studio.newsPublication"))}<select id="news-pub"><option value=""></option>${pubChoices}</select></label>
      ${fieldText("news-talk-title", t("studio.talk"), "")}
      ${fieldText("news-event", t("studio.event"), "")}
      ${fieldText("news-date", "Date", "")}
      ${fieldText("news-location", t("studio.place"), "")}
      <button type="button" class="btn" id="news-save" data-action="save-news">${escapeHtml(t("studio.addNews"))}</button>
      ${editedNews}${addedNews}
    </details>
    <details data-detail="about"${sessionStorage.getItem("folio-detail") === "about" ? " open" : ""}>
      <summary>${escapeHtml(t("studio.biography"))}</summary>
      <label class="field">${escapeHtml(t("studio.correctPick"))}<select id="about-pick">${aboutOptions}</select></label>
      <p class="hint">${escapeHtml(t("studio.paragraphHint"))}</p>
      ${fieldText("about-title-en", t("studio.titleEn"), "")}
      ${fieldText("about-title-fr", t("studio.titleFr"), "")}
      ${fieldArea("about-en", t("studio.paragraphsEn"), "")}
      ${fieldArea("about-fr", t("studio.paragraphsFr"), "")}
      <input type="hidden" id="about-kind-en" value="paragraphs">
      <input type="hidden" id="about-kind-fr" value="paragraphs">
      <button type="button" class="btn" id="about-save" data-action="save-about">${escapeHtml(t("studio.addSection"))}</button>
      ${editedSections}${addedSections}
    </details>
    <details data-detail="interest"${sessionStorage.getItem("folio-detail") === "interest" ? " open" : ""}>
      <summary>${escapeHtml(t("studio.interest"))}</summary>
      <label class="field">${escapeHtml(t("studio.correctPick"))}<select id="word-pick">${wordOptions.join("")}</select></label>
      <p class="hint">${escapeHtml(t("studio.wordHint"))}</p>
      ${fieldArea("words-en", t("studio.wordsEn"), "")}
      ${fieldArea("words-fr", t("studio.wordsFr"), "")}
      <button type="button" class="btn" id="words-save" data-action="save-words">${escapeHtml(t("studio.addInterest"))}</button>
      ${editedWords}${addedWords}
    </details>
    <details data-detail="project"${sessionStorage.getItem("folio-detail") === "project" ? " open" : ""}>
      <summary>${escapeHtml(t("studio.project"))}</summary>
      <label class="field">${escapeHtml(t("studio.correctPick"))}<select id="project-pick">${projectOptions}</select></label>
      ${fieldText("project-title-en", t("studio.titleEn"), "")}
      ${fieldText("project-title-fr", t("studio.titleFr"), "")}
      ${fieldArea("project-summary-en", t("studio.summaryEn"), "")}
      ${fieldArea("project-summary-fr", t("studio.summaryFr"), "")}
      ${fieldArea("project-body-en", t("studio.bodyEn"), "")}
      ${fieldArea("project-body-fr", t("studio.bodyFr"), "")}
      <button type="button" class="btn" id="project-save" data-action="save-project">${escapeHtml(t("studio.addProject"))}</button>
      ${editedProjects}${addedProjects}
    </details>`;
}

function renderStylePanel() {
  const style = SITE.local.style || {};
  const color = (id, label, value, fallback) => `
    <label class="check"><input type="checkbox" id="${id}-on"${value ? " checked" : ""}> <span>${escapeHtml(label)}</span></label>
    <input class="color" type="color" id="${id}" value="${escapeHtml(value || fallback)}">`;
  return `
    <p class="hint">${escapeHtml(t("studio.styleLead"))}</p>
    ${color("style-accent", t("studio.useAccent"), style.accent, "#1f4e3d")}
    ${color("style-ink", t("studio.useInk"), style.ink, "#212121")}
    ${color("style-bg", t("studio.useBg"), style.bg, "#ffffff")}
    <label class="field">${escapeHtml(t("studio.column"))}<input type="number" id="style-frame" min="36" max="80" step="0.5" placeholder="48.5" value="${escapeHtml(style.frame || "")}"></label>
    <label class="field">${escapeHtml(t("studio.textSize"))}<input type="number" id="style-size" min="0.9" max="1.4" step="0.01" placeholder="1.06" value="${escapeHtml(style.fontSize || "")}"></label>
    ${fieldArea("style-extra", t("studio.extraCss"), style.extra)}`;
}

function renderStudio() {
  if (!folio.isLocalHost()) {
    document.getElementById("content").innerHTML = `
      <div class="studio-form local-note">
        <h1>${escapeHtml(t("studio.title"))}</h1>
        <p>${escapeHtml(t("studio.localOnly"))}</p>
        <p class="hint">${escapeHtml(t("studio.localHow"))}</p>
      </div>`;
    return;
  }
  const display = SITE.display;
  const { publications, talks, projects } = SITE.content;
  const hiddenPubs = new Set(display.publications.hiddenIds || []);
  const pins = new Set(display.home.selectedIds || []);
  const hiddenTalks = new Set(display.talks.hiddenTitles || []);
  const previewPage = sessionStorage.getItem("folio-preview") || "index.html";

  document.getElementById("content").innerHTML = `
    <div class="studio">
      <form id="studio-form" class="studio-form">
        <h1>${escapeHtml(t("studio.title"))}</h1>
        <p class="studio-lead">${escapeHtml(t("studio.lead"))}</p>
        <div class="studio-actions">
          <button type="button" class="btn" id="studio-save">${escapeHtml(t("studio.saveDisk"))}</button>
          <button type="button" class="btn ghost" id="studio-reset">${escapeHtml(t("studio.reset"))}</button>
        </div>
        <p class="studio-status" id="studio-status" role="status"></p>
        <div class="studio-tabs">
          <button type="button" class="btn ghost" data-tab="display">${escapeHtml(t("studio.tabDisplay"))}</button>
          <button type="button" class="btn ghost" data-tab="texts">${escapeHtml(t("studio.tabTexts"))}</button>
          <button type="button" class="btn ghost" data-tab="style">${escapeHtml(t("studio.tabStyle"))}</button>
        </div>
        <div data-panel="display">

        <fieldset>
          <legend>${escapeHtml(t("studio.appearance"))}</legend>
          <p class="hint">${escapeHtml(t("studio.accent"))}</p>
          <div class="swatches">
            ${Object.entries(SWATCH).map(([id, color]) => `<label class="swatch" style="background:${color}" title="${escapeHtml(t(`studio.${id}`))}"><input type="radio" name="accent" data-bind="appearance.accent" value="${id}"${display.appearance.accent === id ? " checked" : ""}></label>`).join("")}
          </div>
          ${fieldSelect("appearance.mode", t("studio.mode"), display.appearance.mode, [["light", t("studio.light")], ["dark", t("studio.dark")], ["system", t("studio.system")]])}
          ${fieldSelect("appearance.density", t("studio.density"), display.appearance.density, [["compact", t("studio.compact")], ["regular", t("studio.regular")], ["airy", t("studio.airy")]])}
          ${fieldSelect("language", t("studio.language"), display.language, [["en", "English"], ["fr", "Français"]])}
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.navigation"))}</legend>
          <ul class="order">${orderList(display.navigation.items, "nav", (item) => t(`nav.${item.id}`))}</ul>
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.home"))}</legend>
          ${fieldCheck("home.showPhoto", t("studio.photo"), display.home.showPhoto)}
          ${fieldCheck("home.showRole", t("studio.role"), display.home.showRole)}
          ${fieldCheck("home.showSocial", t("studio.social"), display.home.showSocial)}
          ${fieldCheck("home.social.email", t("home.email"), display.home.social.email)}
          ${fieldCheck("home.social.scholar", t("social.scholar"), display.home.social.scholar)}
          ${fieldCheck("home.social.orcid", t("social.orcid"), display.home.social.orcid)}
          ${fieldCheck("home.social.github", t("social.github"), display.home.social.github)}
          ${fieldCheck("home.social.linkedin", t("social.linkedin"), display.home.social.linkedin)}
          ${fieldCheck("home.social.cv", t("social.cv"), display.home.social.cv)}
          ${fieldCheck("home.social.halCv", t("social.halCv"), display.home.social.halCv)}
          <p class="hint">${escapeHtml(t("studio.sections"))}</p>
          <ul class="order">${orderList(display.home.sections, "section", (item) => t(`studio.${item.id}`))}</ul>
          ${fieldSelect("home.selectedMode", t("studio.selectedMode"), display.home.selectedMode, [["recent", t("studio.recent")], ["pinned", t("studio.pinned")]])}
          <label class="field">${escapeHtml(t("studio.count"))}<input type="number" min="1" max="12" data-bind="home.selectedCount" value="${Number(display.home.selectedCount) || 4}"></label>
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.publications"))}</legend>
          ${fieldCheck("publications.showAbstract", t("pub.abstract"), display.publications.showAbstract)}
          ${fieldCheck("publications.showBibtex", t("pub.bib"), display.publications.showBibtex)}
          ${fieldCheck("publications.showOverview", t("pub.overview"), display.publications.showOverview)}
          ${fieldCheck("publications.showHal", "HAL", display.publications.showHal)}
          ${fieldCheck("publications.showDoi", "DOI", display.publications.showDoi)}
          ${fieldCheck("publications.showArxiv", "arXiv", display.publications.showArxiv)}
          ${fieldCheck("publications.showCode", "Code", display.publications.showCode)}
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.research"))}</legend>
          ${fieldCheck("research.showThemes", t("studio.themes"), display.research.showThemes)}
          ${fieldCheck("research.showProjects", t("studio.projects"), display.research.showProjects)}
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.talks"))}</legend>
          ${fieldCheck("talks.showAbstract", t("talks.abstract"), display.talks.showAbstract)}
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.teaching"))}</legend>
          ${fieldCheck("teaching.showLecturer", t("teaching.lecturer"), display.teaching.showLecturer)}
          ${fieldCheck("teaching.showHours", t("teaching.hours"), display.teaching.showHours)}
          ${fieldCheck("teaching.showDepartment", t("teaching.department"), display.teaching.showDepartment)}
          ${fieldCheck("teaching.showLevel", t("teaching.level"), display.teaching.showLevel)}
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.paper"))}</legend>
          ${fieldSelect("paper.font", t("studio.font"), display.paper.font, [["serif", t("studio.serif")], ["sans", t("studio.sans")], ["mono", t("studio.mono")]])}
          ${fieldSelect("paper.mathFont", t("studio.math"), display.paper.mathFont, [["katex", "KaTeX"], ["sans", t("studio.sans")]])}
          ${fieldSelect("paper.size", t("studio.size"), display.paper.size, [["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]])}
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.footer"))}</legend>
          ${fieldCheck("footer.showUpdated", t("studio.updated"), display.footer.showUpdated)}
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.analytics"))}</legend>
          ${fieldCheck("analytics.enabled", t("studio.enabled"), display.analytics.enabled)}
          ${fieldSelect("analytics.provider", t("studio.provider"), display.analytics.provider, [["clarity", "Clarity"], ["google", "Google Analytics"], ["none", "—"]])}
          <label class="field">Clarity<input type="text" data-bind="analytics.clarityProjectId" value="${escapeHtml(display.analytics.clarityProjectId || "")}"></label>
          <label class="field">Google<input type="text" data-bind="analytics.googleAnalyticsId" value="${escapeHtml(display.analytics.googleAnalyticsId || "")}"></label>
        </fieldset>

        <fieldset>
          <legend>${escapeHtml(t("studio.items"))}</legend>
          <details>
            <summary>${escapeHtml(t("studio.publications"))}</summary>
            ${publications.map((pub) => `<label class="check"><input type="checkbox" data-pub="${escapeHtml(pub.id)}"${hiddenPubs.has(pub.id) ? "" : " checked"}> <span>${escapeHtml(`${pub.year} — ${pub.title}`)}</span></label><label class="check"><input type="checkbox" data-pin="${escapeHtml(pub.id)}"${pins.has(pub.id) ? " checked" : ""}> <span class="item-note">${escapeHtml(t("studio.pin"))}</span></label>`).join("")}
          </details>
          <details>
            <summary>${escapeHtml(t("studio.projects"))}</summary>
            ${projects.map((project) => {
              const title = (project.en || project.fr).title;
              const note = project.visible === false ? ` <span class="item-note">(${escapeHtml(t("studio.hiddenInFile"))})</span>` : "";
              return `<label class="check"><input type="checkbox" data-project="${escapeHtml(project.slug)}"${projectShown(project, display) ? " checked" : ""}> <span>${escapeHtml(title)}</span>${note}</label>`;
            }).join("")}
          </details>
          <details>
            <summary>${escapeHtml(t("studio.talks"))}</summary>
            ${talks.map((talk) => `<label class="check"><input type="checkbox" data-talk="${escapeHtml(talk.title)}"${hiddenTalks.has(talk.title) ? "" : " checked"}> <span>${escapeHtml(`${talk.year} — ${talk.title}`)}</span></label>`).join("")}
          </details>
        </fieldset>
        </div>
        <div data-panel="texts" hidden>${renderTextPanel()}</div>
        <div data-panel="style" hidden>${renderStylePanel()}</div>
      </form>
      <div class="preview-col">
        <div class="preview-switch">
          ${PREVIEW_PAGES.map(([href, key]) => `<button type="button" class="btn ghost${href === previewPage ? " is-on" : ""}" data-preview="${href}">${escapeHtml(t(key))}</button>`).join("")}
        </div>
        <div class="preview-frame"><iframe id="preview" title="${escapeHtml(t("studio.preview"))}"></iframe></div>
      </div>
    </div>`;

  const form = document.getElementById("studio-form");
  const status = document.getElementById("studio-status");
  let timer = 0;

  function readForm() {
    const draft = structuredClone(SITE.display);
    form.querySelectorAll("[data-bind]").forEach((el) => {
      if (el.type === "radio" && !el.checked) return;
      const value = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value) : el.value;
      setPath(draft, el.dataset.bind, value);
    });
    draft.home.selectedCount = Math.min(12, Math.max(1, Number(draft.home.selectedCount) || 4));
    draft.navigation.items = [...form.querySelectorAll("[data-nav]")].map((el) => ({ id: el.dataset.nav, enabled: el.checked }));
    draft.home.sections = [...form.querySelectorAll("[data-section]")].map((el) => ({ id: el.dataset.section, enabled: el.checked }));
    draft.publications.hiddenIds = [...form.querySelectorAll("[data-pub]")].filter((el) => !el.checked).map((el) => el.dataset.pub);
    draft.home.selectedIds = [...form.querySelectorAll("[data-pin]:checked")].map((el) => el.dataset.pin);
    draft.talks.hiddenTitles = [...form.querySelectorAll("[data-talk]")].filter((el) => !el.checked).map((el) => el.dataset.talk);
    draft.research.hiddenSlugs = [];
    draft.research.shownSlugs = [];
    form.querySelectorAll("[data-project]").forEach((el) => {
      const project = projects.find((item) => item.slug === el.dataset.project);
      const contentVisible = project?.visible !== false;
      if (el.checked && !contentVisible) draft.research.shownSlugs.push(el.dataset.project);
      if (!el.checked && contentVisible) draft.research.hiddenSlugs.push(el.dataset.project);
    });
    return draft;
  }

  function showPreview(page, reload) {
    sessionStorage.setItem("folio-preview", page);
    form.parentElement.querySelectorAll("[data-preview]").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.preview === page);
    });
    const frame = document.getElementById("preview");
    if (reload && frame.dataset.page === page) {
      try {
        frame.contentWindow.location.reload();
        return;
      } catch { /* fall through */ }
    }
    frame.dataset.page = page;
    frame.src = page;
  }

  function commit() {
    const next = readForm();
    folio.saveDisplay(next);
    status.textContent = t("studio.saved");
    showPreview(sessionStorage.getItem("folio-preview") || "index.html", true);
  }

  function showTab(name) {
    const tab = ["display", "texts", "style"].includes(name) ? name : "display";
    sessionStorage.setItem("folio-studio-tab", tab);
    form.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("is-on", button.dataset.tab === tab));
    form.querySelectorAll("[data-panel]").forEach((panel) => panel.toggleAttribute("hidden", panel.dataset.panel !== tab));
  }

  function refresh(tab, detail) {
    sessionStorage.setItem("folio-studio-tab", tab);
    if (detail) sessionStorage.setItem("folio-detail", detail);
    sessionStorage.setItem("folio-studio-status", t("studio.saved"));
    folio.syncContent();
    renderStudio();
  }

  function fillPublication(id) {
    const pub = id ? SITE.content.publications.find((item) => item.id === id) : null;
    document.getElementById("pub-origin").value = pub?.id || "";
    document.getElementById("pub-title").value = pub?.title || "";
    document.getElementById("pub-authors").value = pub?.authors || "";
    document.getElementById("pub-year").value = pub?.year || "";
    document.getElementById("pub-category").value = pub?.category || "journal";
    document.getElementById("pub-venue").value = pub?.venue || "";
    document.getElementById("pub-volume").value = pub?.volume || "";
    document.getElementById("pub-number").value = pub?.number || "";
    document.getElementById("pub-pages").value = pub?.pages || "";
    document.getElementById("pub-abs-en").value = pub?.abstract?.en || "";
    document.getElementById("pub-abs-fr").value = pub?.abstract?.fr || "";
    document.getElementById("pub-hal").value = pub?.links?.hal || "";
    document.getElementById("pub-doi").value = pub?.links?.doi || "";
    document.getElementById("pub-arxiv").value = pub?.links?.arxiv || "";
    document.getElementById("pub-code").value = pub?.links?.code || "";
    document.getElementById("pub-save").textContent = pub ? t("studio.updateArticle") : t("studio.addArticle");
  }

  function fillTalk(pick) {
    let talk = blankTalk();
    if (pick.startsWith("file:")) {
      const title = pick.slice(5);
      talk = structuredClone(SITE.local.talkEdits[title] || SITE.files.talks.find((item) => item.title === title) || talk);
    } else if (pick.startsWith("add:")) {
      talk = structuredClone(SITE.local.addedTalks.find((item) => item._localId === pick.slice(4)) || talk);
    }
    document.getElementById("talk-title").value = talk.title || "";
    document.getElementById("talk-event").value = talk.event || "";
    document.getElementById("talk-location").value = talk.location || "";
    document.getElementById("talk-year").value = talk.year || "";
    document.getElementById("talk-month").value = talk.month || "";
    document.getElementById("talk-type").value = talk.type || "conference";
    document.getElementById("talk-abs-en").value = talk.abstract?.en || "";
    document.getElementById("talk-abs-fr").value = talk.abstract?.fr || "";
    document.getElementById("talk-slides").value = talk.links?.slides || "";
    document.getElementById("talk-video").value = talk.links?.video || "";
    document.getElementById("talk-poster").value = talk.links?.poster || "";
    document.getElementById("talk-website").value = talk.links?.website || "";
    form.querySelector("[data-action='save-talk']").textContent = pick ? t("studio.updateTalk") : t("studio.addTalk");
  }

  function markCorrection(id, active, addKey) {
    const button = document.getElementById(id);
    if (button) button.textContent = active ? t("studio.saveCorrection") : t(addKey);
  }

  function fillCourse(pick) {
    const blank = {
      course: "", university: "Sorbonne Université", year: "", semesterEn: "", semesterFr: "",
      lecturer: "", hours: "", department: "", levelEn: "", levelFr: "",
    };
    let course = blank;
    if (pick.startsWith("file:")) {
      const key = pick.slice(5);
      course = SITE.local.courseEdits[key] || fileCourseRows().find((item) => item.key === key) || blank;
    } else if (pick.startsWith("add:")) {
      course = SITE.local.courses.find((item) => item._localId === pick.slice(4)) || blank;
    }
    document.getElementById("course-name").value = course.course || "";
    document.getElementById("course-university").value = course.university || "";
    document.getElementById("course-year").value = course.year || "";
    document.getElementById("course-sem-en").value = course.semesterEn || "";
    document.getElementById("course-sem-fr").value = course.semesterFr || "";
    document.getElementById("course-lecturer").value = course.lecturer || "";
    document.getElementById("course-hours").value = course.hours || "";
    document.getElementById("course-department").value = course.department || "";
    document.getElementById("course-level-en").value = course.levelEn || "";
    document.getElementById("course-level-fr").value = course.levelFr || "";
    markCorrection("course-save", Boolean(pick), "studio.addCourse");
  }

  function writeNews(item) {
    document.getElementById("news-type").value = item?.type || "text";
    document.getElementById("news-prefix-en").value = item?.en?.prefix || "";
    document.getElementById("news-prefix-fr").value = item?.fr?.prefix || "";
    document.getElementById("news-body-en").value = item?.en?.body || "";
    document.getElementById("news-body-fr").value = item?.fr?.body || "";
    document.getElementById("news-label-en").value = item?.en?.label || "";
    document.getElementById("news-label-fr").value = item?.fr?.label || "";
    document.getElementById("news-href").value = item?.href || "";
    document.getElementById("news-pub").value = item?.pubId || "";
    document.getElementById("news-talk-title").value = item?.en?.title || item?.fr?.title || "";
    document.getElementById("news-event").value = item?.en?.event || item?.fr?.event || "";
    document.getElementById("news-date").value = item?.en?.date || item?.fr?.date || "";
    document.getElementById("news-location").value = item?.en?.location || item?.fr?.location || "";
  }

  function fillNews(pick) {
    if (pick.startsWith("file:")) {
      const index = pick.slice(5);
      const stored = SITE.local.newsEdits[index];
      const en = SITE.files.announcement?.en?.items?.[Number(index)];
      const fr = SITE.files.announcement?.fr?.items?.[Number(index)];
      writeNews(stored || newsFromFile(en, fr));
    } else if (pick.startsWith("add:")) {
      writeNews(SITE.local.news.find((item) => item._localId === pick.slice(4)));
    } else {
      writeNews(null);
    }
    markCorrection("news-save", Boolean(pick), "studio.addNews");
  }

  function fillAbout(pick) {
    let section = { titleEn: "", titleFr: "", paragraphsEn: "", paragraphsFr: "", kindEn: "paragraphs", kindFr: "paragraphs" };
    if (pick.startsWith("file:")) {
      const index = Number(pick.slice(5));
      const stored = SITE.local.aboutEdits[String(index)];
      const en = SITE.files.about?.en?.sections?.[index] || {};
      const fr = SITE.files.about?.fr?.sections?.[index] || {};
      section = stored ? {
        titleEn: stored.titleEn || "",
        titleFr: stored.titleFr || "",
        paragraphsEn: (stored.itemsEn || stored.paragraphsEn || []).join("\n\n"),
        paragraphsFr: (stored.itemsFr || stored.paragraphsFr || []).join("\n\n"),
        kindEn: stored.itemsEn ? "items" : "paragraphs",
        kindFr: stored.itemsFr ? "items" : "paragraphs",
      } : {
        titleEn: en.title || "",
        titleFr: fr.title || "",
        paragraphsEn: sectionText(en),
        paragraphsFr: sectionText(fr),
        kindEn: en.items?.length ? "items" : "paragraphs",
        kindFr: fr.items?.length ? "items" : "paragraphs",
      };
    } else if (pick.startsWith("add:")) {
      const found = SITE.local.aboutSections.find((item) => item._localId === pick.slice(4));
      if (found) {
        section = {
          titleEn: found.titleEn || "",
          titleFr: found.titleFr || "",
          paragraphsEn: (found.paragraphsEn || []).join("\n\n"),
          paragraphsFr: (found.paragraphsFr || []).join("\n\n"),
          kindEn: "paragraphs",
          kindFr: "paragraphs",
        };
      }
    }
    document.getElementById("about-title-en").value = section.titleEn;
    document.getElementById("about-title-fr").value = section.titleFr;
    document.getElementById("about-en").value = section.paragraphsEn;
    document.getElementById("about-fr").value = section.paragraphsFr;
    document.getElementById("about-kind-en").value = section.kindEn;
    document.getElementById("about-kind-fr").value = section.kindFr;
    markCorrection("about-save", Boolean(pick), "studio.addSection");
  }

  function fillWord(pick) {
    document.getElementById("words-en").value = "";
    document.getElementById("words-fr").value = "";
    if (pick.startsWith("file:") || pick.startsWith("add:")) {
      const [, lang, ...rest] = pick.split(":");
      const original = rest.join(":");
      const shown = pick.startsWith("file:") ? (SITE.local.keywordEdits?.[lang]?.[original] ?? original) : original;
      document.getElementById(lang === "fr" ? "words-fr" : "words-en").value = shown;
    }
    markCorrection("words-save", Boolean(pick), "studio.addInterest");
  }

  function fillProject(pick) {
    let project = null;
    let plainEn = "";
    let plainFr = "";
    if (pick.startsWith("file:")) {
      const slug = pick.slice(5);
      const file = SITE.files.projects.find((item) => item.slug === slug);
      const edit = SITE.local.projectEdits[slug];
      project = edit || file;
      plainEn = edit?.replaceBody ? projectPlain(edit.en) : projectPlain(file?.en);
      plainFr = edit?.replaceBody ? projectPlain(edit.fr) : projectPlain(file?.fr);
      if (edit && !edit.replaceBody) {
        project = {
          en: { ...(file?.en || {}), ...(edit.en || {}) },
          fr: { ...(file?.fr || {}), ...(edit.fr || {}) },
        };
      }
    } else if (pick.startsWith("add:")) {
      project = SITE.local.projects.find((item) => item.slug === pick.slice(4));
      plainEn = projectPlain(project?.en);
      plainFr = projectPlain(project?.fr);
    }
    document.getElementById("project-title-en").value = project?.en?.title || "";
    document.getElementById("project-title-fr").value = project?.fr?.title || "";
    document.getElementById("project-summary-en").value = project?.en?.summary || "";
    document.getElementById("project-summary-fr").value = project?.fr?.summary || "";
    const bodyEn = document.getElementById("project-body-en");
    const bodyFr = document.getElementById("project-body-fr");
    bodyEn.value = plainEn;
    bodyFr.value = plainFr;
    bodyEn.dataset.source = plainEn;
    bodyFr.dataset.source = plainFr;
    markCorrection("project-save", Boolean(pick), "studio.addProject");
  }

  function readStyle() {
    const style = SITE.local.style;
    const take = (id, key) => {
      style[key] = document.getElementById(`${id}-on`).checked ? document.getElementById(id).value : "";
    };
    take("style-accent", "accent");
    take("style-ink", "ink");
    take("style-bg", "bg");
    style.frame = valueOf("style-frame");
    style.fontSize = valueOf("style-size");
    style.extra = document.getElementById("style-extra").value.trim();
    folio.touchLocal();
    status.textContent = t("studio.saved");
    showPreview(sessionStorage.getItem("folio-preview") || "index.html", true);
  }

  function savePublication() {
    const origin = valueOf("pub-origin");
    const existing = origin ? SITE.content.publications.find((item) => item.id === origin) : null;
    const pub = existing ? structuredClone(existing) : {
      id: "",
      year: new Date().getFullYear(),
      title: "",
      authors: "",
      venue: "",
      category: "journal",
      volume: "",
      number: "",
      pages: "",
      abstract: { en: "", fr: "" },
      overview: { en: { sections: [] }, fr: { sections: [] } },
      links: { hal: "", arxiv: "", doi: "", code: "" },
    };
    pub.title = valueOf("pub-title");
    if (!pub.title) {
      status.textContent = t("studio.needTitle");
      return;
    }
    pub.authors = valueOf("pub-authors");
    pub.year = Number(valueOf("pub-year")) || new Date().getFullYear();
    pub.category = document.getElementById("pub-category").value;
    pub.venue = valueOf("pub-venue");
    pub.volume = valueOf("pub-volume");
    pub.number = valueOf("pub-number");
    pub.pages = valueOf("pub-pages");
    pub.abstract = { en: valueOf("pub-abs-en"), fr: valueOf("pub-abs-fr") };
    pub.links = {
      ...(pub.links || {}),
      hal: valueOf("pub-hal"),
      doi: valueOf("pub-doi"),
      arxiv: valueOf("pub-arxiv"),
      code: valueOf("pub-code"),
    };
    if (!pub.id) {
      const used = new Set(SITE.content.publications.map((item) => item.id));
      pub.id = uniqueId(slugify(`${pub.title}-${pub.year}`), used);
    }
    const addedIndex = SITE.local.addedPublications.findIndex((item) => item.id === pub.id);
    if (addedIndex >= 0) SITE.local.addedPublications[addedIndex] = pub;
    else if (SITE.files.publications.some((item) => item.id === pub.id)) SITE.local.publications[pub.id] = pub;
    else SITE.local.addedPublications.unshift(pub);
    refresh("texts", "article");
  }

  function saveTalk() {
    const pick = document.getElementById("talk-pick").value;
    let talk;
    if (pick.startsWith("file:")) {
      const title = pick.slice(5);
      talk = structuredClone(SITE.local.talkEdits[title] || SITE.files.talks.find((item) => item.title === title) || blankTalk());
    } else if (pick.startsWith("add:")) {
      talk = structuredClone(SITE.local.addedTalks.find((item) => item._localId === pick.slice(4)) || blankTalk());
    } else {
      talk = blankTalk();
    }
    talk.title = valueOf("talk-title");
    if (!talk.title) {
      status.textContent = t("studio.needTitle");
      return;
    }
    talk.event = valueOf("talk-event");
    talk.location = valueOf("talk-location");
    talk.year = Number(valueOf("talk-year")) || new Date().getFullYear();
    talk.month = Math.min(12, Math.max(1, Number(valueOf("talk-month")) || 1));
    talk.type = document.getElementById("talk-type").value;
    talk.abstract = { en: valueOf("talk-abs-en"), fr: valueOf("talk-abs-fr") };
    talk.links = {
      slides: valueOf("talk-slides"),
      video: valueOf("talk-video"),
      poster: valueOf("talk-poster"),
      website: valueOf("talk-website"),
    };
    if (pick.startsWith("file:")) SITE.local.talkEdits[pick.slice(5)] = talk;
    else if (pick.startsWith("add:")) {
      const id = pick.slice(4);
      const index = SITE.local.addedTalks.findIndex((item) => item._localId === id);
      talk._localId = id;
      if (index >= 0) SITE.local.addedTalks[index] = talk;
    } else {
      talk._localId = `t-${Date.now()}`;
      SITE.local.addedTalks.unshift(talk);
    }
    refresh("texts", "talk");
  }

  function runAction(action, id) {
    if (action === "save-pub") return savePublication();
    if (action === "save-talk") return saveTalk();
    if (action === "save-course") {
      const course = {
        course: valueOf("course-name"),
        university: valueOf("course-university"),
        year: valueOf("course-year"),
        semesterEn: valueOf("course-sem-en"),
        semesterFr: valueOf("course-sem-fr"),
        lecturer: valueOf("course-lecturer"),
        hours: valueOf("course-hours"),
        department: valueOf("course-department"),
        levelEn: valueOf("course-level-en"),
        levelFr: valueOf("course-level-fr"),
      };
      if (!course.course) {
        status.textContent = t("studio.needTitle");
        return;
      }
      const pick = document.getElementById("course-pick").value;
      if (pick.startsWith("file:")) {
        const key = pick.slice(5);
        const source = fileCourseRows().find((item) => item.key === key);
        if (!source) return;
        SITE.local.courseEdits[key] = { ...course, source: { university: source.university, year: source.year, course: source.course } };
      } else if (pick.startsWith("add:")) {
        const id = pick.slice(4);
        const index = SITE.local.courses.findIndex((item) => item._localId === id);
        if (index >= 0) SITE.local.courses[index] = { ...SITE.local.courses[index], ...course, _localId: id };
      } else {
        SITE.local.courses.unshift({ ...course, _localId: `c-${Date.now()}` });
      }
      refresh("texts", "course");
      return;
    }
    if (action === "save-news") {
      const type = document.getElementById("news-type").value;
      const shared = {
        title: valueOf("news-talk-title"),
        event: valueOf("news-event"),
        date: valueOf("news-date"),
        location: valueOf("news-location"),
      };
      const item = {
        type,
        href: valueOf("news-href"),
        pubId: document.getElementById("news-pub").value,
        en: { body: valueOf("news-body-en"), label: valueOf("news-label-en"), prefix: valueOf("news-prefix-en"), ...shared },
        fr: { body: valueOf("news-body-fr"), label: valueOf("news-label-fr"), prefix: valueOf("news-prefix-fr"), ...shared },
      };
      const emptyText = type === "text" && !item.en.body && !item.fr.body;
      const emptyLink = type === "link" && !item.href;
      const emptyPub = type === "publication" && !item.pubId;
      const emptyTalk = type === "talk" && !item.en.title;
      if (emptyText || emptyLink || emptyPub || emptyTalk) {
        status.textContent = t("studio.needTitle");
        return;
      }
      const pick = document.getElementById("news-pick").value;
      if (pick.startsWith("file:")) SITE.local.newsEdits[pick.slice(5)] = item;
      else if (pick.startsWith("add:")) {
        const id = pick.slice(4);
        const index = SITE.local.news.findIndex((entry) => entry._localId === id);
        if (index >= 0) SITE.local.news[index] = { ...item, _localId: id };
      } else {
        SITE.local.news.unshift({ ...item, _localId: `n-${Date.now()}` });
      }
      refresh("texts", "news");
      return;
    }
    if (action === "save-about") {
      const kindEn = document.getElementById("about-kind-en").value || "paragraphs";
      const kindFr = document.getElementById("about-kind-fr").value || "paragraphs";
      const textEn = paragraphsOf("about-en");
      const textFr = paragraphsOf("about-fr");
      const section = {
        titleEn: valueOf("about-title-en"),
        titleFr: valueOf("about-title-fr"),
        paragraphsEn: kindEn === "items" ? [] : textEn,
        paragraphsFr: kindFr === "items" ? [] : textFr,
        itemsEn: kindEn === "items" ? textEn : null,
        itemsFr: kindFr === "items" ? textFr : null,
      };
      if (!section.titleEn && !section.titleFr && !textEn.length && !textFr.length) {
        status.textContent = t("studio.needTitle");
        return;
      }
      const pick = document.getElementById("about-pick").value;
      if (pick.startsWith("file:")) SITE.local.aboutEdits[pick.slice(5)] = section;
      else if (pick.startsWith("add:")) {
        const id = pick.slice(4);
        const index = SITE.local.aboutSections.findIndex((entry) => entry._localId === id);
        if (index >= 0) {
          SITE.local.aboutSections[index] = {
            _localId: id,
            titleEn: section.titleEn,
            titleFr: section.titleFr,
            paragraphsEn: textEn,
            paragraphsFr: textFr,
          };
        }
      } else {
        SITE.local.aboutSections.push({
          _localId: `a-${Date.now()}`,
          titleEn: section.titleEn,
          titleFr: section.titleFr,
          paragraphsEn: textEn,
          paragraphsFr: textFr,
        });
      }
      refresh("texts", "about");
      return;
    }
    if (action === "save-words") {
      const pick = document.getElementById("word-pick").value;
      if (pick.startsWith("file:") || pick.startsWith("add:")) {
        const [, lang, ...rest] = pick.split(":");
        const original = rest.join(":");
        const next = wordsOf(lang === "fr" ? "words-fr" : "words-en")[0] || "";
        if (!next) {
          status.textContent = t("studio.needTitle");
          return;
        }
        if (pick.startsWith("file:")) SITE.local.keywordEdits[lang][original] = next;
        else {
          const list = SITE.local.keywords[lang];
          const index = list.indexOf(original);
          if (index >= 0) list[index] = next;
        }
      } else {
        const beforeEn = SITE.local.keywords.en.length;
        const beforeFr = SITE.local.keywords.fr.length;
        wordsOf("words-en").forEach((word) => {
          if (!SITE.local.keywords.en.includes(word)) SITE.local.keywords.en.push(word);
        });
        wordsOf("words-fr").forEach((word) => {
          if (!SITE.local.keywords.fr.includes(word)) SITE.local.keywords.fr.push(word);
        });
        if (SITE.local.keywords.en.length === beforeEn && SITE.local.keywords.fr.length === beforeFr) {
          status.textContent = t("studio.needTitle");
          return;
        }
      }
      refresh("texts", "interest");
      return;
    }
    if (action === "save-project") {
      const titleEn = valueOf("project-title-en");
      const titleFr = valueOf("project-title-fr") || titleEn;
      if (!titleEn && !titleFr) {
        status.textContent = t("studio.needTitle");
        return;
      }
      const bodyEn = valueOf("project-body-en");
      const bodyFr = valueOf("project-body-fr");
      const summaryEn = valueOf("project-summary-en");
      const summaryFr = valueOf("project-summary-fr") || summaryEn;
      const pick = document.getElementById("project-pick").value;
      const bodyNodeEn = document.getElementById("project-body-en");
      const bodyNodeFr = document.getElementById("project-body-fr");
      const replaceBody = !pick.startsWith("file:") || bodyEn !== (bodyNodeEn.dataset.source || "") || bodyFr !== (bodyNodeFr.dataset.source || "");
      const language = (title, summary, body) => ({
        title,
        summary,
        sections: body ? [{ heading: "", body }] : [],
      });
      if (pick.startsWith("file:")) {
        const slug = pick.slice(5);
        SITE.local.projectEdits[slug] = {
          replaceBody,
          en: { title: titleEn || titleFr, summary: summaryEn, sections: replaceBody ? language(titleEn || titleFr, summaryEn, bodyEn).sections : [] },
          fr: { title: titleFr || titleEn, summary: summaryFr, sections: replaceBody ? language(titleFr || titleEn, summaryFr, bodyFr).sections : [] },
        };
      } else if (pick.startsWith("add:")) {
        const slug = pick.slice(4);
        const index = SITE.local.projects.findIndex((item) => item.slug === slug);
        if (index >= 0) {
          SITE.local.projects[index] = {
            ...SITE.local.projects[index],
            en: language(titleEn || titleFr, summaryEn, bodyEn),
            fr: language(titleFr || titleEn, summaryFr, bodyFr),
          };
        }
      } else {
        const used = new Set(SITE.content.projects.map((item) => item.slug));
        const slug = uniqueId(slugify(titleEn || titleFr), used);
        SITE.local.projects.unshift({
          slug,
          visible: true,
          en: language(titleEn || titleFr, summaryEn, bodyEn),
          fr: language(titleFr || titleEn, summaryFr, bodyFr),
        });
      }
      refresh("texts", "project");
      return;
    }
    const detail = {
      "remove-pub": "article",
      "restore-pub": "article",
      "remove-talk": "talk",
      "restore-talk": "talk",
      "remove-course": "course",
      "restore-course": "course",
      "remove-news": "news",
      "restore-news": "news",
      "remove-section": "about",
      "restore-section": "about",
      "remove-word": "interest",
      "restore-word": "interest",
      "remove-project": "project",
      "restore-project": "project",
    }[action];
    if (action === "remove-pub") SITE.local.addedPublications = SITE.local.addedPublications.filter((item) => item.id !== id);
    else if (action === "restore-pub") delete SITE.local.publications[id];
    else if (action === "remove-talk") SITE.local.addedTalks = SITE.local.addedTalks.filter((item) => item._localId !== id);
    else if (action === "restore-talk") delete SITE.local.talkEdits[id];
    else if (action === "remove-course") SITE.local.courses = SITE.local.courses.filter((item) => item._localId !== id);
    else if (action === "restore-course") delete SITE.local.courseEdits[id];
    else if (action === "remove-news") SITE.local.news = SITE.local.news.filter((item) => item._localId !== id);
    else if (action === "restore-news") delete SITE.local.newsEdits[id];
    else if (action === "remove-section") SITE.local.aboutSections = SITE.local.aboutSections.filter((item) => item._localId !== id);
    else if (action === "restore-section") delete SITE.local.aboutEdits[id];
    else if (action === "remove-word") {
      SITE.local.keywords.en = SITE.local.keywords.en.filter((word) => word !== id);
      SITE.local.keywords.fr = SITE.local.keywords.fr.filter((word) => word !== id);
    } else if (action === "restore-word") {
      const split = id.indexOf(":");
      const lang = id.slice(0, split);
      const word = id.slice(split + 1);
      if (SITE.local.keywordEdits[lang]) delete SITE.local.keywordEdits[lang][word];
    } else if (action === "remove-project") SITE.local.projects = SITE.local.projects.filter((item) => item.slug !== id);
    else if (action === "restore-project") delete SITE.local.projectEdits[id];
    else return;
    refresh("texts", detail);
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("change", (event) => {
    if (event.target.closest("[data-panel='style']")) {
      readStyle();
      return;
    }
    if (event.target.closest("[data-panel='texts']")) {
      if (event.target.id === "pub-pick") fillPublication(event.target.value);
      if (event.target.id === "talk-pick") fillTalk(event.target.value);
      if (event.target.id === "course-pick") fillCourse(event.target.value);
      if (event.target.id === "news-pick") fillNews(event.target.value);
      if (event.target.id === "about-pick") fillAbout(event.target.value);
      if (event.target.id === "word-pick") fillWord(event.target.value);
      if (event.target.id === "project-pick") fillProject(event.target.value);
      return;
    }
    commit();
  });
  form.addEventListener("input", (event) => {
    if (event.target.closest("[data-panel='style']")) {
      clearTimeout(timer);
      timer = setTimeout(readStyle, 220);
      return;
    }
    if (event.target.closest("[data-panel='texts']")) return;
    if (!event.target.matches("input[type='text'], input[type='number']")) return;
    clearTimeout(timer);
    timer = setTimeout(commit, 200);
  });
  form.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      showTab(tab.dataset.tab);
      return;
    }
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      runAction(actionButton.dataset.action, actionButton.dataset.id);
      return;
    }
    const button = event.target.closest("[data-move]");
    if (!button) return;
    const item = button.closest(".order-item");
    const dir = Number(button.dataset.move);
    const sibling = dir < 0 ? item.previousElementSibling : item.nextElementSibling;
    if (!sibling) return;
    if (dir < 0) item.parentElement.insertBefore(item, sibling);
    else item.parentElement.insertBefore(sibling, item);
    commit();
  });
  document.getElementById("studio-save").addEventListener("click", async () => {
    folio.saveDisplay(readForm());
    try {
      await folio.saveToDisk();
      status.textContent = t("studio.savedDisk");
      showPreview(sessionStorage.getItem("folio-preview") || "index.html", true);
    } catch {
      status.textContent = t("studio.saveFailed");
    }
  });
  document.getElementById("studio-reset").addEventListener("click", () => folio.resetDisplay());
  document.querySelectorAll("[data-preview]").forEach((button) => {
    button.addEventListener("click", () => showPreview(button.dataset.preview, false));
  });
  showTab(sessionStorage.getItem("folio-studio-tab") || "display");
  const flashed = sessionStorage.getItem("folio-studio-status");
  if (flashed) {
    status.textContent = flashed;
    sessionStorage.removeItem("folio-studio-status");
  }
  showPreview(previewPage, false);
}
