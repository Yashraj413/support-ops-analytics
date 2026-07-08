(function() {
  const { useRef, useEffect, useState } = React;
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  window.RepeatChurn = function({ repeatAnalysis, churnVolume, repeatCostSummary, churnHeadline }) {
    const repeatChartRef = useRef(null);
    const churnChartRef = useRef(null);
    const repeatChartInst = useRef(null);
    const churnChartInst = useRef(null);
    const [showSql, setShowSql] = useState(false);

    useEffect(() => {
      // Render Repeat chart
      if (repeatChartRef.current) {
        if (repeatChartInst.current) repeatChartInst.current.destroy();

        const sortedRepeat = [...repeatAnalysis].sort((a, b) => b.repeat_rate_pct - a.repeat_rate_pct);
        const categories = sortedRepeat.map(c => c.category);
        const repeatRates = sortedRepeat.map(c => c.repeat_rate_pct);
        const colors = sortedRepeat.map(c => c.category === "Billing" ? '#B4432F' : '#16233D');

        const options = {
          series: [{ name: 'Repeat Rate', data: repeatRates }],
          chart: { type: 'bar', height: 180, toolbar: { show: false } },
          plotOptions: { bar: { borderRadius: 3, horizontal: true, distributed: true, barHeight: '55%' } },
          colors: colors,
          dataLabels: { enabled: false },
          legend: { show: false },
          xaxis: { labels: { formatter: (v) => `${v}%`, style: { fontSize: '10px' } } },
          yaxis: { categories: categories, labels: { style: { fontSize: '10px' } } },
          grid: { borderColor: '#DCD5C6', strokeDasharray: 3, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
          tooltip: { y: { formatter: (v) => `${v}%` } }
        };

        repeatChartInst.current = new ApexCharts(repeatChartRef.current, options);
        repeatChartInst.current.render();
      }

      // Render Churn chart
      if (churnChartRef.current) {
        if (churnChartInst.current) churnChartInst.current.destroy();

        const buckets = churnVolume.map(c => c.bucket);
        const churnRates = churnVolume.map(c => c.churn_rate_pct);
        const colors = churnVolume.map((c, i) => i >= 2 ? '#B4432F' : '#16233D');

        const options = {
          series: [{ name: 'Churn Rate', data: churnRates }],
          chart: { type: 'bar', height: 180, toolbar: { show: false } },
          plotOptions: { bar: { borderRadius: 4, horizontal: false, distributed: true, columnWidth: '50%' } },
          colors: colors,
          dataLabels: { enabled: false },
          legend: { show: false },
          xaxis: { categories: buckets, labels: { style: { fontSize: '10px' } } },
          yaxis: { labels: { formatter: (v) => `${v}%`, style: { fontSize: '10px' } } },
          grid: { borderColor: '#DCD5C6', strokeDasharray: 3 },
          tooltip: { y: { formatter: (v) => `${v}%` } }
        };

        churnChartInst.current = new ApexCharts(churnChartRef.current, options);
        churnChartInst.current.render();
      }

      return () => {
        if (repeatChartInst.current) repeatChartInst.current.destroy();
        if (churnChartInst.current) churnChartInst.current.destroy();
      };
    }, [repeatAnalysis, churnVolume]);

    return html`
      <section class="bg-white border border-[#DCD5C6] rounded-lg p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <span class="text-xs tracking-widest font-semibold text-[#B4432F]">FINDING C</span>
            <h2 class="text-lg font-bold text-[#16233D] serif-font">Repeat Tickets drive Customer Churn</h2>
          </div>
          <button onClick=${() => setShowSql(!showSql)} class="text-xs font-semibold px-2.5 py-1.5 border border-[#DCD5C6] rounded bg-[#F6F3EC] hover:bg-[#eae6db] text-stone-600 transition-colors">
            ${showSql ? 'Hide SQL Query' : 'View SQL Query'}
          </button>
        </div>

        <!-- SQL DRAWER -->
        ${showSql && html`
          <div class="mb-4 p-3 bg-stone-900 text-[#eae6db] rounded-md overflow-x-auto text-xs mono-font">
            <span class="text-[#888] block mb-1">-- Part 1: Repeat Ticket rate by category</span>
            <pre class="mb-3">SELECT
    category,
    ROUND(100.0 * AVG(CASE WHEN is_repeat THEN 1 ELSE 0 END), 1) AS repeat_rate_pct,
    ROUND(SUM(CASE WHEN is_repeat THEN total_cost_usd ELSE 0 END), 0) AS repeat_driven_cost_usd
FROM fact_tickets
GROUP BY category
ORDER BY repeat_rate_pct DESC;</pre>
            <span class="text-[#888] block mb-1">-- Part 2: Churn rate correlation by ticket volume bucket</span>
            <pre>WITH customer_ticket_counts AS (
    SELECT
        c.customer_id, c.churned, COUNT(t.ticket_id) AS ticket_count
    FROM dim_customers c
    LEFT JOIN fact_tickets t ON t.customer_id = c.customer_id
    GROUP BY c.customer_id, c.churned
)
SELECT
    CASE
        WHEN ticket_count = 0 THEN '0 tickets'
        WHEN ticket_count = 1 THEN '1 ticket'
        WHEN ticket_count BETWEEN 2 AND 3 THEN '2-3 tickets'
        ELSE '4+ tickets'
    END AS ticket_bucket,
    COUNT(*) AS customer_count,
    ROUND(100.0 * AVG(CASE WHEN churned THEN 1 ELSE 0 END), 1) AS churn_rate_pct
FROM customer_ticket_counts
GROUP BY ticket_bucket
ORDER BY MIN(ticket_count);</pre>
          </div>
        `}

        <p class="text-sm text-stone-600 mb-6">
          Repeat tickets are a direct indicator of product frustration and poor self-service. Billing tickets exhibit a <strong>9.9% repeat rate</strong> (5× other categories) and account for <strong>60.6% of repeat costs</strong>. Customers who file 2+ tickets churn at <strong>2.79× the baseline rate</strong> (<span class="font-medium">${churnHeadline.multi_ticket_churn_pct}%</span> vs <span class="font-medium">${churnHeadline.baseline_churn_pct}%</span>).
        </p>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="border border-[#DCD5C6] rounded p-4 bg-[#FBFBFA]">
            <h3 class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Repeat Ticket Rate by Category (%)</h3>
            <div ref=${repeatChartRef} class="w-full h-48"></div>
          </div>
          <div class="border border-[#DCD5C6] rounded p-4 bg-[#FBFBFA]">
            <h3 class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Customer Churn Rate by Ticket Volume Bucket (%)</h3>
            <div ref=${churnChartRef} class="w-full h-48"></div>
          </div>
        </div>
      </section>
    `;
  };
})();
