/** Donor map widget — Plotly scattergeo */
window.DonorMapWidget = (function () {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const DOT_COLOR = "#e879b5";

  let allRecords = [];
  let maxAmt = 1;
  let mapEl = null;
  let slider = null;

  const layout = {
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: { color: "#181818", family: "Inter, system-ui, sans-serif", size: 10 },
    margin: { l: 0, r: 0, t: 4, b: 0 },
    geo: {
      scope: "usa",
      bgcolor: "rgba(255,255,255,0)",
      lakecolor: "#b8d4e8",
      landcolor: "#e8eaed",
      subunitcolor: "#c4c4c4",
      countrycolor: "#b0b0b0",
      showlakes: true,
      showland: true,
      showsubunits: true,
      resolution: 50,
      projection: { type: "albers usa" },
    },
    showlegend: false,
    hoverlabel: {
      bgcolor: "#ffffff",
      bordercolor: "#db2777",
      font: { color: "#181818", size: 11 },
    },
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    scrollZoom: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
  };

  function scaleDotSize(amount) {
    if (amount <= 0) return 5;
    const t = Math.sqrt(amount / maxAmt);
    return 6 + t * 44;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function makeTrace(records) {
    return {
      type: "scattergeo",
      lat: records.map(r => r.lat),
      lon: records.map(r => r.lon),
      text: records.map(r => r.name),
      customdata: records.map(r => [r.name, r.link, r.amount, r.zip, r.city, r.state]),
      hovertemplate:
        "<b>%{customdata[0]}</b><br>" +
        "Amount: %{customdata[2]:$,.2f}<br>" +
        "%{customdata[4]}, %{customdata[5]} %{customdata[3]}<extra></extra>",
      mode: "markers",
      marker: {
        size: records.map(r => scaleDotSize(r.amount)),
        color: DOT_COLOR,
        opacity: 0.88,
        line: { width: 0.8, color: "#ffffff" },
        sizemode: "diameter",
        sizeref: 1,
      },
      showlegend: false,
    };
  }

  function applyFilter(minAmount) {
    const filtered = allRecords.filter(r => r.amount >= minAmount);
    const label = document.getElementById("min-amt-label");
    const count = document.getElementById("filter-count");
    if (label) label.textContent = fmt.format(minAmount);
    if (count) {
      count.textContent = `${filtered.length.toLocaleString()} of ${allRecords.length.toLocaleString()}`;
    }
    if (mapEl) Plotly.react(mapEl, [makeTrace(filtered)], layout, config);
  }

  function renderStats(stats) {
    const el = document.getElementById("map-stats");
    if (!el) return;
    el.innerHTML = `
      <span><strong>${stats.plotted.toLocaleString()}</strong> donors</span>
      <span><strong>${stats.uniqueZips.toLocaleString()}</strong> zips</span>
      <span>max <strong>${fmt.format(stats.maxAmount)}</strong></span>
    `;
  }

  function renderSkipped(skipped) {
    const details = document.getElementById("map-skipped");
    if (!details || !skipped.length) return;
    details.hidden = false;
    details.querySelector("summary").textContent = `${skipped.length} skipped records`;
    details.querySelector("ul").innerHTML =
      skipped.slice(0, 30).map(s =>
        `<li>Row ${s.row}: ${escapeHtml(s.name)} — "${escapeHtml(s.zip)}"</li>`
      ).join("") + (skipped.length > 30 ? `<li>…and ${skipped.length - 30} more</li>` : "");
  }

  function init(data) {
    const { records, skipped, stats } = data;
    allRecords = records;
    maxAmt = stats.maxAmount || 1;
    renderStats(stats);
    renderSkipped(skipped);

    slider = document.getElementById("min-amt-slider");
    if (slider) {
      slider.max = String(Math.ceil(maxAmt));
      slider.step = maxAmt > 10000 ? "100" : "50";
      slider.addEventListener("input", () => applyFilter(Number(slider.value)));
    }

    const loading = document.getElementById("map-loading");
    mapEl = document.getElementById("map");
    if (loading) loading.style.display = "none";
    if (mapEl) mapEl.style.display = "block";

    applyFilter(0);

    if (mapEl) {
      mapEl.on("plotly_click", ev => {
        const link = ev.points[0].customdata[1];
        if (link) window.open(link, "_blank", "noopener,noreferrer");
      });
    }
  }

  return {
    init,
    resize() {
      if (mapEl && window.Plotly) Plotly.Plots.resize(mapEl);
    },
  };
})();
