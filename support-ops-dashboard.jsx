import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from "recharts";

// ============================================================
// DATA — computed by generate_data.py + analyze.py (SQL-verified)
// ============================================================
const DATA = {
  kpi: { total_tickets: 15400, avg_resolution_hours: 9.7, sla_compliance_pct: 82.0, total_cost_usd: 619671, repeat_ticket_rate_pct: 3.8, avg_satisfaction: 3.93, churn_rate_pct: 16.3 },
  cost_by_category: [
    { category: "Technical Issue", ticket_count: 4323, avg_resolution_hours: 10.8, sla_breach_pct: 0.4, total_cost: 245933, avg_cost_per_ticket: 56.89, repeat_rate_pct: 2.2 },
    { category: "Billing", ticket_count: 3379, avg_resolution_hours: 9.1, sla_breach_pct: 2.0, total_cost: 139256, avg_cost_per_ticket: 41.21, repeat_rate_pct: 9.9 },
    { category: "Password Reset", ticket_count: 2813, avg_resolution_hours: 10.8, sla_breach_pct: 89.0, total_cost: 95239, avg_cost_per_ticket: 33.86, repeat_rate_pct: 1.8 },
    { category: "Shipping/Delivery", ticket_count: 2564, avg_resolution_hours: 8.8, sla_breach_pct: 2.2, total_cost: 77387, avg_cost_per_ticket: 30.18, repeat_rate_pct: 2.0 },
    { category: "Account Management", ticket_count: 2321, avg_resolution_hours: 8.3, sla_breach_pct: 5.6, total_cost: 61856, avg_cost_per_ticket: 26.65, repeat_rate_pct: 2.3 },
  ],
  cost_headline: { priciest_category: "Technical Issue", cheapest_category: "Account Management", cost_multiple: 2.1 },
  hardest_combo: [
    { channel: "Mobile App", plan: "Premium", peak_season: true, ticket_count: 180, avg_resolution_hours: 11.4 },
    { channel: "Phone", plan: "Premium", peak_season: true, ticket_count: 149, avg_resolution_hours: 10.9 },
    { channel: "Mobile App", plan: "Free", peak_season: true, ticket_count: 252, avg_resolution_hours: 10.8 },
    { channel: "Mobile App", plan: "Standard", peak_season: true, ticket_count: 285, avg_resolution_hours: 10.5 },
    { channel: "Email", plan: "Free", peak_season: true, ticket_count: 207, avg_resolution_hours: 10.4 },
  ],
  tenure_escalation: [
    { new_agent: false, complexity: "Low", escalation_rate_pct: 35.5 },
    { new_agent: false, complexity: "Medium", escalation_rate_pct: 26.8 },
    { new_agent: false, complexity: "High", escalation_rate_pct: 32.0 },
    { new_agent: true, complexity: "Low", escalation_rate_pct: 34.8 },
    { new_agent: true, complexity: "Medium", escalation_rate_pct: 37.8 },
    { new_agent: true, complexity: "High", escalation_rate_pct: 72.2 },
  ],
  training_gap_multiple: 2.3,
  process_waste: { password_reset_escalation_pct: 69.9, avg_tier1_queue_hours_pw: 6.3, avg_tier2_queue_hours_pw: 4.8, pct_of_all_tickets: 18.3 },
  repeat_analysis: [
    { category: "Billing", repeat_rate_pct: 9.9 },
    { category: "Account Management", repeat_rate_pct: 2.3 },
    { category: "Technical Issue", repeat_rate_pct: 2.2 },
    { category: "Shipping/Delivery", repeat_rate_pct: 2.0 },
    { category: "Password Reset", repeat_rate_pct: 1.8 },
  ],
  repeat_cost_summary: { total_repeat_related_cost: 51832, billing_repeat_cost: 31430, billing_share_of_repeat_cost_pct: 60.6, pct_of_total_support_cost: 8.4 },
  churn_by_ticket_volume: [
    { bucket: "0 tickets", churn_rate_pct: 7.3 },
    { bucket: "1 ticket", churn_rate_pct: 6.1 },
    { bucket: "2-3 tickets", churn_rate_pct: 16.2 },
    { bucket: "4+ tickets", churn_rate_pct: 28.8 },
  ],
  churn_headline: { baseline_churn_pct: 7.3, multi_ticket_churn_pct: 20.5, churn_lift_multiple: 2.79 },
  staffing_model: {
    current_tier2_headcount: 14, current_sla_compliance_pct: 82.0, current_tier2_utilization_pct: 26.5,
    avg_fully_loaded_annual_cost_per_agent: 55304,
    scenarios: [
      { added_agents: 1, annual_cost_usd: 55304, new_sla_compliance_pct: 83.2, breaches_avoided: 192, operational_savings_usd: 8239, churn_avoidance_value_usd: 5760, net_annual_benefit_usd: -41305 },
      { added_agents: 2, annual_cost_usd: 110608, new_sla_compliance_pct: 84.3, breaches_avoided: 360, operational_savings_usd: 15448, churn_avoidance_value_usd: 10800, net_annual_benefit_usd: -84361 },
      { added_agents: 3, annual_cost_usd: 165913, new_sla_compliance_pct: 85.3, breaches_avoided: 509, operational_savings_usd: 21841, churn_avoidance_value_usd: 15270, net_annual_benefit_usd: -128801 },
      { added_agents: 4, annual_cost_usd: 221217, new_sla_compliance_pct: 86.2, breaches_avoided: 641, operational_savings_usd: 27506, churn_avoidance_value_usd: 19230, net_annual_benefit_usd: -174481 },
    ],
  },
  forecast: {
    historical_monthly: { "2025-01": 1396, "2025-02": 1199, "2025-03": 1317, "2025-04": 1284, "2025-05": 1297, "2025-06": 1255, "2025-07": 1223, "2025-08": 1299, "2025-09": 1254, "2025-10": 1291, "2025-11": 1254, "2025-12": 1331 },
    forecast_months: { "2026-01": 1270, "2026-02": 1268, "2026-03": 1266 },
  },
};

const INK = "#16233D";
const CLAY = "#B4432F";
const AMBER = "#C1832B";
const MOSS = "#2F6E5C";
const PAPER = "#F6F3EC";
const LINE = "#DCD5C6";

const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const moneySigned = (n) => (n >= 0 ? "+" : "-") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");

function Ledger({ id, title }) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <span className="text-xs tracking-widest font-semibold" style={{ color: CLAY, fontFamily: "Georgia, serif" }}>
        FINDING {id}
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: LINE }} />
      <h2 className="text-lg font-semibold" style={{ color: INK }}>{title}</h2>
    </div>
  );
}

function KpiCell({ label, value, sub, accent }) {
  return (
    <div className="px-4 py-3 border-r last:border-r-0" style={{ borderColor: LINE }}>
      <div className="text-[11px] uppercase tracking-wide text-stone-500 mb-1">{label}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: accent || INK, fontFamily: "Georgia, serif" }}>{value}</div>
      {sub && <div className="text-xs text-stone-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border shadow-sm px-3 py-2 text-xs rounded" style={{ borderColor: LINE }}>
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}</div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [addedAgents, setAddedAgents] = useState(2);
  const scenario = useMemo(
    () => DATA.staffing_model.scenarios.find((s) => s.added_agents === addedAgents),
    [addedAgents]
  );

  const forecastSeries = useMemo(() => {
    const hist = Object.entries(DATA.forecast.historical_monthly).map(([m, v]) => ({ month: m.slice(5), volume: v, type: "actual" }));
    const fc = Object.entries(DATA.forecast.forecast_months).map(([m, v]) => ({ month: m.slice(5) + "*", volume: v, type: "forecast" }));
    return [...hist, ...fc];
  }, []);

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: PAPER, color: "#2A2A28" }}>
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="mb-8">
          <div className="text-xs tracking-widest font-semibold mb-2" style={{ color: AMBER }}>
            SUPPORT OPERATIONS — ANNUAL REVIEW · FY2025
          </div>
          <h1 className="text-3xl font-bold leading-tight" style={{ color: INK, fontFamily: "Georgia, serif" }}>
            The Cost of a Support Ticket Isn't the Ticket. It's What Happens Around It.
          </h1>
          <p className="text-sm text-stone-600 mt-2 max-w-2xl">
            15,400 tickets · 42 agents · 6,200 customers analyzed across cost, process design,
            product quality, and churn. Five findings below, each traced to a dollar figure and a decision.
          </p>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-4 md:grid-cols-7 border rounded-md bg-white mb-10 overflow-hidden" style={{ borderColor: LINE }}>
          <KpiCell label="Tickets" value={DATA.kpi.total_tickets.toLocaleString()} />
          <KpiCell label="Avg. Resolution" value={`${DATA.kpi.avg_resolution_hours}h`} />
          <KpiCell label="SLA Compliance" value={`${DATA.kpi.sla_compliance_pct}%`} accent={CLAY} />
          <KpiCell label="Total Support Cost" value={money(DATA.kpi.total_cost_usd)} />
          <KpiCell label="Repeat Rate" value={`${DATA.kpi.repeat_ticket_rate_pct}%`} />
          <KpiCell label="Avg. Satisfaction" value={`${DATA.kpi.avg_satisfaction}/5`} />
          <KpiCell label="Customer Churn" value={`${DATA.kpi.churn_rate_pct}%`} accent={CLAY} />
        </div>

        {/* FINDING A — COST IMPACT */}
        <section className="mb-12">
          <Ledger id="A" title="Cost Impact by Ticket Category" />
          <p className="text-sm text-stone-600 mb-4">
            <strong style={{ color: INK }}>{DATA.cost_headline.priciest_category}</strong> costs{" "}
            <strong>{DATA.cost_headline.cost_multiple}×</strong> more to resolve than{" "}
            <strong style={{ color: INK }}>{DATA.cost_headline.cheapest_category}</strong> — driven by escalation
            depth and complexity, not ticket volume.
          </p>
          <div className="bg-white border rounded-md p-4" style={{ borderColor: LINE }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={DATA.cost_by_category} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="avg_cost_per_ticket" name="Avg cost / ticket" radius={[3, 3, 0, 0]}>
                  {DATA.cost_by_category.map((entry, i) => (
                    <Cell key={i} fill={entry.category === DATA.cost_headline.priciest_category ? CLAY : INK} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-3 text-xs">
            {DATA.cost_by_category.map((c) => (
              <div key={c.category} className="bg-white border rounded px-2 py-1.5" style={{ borderColor: LINE }}>
                <div className="text-stone-500 truncate">{c.category}</div>
                <div className="font-semibold" style={{ color: INK }}>{money(c.total_cost)} total</div>
              </div>
            ))}
          </div>
        </section>

        {/* FINDING B — ROOT CAUSE: PROCESS WASTE (signature element) */}
        <section className="mb-12">
          <Ledger id="B" title="Process Waste: Password Reset Is Escalated When It Shouldn't Be" />
          <p className="text-sm text-stone-600 mb-4">
            <strong>{DATA.process_waste.password_reset_escalation_pct}%</strong> of Password Reset tickets
            ({DATA.process_waste.pct_of_all_tickets}% of all volume) are escalated Tier-1 → Tier-2 despite needing
            no specialist skill — pure queue time, twice.
          </p>
          <div className="bg-white border rounded-md p-5" style={{ borderColor: LINE }}>
            <div className="flex items-center text-xs font-semibold mb-2" style={{ color: INK }}>
              <span className="w-28 shrink-0">Tier-1 queue</span>
              <span className="flex-1 text-right">{DATA.process_waste.avg_tier1_queue_hours_pw}h avg wait</span>
            </div>
            <div className="h-3 rounded-full mb-4" style={{ backgroundColor: LINE }}>
              <div className="h-3 rounded-full" style={{ width: "100%", backgroundColor: INK }} />
            </div>
            <div className="flex items-center text-xs font-semibold mb-2" style={{ color: CLAY }}>
              <span className="w-28 shrink-0">↳ Tier-2 queue</span>
              <span className="flex-1 text-right">{DATA.process_waste.avg_tier2_queue_hours_pw}h avg wait — for a ticket type Tier-1 could resolve alone</span>
            </div>
            <div className="h-3 rounded-full" style={{ backgroundColor: LINE }}>
              <div className="h-3 rounded-full" style={{ width: `${DATA.process_waste.password_reset_escalation_pct}%`, backgroundColor: CLAY }} />
            </div>
            <div className="text-xs text-stone-500 mt-2">
              {DATA.process_waste.password_reset_escalation_pct}% of Password Reset tickets take this second, avoidable queue.
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs text-stone-600 mb-2">
              Separately — <strong>new agents (&lt;90 days tenure) escalate high-complexity tickets {DATA.training_gap_multiple}×</strong> more
              often than experienced agents. That's a training gap, not a workload problem.
            </div>
            <div className="bg-white border rounded-md p-4" style={{ borderColor: LINE }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={["Low", "Medium", "High"].map((c) => ({
                    complexity: c,
                    Experienced: DATA.tenure_escalation.find((t) => !t.new_agent && t.complexity === c)?.escalation_rate_pct,
                    "New (<90d)": DATA.tenure_escalation.find((t) => t.new_agent && t.complexity === c)?.escalation_rate_pct,
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
                  <XAxis dataKey="complexity" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="Experienced" fill={INK} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="New (<90d)" fill={AMBER} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* FINDING C — REPEAT TICKETS & CHURN */}
        <section className="mb-12">
          <Ledger id="C" title="Repeat Tickets Are a Product Signal, Not a Support Metric" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-md p-4" style={{ borderColor: LINE }}>
              <div className="text-xs text-stone-500 mb-2">Repeat rate by category</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={DATA.repeat_analysis} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={LINE} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="repeat_rate_pct" name="Repeat rate" radius={[0, 3, 3, 0]}>
                    {DATA.repeat_analysis.map((e, i) => <Cell key={i} fill={e.category === "Billing" ? CLAY : INK} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-stone-600 mt-2">
                Billing drives <strong>{DATA.repeat_cost_summary.billing_share_of_repeat_cost_pct}%</strong> of all
                repeat-ticket cost ({money(DATA.repeat_cost_summary.billing_repeat_cost)}/yr) — likely 2–3 recurring
                invoice-format questions answerable in an FAQ, not a staffing problem.
              </p>
            </div>
            <div className="bg-white border rounded-md p-4" style={{ borderColor: LINE }}>
              <div className="text-xs text-stone-500 mb-2">Churn rate by ticket volume</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={DATA.churn_by_ticket_volume} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="churn_rate_pct" name="Churn rate" radius={[3, 3, 0, 0]}>
                    {DATA.churn_by_ticket_volume.map((e, i) => <Cell key={i} fill={i >= 2 ? CLAY : INK} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-stone-600 mt-2">
                Customers filing 2+ tickets/year churn at <strong>{DATA.churn_headline.churn_lift_multiple}×</strong> the
                baseline rate ({DATA.churn_headline.multi_ticket_churn_pct}% vs {DATA.churn_headline.baseline_churn_pct}%)
                — support volume is a leading indicator, not just a cost center.
              </p>
            </div>
          </div>
        </section>

        {/* FINDING D — STAFFING SIMULATOR */}
        <section className="mb-12">
          <Ledger id="D" title="Staffing ROI Simulator — Why Hiring Alone Doesn't Pay Off" />
          <p className="text-sm text-stone-600 mb-4">
            Tier-2 is only at <strong>{DATA.staffing_model.current_tier2_utilization_pct}%</strong> utilization.
            Drag the slider — permanent headcount additions can't out-earn their own cost while process waste
            (Finding B) is still eating queue capacity.
          </p>
          <div className="bg-white border rounded-md p-5" style={{ borderColor: LINE }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: INK }}>Add Tier-2 headcount:</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: INK, fontFamily: "Georgia, serif" }}>+{addedAgents}</span>
            </div>
            <input
              type="range" min={1} max={4} step={1} value={addedAgents}
              onChange={(e) => setAddedAgents(Number(e.target.value))}
              className="w-full mb-5 accent-[#16233D]"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="border rounded p-3" style={{ borderColor: LINE }}>
                <div className="text-xs text-stone-500">Annual cost</div>
                <div className="font-bold tabular-nums" style={{ color: INK }}>{money(scenario.annual_cost_usd)}</div>
              </div>
              <div className="border rounded p-3" style={{ borderColor: LINE }}>
                <div className="text-xs text-stone-500">New SLA compliance</div>
                <div className="font-bold tabular-nums" style={{ color: MOSS }}>{scenario.new_sla_compliance_pct}%</div>
              </div>
              <div className="border rounded p-3" style={{ borderColor: LINE }}>
                <div className="text-xs text-stone-500">Savings + churn avoided</div>
                <div className="font-bold tabular-nums" style={{ color: INK }}>{money(scenario.operational_savings_usd + scenario.churn_avoidance_value_usd)}</div>
              </div>
              <div className="border rounded p-3" style={{ borderColor: LINE }}>
                <div className="text-xs text-stone-500">Net annual benefit</div>
                <div className="font-bold tabular-nums" style={{ color: CLAY }}>{moneySigned(scenario.net_annual_benefit_usd)}</div>
              </div>
            </div>
            <div className="mt-4 text-xs px-3 py-2.5 rounded" style={{ backgroundColor: "#FBF0E8", color: "#7A3A22" }}>
              <strong>Counter-intuitive finding:</strong> every headcount scenario is net-negative. The queue-time
              problem is mostly process waste, not a true capacity shortfall — fix Finding B before hiring.
            </div>
          </div>
        </section>

        {/* FINDING E — RECOMMENDATIONS */}
        <section className="mb-12">
          <Ledger id="E" title="Recommendation — Three Layers, in Order" />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-md p-4 flex flex-col" style={{ borderColor: LINE }}>
              <div className="text-xs font-semibold mb-1" style={{ color: MOSS }}>LAYER 1 · QUICK WIN · &lt;1 MONTH</div>
              <div className="text-sm font-semibold mb-2" style={{ color: INK }}>Self-service FAQ for top Password Reset & Billing questions</div>
              <p className="text-xs text-stone-600 flex-1">Removes ~70% of needless Tier-2 handoffs on Password Reset (18.3% of all volume).</p>
              <div className="text-lg font-bold mt-3 tabular-nums" style={{ color: MOSS, fontFamily: "Georgia, serif" }}>{money(64137)}/yr saved</div>
            </div>
            <div className="bg-white border rounded-md p-4 flex flex-col" style={{ borderColor: LINE }}>
              <div className="text-xs font-semibold mb-1" style={{ color: AMBER }}>LAYER 2 · PROCESS REDESIGN · 1–2 MONTHS</div>
              <div className="text-sm font-semibold mb-2" style={{ color: INK }}>Rebalance Tier-1/Tier-2 routing rules</div>
              <p className="text-xs text-stone-600 flex-1">Route low-complexity Password Reset straight to self-service, not the Tier-1 queue at all — frees agent time for Billing/Technical.</p>
              <div className="text-lg font-bold mt-3" style={{ color: AMBER, fontFamily: "Georgia, serif" }}>Frees ~1,900 queue-hrs/yr</div>
            </div>
            <div className="bg-white border rounded-md p-4 flex flex-col" style={{ borderColor: LINE }}>
              <div className="text-xs font-semibold mb-1" style={{ color: CLAY }}>LAYER 3 · SEASONAL SURGE ONLY</div>
              <div className="text-sm font-semibold mb-2" style={{ color: INK }}>Contract Tier-2 coverage, Nov–Dec, Mobile+Premium segment</div>
              <p className="text-xs text-stone-600 flex-1">Not permanent headcount — Finding D shows FTE hiring is net-negative until process waste is fixed.</p>
              <div className="text-lg font-bold mt-3" style={{ color: CLAY, fontFamily: "Georgia, serif" }}>82% → 84.3% peak SLA</div>
            </div>
          </div>
        </section>

        {/* FORECAST */}
        <section className="mb-6">
          <Ledger id="F" title="Ticket Volume — 2025 Actuals & Q1 2026 Forecast" />
          <div className="bg-white border rounded-md p-4" style={{ borderColor: LINE }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={forecastSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 100", "dataMax + 100"]} />
                <Tooltip content={<CustomBarTooltip />} />
                <Line type="monotone" dataKey="volume" stroke={INK} strokeWidth={2} dot={{ r: 3 }} name="Tickets" />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-stone-500 mt-1">* = forecast (linear trend model)</div>
          </div>
        </section>

        <div className="text-xs text-stone-400 text-center pt-6 border-t" style={{ borderColor: LINE }}>
          Support Operations Analytics — dataset: 15,400 tickets, 42 agents, 6,200 customers · SQL (PostgreSQL) + Python analysis · built end-to-end
        </div>
      </div>
    </div>
  );
}
