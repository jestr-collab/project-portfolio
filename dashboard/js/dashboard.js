/** Widget chrome: expand / collapse to fullscreen */
(function () {
  const ICON_EXPAND = `<svg viewBox="0 0 24 24"><path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm16 0v6h-6v-2h4v-4h2z"/></svg>`;
  const ICON_COLLAPSE = `<svg viewBox="0 0 24 24"><path d="M9 9H5V5h4v4zm6 0V5h4v4h-4zM9 15H5v4h4v-4zm6 4h4v-4h-4v4z"/></svg>`;

  let expandedWidget = null;
  let backdrop = null;

  function ensureBackdrop() {
    if (backdrop) return backdrop;
    backdrop = document.createElement("div");
    backdrop.className = "fullscreen-backdrop";
    backdrop.addEventListener("click", collapse);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function resizeCharts(widget) {
    const charts = widget.querySelectorAll(".map-chart");
    charts.forEach(el => {
      if (el.data && window.Plotly) {
        Plotly.Plots.resize(el);
      }
    });
    if (window.DonorMapWidget) {
      window.DonorMapWidget.resize();
    }
  }

  function expand(widget) {
    if (expandedWidget) collapse();
    expandedWidget = widget;
    widget.classList.add("widget-fullscreen");
    document.body.classList.add("widget-expanded");
    ensureBackdrop().classList.add("visible");
    requestAnimationFrame(() => {
      setTimeout(() => resizeCharts(widget), 50);
    });
  }

  function collapse() {
    if (!expandedWidget) return;
    expandedWidget.classList.remove("widget-fullscreen");
    document.body.classList.remove("widget-expanded");
    if (backdrop) backdrop.classList.remove("visible");
    const w = expandedWidget;
    expandedWidget = null;
    requestAnimationFrame(() => {
      setTimeout(() => resizeCharts(w), 50);
    });
  }

  function initWidget(widget) {
    const actions = widget.querySelector(".widget-actions");
    if (!actions || actions.dataset.bound) return;
    actions.dataset.bound = "1";

    const expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "widget-btn widget-btn-expand";
    expandBtn.title = "Expand to full screen";
    expandBtn.innerHTML = ICON_EXPAND;
    expandBtn.addEventListener("click", () => expand(widget));

    const collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "widget-btn widget-btn-collapse";
    collapseBtn.title = "Exit full screen";
    collapseBtn.innerHTML = ICON_COLLAPSE;
    collapseBtn.addEventListener("click", collapse);

    actions.appendChild(expandBtn);
    actions.appendChild(collapseBtn);
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") collapse();
  });

  window.Dashboard = {
    init() {
      document.querySelectorAll(".widget[data-widget]:not(.widget-placeholder)").forEach(initWidget);
    },
    collapse,
  };
})();
