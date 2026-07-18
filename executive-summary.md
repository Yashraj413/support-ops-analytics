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
