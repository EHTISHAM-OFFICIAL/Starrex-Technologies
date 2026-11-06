/* =========================
   STARREX TECHNOLOGIES
   Interactions
   (The hero globe and map live in assets/js/globe.js)
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

/* ---------- Header, mobile menu, scroll progress, back to top, active link ---------- */

(function header() {
    const bar = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav-toggle");
    const links = document.getElementById("nav-links");
    const progress = document.querySelector(".progress");
    const toTop = document.querySelector(".to-top");
    if (!bar || !toggle || !links) return;

    let ticking = false;

    function update() {
        ticking = false;
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;

        bar.classList.toggle("is-scrolled", y > 24);
        if (progress) progress.style.setProperty("--p", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
        if (toTop) toTop.classList.toggle("is-visible", y > 700);
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
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
    window.addEventListener("resize", onScroll);
    update();

    // Highlight the nav link for the section on screen
    if ("IntersectionObserver" in window) {
        const map = new Map();
        links.querySelectorAll('a[href^="#"]').forEach((a) => {
            const target = document.querySelector(a.getAttribute("href"));
            if (target && !a.parentElement.classList.contains("nav-links-cta")) map.set(target, a);
        });

        const spy = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    map.forEach((a) => a.classList.remove("is-active"));
                    const link = map.get(entry.target);
                    if (link) link.classList.add("is-active");
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );
        map.forEach((_, target) => spy.observe(target));
    }
})();

/* ---------- Cursor glow and card spotlight ---------- */

(function pointerEffects() {
    const glow = document.querySelector(".cursor-glow");
    const fine = window.matchMedia("(pointer: fine)");
    let queued = false;
    let x = 0;
    let y = 0;

    function paint() {
        queued = false;
        if (glow) {
            glow.style.setProperty("--gx", x + "px");
            glow.style.setProperty("--gy", y + "px");
        }
    }

    document.addEventListener(
        "pointermove",
        (event) => {
            if (!fine.matches) return;
            x = event.clientX;
            y = event.clientY;
            if (glow && !reduceMotion.matches) {
                glow.classList.add("is-on");
                if (!queued) {
                    queued = true;
                    requestAnimationFrame(paint);
                }
            }

            const card = event.target.closest && event.target.closest("[data-spot]");
            if (card) {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--mx", event.clientX - rect.left + "px");
                card.style.setProperty("--my", event.clientY - rect.top + "px");
            }
        },
        { passive: true }
    );

    document.addEventListener("pointerleave", () => glow && glow.classList.remove("is-on"));
})();

/* ---------- Expandable services ---------- */

(function services() {
    document.querySelectorAll(".service-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const item = button.closest(".service");
            const open = !item.classList.contains("is-open");
            item.classList.toggle("is-open", open);
            button.setAttribute("aria-expanded", String(open));
        });
    });
})();

/* ---------- Reveal on scroll, and the process line ---------- */

(function reveals() {
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
        document.querySelectorAll(".steps").forEach((s) => s.classList.add("is-drawn"));
        return;
    }

    const targets = document.querySelectorAll(
        ".section-head, .service, .panel, .steps li, .about h2, .about-body, .contact"
    );

    const seen = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                seen.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    targets.forEach((node, i) => {
        node.classList.add("reveal");
        const siblings = node.parentElement ? Array.from(node.parentElement.children) : [];
        node.style.setProperty("--d", Math.min(siblings.indexOf(node), 4) * 0.09 + "s");
        seen.observe(node);
    });

    const line = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-drawn");
                line.unobserve(entry.target);
            });
        },
        { threshold: 0.35 }
    );
    document.querySelectorAll(".steps").forEach((s) => line.observe(s));
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
