/*
 * A project's own page. Everything shown is read from GitHub when the page opens —
 * version, dates, licence, what the release contains — so a release published tonight
 * appears tonight, without this file ever being touched.
 *
 * La page existe en deux langues et ce fichier sert les deux : la langue est lue sur
 * l'élément <html>, et les textes sont écrits côte à côte plutôt que derrière des clés,
 * pour qu'une traduction oubliée se voie à la lecture.
 */
(async () => {
    const holder = document.getElementById("project");
    const owner = "B-loom";

    const enAnglais = document.documentElement.lang !== "fr";
    const t = (fr, en) => (enAnglais ? en : fr);

    /*
     * Le lien de langue mène à la même page, donc il doit emporter le projet demandé :
     * sans la requête, changer de langue retomberait sur « aucun projet demandé ».
     */
    const lien = document.querySelector("a.lang");
    if (lien && location.search) lien.href += location.search;

    /** What each project is for, in my own words rather than a one-line description */
    const PURPOSE = {
        "Voidcord": [
            "Réunir mes comptes Discord et mes bots dans une seule application de bureau : une fenêtre par compte, le même client pour tous. C'est une version modifiée de DiscordBotClient, à laquelle j'ai ajouté ce qui me manquait.",
            "Bringing my Discord accounts and my bots together in one desktop application: one window per account, the same client for all of them. It is a modified version of DiscordBotClient, to which I added what I was missing.",
        ],
        "discord-bot-client-web": [
            "Un client Discord pour bot qui tourne entièrement dans le navigateur : on colle le token, et on voit son bot en ligne — serveurs, salons, membres et messages en direct, dans une interface façon Discord, sans rien installer. (L'historique et l'envoi de messages ne sont pas possibles depuis un navigateur.)",
            "A Discord client for bots that runs entirely in the browser: paste the token, and you see your bot online — servers, channels, members and messages live, in a Discord-like interface, with nothing to install. (History and sending messages are not possible from a browser.)",
        ],
        "B-loom.github.io": [
            "Ma page personnelle. Elle lit mes projets sur GitHub à chaque ouverture, donc elle ne peut pas être en retard sur ce que je publie.",
            "My personal page. It reads my projects from GitHub every time it opens, so it cannot fall behind what I publish.",
        ],
    };

    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    };

    const date = value =>
        new Date(value).toLocaleDateString(enAnglais ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const fail = text => {
        holder.innerHTML = "";
        holder.append(
            el("h1", "project-title", t("Projet introuvable", "Project not found")),
            el("p", "muted", text),
        );
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
    if (!name) return fail(t("Aucun projet n'a été demandé.", "No project was asked for."));

    let repo;
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error(String(response.status));
        repo = await response.json();
    } catch {
        return fail(t(
            "GitHub n'a pas répondu, ou ce dépôt n'existe pas.",
            "GitHub did not answer, or that repository does not exist.",
        ));
    }

    document.title = `${repo.name} · Bloom`;
    holder.innerHTML = "";

    const propos = PURPOSE[repo.name];
    holder.append(el("h1", "project-title", repo.name));
    holder.append(el(
        "p",
        "project-lead",
        (propos ? t(propos[0], propos[1]) : repo.description) ?? t("Pas encore de description.", "No description yet."),
    ));

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

    fact(t("Version", "Version"), release ? release.tag_name : t("Aucune publiée", "None published"));
    if (release) fact(t("Publiée le", "Published"), date(release.published_at));
    fact(t("Créé le", "Created"), date(repo.created_at));
    fact(t("Mis à jour le", "Updated"), date(repo.pushed_at));
    if (repo.language) fact(t("Écrit en", "Written in"), repo.language);
    if (repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION") fact(t("Licence", "Licence"), repo.license.spdx_id);
    fact(t("Étoiles", "Stars"), String(repo.stargazers_count));
    holder.append(facts);

    const links = el("div", "links project-links");
    const installer = release?.assets?.find(asset => asset.name.endsWith(".exe"));
    if (installer) {
        const download = el("a", "btn btn-main", t("Télécharger ", "Download ") + release.tag_name);
        download.href = installer.browser_download_url;
        links.append(download);
    }
    if (repo.homepage) {
        const site = el("a", "btn", t("Voir le site", "Visit the site"));
        site.href = repo.homepage;
        links.append(site);
    }
    const code = el("a", "btn", t("Code source", "Source code"));
    code.href = repo.html_url;
    links.append(code);
    holder.append(links);

    if (release?.body) {
        holder.append(el("h2", "project-sub", t("Dans la version ", "In release ") + release.tag_name));
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
