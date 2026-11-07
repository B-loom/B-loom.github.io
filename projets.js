/*
 * La liste des projets, lue sur GitHub à l'ouverture de la page plutôt qu'écrite à la
 * main : un nouveau dépôt, une nouvelle version, et elle se met à jour toute seule.
 *
 * La page existe en deux langues et ce fichier sert les deux : la langue est lue sur
 * l'élément <html>, et les quelques phrases d'ici sont écrites côte à côte plutôt que
 * derrière des clés, pour qu'une traduction oubliée se voie à la lecture.
 */
(async () => {
    const holder = document.getElementById("repos");
    if (!holder) return;

    const enAnglais = document.documentElement.lang !== "fr";
    const t = (fr, en) => (enAnglais ? en : fr);
    const vers = chemin => (enAnglais ? chemin : `../${chemin}`);

    const say = text => {
        holder.innerHTML = "";
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = text;
        holder.append(p);
    };

    try {
        const response = await fetch("https://api.github.com/users/B-loom/repos?sort=updated&per_page=100");
        if (!response.ok) throw new Error("GitHub a répondu " + response.status);

        const repos = (await response.json())
            .filter(repo => !repo.fork && !repo.archived)
            .sort((a, b) => b.stargazers_count - a.stargazers_count || Date.parse(b.pushed_at) - Date.parse(a.pushed_at));

        if (!repos.length) {
            return say(t("Aucun projet public pour l'instant.", "No public project for now."));
        }

        holder.innerHTML = "";
        for (const repo of repos) {
            const card = document.createElement("a");
            card.className = "card repo";
            card.href = vers("projet.html") + "?repo=" + encodeURIComponent(repo.name);

            const title = document.createElement("h3");
            title.textContent = repo.name;

            const text = document.createElement("p");
            text.textContent = repo.description || t("Pas encore de description.", "No description yet.");

            const meta = document.createElement("p");
            meta.className = "meta";
            const bits = [];
            if (repo.language) bits.push(repo.language);
            if (repo.stargazers_count) bits.push("★ " + repo.stargazers_count);
            bits.push(t(
                "mis à jour le " + new Date(repo.pushed_at).toLocaleDateString("fr-FR"),
                "updated " + new Date(repo.pushed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
            ));
            meta.textContent = bits.join(" · ");

            card.append(title, text, meta);
            holder.append(card);
        }
    } catch {
        // GitHub limits how often an address may ask; saying so beats an empty box
        say(t(
            "Impossible de lire la liste des projets pour le moment. Elle est sur github.com/B-loom.",
            "The project list could not be read right now. It is on github.com/B-loom.",
        ));
    }
})();
