(function() {
  const { useRef, useEffect, useState } = React;

  window.ProcessWaste = function({ waste, tenureEscalation, trainingGapMultiple }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [showSql, setShowSql] = useState(false);

    useEffect(() => {
      if (!chartRef.current) return;

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const expData = ["Low", "Medium", "High"].map(tier => 
        tenureEscalation.find(t => !t.new_agent && t.complexity === tier).escalation_rate_pct
      );
      const newData = ["Low", "Medium", "High"].map(tier => 
        tenureEscalation.find(t => t.new_agent && t.complexity === tier).escalation_rate_pct
      );

      const options = {
        series: [{
          name: 'Experienced',
          data: expData
        }, {
          name: 'New (<90d Tenure)',
          data: newData
        }],
        chart: {
          type: 'bar',
          height: 180,
          toolbar: { show: false }
        },
        colors: ['#16233D', '#C1832B'],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '60%',
            borderRadius: 3
          },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: {
          categories: ['Low', 'Medium', 'High'],
          labels: { style: { fontSize: '10px' } }
        },
        yaxis: {
          labels: {
            formatter: (v) => `${v}%`,
            style: { fontSize: '10px' }
          }
        },
        grid: {
          borderColor: '#DCD5C6',
          strokeDasharray: 3,
        },
        tooltip: {
          y: { formatter: (v) => `${v}%` }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '10px'
        }
      };

      chartInstance.current = new ApexCharts(chartRef.current, options);
      chartInstance.current.render();

      return () => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }, [tenureEscalation]);

    return html`
      <section class="bg-white border border-[#DCD5C6] rounded-lg p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <span class="text-xs tracking-widest font-semibold text-[#B4432F]">FINDING B</span>
            <h2 class="text-lg font-bold text-[#16233D] serif-font">Process Waste: Password Resets and Handoff Gaps</h2>
          </div>
          <button onClick=${() => setShowSql(!showSql)} class="text-xs font-semibold px-2.5 py-1.5 border border-[#DCD5C6] rounded bg-[#F6F3EC] hover:bg-[#eae6db] text-stone-600 transition-colors">
            ${showSql ? 'Hide SQL Query' : 'View SQL Query'}
          </button>
        </div>

        <!-- SQL DRAWER -->
        ${showSql && html`
          <div class="mb-4 p-3 bg-stone-900 text-[#eae6db] rounded-md overflow-x-auto text-xs mono-font">
            <span class="text-[#888] block mb-1">-- Part 1: Password Reset Process Waste</span>
            <pre class="mb-3">SELECT
    ROUND(100.0 * AVG(CASE WHEN escalated_to_tier2 THEN 1 ELSE 0 END), 1) AS escalation_pct,
    ROUND(AVG(tier1_queue_hours), 1) AS avg_tier1_queue_hours,
    ROUND(AVG(tier2_queue_hours) FILTER (WHERE escalated_to_tier2), 1) AS avg_tier2_queue_hours,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM fact_tickets), 1) AS pct_of_all_tickets
FROM fact_tickets WHERE category = 'Password Reset';</pre>
            <span class="text-[#888] block mb-1">-- Part 2: Training Gap (Tenure vs Escalation)</span>
            <pre>SELECT
    a.is_new_agent,
    CASE WHEN t.complexity <= 2.5 THEN 'Low' WHEN t.complexity <= 3.5 THEN 'Medium' ELSE 'High' END AS complexity_tier,
    ROUND(100.0 * AVG(CASE WHEN escalated_to_tier2 THEN 1 ELSE 0 END), 1) AS escalation_rate_pct,
    COUNT(*) AS ticket_count
FROM fact_tickets t JOIN dim_agents a ON a.agent_id = t.tier1_agent
GROUP BY a.is_new_agent, complexity_tier ORDER BY complexity_tier, a.is_new_agent;</pre>
          </div>
        `}

        <p class="text-sm text-stone-600 mb-6">
          An alarming <strong class="text-[#B4432F]">${waste.password_reset_escalation_pct}%</strong> of Password Reset tickets (representing <span class="font-medium">${waste.pct_of_all_tickets}</span>% of overall support volume) are needlessly escalated from Tier-1 to Tier-2. Separately, new agents with less than 90 days tenure escalate complex tickets <strong class="text-[#C1832B]">${trainingGapMultiple}×</strong> more than experienced agents.
        </p>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="border border-[#DCD5C6] rounded p-5 bg-[#FBFBFA] flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-4">Avoidable Queue Delay (Password Resets)</h3>
              <div class="space-y-4">
                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span class="text-[#16233D]">Tier-1 Queue Wait</span>
                    <span class="text-stone-500">${waste.avg_tier1_queue_hours_pw}h avg wait</span>
                  </div>
                  <div class="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-[#16233D] h-full" style=${{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1 text-[#B4432F]">
                    <span>↳ Tier-2 Handoff Queue Wait (Avoidable)</span>
                    <span>${waste.avg_tier2_queue_hours_pw}h avg wait</span>
                  </div>
                  <div class="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-[#B4432F] h-full" style=${{ width: `${waste.password_reset_escalation_pct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-dashed border-[#DCD5C6] text-xs text-stone-500">
              Password resets are automated in industry standards. In this case, customers wait in two queues for a simple credentials reset, causing process SLA breach rates to hit 89% for this category.
            </div>
          </div>
          
          <div class="border border-[#DCD5C6] rounded p-4 bg-[#FBFBFA]">
            <h3 class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Escalation Rate by Agent Tenure & Complexity</h3>
            <div ref=${chartRef} class="w-full h-48"></div>
          </div>
        </div>
      </section>
    `;
  };
})();
