/** Affinity score pivot — Bowl + Floor (synthesized) */
window.IwaveAnalysisWidget = (function () {
  const SCORE_COLUMNS = ["1", "2", "3", "4"];

  const ROWS = [
    {
      label: "Bowl",
      scores: { 1: 3128, 2: 984, 3: 361, 4: 64 },
      total: 4537,
    },
    {
      label: "Floor",
      scores: { 1: 278, 2: 129, 3: 54, 4: 9 },
      total: 470,
    },
  ];

  function fmt(n) {
    return n.toLocaleString("en-US");
  }

  function render() {
    const root = document.getElementById("iwave-table");
    if (!root) return;

    const head = `
      <thead>
        <tr>
          <th class="iwave-corner" scope="col"></th>
          ${SCORE_COLUMNS.map(c => `<th scope="col">Score ${c}</th>`).join("")}
          <th scope="col" class="iwave-total-col">Total</th>
        </tr>
      </thead>
    `;

    const body = `
      <tbody>
        ${ROWS.map(row => `
          <tr>
            <th scope="row" class="iwave-row-label">${row.label}</th>
            ${SCORE_COLUMNS.map(c => `<td>${fmt(row.scores[c])}</td>`).join("")}
            <td class="iwave-total-col">${fmt(row.total)}</td>
          </tr>
        `).join("")}
      </tbody>
    `;

    root.innerHTML = head + body;
  }

  return { init: render };
})();
