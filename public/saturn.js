/* =========================================================
   STARREX – Planet background (Three.js)
   Earth (home) + Saturn (projects), both fully procedural.
   No texture downloads needed.
 
   Self-contained classic script (no import statements), so it
   works when loaded from /public in a Vite / React project.
   Requires the global THREE (r128 UMD build) and <canvas id="planet">.
 
   Page switching API (called from React):
     window.StarrexPlanets.show("earth")   // Earth settles into the Home composition
     window.StarrexPlanets.show("saturn")  // Saturn sweeps into the Projects composition
 
   Stability:
   - WebGL availability protection
   - Single animation loop
   - Pause when tab is hidden
   - WebGL context-loss handling
   - Resize handling
   - Reduced-motion support
========================================================= */
 
(() => {
  "use strict";
 
  /* ---------- INITIAL SAFETY CHECKS ---------- */
  if (document.body.dataset.planet === "moon") return;
 
  const canvas = document.getElementById("planet");
 
  if (!canvas) {
    console.warn("Starrex Planets: Canvas #planet was not found.");
    return;
  }
 
  if (!window.THREE) {
    console.warn("Starrex Planets: Three.js is not available.");
    return;
  }
 
  // Safety net in case the page CSS does not position the canvas.
  if (getComputedStyle(canvas).position === "static") {
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "-1";
    canvas.style.pointerEvents = "none";
  }
 
  /* =========================================================
     INLINED HELPERS
  ========================================================= */
 
  function createAnimationLoop({ onFrame, shouldRun }) {
    let id = 0;
    let disposed = false;
 
    function tick() {
      id = 0;
      if (disposed || !shouldRun()) return;
      if (onFrame() === false) return;
      id = requestAnimationFrame(tick);
    }
 
    function stop() {
      if (id) {
        cancelAnimationFrame(id);
        id = 0;
      }
    }
 
    return {
      start() {
        if (id || disposed || !shouldRun()) return;
        id = requestAnimationFrame(tick);
      },
      stop,
      dispose() {
        disposed = true;
        stop();
      },
    };
  }
 
  function createVisibilityController({ onVisibilityChange }) {
    const handler = () => onVisibilityChange(document.hidden);
    document.addEventListener("visibilitychange", handler);
 
    return {
      dispose() {
        document.removeEventListener("visibilitychange", handler);
      },
    };
  }
 
  function createViewportController({ renderer, camera, onResize }) {
    let queued = false;
    let observer = null;
 
    function resize() {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      if (width < 1 || height < 1) return;
 
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
 
      const aspect = width / height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
 
      const halfViewHeight =
        Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
 
      onResize({
        width,
        height,
        portrait: aspect < 1,
        halfViewHeight,
        halfViewWidth: halfViewHeight * aspect,
      });
    }
 
    function scheduleResize() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        resize();
      });
    }
 
    window.addEventListener("resize", scheduleResize, { passive: true });
 
    if (window.ResizeObserver) {
      observer = new ResizeObserver(scheduleResize);
      observer.observe(canvas);
    }
 
    return {
      resize,
      dispose() {
        window.removeEventListener("resize", scheduleResize);
        if (observer) observer.disconnect();
      },
    };
  }
 
  /* ---------- RENDERER ---------- */
  let renderer;
 
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
  } catch (error) {
    console.warn("Starrex Planets: WebGL could not be initialized.", error);
    return;
  }
 
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
 
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 10;
 
  // One group per planet; the page decides which one is present.
  const group = new THREE.Group();        // Saturn
  const earthGroup = new THREE.Group();   // Earth
  scene.add(group, earthGroup);
 
  const PLANET_R = 2.0;
  const EARTH_R = 2.3;
  const FLATTEN = 0.93;
  const SUN = new THREE.Vector3(-0.9, 0.3, 0.5).normalize();
 
  /* ---------- HELPERS ---------- */
  let seed = 11;
 
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
 
  function smoothArr(arr, k) {
    return arr.map((_, i) => {
      let s = 0;
      let n = 0;
 
      for (let j = -k; j <= k; j++) {
        const idx = i + j;
 
        if (idx >= 0 && idx < arr.length) {
          s += arr[idx];
          n++;
        }
      }
 
      return s / n;
    });
  }
 
  function normArr(arr) {
    let lo = Infinity;
    let hi = -Infinity;
 
    for (const v of arr) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
 
    return arr.map((v) => (v - lo) / (hi - lo || 1));
  }
 
  function ramp(t, stops) {
    t = Math.min(Math.max(t, 0), 1);
 
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i];
      const [t1, c1] = stops[i + 1];
 
      if (t <= t1) {
        const f = (t - t0) / (t1 - t0);
 
        return [
          c0[0] + (c1[0] - c0[0]) * f,
          c0[1] + (c1[1] - c0[1]) * f,
          c0[2] + (c1[2] - c0[2]) * f,
        ];
      }
    }
 
    return stops[stops.length - 1][1];
  }
 
  /* ---------- SATURN SURFACE TEXTURE ---------- */
  function makeSaturnTexture() {
    const w = 2048;
    const h = 1024;
 
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
 
    const g = c.getContext("2d");
    const img = g.createImageData(w, h);
 
    function makeNoise(nx, ny) {
      const L = new Float32Array(nx * (ny + 1));
 
      for (let i = 0; i < L.length; i++) {
        L[i] = rnd();
      }
 
      return (u, v) => {
        const x = u * nx;
        const y = v * ny;
 
        const ix = Math.floor(x);
        const iy = Math.floor(y);
 
        let fx = x - ix;
        let fy = y - iy;
 
        fx = fx * fx * (3 - 2 * fx);
        fy = fy * fy * (3 - 2 * fy);
 
        const x0 = ix % nx;
        const x1 = (ix + 1) % nx;
 
        const a = L[iy * nx + x0];
        const b = L[iy * nx + x1];
        const c2 = L[(iy + 1) * nx + x0];
        const d = L[(iy + 1) * nx + x1];
 
        return (a + (b - a) * fx) * (1 - fy) + (c2 + (d - c2) * fx) * fy;
      };
    }
 
    const waves = makeNoise(10, 6);
    const swirls = makeNoise(40, 20);
    const streaks = makeNoise(5, 220);
 
    const raw = Array.from({ length: h }, rnd);
 
    const a1 = normArr(smoothArr(raw, 30));
    const a2 = normArr(smoothArr(raw, 10));
    const a3 = normArr(smoothArr(raw, 3));
 
    const prof = normArr(
      a1.map((_, i) => 0.5 * a1[i] + 0.33 * a2[i] + 0.17 * a3[i]),
    );
 
    const stops = [
      [0.0, [118, 92, 62]],
      [0.3, [170, 140, 94]],
      [0.58, [212, 185, 133]],
      [0.82, [235, 215, 166]],
      [1.0, [247, 236, 204]],
    ];
 
    for (let y = 0; y < h; y++) {
      const v = y / h;
 
      const polar = Math.abs(v - 0.5) * 2;
      const polarMix = Math.min(Math.max((polar - 0.72) / 0.28, 0), 1) * 0.45;
 
      for (let x = 0; x < w; x++) {
        const u = x / w;
 
        const warp = (waves(u, v) - 0.5) * 0.032 + (swirls(u, v) - 0.5) * 0.01;
 
        const vy = Math.min(Math.max(v + warp, 0), 0.999);
 
        let t = prof[Math.floor(vy * (h - 1))];
 
        t += (streaks(u, v) - 0.5) * 0.14 + (swirls(u, v) - 0.5) * 0.1;
 
        t = 0.12 + 0.8 * t;
 
        const col = ramp(t, stops);
        const k = (y * w + x) * 4;
 
        img.data[k] = col[0] * (1 - polarMix) + 138 * polarMix;
        img.data[k + 1] = col[1] * (1 - polarMix) + 140 * polarMix;
        img.data[k + 2] = col[2] * (1 - polarMix) + 132 * polarMix;
        img.data[k + 3] = 255;
      }
    }
 
    g.putImageData(img, 0, 0);
 
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
 
    return tex;
  }
 
  /* ---------- RING TEXTURE ---------- */
  function makeRingTexture() {
    const w = 2048;
    const h = 4;
 
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
 
    const g = c.getContext("2d");
    const img = g.createImageData(w, h);
 
    const noise = Array.from({ length: w }, rnd);
 
    const fine = normArr(smoothArr(noise, 1));
    const mid = normArr(smoothArr(noise, 6));
    const broad = normArr(smoothArr(noise, 28));
 
    const alpha = new Array(w);
    const cols = new Array(w);
 
    for (let i = 0; i < w; i++) {
      const r = i / (w - 1);
 
      const rl =
        (fine[i] - 0.5) * 0.45 +
        (mid[i] - 0.5) * 0.55 +
        (broad[i] - 0.5) * 0.35;
 
      let a;
      let col;
 
      if (r < 0.28) {
        const q = r / 0.28;
 
        a = 0.14 + 0.26 * q + rl * 0.22;
        col = [128 + 36 * q, 113 + 32 * q, 92 + 24 * q];
      } else if (r < 0.69) {
        const q = (r - 0.28) / 0.41;
 
        a = 0.8 + 0.16 * q + rl * 0.4;
        col = [205 + 33 * q, 180 + 42 * q, 140 + 50 * q];
      } else if (r < 0.765) {
        a = 0.06 + rl * 0.08;
        col = [170, 150, 120];
      } else {
        const q = (r - 0.765) / 0.235;
 
        a = 0.66 - 0.12 * q + rl * 0.38;
        col = [214, 196, 162];
 
        if (r > 0.943 && r < 0.957) {
          a *= 0.12;
        }
 
        a *= Math.min(Math.max((1.0 - r) / 0.03, 0), 1);
      }
 
      alpha[i] = Math.min(Math.max(a, 0), 1);
      cols[i] = col;
    }
 
    const alphaS = smoothArr(alpha, 2);
 
    for (let i = 0; i < w; i++) {
      for (let y = 0; y < h; y++) {
        const k = (y * w + i) * 4;
 
        img.data[k] = cols[i][0];
        img.data[k + 1] = cols[i][1];
        img.data[k + 2] = cols[i][2];
        img.data[k + 3] = alphaS[i] * 255;
      }
    }
 
    g.putImageData(img, 0, 0);
 
    return new THREE.CanvasTexture(c);
  }
 
  const saturnTex = makeSaturnTexture();
  const ringTex = makeRingTexture();
 
  const R_IN = PLANET_R * 1.24;
  const R_OUT = PLANET_R * 2.27;
 
  /* ---------- SATURN RINGS ---------- */
  const ringGeo = new THREE.RingGeometry(R_IN, R_OUT, 256, 1);
 
  {
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    const v = new THREE.Vector3();
 
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
 
      uv.setXY(i, (v.length() - R_IN) / (R_OUT - R_IN), 0.5);
    }
  }
 
  const ring = new THREE.Mesh(
    ringGeo,
    new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: ringTex },
        uSun: { value: SUN },
        uR: { value: PLANET_R },
        uTilt: { value: new THREE.Matrix4() },
      },
 
      vertexShader: `
        uniform mat4 uTilt;
        varying vec2 vUv;
        varying vec3 vGP;
 
        void main() {
          vUv = uv;
          vGP = (uTilt * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
 
      fragmentShader: `
        uniform sampler2D uMap;
        uniform vec3 uSun;
        uniform float uR;
 
        varying vec2 vUv;
        varying vec3 vGP;
 
        void main() {
          vec4 tex = texture2D(uMap, vUv);
 
          vec3 l = normalize(uSun);
          float b = dot(vGP, l);
 
          float disc = b * b - (dot(vGP, vGP) - uR * uR);
          float shadow = smoothstep(-0.8, 1.2, disc) * step(b, 0.0);
 
          float grey = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
          vec3 rc = mix(vec3(grey), tex.rgb, 0.6);
 
          float ringOpacity = clamp(tex.a * 1.22 + 0.055, 0.0, 0.98);
          // Lower ring luminance so the background stays behind the content.
          gl_FragColor = vec4(rc * (1.0 - 0.78 * shadow) * 0.62, ringOpacity);
        }
      `,
 
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
 
  ring.rotation.order = "ZXY";
  ring.rotation.x = THREE.MathUtils.degToRad(-70);
  ring.rotation.z = THREE.MathUtils.degToRad(16);
 
  ring.updateMatrix();
  ring.material.uniforms.uTilt.value = ring.matrix;
 
  ring.renderOrder = 3;
  group.add(ring);
 
  const ringNormal = new THREE.Vector3(0, 0, 1).transformDirection(ring.matrix);
 
  /* ---------- SATURN BODY ---------- */
  const globe = new THREE.Group();
 
  globe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ringNormal);
 
  globe.scale.set(1, FLATTEN, 1);
  group.add(globe);
 
  const planetMat = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: saturnTex },
      uRing: { value: ringTex },
      uRot: { value: 0 },
      uSun: { value: SUN },
      uN: { value: ringNormal },
      uR: { value: PLANET_R },
      uRin: { value: R_IN },
      uRout: { value: R_OUT },
    },
 
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
 
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
 
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
 
        gl_Position = projectionMatrix * mv;
      }
    `,
 
    fragmentShader: `
      uniform sampler2D uTex;
      uniform sampler2D uRing;
 
      uniform float uRot, uR, uRin, uRout;
      uniform vec3 uSun, uN;
 
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
 
      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vView);
        vec3 l = normalize(uSun);
 
        vec3 tex = texture2D(uTex, vec2(vUv.x + uRot, vUv.y)).rgb;
 
        float grey = dot(tex, vec3(0.299, 0.587, 0.114));
        tex = mix(vec3(grey), tex, 0.5);
 
        float d = dot(n, l);
        float soft = smoothstep(-0.12, 0.75, d);
 
        // Shadow of the rings on the planet.
        vec3 p = n * uR;
        float ndl = dot(l, uN);
        float shadow = 0.0;
 
        if (abs(ndl) > 0.02) {
          float t = -dot(p, uN) / ndl;
 
          if (t > 0.0) {
            vec3 hp = p + l * t;
            float k = (length(hp) - uRin) / (uRout - uRin);
 
            if (k > 0.0 && k < 1.0) {
              shadow = texture2D(uRing, vec2(k, 0.5)).a;
            }
          }
        }
 
        float mu = max(dot(n, v), 0.0);
 
        vec3 col = tex * (0.075 + 1.32 * soft * (1.0 - 0.72 * shadow));
        col *= 0.6 + 0.4 * pow(mu, 0.6);
 
        float fres = pow(1.0 - mu, 3.0);
        col += vec3(0.85, 0.82, 0.75) * fres * 0.22 * soft;
 
        // Apply the final brightness reduction to both the surface and rim light.
        col *= 0.62;
 
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
 
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_R, 128, 128),
    planetMat,
  );
 
  globe.add(planet);
 
  /* =========================================================
     EARTH (real NASA-based maps from the three.js repo)
     Plain Earth: continents, clouds, city lights, thin blue
     atmosphere. No rings, no violet glow.
  ========================================================= */
  const TEX = "https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/";
  const texLoader = new THREE.TextureLoader();
  texLoader.setCrossOrigin("anonymous");
 
  let earthReadyTarget = 0;
  const earthTextures = [];
 
  function loadEarthTex(file, onLoad) {
    const t = texLoader.load(TEX + file, onLoad, undefined, () => {
      console.warn("Starrex Planets: could not load " + file + " (check your internet connection).");
      if (file === "earth_atmos_2048.jpg") {
        earthMat.uniforms.uFallback.value = 1;
        earthReadyTarget = 1;
      }
    });
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    earthTextures.push(t);
    return t;
  }
 
  const dayMap = loadEarthTex("earth_atmos_2048.jpg", () => { earthReadyTarget = 1; });
  const nightMap = loadEarthTex("earth_lights_2048.png");
  const specMap = loadEarthTex("earth_specular_2048.jpg");
  const cloudMap = loadEarthTex("earth_clouds_1024.png");
 
  const sphereVertex = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
 
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
 
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = normalize(-mv.xyz);
 
      gl_Position = projectionMatrix * mv;
    }
  `;
 
  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: dayMap },
      uNight: { value: nightMap },
      uSpec: { value: specMap },
      uRot: { value: 0 },
      uSun: { value: SUN },
      uReady: { value: 0 },
      uFallback: { value: 0 },
      uBright: { value: 0.9 },
    },
 
    vertexShader: sphereVertex,
 
    fragmentShader: `
      uniform sampler2D uDay;
      uniform sampler2D uNight;
      uniform sampler2D uSpec;
      uniform float uRot;
      uniform vec3 uSun;
      uniform float uReady;
      uniform float uFallback;
      uniform float uBright;
 
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
 
      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vView);
        vec3 l = normalize(uSun);
 
        // Minus sign: the surface turns west to east (left to right on screen).
vec2 uv = vec2(vUv.x + uRot, vUv.y); 
        vec3 day = texture2D(uDay, uv).rgb;
        vec3 night = texture2D(uNight, uv).rgb;
        float spec = texture2D(uSpec, uv).r;
 
        // Plain blue ball if the textures could not be downloaded.
        day = mix(day, vec3(0.10, 0.30, 0.55), uFallback);
        night *= 1.0 - uFallback;
        spec = mix(spec, 1.0, uFallback);
 
        float d = dot(n, l);
        float lit = smoothstep(-0.12, 0.30, d);
 
        vec3 col = day * max(d, 0.0) * 1.25;                  // sunlit side
        col += day * vec3(0.03, 0.05, 0.09) * 0.6;            // faint blue ambient
        col += night * vec3(1.0, 0.78, 0.45) * 1.4 * (1.0 - lit); // city lights
 
        vec3 h = normalize(l + v);
        float s = pow(max(dot(n, h), 0.0), 70.0) * spec * lit; // ocean shine
        col += vec3(1.0, 0.95, 0.85) * s * 0.7;
 
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);      // subtle blue edge
        col += vec3(0.25, 0.50, 1.0) * fres * (0.08 + 0.30 * lit);
 
        gl_FragColor = vec4(col * uBright * uReady, 1.0);
      }
    `,
  });
 
  const earthTilt = new THREE.Group();
earthTilt.rotation.z = THREE.MathUtils.degToRad(0);
earthTilt.rotation.x = THREE.MathUtils.degToRad(0);
  earthGroup.add(earthTilt);
 
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 96, 96), earthMat);
  earthTilt.add(earth);
 
  /* ---------- CLOUDS ---------- */
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: {
      uClouds: { value: cloudMap },
      uRot: { value: 0 },
      uSun: { value: SUN },
      uReady: { value: 0 },
      uFallback: { value: 0 },
    },
 
    vertexShader: sphereVertex,
 
    fragmentShader: `
      uniform sampler2D uClouds;
      uniform float uRot;
      uniform vec3 uSun;
      uniform float uReady;
      uniform float uFallback;
 
      varying vec2 vUv;
      varying vec3 vNormal;
 
      void main() {
        vec3 n = normalize(vNormal);
        float lit = smoothstep(-0.15, 0.4, dot(n, normalize(uSun)));
 
        vec4 c = texture2D(uClouds, vec2(vUv.x + uRot, vUv.y));
        vec3 col = mix(vec3(0.05, 0.06, 0.09), vec3(1.0, 1.0, 1.0), lit);
        float a = c.a * 0.85 * (0.2 + 0.8 * lit) * uReady * (1.0 - uFallback);
 
        gl_FragColor = vec4(col * 0.9, a);
      }
    `,
 
    transparent: true,
    depthWrite: false,
  });
 
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, 96, 96), cloudMat);
  clouds.renderOrder = 1;
  earthTilt.add(clouds);
 
  
  /* ---------- STARS ---------- */
  function makeStars(count, size, spread) {
    const pos = [];
 
    for (let i = 0; i < count; i++) {
      pos.push(
        (Math.random() - 0.5) * spread * 1.8,
        (Math.random() - 0.5) * spread,
        -Math.random() * 25 - 2,
      );
    }
 
    const geo = new THREE.BufferGeometry();
 
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
 
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xfff4e0,
        size,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    );
  }
 
  const starsFar = makeStars(700, 0.04, 40);
  const starsNear = makeStars(120, 0.09, 30);
 
  scene.add(starsFar, starsNear);
 
  /* ---------- SIZE AND POSITION ---------- */
  const base = new THREE.Vector2(4.6, -0.3);
  const cur = new THREE.Vector2(4.6, -0.3); // smoothed position shared by both planets
  let scrollTravel = 9.4;
  let viewHalfW = 6.5;
 
  let viewportController = null;
  let visibilityController = null;
 
  function updateSaturnComposition({ portrait, halfViewWidth }) {
    // Preserve the established planet position and responsive scale.
    base.set(
      halfViewWidth * (portrait ? 0.4 : 0.76),
      portrait ? -1.6 : -0.3,
    );
    viewHalfW = halfViewWidth;
 
    const s = portrait ? 0.55 : 1;
    group.scale.setScalar(s);
    earthGroup.scale.setScalar(s);
 
    // Keep the planet visible through most of the page and move it fully
    // beyond the top edge only as the visitor approaches the page bottom.
    scrollTravel = portrait ? 6.4 : 6.0;
  }
 
  /* =========================================================
     PLANET SWITCHING (Saturn <-> Earth)
     presence: 1 = in place, 0 = gone
     - Saturn leaves by swiping off to the left, returns from the left.
     - Earth arrives from far behind (tiny, deep in the scene) and
       settles where Saturn was; it recedes the same way when leaving.
  ========================================================= */
  const easeInOutCubic = (k) =>
    k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
  const easeInCubic = (k) => k * k * k;
 
  const planets = {
    saturn: {
      group,
      presence: 0,
      tween: null,
      enter: { delay: 0.18, duration: 1.85, ease: easeInOutCubic },
      leave: { delay: 0, duration: 1.3, ease: easeInOutCubic },
      place(p) {
        const away = (1 - p) * (base.x + viewHalfW + 7);
        group.position.set(cur.x - away, cur.y, 0);
      },
    },
 
    earth: {
      group: earthGroup,
      presence: 1,
      tween: null,
      enter: { delay: 0.12, duration: 2.15, ease: easeOutCubic },
      leave: { delay: 0, duration: 1.5, ease: easeInCubic },
      place(p) {
        earthGroup.position.set(cur.x, cur.y, -(1 - p) * 38);
      },
    },
  };
 
  let currentPlanet = "earth";
  let firstShowCall = true;
 
  function startTween(planet, to, cfg) {
    planet.tween = {
      from: planet.presence,
      to,
      start: performance.now() + cfg.delay * 1000,
      duration: cfg.duration * 1000,
      ease: cfg.ease,
    };
  }
 
  function showPlanet(name) {
    if (!planets[name]) return;
 
    // The very first call (page load) and reduced-motion users switch instantly.
    const instant = firstShowCall || reduceMotion;
    firstShowCall = false;
 
    if (name === currentPlanet) return;
 
    const prev = planets[currentPlanet];
    const next = planets[name];
    currentPlanet = name;
 
    if (instant) {
      prev.tween = null;
      next.tween = null;
      prev.presence = 0;
      next.presence = 1;
      return;
    }
 
    startTween(prev, 0, prev.leave);
    startTween(next, 1, next.enter);
  }
 
  function updateTweens(now) {
    for (const key in planets) {
      const p = planets[key];
      const t = p.tween;
      if (!t) continue;
 
      const k = (now - t.start) / t.duration;
      if (k <= 0) continue; // still waiting for its delay
 
      const kk = Math.min(k, 1);
      p.presence = t.from + (t.to - t.from) * t.ease(kk);
 
      if (kk >= 1) {
        p.presence = t.to;
        p.tween = null;
      }
    }
  }
 
  window.StarrexPlanets = {
    show: showPlanet,
    current: () => currentPlanet,
  };
 
  /* ---------- MOUSE PARALLAX ---------- */
  const mouse = { x: 0, y: 0 };
 
  function handlePointerMove(e) {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }
 
  /* ---------- MOTION PREFERENCES ---------- */
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
 
  let reduceMotion = motionQuery.matches;
 
  // Rotation speeds (fractions of a full turn per frame).
  const normalSpeed = 0.0005;
  const reducedSpeed = 0.0001;
 
  /* ---------- ANIMATION CONTROL ---------- */
  let isContextLost = false;
  let isDisposed = false;
 
  function shouldAnimate() {
    if (isDisposed || isContextLost || document.hidden) return false;
 
    const context = renderer.getContext();
    return Boolean(context && !context.isContextLost());
  }
 
  function applyPlanetTransforms() {
    for (const key in planets) {
      const p = planets[key];
      const on = p.presence > 0.001;
      p.group.visible = on;
      if (on) p.place(p.presence);
    }
  }
 
  function animate() {
    if (!shouldAnimate()) return false;
 
    const speed = reduceMotion ? reducedSpeed : normalSpeed;
 
    updateTweens(performance.now());
 
    if (planets.saturn.presence > 0.001) planetMat.uniforms.uRot.value += speed;
    if (planets.earth.presence > 0.001) {
      earthMat.uniforms.uRot.value += speed * 0.2;
cloudMat.uniforms.uRot.value += speed * 0.2 * 1.35;
    }
 
    // Fade Earth in once its textures have arrived.
    const ready = earthMat.uniforms.uReady.value;
    const nextReady = ready + (earthReadyTarget - ready) * 0.06;
    earthMat.uniforms.uReady.value = nextReady;
    cloudMat.uniforms.uReady.value = nextReady;
    cloudMat.uniforms.uFallback.value = earthMat.uniforms.uFallback.value;
 
    if (!reduceMotion) {
      starsFar.rotation.z += 0.00005;
      starsNear.rotation.z += 0.0001;
    }
 
    // Normalize against the full document so the same behaviour works on
    // pages of different lengths.
    const pageHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0,
    );
 
    const maxScroll = Math.max(pageHeight - window.innerHeight, 1);
    const currentScroll = Math.max(
      window.scrollY,
      document.documentElement.scrollTop,
      document.body ? document.body.scrollTop : 0,
    );
 
    // Scroll-driven movement remains active even when reduced-motion is
    // enabled; that preference only reduces decorative rotation/parallax.
    const rawProgress = THREE.MathUtils.clamp(
      currentScroll / maxScroll,
      0,
      1,
    );
 
    // Smoothstep keeps the upward movement gradual at both ends of the page.
    const easedProgress =
      rawProgress * rawProgress * (3 - 2 * rawProgress);
 
    const scrollLift = easedProgress * scrollTravel;
 
    const targetX = base.x + (reduceMotion ? 0 : mouse.x * 0.2);
    cur.x += (targetX - cur.x) * 0.05;
 
    const targetY = base.y + scrollLift - (reduceMotion ? 0 : mouse.y * 0.15);
    cur.y += (targetY - cur.y) * 0.075;
 
    applyPlanetTransforms();
 
    renderer.render(scene, camera);
    return true;
  }
 
  const animationLoop = createAnimationLoop({
    onFrame: animate,
    shouldRun: shouldAnimate,
  });
 
  function startAnimation() {
    animationLoop.start();
  }
 
  function stopAnimation() {
    animationLoop.stop();
  }
 
  /* ---------- BROWSER EVENT HANDLERS ---------- */
  function handleContextLost(event) {
    // Allow the browser to attempt restoring the WebGL context.
    event.preventDefault();
 
    isContextLost = true;
    stopAnimation();
 
    console.warn("Starrex Planets: WebGL context was lost.");
  }
 
  function handleContextRestored() {
    isContextLost = false;
 
    console.info("Starrex Planets: WebGL context restored.");
 
    saturnTex.needsUpdate = true;
    ringTex.needsUpdate = true;
    earthTextures.forEach((t) => { t.needsUpdate = true; });
 
    if (viewportController) viewportController.resize();
    startAnimation();
  }
 
  function handleMotionPreferenceChange(event) {
    reduceMotion = event.matches;
  }
 
  /* ---------- INITIALIZE ---------- */
  try {
    viewportController = createViewportController({
      renderer,
      camera,
      onResize: updateSaturnComposition,
    });
    viewportController.resize();
 
    // Start on the Home composition (Earth) without a first-frame jump.
    cur.set(base.x, base.y);
    applyPlanetTransforms();
 
    visibilityController = createVisibilityController({
      onVisibilityChange: (hidden) => {
        if (hidden) {
          stopAnimation();
        } else {
          startAnimation();
        }
      },
    });
 
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
 
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
 
    canvas.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false,
    );
 
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionPreferenceChange);
    } else {
      // Compatibility with older browsers.
      motionQuery.addListener(handleMotionPreferenceChange);
    }
 
    startAnimation();
  } catch (error) {
    isDisposed = true;
    if (visibilityController) visibilityController.dispose();
    if (viewportController) viewportController.dispose();
    animationLoop.dispose();
 
    console.error("Starrex Planets: Initialization failed.", error);
  }
})();
