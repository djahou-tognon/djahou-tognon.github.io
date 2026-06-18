const translations = {
  en: {
    meta: { siteTitle: "Researcher", navLabel: "Main navigation", openMenu: "Open menu" },
    nav: { home: "Home", research: "Research", publications: "Publications", talks: "Talks", teaching: "Teaching", contact: "Contact" },
    lang: { switchTo: "Français" },
    hero: { downloadCv: "Download CV", getInTouch: "Get in touch", photoPlaceholder: "Your photo" },
    about: { title: "About" },
    contact: { title: "Contact", email: "Email", office: "Office" },
    footer: { updated: "Last updated:", hosted: "Hosted on" },
    researchPage: { title: "Research", intro: "Research directions and ongoing projects.", themesTitle: "Research areas", projectsTitle: "Projects", explore: "Explore project" },
    projectPage: { back: "← Back to research", related: "Related publications", abstract: "Abstract" },
    teachingPage: {
      title: "Teaching",
      intro: "Courses and teaching activities.",
      lecturer: "Lecturer",
      hours: "Hours",
      department: "Department",
      level: "Level",
    },
    publicationsPage: {
      title: "Publications",
      intro: "Complete list of publications.",
      hal: "HAL", doi: "DOI", code: "Code", abstract: "Abstract",
      categories: { journal: "Journal Papers", preprint: "Preprints", proceeding: "Conference Proceedings", thesis: "Thesis" },
    },
    talksPage: {
      title: "Talks",
      intro: "Conference presentations, seminars, and workshops.",
      slides: "Slides", video: "Video", poster: "Poster", website: "Website", abstract: "Abstract",
      types: { conference: "Invited talks and conferences", seminar: "Seminars", workshop: "Workshops", other: "Presentations" },
    },
    errors: { loadFailed: "Unable to load content. If you are offline, check https://djahou-tognon.github.io — locally, run ./preview.sh" },
  },
  fr: {
    meta: { siteTitle: "Chercheur", navLabel: "Navigation principale", openMenu: "Ouvrir le menu" },
    nav: { home: "Accueil", research: "Recherche", publications: "Publications", talks: "Conférences", teaching: "Enseignement", contact: "Contact" },
    lang: { switchTo: "English" },
    hero: { downloadCv: "Télécharger le CV", getInTouch: "Me contacter", photoPlaceholder: "Votre photo" },
    about: { title: "À propos" },
    contact: { title: "Contact", email: "Email", office: "Bureau" },
    footer: { updated: "Dernière mise à jour :", hosted: "Hébergé sur" },
    researchPage: { title: "Recherche", intro: "Grandes lignes de recherche et projets en cours.", themesTitle: " Domaines de recherche", projectsTitle: "Projets", explore: "Explorer le projet" },
    projectPage: { back: "← Retour à la recherche", related: "Publications associées", abstract: "Résumé" },
    teachingPage: {
      title: "Enseignement",
      intro: "Cours et activités d'enseignement.",
      lecturer: "Enseignant",
      hours: "Volume horaire",
      department: "Département",
      level: "Niveau",
    },
    publicationsPage: {
      title: "Publications",
      intro: "Liste complète des publications.",
      hal: "HAL", doi: "DOI", code: "Code", abstract: "Résumé",
      categories: { journal: "Articles de journaux", preprint: "Prépublications", proceeding: "Communications", thesis: "Thèse" },
    },
    talksPage: {
      title: "Conférences",
      intro: "Présentations, séminaires et ateliers.",
      slides: "Diapositives", video: "Vidéo", poster: "Poster", website: "Site web", abstract: "Résumé",
      types: { conference: "Conférences et exposés invités", seminar: "Séminaires", workshop: "Ateliers", other: "Présentations" },
    },
    errors: { loadFailed: "Impossible de charger le contenu. En ligne : https://djahou-tognon.github.io — en local, lancez ./preview.sh" },
  },
};

function t(key, lang) {
  return key.split(".").reduce((o, k) => o?.[k], translations[lang]);
}

function getLanguage() {
  return localStorage.getItem("site-lang") || "en";
}

function pickLang(data, lang) {
  return Array.isArray(data) ? data : data[lang] || data.en || [];
}

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t(el.dataset.i18n, lang);
    if (v != null) el.textContent = v;
  });
  const profile = window.SITE_CONTENT?.profile;
  const titleKey = document.body.dataset.pageTitle;
  if (titleKey && profile) document.title = `${t(titleKey, lang) || t("meta.siteTitle", lang)} — ${profile.name}`;
  const btn = document.getElementById("lang-toggle");
  if (btn) {
    btn.textContent = t("lang.switchTo", lang);
    btn.setAttribute("aria-label", t("lang.switchTo", lang));
  }
}

function setLanguage(lang) {
  localStorage.setItem("site-lang", lang);
  document.documentElement.lang = lang;
  renderLayout();
  bindNav();
  applyTranslations(lang);
  renderPage(lang);
  bindLangToggle();
}

function bindLangToggle() {
  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    setLanguage(getLanguage() === "en" ? "fr" : "en");
  });
}

function initI18n() {
  applyTranslations(getLanguage());
  bindLangToggle();
}
