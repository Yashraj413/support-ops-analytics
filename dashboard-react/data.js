window.FALLBACK_DATA = {
  kpi: { total_tickets: 15400, avg_resolution_hours: 9.7, sla_compliance_pct: 82.0, total_cost_usd: 619671, repeat_ticket_rate_pct: 3.8, avg_satisfaction: 3.93, churn_rate_pct: 16.3 },
  cost_by_category: [
    { category: "Technical Issue", ticket_count: 4323, avg_resolution_hours: 10.8, sla_breach_pct: 0.4, total_cost: 245933, avg_cost_per_ticket: 56.89, repeat_rate_pct: 2.2 },
    { category: "Billing", ticket_count: 3379, avg_resolution_hours: 9.1, sla_breach_pct: 2.0, total_cost: 139256, avg_cost_per_ticket: 41.21, repeat_rate_pct: 9.9 },
    { category: "Password Reset", ticket_count: 2813, avg_resolution_hours: 10.8, sla_breach_pct: 89.0, total_cost: 95239, avg_cost_per_ticket: 33.86, repeat_rate_pct: 1.8 },
    { category: "Shipping/Delivery", ticket_count: 2564, avg_resolution_hours: 8.8, sla_breach_pct: 2.2, total_cost: 77387, avg_cost_per_ticket: 30.18, repeat_rate_pct: 2.0 },
    { category: "Account Management", ticket_count: 2321, avg_resolution_hours: 8.3, sla_breach_pct: 5.6, total_cost: 61856, avg_cost_per_ticket: 26.65, repeat_rate_pct: 2.3 }
  ],
  cost_headline: { priciest_category: "Technical Issue", cheapest_category: "Account Management", cost_multiple: 2.1 },
  process_waste: { password_reset_escalation_pct: 69.9, avg_tier1_queue_hours_pw: 6.3, avg_tier2_queue_hours_pw: 4.8, pct_of_all_tickets: 18.3 },
  tenure_escalation: [
    { new_agent: false, complexity: "Low", escalation_rate_pct: 35.5 },
    { new_agent: false, complexity: "Medium", escalation_rate_pct: 26.8 },
    { new_agent: false, complexity: "High", escalation_rate_pct: 32.0 },
    { new_agent: true, complexity: "Low", escalation_rate_pct: 34.8 },
    { new_agent: true, complexity: "Medium", escalation_rate_pct: 37.8 },
    { new_agent: true, complexity: "High", escalation_rate_pct: 72.2 }
  ],
  training_gap_multiple: 2.3,
  repeat_analysis: [
    { category: "Billing", repeat_rate_pct: 9.9 },
    { category: "Account Management", repeat_rate_pct: 2.3 },
    { category: "Technical Issue", repeat_rate_pct: 2.2 },
    { category: "Shipping/Delivery", repeat_rate_pct: 2.0 },
    { category: "Password Reset", repeat_rate_pct: 1.8 }
  ],
  repeat_cost_summary: { total_repeat_related_cost: 51832, billing_repeat_cost: 31430, billing_share_of_repeat_cost_pct: 60.6, pct_of_total_support_cost: 8.4 },
  churn_by_ticket_volume: [
    { bucket: "0 tickets", churn_rate_pct: 7.3 },
    { bucket: "1 ticket", churn_rate_pct: 6.1 },
    { bucket: "2-3 tickets", churn_rate_pct: 16.2 },
    { bucket: "4+ tickets", churn_rate_pct: 28.8 }
  ],
  churn_headline: { baseline_churn_pct: 7.3, multi_ticket_churn_pct: 20.5, churn_lift_multiple: 2.79 },
  staffing_model: {
    current_tier2_headcount: 14, current_sla_compliance_pct: 82.0, current_tier2_utilization_pct: 26.5,
    avg_fully_loaded_annual_cost_per_agent: 55304,
    scenarios: [
      { added_agents: 1, annual_cost_usd: 55304, new_sla_compliance_pct: 83.2, breaches_avoided: 192, operational_savings_usd: 8239, churn_avoidance_value_usd: 5760, net_annual_benefit_usd: -41305 },
      { added_agents: 2, annual_cost_usd: 110608, new_sla_compliance_pct: 84.3, breaches_avoided: 360, operational_savings_usd: 15448, churn_avoidance_value_usd: 10800, net_annual_benefit_usd: -84361 },
      { added_agents: 3, annual_cost_usd: 165913, new_sla_compliance_pct: 85.3, breaches_avoided: 509, operational_savings_usd: 21841, churn_avoidance_value_usd: 15270, net_annual_benefit_usd: -128801 },
      { added_agents: 4, annual_cost_usd: 221217, new_sla_compliance_pct: 86.2, breaches_avoided: 641, operational_savings_usd: 27506, churn_avoidance_value_usd: 19230, net_annual_benefit_usd: -174481 }
    ]
  },
  forecast: {
    historical_monthly: { "2025-01": 1396, "2025-02": 1199, "2025-03": 1317, "2025-04": 1284, "2025-05": 1297, "2025-06": 1255, "2025-07": 1223, "2025-08": 1299, "2025-09": 1254, "2025-10": 1291, "2025-11": 1254, "2025-12": 1331 },
    forecast_months: { "2026-01": 1270, "2026-02": 1268, "2026-03": 1266 }
  }
};
