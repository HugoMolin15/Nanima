const SUPPORTED_LANGS = ["en", "it", "nl", "sv"];
const DEFAULT_LANG = "en";
const STORAGE_KEY = "lang";
const LANGUAGE_NAMES = { en: "English", it: "Italiano", nl: "Nederlands", sv: "Svenska" };

function readSavedLang() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED_LANGS.includes(saved) ? saved : null;
    } catch {
        return null;
    }
}

// First visit: use the first browser language we support (e.g. "sv-SE" -> "sv").
function detectBrowserLang() {
    const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of preferred) {
        const code = (tag || "").slice(0, 2).toLowerCase();
        if (SUPPORTED_LANGS.includes(code)) return code;
    }
    return null;
}

function saveLang(lang) {
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch {
        // Storage can be blocked (e.g. private browsing); the choice then lasts for this page only.
    }
}

// Story texts are hard-wrapped, so a line break only starts a new paragraph after a finished sentence.
function toParagraphs(text) {
    const paragraphs = [];
    let current = "";
    text.split("\n").map(line => line.trim()).filter(Boolean).forEach(line => {
        current = current ? `${current} ${line}` : line;
        if (/[.!?…”"]$/.test(line)) {
            paragraphs.push(current);
            current = "";
        }
    });
    if (current) paragraphs.push(current);
    return paragraphs.map(paragraph => `<p>${paragraph}</p>`).join("");
}

function applyLanguage(lang) {
    const strings = translations[lang] || translations[DEFAULT_LANG];
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const value = strings[el.dataset.i18n];
        if (value === undefined) return;
        const text = value.replaceAll("{year}", new Date().getFullYear());
        el.innerHTML = el.hasAttribute("data-i18n-paragraphs") ? toParagraphs(text) : text;
    });

    const titleKey = document.body.dataset.titleKey;
    if (titleKey && strings[titleKey]) document.title = `${strings[titleKey]} | Nanima`;

    updateLanguageSwitchers(lang, strings);
}

function setLanguage(lang) {
    const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    applyLanguage(safeLang);
    saveLang(safeLang);
}

function createFlag(lang) {
    const flag = document.createElement("img");
    flag.src = `/images/flags/${lang}.svg`;
    flag.alt = "";
    flag.width = 24;
    flag.height = 18;
    flag.className = "lang-flag";
    return flag;
}

// Flag dropdown: a button shows the current flag and opens a list of languages.
function buildLanguageSwitcher(container) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "lang-toggle";
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");

    const menu = document.createElement("ul");
    menu.className = "lang-menu";
    menu.hidden = true;

    const openMenu = () => {
        menu.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
        (menu.querySelector('[aria-current="true"]') || menu.querySelector("button"))?.focus();
    };
    const closeMenu = () => {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
    };

    SUPPORTED_LANGS.forEach(lang => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "lang-option";
        option.lang = lang;
        option.dataset.lang = lang;
        option.append(createFlag(lang), LANGUAGE_NAMES[lang]);
        option.addEventListener("click", () => {
            setLanguage(lang);
            closeMenu();
            toggle.focus();
        });
        const item = document.createElement("li");
        item.append(option);
        menu.append(item);
    });

    toggle.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));
    document.addEventListener("click", event => {
        if (!container.contains(event.target)) closeMenu();
    });
    container.addEventListener("keydown", event => {
        if (menu.hidden) return;
        const options = [...menu.querySelectorAll("button")];
        const index = options.indexOf(document.activeElement);
        if (event.key === "Escape") {
            closeMenu();
            toggle.focus();
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            options[(index + step + options.length) % options.length].focus();
        }
    });

    container.append(toggle, menu);
}

function updateLanguageSwitchers(lang, strings) {
    document.querySelectorAll(".lang-toggle").forEach(toggle => {
        toggle.replaceChildren(createFlag(lang));
        toggle.setAttribute("aria-label", `${strings.lang_label || "Language"}: ${LANGUAGE_NAMES[lang]}`);
    });
    document.querySelectorAll(".lang-option").forEach(option => {
        option.setAttribute("aria-current", String(option.dataset.lang === lang));
    });
}

document.querySelectorAll("[data-lang-switcher]").forEach(buildLanguageSwitcher);
applyLanguage(readSavedLang() || detectBrowserLang() || DEFAULT_LANG);
