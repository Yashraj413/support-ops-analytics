"""
Support Operations Analytics - Synthetic Data Generator
Generates 15,000+ support tickets with REALISTIC, INTENTIONAL patterns baked in:
  1. Billing tickets have high repeat-rate (documentation gap) -> churn driver
  2. Tier-1 -> Tier-2 handoff for Password Reset is pure process waste (should be self-service)
  3. New agents (<90 days tenure) escalate high-complexity tickets more (training gap)
  4. Mobile+Premium+Nov-Dec combo is the hardest-to-resolve segment (seasonal + channel issue)
  5. Customers with >1 ticket/year churn at meaningfully higher rate
These patterns are what the analysis is designed to "discover" - this is how a real
portfolio project should be built: simulate a business reality, then prove you can find it.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json

np.random.seed(42)

N_TICKETS = 15400
N_AGENTS = 42
N_CUSTOMERS = 6200

START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2025, 12, 31)
DAYS_RANGE = (END_DATE - START_DATE).days

CATEGORIES = ["Billing", "Password Reset", "Technical Issue", "Shipping/Delivery", "Account Management"]
CATEGORY_WEIGHTS = [0.22, 0.18, 0.28, 0.17, 0.15]
CHANNELS = ["Web", "Mobile App", "Email", "Phone"]
CHANNEL_WEIGHTS = [0.30, 0.28, 0.22, 0.20]
TIERS = ["Tier-1", "Tier-2"]
PRODUCTS = ["Core Platform", "Mobile App", "Billing Portal", "API/Integrations"]
CUSTOMER_PLANS = ["Free", "Standard", "Premium"]
PLAN_WEIGHTS = [0.35, 0.40, 0.25]

# ---------- Agents ----------
agent_ids = [f"AG{i:03d}" for i in range(1, N_AGENTS + 1)]
agent_tenure_days = np.random.choice(
    [np.random.randint(1, 90), np.random.randint(91, 365), np.random.randint(366, 1800)],
    size=N_AGENTS, p=None
) if False else np.concatenate([
    np.random.randint(1, 90, size=int(N_AGENTS*0.25)),
    np.random.randint(91, 365, size=int(N_AGENTS*0.35)),
    np.random.randint(366, 1800, size=N_AGENTS - int(N_AGENTS*0.25) - int(N_AGENTS*0.35))
])
np.random.shuffle(agent_tenure_days)
agents = pd.DataFrame({
    "agent_id": agent_ids,
    "tenure_days": agent_tenure_days,
    "tier": np.random.choice(TIERS, size=N_AGENTS, p=[0.65, 0.35]),
    "hourly_cost_usd": np.round(np.random.uniform(18, 35, size=N_AGENTS), 2),
})
agents["is_new_agent"] = agents["tenure_days"] < 90

# ---------- Customers ----------
customer_ids = [f"CUST{i:05d}" for i in range(1, N_CUSTOMERS + 1)]
customers = pd.DataFrame({
    "customer_id": customer_ids,
    "plan": np.random.choice(CUSTOMER_PLANS, size=N_CUSTOMERS, p=PLAN_WEIGHTS),
    "signup_offset_days": np.random.randint(0, 700, size=N_CUSTOMERS),
})
# base churn propensity (will be adjusted by ticket behavior later)
customers["base_churn_risk"] = np.random.uniform(0.03, 0.10, size=N_CUSTOMERS)

# ---------- Tickets ----------
ticket_dates = START_DATE + pd.to_timedelta(np.random.randint(0, DAYS_RANGE, size=N_TICKETS), unit="D")
categories = np.random.choice(CATEGORIES, size=N_TICKETS, p=CATEGORY_WEIGHTS)
channels = np.random.choice(CHANNELS, size=N_TICKETS, p=CHANNEL_WEIGHTS)
products = np.random.choice(PRODUCTS, size=N_TICKETS)
customer_sample = np.random.choice(customer_ids, size=N_TICKETS)

df = pd.DataFrame({
    "ticket_id": [f"TCK{i:06d}" for i in range(1, N_TICKETS + 1)],
    "customer_id": customer_sample,
    "category": categories,
    "channel": channels,
    "product": products,
    "created_at": ticket_dates,
})
df = df.merge(customers[["customer_id", "plan"]], on="customer_id", how="left")

# Assign initial tier: Password Reset should almost always start Tier-1 then MOST get
# needlessly handed to Tier-2 (this is the embedded process-waste pattern)
def assign_tier1_start(cat):
    return "Tier-1"
df["entry_tier"] = "Tier-1"

# complexity score (1-5) - technical/billing skew complex
complexity_base = {
    "Billing": 2.6, "Password Reset": 1.1, "Technical Issue": 3.4,
    "Shipping/Delivery": 2.2, "Account Management": 2.0
}
df["complexity"] = df["category"].map(complexity_base) + np.random.normal(0, 0.6, N_TICKETS)
df["complexity"] = df["complexity"].clip(1, 5).round(1)

# assign handling agent (weighted toward Tier-1 first)
tier1_agents = agents[agents.tier == "Tier-1"]["agent_id"].values
tier2_agents = agents[agents.tier == "Tier-2"]["agent_id"].values
df["tier1_agent"] = np.random.choice(tier1_agents, size=N_TICKETS)
df = df.merge(agents[["agent_id", "tenure_days", "is_new_agent", "hourly_cost_usd"]]
              .rename(columns={"agent_id": "tier1_agent", "tenure_days": "t1_tenure",
                                "is_new_agent": "t1_is_new", "hourly_cost_usd": "t1_hourly_cost"}),
              on="tier1_agent", how="left")

# --- PATTERN 1: Password Reset needlessly escalated to Tier-2 (process waste) ---
pw_mask = df["category"] == "Password Reset"
escalate_prob = np.where(pw_mask, 0.71, np.nan)  # 71% of PW resets pointlessly escalate

# --- PATTERN 2: new agents escalate high-complexity tickets far more (training gap) ---
new_agent_mask = df["t1_is_new"]
base_escalate = 0.12 + (df["complexity"] - 1) * 0.07  # complexity-driven baseline
base_escalate = np.where(new_agent_mask & (df["complexity"] >= 3.2), base_escalate * 2.1, base_escalate)
escalate_prob = np.where(pw_mask, escalate_prob, base_escalate)
escalate_prob = np.clip(escalate_prob, 0, 0.95)

df["escalated_to_tier2"] = np.random.binomial(1, escalate_prob).astype(bool)
df["tier2_agent"] = np.where(df["escalated_to_tier2"], np.random.choice(tier2_agents, size=N_TICKETS), None)
tier2_lookup = agents[agents.tier == "Tier-2"].set_index("agent_id")
df["t2_hourly_cost"] = df["tier2_agent"].map(agents.set_index("agent_id")["hourly_cost_usd"])

# --- queue / work time (hours) by stage ---
# Tier-1 queue time baseline
df["tier1_queue_hours"] = np.random.gamma(shape=2.0, scale=3.2, size=N_TICKETS)
df["tier1_work_hours"] = np.random.gamma(shape=1.5, scale=0.55, size=N_TICKETS) * (df["complexity"] / 2.5)

# --- PATTERN 3: Mobile + Premium + Nov/Dec = hardest combo (seasonal capacity crunch) ---
is_mobile = df["channel"] == "Mobile App"
is_premium = df["plan"] == "Premium"
is_peak = df["created_at"].dt.month.isin([11, 12])
hard_combo = is_mobile & is_premium & is_peak
season_multiplier = np.where(hard_combo, 2.4, np.where(is_peak, 1.35, 1.0))

df["tier2_queue_hours"] = np.where(
    df["escalated_to_tier2"],
    np.random.gamma(shape=2.2, scale=2.1, size=N_TICKETS) * season_multiplier,
    0
)
df["tier2_work_hours"] = np.where(
    df["escalated_to_tier2"],
    np.random.gamma(shape=1.8, scale=0.75, size=N_TICKETS) * (df["complexity"] / 2.2),
    0
)

# handoff back-and-forth (rework loops) - technical issues most prone
handoff_prob = np.where(df["category"] == "Technical Issue", 0.18, 0.06)
df["handoff_loops"] = np.random.binomial(1, handoff_prob) + np.where(
    (df["category"] == "Technical Issue") & (df["complexity"] > 3.5),
    np.random.binomial(1, 0.15), 0
)

df["total_resolution_hours"] = (
    df["tier1_queue_hours"] + df["tier1_work_hours"] +
    df["tier2_queue_hours"] + df["tier2_work_hours"] +
    df["handoff_loops"] * np.random.gamma(2, 1.8, N_TICKETS)
).round(2)

# SLA target hours by category
sla_target = {"Billing": 24, "Password Reset": 4, "Technical Issue": 36,
              "Shipping/Delivery": 24, "Account Management": 18}
df["sla_target_hours"] = df["category"].map(sla_target)
df["sla_breached"] = df["total_resolution_hours"] > df["sla_target_hours"]

# --- PATTERN 4: Billing repeat-ticket problem (documentation gap, not support issue) ---
# We create repeat tickets explicitly: some tickets are "repeats" of an earlier one
df["is_repeat"] = False
repeat_source_pool = df.sample(frac=0.14, random_state=1).index  # candidates that spawn a repeat
billing_repeat_boost = df["category"] == "Billing"
repeat_flags = np.zeros(N_TICKETS, dtype=bool)
repeat_flags[repeat_source_pool] = np.random.binomial(
    1, np.where(billing_repeat_boost.loc[repeat_source_pool], 0.62, 0.16)
).astype(bool)
df["is_repeat"] = repeat_flags

# satisfaction score (1-5), lower for breaches, repeats, and long resolution
sat = 4.3 - (df["sla_breached"].astype(int) * 0.9) - (df["is_repeat"].astype(int) * 1.1) \
      - (df["total_resolution_hours"] / 60).clip(0, 1.5)
df["satisfaction_score"] = (sat + np.random.normal(0, 0.35, N_TICKETS)).clip(1, 5).round(1)

# cost calc
df["labor_cost_usd"] = (
    (df["tier1_work_hours"] * df["t1_hourly_cost"]) +
    (df["tier2_work_hours"] * df["t2_hourly_cost"].fillna(0))
).round(2)
sla_penalty = {"Billing": 45, "Password Reset": 8, "Technical Issue": 60,
               "Shipping/Delivery": 35, "Account Management": 25}
df["sla_breach_penalty_usd"] = np.where(df["sla_breached"], df["category"].map(sla_penalty), 0)
rework_cost = {"Billing": 55, "Password Reset": 12, "Technical Issue": 70,
               "Shipping/Delivery": 40, "Account Management": 30}
df["rework_cost_usd"] = np.where(df["is_repeat"], df["category"].map(rework_cost), 0) + \
                          (df["handoff_loops"] * 22)
df["total_cost_usd"] = (df["labor_cost_usd"] + df["sla_breach_penalty_usd"] + df["rework_cost_usd"]).round(2)

# --- PATTERN 5: customer churn correlated with ticket volume/repeats ---
ticket_counts = df.groupby("customer_id").size().rename("ticket_count")
repeat_counts = df.groupby("customer_id")["is_repeat"].sum().rename("repeat_count")
cust_stats = customers.set_index("customer_id").join(ticket_counts).join(repeat_counts).fillna(0)
cust_stats["ticket_count"] = cust_stats["ticket_count"].astype(int)
cust_stats["repeat_count"] = cust_stats["repeat_count"].astype(int)

churn_prob = cust_stats["base_churn_risk"].copy()
churn_prob += np.where(cust_stats["ticket_count"] > 1, 0.09, 0)
churn_prob += np.where(cust_stats["ticket_count"] > 3, 0.14, 0)
churn_prob += cust_stats["repeat_count"] * 0.05
churn_prob = churn_prob.clip(0, 0.85)
cust_stats["churned"] = np.random.binomial(1, churn_prob)
cust_stats = cust_stats.reset_index()

df.drop(columns=["tenure_days"], errors="ignore", inplace=True)

# Save
import os
os.makedirs("data", exist_ok=True)
df.to_csv("data/tickets.csv", index=False)
agents.to_csv("data/agents.csv", index=False)
cust_stats.to_csv("data/customers.csv", index=False)

print("Tickets:", df.shape)
print("Agents:", agents.shape)
print("Customers:", cust_stats.shape)
print(df.head(3).to_string())
