/*
 * The starfield behind every page: a few hundred points drifting slowly upward. Kept
 * deliberately small — it sits behind the content and must never cost more than the page
 * it decorates.
 */
(() => {
    const canvas = document.getElementById("stars");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let stars = [];

    function build() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        const count = Math.min(260, Math.round((innerWidth * innerHeight) / 7000));
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.3 + 0.2,
            a: Math.random() * 0.6 + 0.2,
            s: Math.random() * 0.12 + 0.02,
        }));
    }

    function draw(move) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const star of stars) {
            if (move) {
                star.y -= star.s;
                if (star.y < -2) {
                    star.y = canvas.height + 2;
                    star.x = Math.random() * canvas.width;
                }
            }
            ctx.globalAlpha = star.a;
            ctx.fillStyle = "#dcd6ff";
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function frame() {
        draw(true);
        requestAnimationFrame(frame);
    }

    addEventListener("resize", build);
    build();

    // Someone who asked for less motion should not be handed a moving background
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) draw(false);
    else frame();
})();
