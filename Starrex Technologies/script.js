/* =========================
   STARREX TECHNOLOGIES
   Interactions
========================= */

/* Set the address that receives messages from the contact form.
   Leave it empty until you have one; the form will say so instead of failing silently. */
const CONTACT_EMAIL = "";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Animated wireframe floor ---------- */

(function wireframe() {
    const canvas = document.getElementById("wireframe");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let time = 0;
    let running = false;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        const horizon = height * 0.5;
        const rows = 18;
        const cols = 34;
        const spread = Math.max(width, 900) / 16;

        ctx.lineWidth = 1;

        const grid = [];
        for (let r = 0; r <= rows; r++) {
            const depth = Math.pow(r / rows, 1.7);
            const y = horizon + (height - horizon) * 1.15 * depth;
            const scale = 0.12 + depth * 2.6;
            const row = [];
            for (let c = -cols / 2; c <= cols / 2; c++) {
                const wave = Math.sin(c * 0.45 + r * 0.35 + time) * 14 * depth;
                row.push({ x: width / 2 + c * spread * scale * 0.5, y: y + wave });
            }
            grid.push(row);
        }

        for (let r = 0; r <= rows; r++) {
            const alpha = 0.06 + (r / rows) * 0.3;
            ctx.strokeStyle = "rgba(110, 160, 215, " + alpha.toFixed(3) + ")";
            ctx.beginPath();
            for (let c = 0; c < grid[r].length; c++) {
                const p = grid[r][c];
                if (c === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();

            if (r < rows) {
                ctx.beginPath();
                for (let c = 0; c < grid[r].length; c++) {
                    ctx.moveTo(grid[r][c].x, grid[r][c].y);
                    ctx.lineTo(grid[r + 1][c].x, grid[r + 1][c].y);
                }
                ctx.strokeStyle = "rgba(110, 160, 215, " + (alpha * 0.8).toFixed(3) + ")";
                ctx.stroke();
            }
        }
    }

    function frame() {
        if (!running) return;
        time += 0.012;
        draw();
        requestAnimationFrame(frame);
    }

    function start() {
        if (running || reduceMotion.matches) return;
        running = true;
        requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
    });

    reduceMotion.addEventListener("change", () => {
        if (reduceMotion.matches) {
            stop();
            draw();
        } else {
            start();
        }
    });

    resize();
    start();
})();

/* ---------- Orbit animation respects reduced motion ---------- */

(function orbit() {
    const svg = document.querySelector(".orbit");
    if (!svg || typeof svg.pauseAnimations !== "function") return;

    function sync() {
        if (reduceMotion.matches) svg.pauseAnimations();
        else svg.unpauseAnimations();
    }

    reduceMotion.addEventListener("change", sync);
    sync();
})();

/* ---------- Header state and mobile menu ---------- */

(function header() {
    const bar = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav-toggle");
    const links = document.getElementById("nav-links");
    if (!bar || !toggle || !links) return;

    function onScroll() {
        bar.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    function setOpen(open) {
        toggle.setAttribute("aria-expanded", String(open));
        links.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", () => {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    links.addEventListener("click", (event) => {
        if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setOpen(false);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
})();

/* ---------- Contact form ---------- */

(function contactForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!form || !status) return;

    function say(message, kind) {
        status.textContent = message;
        status.className = "form-status" + (kind ? " is-" + kind : "");
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const data = new FormData(form);
        const name = String(data.get("name") || "").trim();
        const email = String(data.get("email") || "").trim();
        const message = String(data.get("message") || "").trim();

        let invalid = null;
        for (const field of form.elements) {
            if (!field.name) continue;
            const empty = !String(field.value).trim();
            const badEmail = field.type === "email" && !field.checkValidity();
            const bad = empty || badEmail;
            field.setAttribute("aria-invalid", String(bad));
            if (bad && !invalid) invalid = field;
        }

        if (invalid) {
            say("Fill in your name, a valid email and a short message.", "error");
            invalid.focus();
            return;
        }

        if (!CONTACT_EMAIL) {
            say("The contact email is not set up yet. Please try again soon.", "error");
            return;
        }

        const subject = "Project enquiry from " + name;
        const body = message + "\n\n" + name + "\n" + email;
        window.location.href =
            "mailto:" +
            CONTACT_EMAIL +
            "?subject=" +
            encodeURIComponent(subject) +
            "&body=" +
            encodeURIComponent(body);
        say("Opening your email app with your message ready to send.", "ok");
    });
})();
