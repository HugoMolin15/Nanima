const SUPPORTED_LANGS = ["en", "it", "nl", "sv"];
const DEFAULT_LANG = "en";
const STORAGE_KEY = "lang";

function readSavedLang() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED_LANGS.includes(saved) ? saved : null;
    } catch {
        return null;
    }
}

function saveLang(lang) {
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch {
        // Storage can be blocked (e.g. private browsing); the choice then lasts for this page only.
    }
}

function applyLanguage(lang) {
    const strings = translations[lang] || translations[DEFAULT_LANG];
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const value = strings[el.dataset.i18n];
        if (value !== undefined) el.innerHTML = value;
    });

    const titleKey = document.body.dataset.titleKey;
    if (titleKey && strings[titleKey]) document.title = `${strings[titleKey]} | Nanima`;

    const select = document.getElementById("langSelect");
    if (select) select.value = lang;
}

applyLanguage(readSavedLang() || DEFAULT_LANG);

document.getElementById("langSelect")?.addEventListener("change", event => {
    const lang = SUPPORTED_LANGS.includes(event.target.value) ? event.target.value : DEFAULT_LANG;
    applyLanguage(lang);
    saveLang(lang);
});
