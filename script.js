// Keyboard: Enter/Space on a focused panel activates its case study link.
document.querySelectorAll(".panel").forEach((panel) => {
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target !== panel) return;

    const link = panel.querySelector(".panel-link");
    if (!link) return;

    event.preventDefault();
    link.click();
  });
});

// About panel particle network (scoped to #about-particles only)
function initAboutParticles() {
  if (!window.tsParticles) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  tsParticles.load("about-particles", {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    particles: {
      number: {
        value: prefersReducedMotion ? 24 : 50,
        density: { enable: true, area: 450 },
      },
      color: { value: "#999999" },
      links: {
        enable: true,
        color: "#999999",
        distance: 110,
        opacity: 0.7,
        width: 1.6,
      },
      move: {
        enable: !prefersReducedMotion,
        speed: 0.45,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "bounce" },
      },
      opacity: { value: 0.65 },
      size: { value: { min: 1.2, max: 2.6 } },
    },
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: {
          enable: !prefersReducedMotion,
          mode: "grab",
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 130,
          links: { opacity: 0.9 },
        },
      },
    },
    detectRetina: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAboutParticles);
} else {
  initAboutParticles();
}
