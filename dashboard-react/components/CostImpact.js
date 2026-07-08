(() => {
  const { useRef, useEffect, useState } = React;
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  window.CostImpact = function({ data, headline }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [showSql, setShowSql] = useState(false);

    useEffect(() => {
      if (!chartRef.current) return;
      
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const categories = data.map(c => c.category);
      const costValues = data.map(c => c.avg_cost_per_ticket);
      const colors = data.map(c => c.category === headline.priciest_category ? '#B4432F' : '#16233D');

      const options = {
        series: [{
          name: 'Avg Cost / Ticket',
          data: costValues
        }],
        chart: {
          type: 'bar',
          height: 240,
          toolbar: { show: false }
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            horizontal: false,
            distributed: true,
            columnWidth: '55%'
          }
        },
        colors: colors,
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
          categories: categories,
          labels: { style: { fontSize: '10px' } }
        },
        yaxis: {
          labels: {
            formatter: (v) => `$${v}`,
            style: { fontSize: '10px' }
          }
        },
        grid: {
          borderColor: '#DCD5C6',
          strokeDasharray: 3,
          yaxis: { lines: { show: true } },
          xaxis: { lines: { show: false } }
        },
        tooltip: {
          y: { formatter: (v) => `$${v.toFixed(2)}` }
        }
      };

      chartInstance.current = new ApexCharts(chartRef.current, options);
      chartInstance.current.render();

      return () => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }, [data, headline]);

    const sortedByTotalCost = [...data].sort((a, b) => b.total_cost - a.total_cost);

    return html`
      <section class="bg-white border border-[#DCD5C6] rounded-lg p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <span class="text-xs tracking-widest font-semibold text-[#B4432F]">FINDING A</span>
            <h2 class="text-lg font-bold text-[#16233D] serif-font">Cost Impact by Ticket Category</h2>
          </div>
          <button onClick=${() => setShowSql(!showSql)} class="text-xs font-semibold px-2.5 py-1.5 border border-[#DCD5C6] rounded bg-[#F6F3EC] hover:bg-[#eae6db] text-stone-600 transition-colors">
            ${showSql ? 'Hide SQL Query' : 'View SQL Query'}
          </button>
        </div>
        
        <!-- SQL DRAWER -->
        ${showSql && html`
          <div class="mb-4 p-3 bg-stone-900 text-[#eae6db] rounded-md overflow-x-auto text-xs mono-font">
            <span class="text-[#888] block mb-1">-- Cost impact by category query</span>
            <pre>SELECT
    category,
    COUNT(*) AS ticket_count,
    ROUND(AVG(total_resolution_hours), 1) AS avg_resolution_hours,
    ROUND(100.0 * AVG(CASE WHEN sla_breached THEN 1 ELSE 0 END), 1) AS sla_breach_pct,
    ROUND(SUM(total_cost_usd), 0) AS total_cost_usd,
    ROUND(AVG(total_cost_usd), 2) AS avg_cost_per_ticket,
    ROUND(100.0 * AVG(CASE WHEN is_repeat THEN 1 ELSE 0 END), 1) AS repeat_rate_pct
FROM fact_tickets
GROUP BY category
ORDER BY avg_cost_per_ticket DESC;</pre>
          </div>
        `}

        <p class="text-sm text-stone-600 mb-6">
          <strong class="text-[#16233D]">${headline.priciest_category}</strong> costs 
          <strong class="text-[#B4432F]">${headline.cost_multiple}×</strong> more to resolve than 
          <strong class="text-[#16233D]">${headline.cheapest_category}</strong>. This difference is driven by SLA breaches, rework loops, and escalation depth rather than pure incoming ticket volume.
        </p>

        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 border border-[#DCD5C6] rounded p-4 bg-[#FBFBFA]">
            <h3 class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Average Cost per Ticket ($ USD)</h3>
            <div ref=${chartRef} class="w-full h-64"></div>
          </div>
          <div class="flex flex-col justify-between">
            <div class="border border-[#DCD5C6] rounded p-4 bg-[#FBFBFA] flex-1">
              <h3 class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Total Cost Concentration</h3>
              <div class="space-y-3.5">
                ${sortedByTotalCost.map(c => html`
                  <div key=${c.category} class="flex items-center justify-between text-xs py-1 border-b border-[#DCD5C6] last:border-b-0">
                    <span class="text-stone-500 font-medium">${c.category}</span>
                    <span class="font-bold text-[#16233D] tabular-nums">
                      ${money(c.total_cost)} 
                      <span class="text-[10px] text-stone-400 font-normal flex-shrink-0"> (${c.ticket_count.toLocaleString()} tck)</span>
                    </span>
                  </div>
                `)}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  };
})();
