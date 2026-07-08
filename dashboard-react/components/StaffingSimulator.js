(function() {
  const { useState, useMemo } = React;
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const moneySigned = (n) => (n >= 0 ? "+" : "-") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");

  window.StaffingSimulator = function({ model }) {
    const [addedAgents, setAddedAgents] = useState(2);
    const [showSql, setShowSql] = useState(false);

    const scenario = useMemo(() => {
      return model.scenarios.find(s => s.added_agents === Number(addedAgents)) || model.scenarios[1];
    }, [model, addedAgents]);

    return html`
      <section class="bg-white border border-[#DCD5C6] rounded-lg p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <span class="text-xs tracking-widest font-semibold text-[#B4432F]">FINDING D</span>
            <h2 class="text-lg font-bold text-[#16233D] serif-font">Staffing ROI Simulator — Fix Process Before Hiring</h2>
          </div>
          <button onClick=${() => setShowSql(!showSql)} class="text-xs font-semibold px-2.5 py-1.5 border border-[#DCD5C6] rounded bg-[#F6F3EC] hover:bg-[#eae6db] text-stone-600 transition-colors">
            ${showSql ? 'Hide SQL Query' : 'View SQL Query'}
          </button>
        </div>

        <!-- SQL DRAWER -->
        ${showSql && html`
          <div class="mb-4 p-3 bg-stone-900 text-[#eae6db] rounded-md overflow-x-auto text-xs mono-font">
            <span class="text-[#888] block mb-1">-- Staffing model inputs: current Tier-2 agent utilization</span>
            <pre>SELECT
    COUNT(DISTINCT a.agent_id) FILTER (WHERE a.tier = 'Tier-2') AS tier2_headcount,
    ROUND(AVG(a.hourly_cost_usd) FILTER (WHERE a.tier = 'Tier-2'), 2) AS avg_tier2_hourly_cost,
    ROUND(SUM(t.tier2_work_hours), 0) AS total_tier2_work_hours,
    ROUND(SUM(t.tier2_work_hours) / 
          (COUNT(DISTINCT a.agent_id) FILTER (WHERE a.tier = 'Tier-2') * 8 * 260), 3) AS utilization_ratio
FROM fact_tickets t
CROSS JOIN dim_agents a;</pre>
          </div>
        `}

        <p class="text-sm text-stone-600 mb-6">
          The operations dashboard shows SLA compliance is down to 82%, causing a natural instinct to "hire more headcount". However, Tier-2 agents have only a <strong class="text-[#16233D]">${model.current_tier2_utilization_pct}%</strong> utilization rate. Drag the slider to model new permanent hires and analyze the financial ROI.
        </p>

        <div class="bg-[#FBFBFA] border border-[#DCD5C6] rounded-lg p-5">
          <!-- Slider Control -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span class="text-sm font-semibold text-[#16233D]">Simulate Additional Tier-2 Headcount:</span>
              <span class="inline-block px-3 py-1 bg-[#16233D] text-[#F6F3EC] text-sm font-bold rounded-full ml-2">+${addedAgents} Agent${addedAgents > 1 ? 's' : ''}</span>
            </div>
            <div class="w-full sm:w-64">
              <input 
                id="added-agents-slider" 
                type="range" min="1" max="4" step="1" 
                value=${addedAgents} 
                onChange=${(e) => setAddedAgents(Number(e.target.value))}
                class="w-full accent-[#16233D] cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-stone-400 font-semibold px-1 mt-1">
                <span>+1 FTE</span>
                <span>+2 FTE</span>
                <span>+3 FTE</span>
                <span>+4 FTE</span>
              </div>
            </div>
          </div>

          <!-- Metrics Panel -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white border border-[#DCD5C6] rounded p-4 shadow-sm">
              <div class="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">Additional Annual Cost</div>
              <div class="text-xl sm:text-2xl font-bold text-[#16233D] serif-font">${money(scenario.annual_cost_usd)}</div>
              <div class="text-[10px] text-stone-400 mt-1">@ ${money(model.avg_fully_loaded_annual_cost_per_agent)} / agent</div>
            </div>
            <div class="bg-white border border-[#DCD5C6] rounded p-4 shadow-sm">
              <div class="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">New SLA Compliance</div>
              <div class="text-xl sm:text-2xl font-bold text-[#2F6E5C] serif-font">${scenario.new_sla_compliance_pct}%</div>
              <div class="text-[10px] text-stone-400 mt-1">${scenario.breaches_avoided} breaches avoided</div>
            </div>
            <div class="bg-white border border-[#DCD5C6] rounded p-4 shadow-sm">
              <div class="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">Savings + Avoided Churn</div>
              <div class="text-xl sm:text-2xl font-bold text-[#16233D] serif-font">${money(scenario.operational_savings_usd + scenario.churn_avoidance_value_usd)}</div>
              <div class="text-[10px] text-stone-400 mt-1">${money(scenario.operational_savings_usd)} labor + ${money(scenario.churn_avoidance_value_usd)} LTV</div>
            </div>
            <div class="bg-white border border-[#DCD5C6] rounded p-4 shadow-sm">
              <div class="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">Net Annual Benefit</div>
              <div class="text-xl sm:text-2xl font-bold serif-font ${scenario.net_annual_benefit_usd < 0 ? 'text-[#B4432F]' : 'text-[#2F6E5C]'}">${moneySigned(scenario.net_annual_benefit_usd)}</div>
              <div class="text-[10px] text-stone-400 mt-1">ROI of staffing expansion</div>
            </div>
          </div>

          <!-- Alert Note -->
          <div class="mt-5 p-4 rounded bg-[#FBF0E8] border border-[#E9D9CF] text-xs text-[#7A3A22] flex gap-3 items-start">
            <span class="text-base">💡</span>
            <div>
              <strong class="font-bold">Staffing Paradox:</strong> Each permanent-hire scenario is net-negative (e.g. 2 agents cost $110K but return only $26K). The primary cause of long queue waits is <strong>process waste</strong> (the pointless Password Reset escalations and Billing repeat questions). Resolving the process bottlenecks removes queue hours directly, making additional permanent headcount unnecessary.
            </div>
          </div>
        </div>
      </section>
    `;
  };
})();
