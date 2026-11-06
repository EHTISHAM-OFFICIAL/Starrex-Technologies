/* =========================
   STARREX TECHNOLOGIES
   Hero: rotating Earth, then a world map that lights up all 7 continents.

   Needs: d3-array + d3-geo (assets/vendor) and window.STARREX_CONTINENTS
   (assets/data/continents.js).
========================= */

(function earthHero() {
    "use strict";

    const stage = document.getElementById("earth");
    if (!stage || !window.d3 || !window.STARREX_CONTINENTS) return;

    const canvas = stage.querySelector("#globe");
    const mapSvg = stage.querySelector("#worldmap");
    const countEl = document.getElementById("earth-count");
    const ctx = canvas.getContext("2d");
    const geo = window.STARREX_CONTINENTS;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* ---------- Timeline (seconds) ---------- */

    const GLOBE_END = 7.5; // globe spins until here, then the map takes over
    const FIRST_LIGHT = 8.6; // first continent lights up
    const STEP = 0.75; // seconds between continents
    const MAP_END = 16.2; // map fades, globe returns
    const LOOP = 17.2;

    // Lighting order, north-west to south-east
    const ORDER = ["NA", "SA", "EU", "AF", "AS", "OC", "AN"];

    /* ---------- World map (SVG) ---------- */

    const SVG_NS = "http://www.w3.org/2000/svg";
    const mapProjection = d3
        .geoNaturalEarth1()
        .fitExtent([[14, 20], [946, 486]], { type: "Sphere" });
    const mapPath = d3.geoPath(mapProjection);

    function el(name, attrs) {
        const node = document.createElementNS(SVG_NS, name);
        for (const key in attrs) node.setAttribute(key, attrs[key]);
        return node;
    }

    const mapLayer = el("g", {});
    mapLayer.appendChild(el("path", { class: "map-sphere", d: mapPath({ type: "Sphere" }) }));
    mapLayer.appendChild(el("path", { class: "map-grid", d: mapPath(d3.geoGraticule10()) }));

    // Where each label sits, as [longitude, latitude]
    const LABEL_AT = {
        NA: [-101, 47],
        SA: [-59, -13],
        EU: [16, 53],
        AF: [20, 4],
        AS: [95, 46],
        OC: [135, -27],
        AN: [10, -77],
    };

    const continentNodes = {};
    const labelNodes = {};

    geo.features.forEach((feature) => {
        const code = feature.properties.code;
        const path = el("path", {
            class: "continent",
            "data-code": code,
            d: mapPath(feature),
        });
        continentNodes[code] = path;
        mapLayer.appendChild(path);
    });

    ORDER.forEach((code) => {
        const feature = geo.features.find((f) => f.properties.code === code);
        const at = mapProjection(LABEL_AT[code]);
        const group = el("g", {
            class: "continent-label",
            "data-code": code,
            transform: "translate(" + at[0].toFixed(1) + " " + at[1].toFixed(1) + ")",
        });
        group.appendChild(el("circle", { r: "4.5", class: "label-dot" }));
        const text = el("text", { y: "-14", "text-anchor": "middle" });
        text.textContent = feature.properties.name;
        group.appendChild(text);
        labelNodes[code] = group;
        mapLayer.appendChild(group);
    });

    mapSvg.appendChild(mapLayer);

    let lit = -1; // how many continents are lit right now

    function setLit(n) {
        if (n === lit) return;
        lit = n;
        ORDER.forEach((code, i) => {
            const on = i < n;
            continentNodes[code].classList.toggle("is-lit", on);
            labelNodes[code].classList.toggle("is-lit", on);
        });
        if (countEl) countEl.textContent = String(n);
        stage.classList.toggle("is-complete", n >= ORDER.length);
    }

    /* ---------- Globe (canvas, dot matrix) ---------- */

    // Turn the land shapes into a grid of dots, once.
    const dots = (function buildDots() {
        const w = 720;
        const h = 360;
        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        const octx = off.getContext("2d");
        const flat = d3.geoEquirectangular().scale(w / (2 * Math.PI)).translate([w / 2, h / 2]);
        octx.fillStyle = "#fff";
        octx.beginPath();
        d3.geoPath(flat, octx)(geo);
        octx.fill();
        const px = octx.getImageData(0, 0, w, h).data;

        const out = [];
        const step = 2.6;
        for (let lat = -86; lat <= 86; lat += step) {
            const lonStep = step / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
            for (let lon = -180; lon < 180; lon += lonStep) {
                const x = Math.floor(((lon + 180) / 360) * w);
                const y = Math.floor(((90 - lat) / 180) * h);
                if (px[(y * w + x) * 4 + 3] > 128) out.push([lon, lat]);
            }
        }
        return out;
    })();

    const sphere = { type: "Sphere" };
    const graticule = d3.geoGraticule10();
    const projection = d3.geoOrthographic().clipAngle(90).precision(0.6);
    const pathToCtx = d3.geoPath(projection, ctx);

    let dpr = 1;
    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    let R = 0;

    function resize() {
        const rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = rect.width;
        H = rect.height;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = W / 2;
        cy = H / 2;
        R = Math.min(H * 0.36, W * 0.3);
        projection.translate([cx, cy]).scale(R);
    }

    const TILT = -0.4; // orbit tilt, radians (matches the logo)

    function orbitPoint(a, rx, ry) {
        const x = rx * Math.cos(a);
        const y = ry * Math.sin(a);
        return [cx + x * Math.cos(TILT) - y * Math.sin(TILT), cy + x * Math.sin(TILT) + y * Math.cos(TILT)];
    }

    function orbitHalf(rx, ry, from, to, style) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(TILT);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, from, to);
        ctx.strokeStyle = style;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.restore();
    }

    function star(x, y, size, alpha) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 2.6);
        glow.addColorStop(0, "rgba(234,244,255," + (0.95 * alpha).toFixed(3) + ")");
        glow.addColorStop(0.3, "rgba(127,166,209," + (0.4 * alpha).toFixed(3) + ")");
        glow.addColorStop(1, "rgba(94,141,191,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(x - size * 3, y - size * 3, size * 6, size * 6);

        const s = size;
        const k = size * 0.16;
        ctx.fillStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + k, y - k);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x + k, y + k);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - k, y + k);
        ctx.lineTo(x - s, y);
        ctx.lineTo(x - k, y - k);
        ctx.closePath();
        ctx.fill();
    }

    function satellite(a, rx, ry) {
        // trailing glow behind the star
        for (let i = 26; i >= 1; i--) {
            const t = orbitPoint(a - i * 0.026, rx, ry);
            const f = 1 - i / 27;
            ctx.fillStyle = "rgba(180,215,250," + (f * f * 0.55).toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(t[0], t[1], 0.6 + f * 1.7, 0, Math.PI * 2);
            ctx.fill();
        }
        const p = orbitPoint(a, rx, ry);
        star(p[0], p[1], Math.max(8, R * 0.075), 1);
    }

    function drawGlobe(clock) {
        ctx.clearRect(0, 0, W, H);

        const lon = 20 - clock * 15;
        projection.rotate([lon, -20, 6]);

        const rx = R * 1.55;
        const ry = R * 0.4;
        const a = clock * 0.5 + 0.8;
        const satBehind = Math.sin(a) < 0;

        // atmosphere
        const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.45);
        halo.addColorStop(0, "rgba(120,170,230,0.38)");
        halo.addColorStop(0.45, "rgba(80,130,200,0.12)");
        halo.addColorStop(1, "rgba(60,100,170,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
        ctx.fill();

        // back half of the orbit, and the satellite if it is behind the planet
        orbitHalf(rx, ry, Math.PI, Math.PI * 2, "rgba(120,170,225,0.22)");
        if (satBehind) satellite(a, rx, ry);

        // the planet body
        const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
        body.addColorStop(0, "#1d4470");
        body.addColorStop(0.55, "#0b1f38");
        body.addColorStop(1, "#050d1a");
        ctx.fillStyle = body;
        ctx.beginPath();
        pathToCtx(sphere);
        ctx.fill();

        // graticule
        ctx.beginPath();
        pathToCtx(graticule);
        ctx.strokeStyle = "rgba(120,170,225,0.13)";
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // land outline
        ctx.beginPath();
        pathToCtx(geo);
        ctx.strokeStyle = "rgba(160,200,240,0.35)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // land as glowing dots, dimmer toward the edge
        const buckets = [[], [], [], []];
        for (let i = 0; i < dots.length; i++) {
            const p = projection(dots[i]);
            if (!p) continue;
            const d = Math.hypot(p[0] - cx, p[1] - cy) / R;
            const k = Math.min(3, Math.floor((1 - d * d) * 4.2));
            buckets[k < 0 ? 0 : k].push(p);
        }
        const alphas = [0.28, 0.5, 0.78, 1];
        const size = Math.max(1.5, R * 0.011);
        for (let b = 0; b < 4; b++) {
            ctx.fillStyle = "rgba(190,224,255," + alphas[b] + ")";
            const list = buckets[b];
            for (let i = 0; i < list.length; i++) {
                ctx.fillRect(list[i][0] - size / 2, list[i][1] - size / 2, size, size);
            }
        }

        // rim light
        const rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
        rim.addColorStop(0, "rgba(140,190,255,0)");
        rim.addColorStop(1, "rgba(150,200,255,0.34)");
        ctx.fillStyle = rim;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(170,210,250,0.55)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // front half of the orbit, and the satellite if it is in front
        orbitHalf(rx, ry, 0, Math.PI, "rgba(170,210,250,0.6)");
        if (!satBehind) satellite(a, rx, ry);
    }

    /* ---------- Phases and the loop ---------- */

    let phase = "globe";

    function setPhase(next) {
        if (next === phase) return;
        phase = next;
        stage.dataset.phase = next;
        stage.classList.remove("is-flash");
        void stage.offsetWidth; // restart the flash animation
        stage.classList.add("is-flash");
    }

    let clock = 0;
    let last = 0;
    let rafId = 0;
    let visible = true;

    function frame(now) {
        rafId = 0;
        if (!visible || document.hidden) return;

        const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
        last = now;
        clock += dt;

        const t = clock % LOOP;

        if (t < GLOBE_END || t >= MAP_END) {
            setPhase("globe");
            if (t < GLOBE_END) setLit(0);
        } else {
            setPhase("map");
            const n = t < FIRST_LIGHT ? 0 : Math.min(ORDER.length, Math.floor((t - FIRST_LIGHT) / STEP) + 1);
            setLit(n);
        }

        // the planet only needs drawing while it is on screen
        if (phase === "globe" || t < GLOBE_END + 0.9 || t > MAP_END - 0.1) drawGlobe(clock);

        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (rafId || reduceMotion.matches) return;
        last = 0;
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
    }

    function showStaticMap() {
        stop();
        phase = "map";
        stage.dataset.phase = "map";
        setLit(ORDER.length);
    }

    /* ---------- Wire up ---------- */

    if ("ResizeObserver" in window) {
        new ResizeObserver(() => {
            resize();
            if (reduceMotion.matches) return;
            drawGlobe(clock);
        }).observe(stage);
    } else {
        window.addEventListener("resize", resize);
    }
    resize();

    if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            if (visible) start();
            else stop();
        }).observe(stage);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
    });

    reduceMotion.addEventListener("change", () => {
        if (reduceMotion.matches) showStaticMap();
        else {
            setLit(0);
            phase = "";
            setPhase("globe");
            start();
        }
    });

    // Optional hooks for testing: ?earth=map jumps straight to a phase.
    const jump = new URLSearchParams(window.location.search).get("earth");
    if (jump === "map") clock = FIRST_LIGHT + STEP * 7 - 0.2;
    if (jump === "mid") clock = FIRST_LIGHT + STEP * 3 - 0.2;

    stage.dataset.phase = "globe";

    if (reduceMotion.matches) showStaticMap();
    else {
        drawGlobe(clock);
        start();
    }
})();
