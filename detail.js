/*
 * A project's own page, opened from its card. Everything shown is read from GitHub at
 * that moment — version, dates, licence — so a release published tonight shows up
 * tonight, without this file ever being touched.
 */

const sheet = document.getElementById("detail");
const body = document.getElementById("detail-body");
const PURPOSE = {
    "discord-bot-client-Nebula":
        "Réunir mes comptes Discord et mes bots dans une seule application de bureau : une fenêtre par compte, le même client pour tous.",
    "B-loom.github.io":
        "Ma page personnelle. Elle lit mes projets sur GitHub à chaque ouverture, donc elle ne peut pas être en retard.",
};

const date = value =>
    new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
};

/** Release notes are written in Markdown, where **this** means emphasis */
function withBold(text) {
    const node = document.createElement("span");
    const parts = text.split(/**([^*]+)**/g);
    parts.forEach((part, index) => {
        if (!part) return;
        node.append(index % 2 ? el("strong", null, part) : document.createTextNode(part));
    });
    return node;
}

function noteLine(tag, text) {
    const node = document.createElement(tag);
    node.append(withBold(text));
    return node;
}

function row(label, value) {
    const line = el("div", "row");
    line.append(el("span", "row-label", label), el("span", "row-value", value));
    return line;
}

/** Asks GitHub for the newest release; a project may simply not have one */
async function latestRelease(fullName) {
    try {
        const response = await fetch(`https://api.github.com/repos/${fullName}/releases/latest`);
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    }
}

export async function openDetail(repo) {
    body.innerHTML = "";

    body.append(el("h2", "sheet-title", repo.name));
    body.append(el("p", "sheet-text", PURPOSE[repo.name] ?? repo.description ?? "Pas encore de description."));

    const loading = el("p", "muted small", "Lecture de la dernière version…");
    body.append(loading);

    sheet.showModal();

    const release = await latestRelease(repo.full_name);
    loading.remove();

    const facts = el("div", "rows");
    facts.append(row("Version", release ? release.tag_name : "Aucune version publiée"));
    if (release) facts.append(row("Publiée le", date(release.published_at)));
    facts.append(row("Créé le", date(repo.created_at)));
    facts.append(row("Dernière mise à jour", date(repo.pushed_at)));
    if (repo.language) facts.append(row("Écrit en", repo.language));
    if (repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION") {
        facts.append(row("Licence", repo.license.spdx_id));
    }
    if (repo.stargazers_count) facts.append(row("Étoiles", String(repo.stargazers_count)));
    body.append(facts);

    // What the release actually offers to download, when it offers anything
    const installer = release?.assets?.find(asset => asset.name.endsWith(".exe"));

    const links = el("div", "links sheet-links");
    if (installer) {
        const download = el("a", "btn btn-main", "Télécharger " + release.tag_name);
        download.href = installer.browser_download_url;
        links.append(download);
    }
    if (repo.homepage) {
        const site = el("a", "btn", "Voir le site");
        site.href = repo.homepage;
        links.append(site);
    }
    const code = el("a", "btn", "Code source");
    code.href = repo.html_url;
    links.append(code);
    body.append(links);

    if (release?.body) {
        body.append(el("h3", "sheet-sub", "Dans cette version"));
        // Release notes are Markdown; the headings and bullets are enough to read them
        const notes = el("div", "notes");
        for (const line of release.body.split("\n")) {
            const text = line.trim();
            if (!text) continue;
            if (text.startsWith("### ")) notes.append(el("h4", null, text.slice(4)));
            else if (text.startsWith("## ")) notes.append(el("h4", null, text.slice(3)));
            else if (/^[-*]\s/.test(text)) notes.append(el("li", null, text.slice(2)));
            else notes.append(el("p", null, text));
        }
        body.append(notes);
    }
}

document.getElementById("detail-close").addEventListener("click", () => sheet.close());
// Clicking the dark area around the sheet closes it, as such windows do
sheet.addEventListener("click", event => {
    if (event.target === sheet) sheet.close();
});
