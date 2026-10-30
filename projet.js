/*
 * A project's own page. Everything shown is read from GitHub when the page opens —
 * version, dates, licence, what the release contains — so a release published tonight
 * appears tonight, without this file ever being touched.
 */
(async () => {
    const holder = document.getElementById("project");
    const owner = "B-loom";

    /** What each project is for, in my own words rather than a one-line description */
    const PURPOSE = {
        "discord-bot-client-Nebula":
            "Réunir mes comptes Discord et mes bots dans une seule application de bureau : une fenêtre par compte, le même client pour tous. C'est une version modifiée de DiscordBotClient, à laquelle j'ai ajouté ce qui me manquait.",
        "B-loom.github.io":
            "Ma page personnelle. Elle lit mes projets sur GitHub à chaque ouverture, donc elle ne peut pas être en retard sur ce que je publie.",
    };

    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    };

    const date = value =>
        new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const fail = text => {
        holder.innerHTML = "";
        holder.append(el("h1", "project-title", "Projet introuvable"), el("p", "muted", text));
    };

    /** Release notes are Markdown, where **this** means emphasis */
    const withBold = text => {
        const node = document.createElement("span");
        text.split(/\*\*([^*]+)\*\*/g).forEach((part, index) => {
            if (!part) return;
            node.append(index % 2 ? el("strong", null, part) : document.createTextNode(part));
        });
        return node;
    };

    const noteLine = (tag, text) => {
        const node = document.createElement(tag);
        node.append(withBold(text));
        return node;
    };

    const name = new URLSearchParams(location.search).get("repo");
    if (!name) return fail("Aucun projet n'a été demandé.");

    let repo;
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error(String(response.status));
        repo = await response.json();
    } catch {
        return fail("GitHub n'a pas répondu, ou ce dépôt n'existe pas.");
    }

    document.title = `${repo.name} · Bloom`;
    holder.innerHTML = "";

    holder.append(el("h1", "project-title", repo.name));
    holder.append(el("p", "project-lead", PURPOSE[repo.name] ?? repo.description ?? "Pas encore de description."));

    // The release comes second: a project may simply not have one
    let release = null;
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(name)}/releases/latest`);
        if (response.ok) release = await response.json();
    } catch {
        // Left as nothing: the page below says so plainly
    }

    const facts = el("div", "facts");
    const fact = (label, value) => {
        const box = el("div", "fact");
        box.append(el("span", "fact-label", label), el("span", "fact-value", value));
        facts.append(box);
    };

    fact("Version", release ? release.tag_name : "Aucune publiée");
    if (release) fact("Publiée le", date(release.published_at));
    fact("Créé le", date(repo.created_at));
    fact("Mis à jour le", date(repo.pushed_at));
    if (repo.language) fact("Écrit en", repo.language);
    if (repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION") fact("Licence", repo.license.spdx_id);
    fact("Étoiles", String(repo.stargazers_count));
    holder.append(facts);

    const links = el("div", "links project-links");
    const installer = release?.assets?.find(asset => asset.name.endsWith(".exe"));
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
    holder.append(links);

    if (release?.body) {
        holder.append(el("h2", "project-sub", "Dans la version " + release.tag_name));
        const notes = el("div", "notes");
        let list = null;

        for (const raw of release.body.split("\n")) {
            const text = raw.trim();
            if (!text) continue;

            if (/^[-*]\s/.test(text)) {
                // Bullets belong together, so one list holds the run of them
                list ??= el("ul");
                list.append(noteLine("li", text.slice(2)));
                continue;
            }

            if (list) {
                notes.append(list);
                list = null;
            }

            if (text.startsWith("### ")) notes.append(el("h3", null, text.slice(4)));
            else if (text.startsWith("## ")) notes.append(el("h3", null, text.slice(3)));
            else notes.append(noteLine("p", text));
        }

        if (list) notes.append(list);
        holder.append(notes);
    }
})();
