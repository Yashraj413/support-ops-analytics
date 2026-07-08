(() => {
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  window.KpiCell = function({ label, value, sub, accent }) {
    return html`
      <div class="px-4 py-3 border-r last:border-r-0 border-[#DCD5C6]">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">${label}</div>
        <div class="text-2xl font-bold serif-font" style=${{ color: accent || '#16233D' }}>${value}</div>
        ${sub && html`<div class="text-[10px] text-stone-400 mt-0.5">${sub}</div>`}
      </div>
    `;
  };

  window.KpiStrip = function({ kpi }) {
    return html`
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 border border-[#DCD5C6] rounded-lg bg-white mb-10 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#DCD5C6]">
        <${KpiCell} label="Total Tickets" value=${kpi.total_tickets.toLocaleString()} />
        <${KpiCell} label="Avg. Resolution" value="${kpi.avg_resolution_hours}h" />
        <${KpiCell} label="SLA Compliance" value="${kpi.sla_compliance_pct}%" accent="#B4432F" />
        <${KpiCell} label="Total Support Cost" value=${money(kpi.total_cost_usd)} />
        <${KpiCell} label="Repeat Ticket Rate" value="${kpi.repeat_ticket_rate_pct}%" />
        <${KpiCell} label="Avg. Satisfaction" value="${kpi.avg_satisfaction} / 5" />
        <${KpiCell} label="Customer Churn" value="${kpi.churn_rate_pct}%" accent="#B4432F" />
      </div>
    `;
  };
})();
