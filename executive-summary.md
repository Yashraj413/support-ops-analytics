# Support Operations Optimization: Reducing Resolution Time & Cost Per Ticket While Improving SLA

**Dataset:** 15,400 support tickets · 42 agents · 6,200 customers · FY2025
**Stack:** PostgreSQL (star schema + window functions) · Python (pandas/numpy) · React dashboard (recharts)

---

## Executive Summary

Total support cost: **$619,671/yr**. SLA compliance: **82%**. Customer churn: **16.3%**.
Five findings below turn generic support metrics into dollarized, decision-ready recommendations —
including one that overturns the obvious "just hire more agents" instinct.

## Findings

**A — Cost impact by category.** Technical Issue tickets cost 2.1× more to resolve than Account
Management tickets ($56.89 vs $26.65/ticket) — driven by escalation depth and complexity, not volume.
Total cost concentration: Technical Issue ($245,933) + Billing ($139,256) = 62% of all support spend.

**B — Process waste, not a skills problem.** 69.9% of Password Reset tickets (18.3% of all volume)
are escalated Tier-1 → Tier-2 despite needing no specialist skill — customers wait through two queues
for something Tier-1 could resolve directly. Separately, agents with <90 days tenure escalate
high-complexity tickets 2.3× more often than experienced agents — a training gap, not a workload issue.

**C — Repeat tickets are a product signal.** Billing has a 9.9% repeat rate — 5× every other category
— and drives 60.6% of all repeat-ticket cost ($31,430/yr), most likely a documentation/FAQ gap rather
than a support quality issue. Customers who file 2+ tickets/year churn at 2.79× the baseline rate
(20.5% vs 7.3%) — support volume is a leading indicator of churn, not just an operating cost.

**D — Staffing ROI simulator (the counter-intuitive finding).** Tier-2 is only at 26.5% utilization.
Modeling +1 to +4 permanent Tier-2 hires shows every scenario is net-negative: 2 new agents cost
$110,608/yr but only return ~$26,248/yr in savings + churn avoidance. The queue-time problem is mostly
process waste (Finding B), not a genuine capacity shortfall — hiring without fixing the process first
would waste six figures a year.

**E — Recommendation, in order:**
1. **Quick win (<1 month):** Self-service FAQ for top Password Reset/Billing questions → ~$64,137/yr saved
2. **Process redesign (1–2 months):** Rebalance Tier-1/Tier-2 routing rules, remove Password Reset from
   the Tier-1 queue entirely → frees ~1,900 queue-hours/year for genuinely complex tickets
3. **Targeted, not blanket, staffing:** Contract (not FTE) Tier-2 coverage for Nov–Dec, Mobile+Premium
   segment only — the one segment with a real seasonal capacity gap (82% → 84.3% peak SLA)

---

## Resume Bullet

> Designed and built an end-to-end Support Operations Analytics system (PostgreSQL star schema,
> Python cost/RCA modeling, interactive React dashboard) analyzing 15,400 tickets across 5 categories;
> identified a process-waste pattern causing 70% of Password Reset tickets to be needlessly escalated
> and a training gap causing new agents to escalate complex tickets 2.3× more than experienced agents;
> built a staffing ROI simulator proving permanent headcount additions were net-negative ($110K cost vs
> $26K return), redirecting a hiring decision toward a $64K/year process fix instead; quantified a 2.79×
> churn-rate lift among repeat-ticket customers, reframing support volume as a leading churn indicator.

## Interview Talking Points

- **"Walk me through a time you found something counter-intuitive in data."** → Finding D: the obvious
  fix (hire more agents) tested false. Show the simulator, the math, and why utilization data mattered
  more than SLA breach rate alone.
- **"How do you turn an operational metric into a business case?"** → Finding A/B: cost-per-ticket by
  category plus queue-time decomposition (Tier-1 wait vs Tier-2 wait vs actual work) turns "SLA breach %"
  into a dollar figure a VP can act on.
- **"How do support and product/success teams overlap?"** → Finding C: repeat tickets as a documentation
  gap, and ticket volume as a churn predictor — this is the cross-functional framing that separates a BA
  from a dashboard builder.

## Files Delivered
- `support-ops-dashboard.jsx` — interactive dashboard (KPIs, cost charts, RCA visuals, live staffing
  simulator, layered recommendations)
- `schema_and_queries.sql` — PostgreSQL star schema (fact_tickets, dim_agents, dim_customers) + all 10
  analytical queries behind the findings above, including window-function cohort analysis
- `generate_data.py` / `analyze.py` — synthetic data generator with intentionally embedded realistic
  patterns, and the full analysis engine (cost impact, RCA, churn correlation, staffing ROI, forecast)
