(() => {
  const { useState, useEffect } = React;

  window.App = function () {
    const [data, setData] = useState(window.FALLBACK_DATA);
    const [status, setStatus] = useState("Loaded Local Fallback");
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
      async function loadData() {
        try {
          const response = await fetch('./data/analysis_output.json');
          if (response.ok) {
            const liveData = await response.json();
            setData(liveData);
            setStatus("Live JSON Loaded");
            setIsLive(true);
          }
        } catch (err) {
          console.log("CORS/network block. Using pre-embedded data fallback.", err);
        }
      }
      loadData();
    }, []);

    return html`
      <div class="max-w-6xl mx-auto">
        
        <!-- HEADER -->
        <header class="mb-8 border-b pb-6 border-[#DCD5C6]">
          <div class="text-xs tracking-widest font-semibold mb-2 text-[#C1832B]">
            SUPPORT OPERATIONS — ANNUAL REVIEW · FY2025 · MODULAR REACT
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold leading-tight text-[#16233D]">
            The Cost of a Support Ticket Isn't the Ticket.<br class="hidden sm:inline" /> It's What Happens Around It.
          </h1>
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
            <p class="text-sm text-stone-600 max-w-2xl">
              15,400 tickets · 42 agents · 6,200 customers analyzed across cost, process design,
              product quality, and churn. Built as a modular React component structure with isolated states.
            </p>
            <div class="flex items-center gap-2 self-start md:self-auto bg-white border border-[#DCD5C6] px-3 py-1.5 rounded shadow-sm">
              <span class="inline-block w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'} ${isLive && 'animate-pulse'}"></span>
              <span class="text-xs font-medium text-stone-600">React State: <span class="font-bold">${status}</span></span>
            </div>
          </div>
        </header>

        <!-- KPI STRIP -->
        <${KpiStrip} kpi=${data.kpi} />

        <!-- SECTIONS -->
        <div class="space-y-12">
          <${CostImpact} data=${data.cost_by_category} headline=${data.cost_headline} />
          
          <${ProcessWaste} 
            waste=${data.process_waste} 
            tenureEscalation=${data.tenure_escalation} 
            trainingGapMultiple=${data.training_gap_multiple} 
          />

          <${RepeatChurn} 
            repeatAnalysis=${data.repeat_analysis} 
            churnVolume=${data.churn_by_ticket_volume} 
            repeatCostSummary=${data.repeat_cost_summary} 
            churnHeadline=${data.churn_headline} 
          />

          <${StaffingSimulator} model=${data.staffing_model} />

          <${Recommendations} repeatCostSummary=${data.repeat_cost_summary} />

          <${VolumeForecast} forecast=${data.forecast} />
        </div>

        <!-- FOOTER -->
        <footer class="mt-16 pt-6 border-t border-[#DCD5C6] text-center text-xs text-stone-500 pb-8">
          Support Operations Analytics · Modular React App · Designed by Yash
        </footer>

      </div>
    `;
  };
})();
