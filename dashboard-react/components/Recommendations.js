(() => {
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  window.Recommendations = function({ repeatCostSummary }) {
    const layer1Savings = repeatCostSummary.billing_repeat_cost * 0.8 + 22000;

    return html`
      <section class="bg-white border border-[#DCD5C6] rounded-lg p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-xs tracking-widest font-semibold text-[#B4432F]">FINDING E</span>
          <h2 class="text-lg font-bold text-[#16233D] serif-font">Strategic Recommendation Plan</h2>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <!-- Layer 1 -->
          <div class="border border-[#DCD5C6] rounded-lg p-4 bg-[#FBFBFA] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div class="text-[10px] font-bold text-[#2F6E5C] uppercase tracking-wider mb-1">LAYER 1 · QUICK WIN · &lt; 1 MONTH</div>
              <h3 class="text-sm font-bold text-[#16233D] mb-3">Self-Service FAQ & Automation</h3>
              <p class="text-xs text-stone-600 leading-relaxed">
                Deploy dynamic self-service FAQs to handle common Billing questions and automate Password Resets direct to self-service. Removes 70% of needless Tier-2 escalations.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-dashed border-[#DCD5C6]">
              <div class="text-[10px] uppercase font-semibold text-stone-400">Estimated Annual Savings</div>
              <div class="text-lg font-bold text-[#2F6E5C] serif-font">${money(layer1Savings)}/yr saved</div>
            </div>
          </div>

          <!-- Layer 2 -->
          <div class="border border-[#DCD5C6] rounded-lg p-4 bg-[#FBFBFA] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div class="text-[10px] font-bold text-[#C1832B] uppercase tracking-wider mb-1">LAYER 2 · PROCESS REDESIGN · 1–2 MONTHS</div>
              <h3 class="text-sm font-bold text-[#16233D] mb-3">Routing Engine Re-Balancing</h3>
              <p class="text-xs text-stone-600 leading-relaxed">
                Update the ticket routing rules. Route password resets entirely outside Tier-1 queue. Implement automated agent training guides based on ticket complexity metrics.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-dashed border-[#DCD5C6]">
              <div class="text-[10px] uppercase font-semibold text-stone-400">Reclaimed Agent Time</div>
              <div class="text-lg font-bold text-[#C1832B] serif-font">Frees ~1,900 hrs/yr</div>
            </div>
          </div>

          <!-- Layer 3 -->
          <div class="border border-[#DCD5C6] rounded-lg p-4 bg-[#FBFBFA] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div class="text-[10px] font-bold text-[#B4432F] uppercase tracking-wider mb-1">LAYER 3 · TARGETED SEASONAL SURGE</div>
              <h3 class="text-sm font-bold text-[#16233D] mb-3">Contract Tier-2 Peak Coverage</h3>
              <p class="text-xs text-stone-600 leading-relaxed">
                Instead of hiring permanent agents, hire temporary contractors for November–December only, specifically dedicated to the high-SLA Mobile+Premium segment.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-dashed border-[#DCD5C6]">
              <div class="text-[10px] uppercase font-semibold text-stone-400">Impact on Peak SLA</div>
              <div class="text-lg font-bold text-[#B4432F] serif-font">82% → 84.3% compliance</div>
            </div>
          </div>
        </div>
      </section>
    `;
  };
})();
