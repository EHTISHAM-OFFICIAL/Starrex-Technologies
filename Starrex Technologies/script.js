/* STARREX — AMBIENT CONSTELLATION + NAVIGATION */
(() => {
  const canvas = document.getElementById("wireframe");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".nav-links");
  const yearLabel = document.getElementById("current-year");

  if (yearLabel) yearLabel.textContent = new Date().getFullYear();

  // Accessible mobile navigation
  if (menuButton && navigation) {
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
      navigation.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
      navigation.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("menu-open", !isOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (
        menuButton.getAttribute("aria-expanded") === "true" &&
        !navigation.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        closeMenu();
      }
    });
  }

  // Highlight the navigation item for the section currently in view
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const active = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("active", active);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Soft animated constellation: a lighter replacement for the old dense wireframe.
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let particles = [];
  let animationFrame = 0;
  let isVisible = !document.hidden;

  const random = (min, max) => Math.random() * (max - min) + min;

  function createParticles() {
    const area = width * height;
    const count = Math.min(88, Math.max(28, Math.round(area / 19000)));

    particles = Array.from({ length: count }, () => ({
      x: random(0, width),
      y: random(0, height),
      radius: random(0.7, 1.8),
      speedX: random(-0.12, 0.12),
      speedY: random(-0.1, 0.1),
      phase: random(0, Math.PI * 2)
    }));
  }

  function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    createParticles();

    if (reducedMotion.matches) drawFrame(0, false);
  }

  function drawFrame(time, moveParticles = true) {
    context.clearRect(0, 0, width, height);

    const connectionDistance = width < 700 ? 112 : 148;
    const pulse = 0.72 + Math.sin(time * 0.00045) * 0.12;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];

      if (moveParticles) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < -12) particle.x = width + 12;
        if (particle.x > width + 12) particle.x = -12;
        if (particle.y < -12) particle.y = height + 12;
        if (particle.y > height + 12) particle.y = -12;
      }

      const shimmer = 0.55 + Math.sin(time * 0.001 + particle.phase) * 0.2;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(133, 193, 237, ${shimmer * pulse})`;
      context.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * 0.17;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(104, 170, 220, ${opacity})`;
          context.lineWidth = 0.7;
          context.stroke();
        }
      }
    }
  }

  function animate(time) {
    if (!isVisible || reducedMotion.matches) {
      animationFrame = 0;
      return;
    }

    drawFrame(time);
    animationFrame = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (!isVisible || reducedMotion.matches || animationFrame) return;
    animationFrame = window.requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (!animationFrame) return;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  document.addEventListener("visibilitychange", () => {
    isVisible = !document.hidden;
    if (isVisible) startAnimation();
    else stopAnimation();
  });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        stopAnimation();
        drawFrame(0, false);
      } else {
        startAnimation();
      }
    });
  }

  resizeCanvas();
  startAnimation();
})();
