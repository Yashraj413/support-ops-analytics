CREATE TABLE dim_agents (
    agent_id            VARCHAR(10) PRIMARY KEY,
    tenure_days         INT NOT NULL,
    tier                VARCHAR(10) NOT NULL CHECK (tier IN ('Tier-1','Tier-2')),
    hourly_cost_usd     NUMERIC(6,2) NOT NULL,
    is_new_agent        BOOLEAN GENERATED ALWAYS AS (tenure_days < 90) STORED
);

CREATE TABLE dim_customers (
    customer_id         VARCHAR(12) PRIMARY KEY,
    plan                VARCHAR(10) NOT NULL CHECK (plan IN ('Free','Standard','Premium')),
    signup_offset_days  INT,
    churned             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE fact_tickets (
    ticket_id               VARCHAR(12) PRIMARY KEY,
    customer_id             VARCHAR(12) REFERENCES dim_customers(customer_id),
    category                VARCHAR(30) NOT NULL,
    channel                 VARCHAR(15) NOT NULL,
    product                 VARCHAR(30) NOT NULL,
    created_at              TIMESTAMP NOT NULL,
    complexity              NUMERIC(3,1) NOT NULL,
    tier1_agent             VARCHAR(10) REFERENCES dim_agents(agent_id),
    tier2_agent             VARCHAR(10) REFERENCES dim_agents(agent_id),
    escalated_to_tier2      BOOLEAN NOT NULL DEFAULT FALSE,
    tier1_queue_hours       NUMERIC(6,2),
    tier1_work_hours        NUMERIC(6,2),
    tier2_queue_hours       NUMERIC(6,2),
    tier2_work_hours        NUMERIC(6,2),
    handoff_loops           INT DEFAULT 0,
    total_resolution_hours  NUMERIC(7,2),
    sla_target_hours        INT,
    sla_breached            BOOLEAN GENERATED ALWAYS AS (total_resolution_hours > sla_target_hours) STORED,
    is_repeat                BOOLEAN DEFAULT FALSE,
    satisfaction_score       NUMERIC(3,1),
    labor_cost_usd           NUMERIC(10,2),
    sla_breach_penalty_usd   NUMERIC(10,2),
    rework_cost_usd          NUMERIC(10,2),
    total_cost_usd           NUMERIC(10,2)
);

CREATE INDEX idx_tickets_category   ON fact_tickets(category);
CREATE INDEX idx_tickets_created_at ON fact_tickets(created_at);
CREATE INDEX idx_tickets_customer   ON fact_tickets(customer_id);

-- ---------------------------------------------------------------------
-- 2. COST IMPACT — dollarized cost per ticket category
-- ---------------------------------------------------------------------
SELECT
    category,
    COUNT(*)                                        AS ticket_count,
    ROUND(AVG(total_resolution_hours), 1)           AS avg_resolution_hours,
    ROUND(100.0 * AVG(CASE WHEN sla_breached THEN 1 ELSE 0 END), 1) AS sla_breach_pct,
    ROUND(SUM(total_cost_usd), 0)                   AS total_cost_usd,
    ROUND(AVG(total_cost_usd), 2)                   AS avg_cost_per_ticket,
    ROUND(100.0 * AVG(CASE WHEN is_repeat THEN 1 ELSE 0 END), 1)     AS repeat_rate_pct
FROM fact_tickets
GROUP BY category
ORDER BY avg_cost_per_ticket DESC;

-- ---------------------------------------------------------------------
-- 3. SLA BREACH COST — penalty + rework tied to breaches, by category
-- ---------------------------------------------------------------------
SELECT
    category,
    ROUND(SUM(sla_breach_penalty_usd), 0)  AS total_breach_penalty_usd,
    ROUND(SUM(rework_cost_usd), 0)         AS total_rework_cost_usd,
    ROUND(100.0 * AVG(CASE WHEN is_repeat THEN 1 ELSE 0 END), 1) AS repeat_rate_pct
FROM fact_tickets
WHERE sla_breached = TRUE
GROUP BY category
ORDER BY total_breach_penalty_usd DESC;

-- ---------------------------------------------------------------------
-- 4. ROOT-CAUSE: hardest Product+Channel+Season combination
-- ---------------------------------------------------------------------
SELECT
    channel,
    c.plan,
    (EXTRACT(MONTH FROM created_at) IN (11, 12))    AS is_peak_season,
    COUNT(*)                                         AS ticket_count,
    ROUND(AVG(total_resolution_hours), 1)            AS avg_resolution_hours
FROM fact_tickets t
JOIN dim_customers c ON c.customer_id = t.customer_id
GROUP BY channel, c.plan, is_peak_season
HAVING COUNT(*) >= 20
ORDER BY avg_resolution_hours DESC
LIMIT 5;

-- ---------------------------------------------------------------------
-- 5. ROOT-CAUSE: new-agent tenure vs escalation on high-complexity tickets
--    (training-gap detection)
-- ---------------------------------------------------------------------
SELECT
    a.is_new_agent,
    CASE
        WHEN t.complexity <= 2.5 THEN 'Low'
        WHEN t.complexity <= 3.5 THEN 'Medium'
        ELSE 'High'
    END AS complexity_tier,
    ROUND(100.0 * AVG(CASE WHEN escalated_to_tier2 THEN 1 ELSE 0 END), 1) AS escalation_rate_pct,
    COUNT(*) AS ticket_count
FROM fact_tickets t
JOIN dim_agents a ON a.agent_id = t.tier1_agent
GROUP BY a.is_new_agent, complexity_tier
ORDER BY complexity_tier, a.is_new_agent;

-- ---------------------------------------------------------------------
-- 6. PROCESS WASTE: Password Reset needless Tier-1 -> Tier-2 handoff
-- ---------------------------------------------------------------------
SELECT
    ROUND(100.0 * AVG(CASE WHEN escalated_to_tier2 THEN 1 ELSE 0 END), 1) AS escalation_pct,
    ROUND(AVG(tier1_queue_hours), 1)  AS avg_tier1_queue_hours,
    ROUND(AVG(tier2_queue_hours) FILTER (WHERE escalated_to_tier2), 1) AS avg_tier2_queue_hours,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM fact_tickets), 1) AS pct_of_all_tickets
FROM fact_tickets
WHERE category = 'Password Reset';

-- ---------------------------------------------------------------------
-- 7. REPEAT-TICKET / QUALITY-ISSUE ANALYSIS (cohort, 30-day window)
--    Uses window functions to detect a repeat ticket per customer.
-- ---------------------------------------------------------------------
WITH cohorts AS (
    SELECT
        customer_id,
        DATE_TRUNC('month', MIN(created_at)) AS cohort_month,
        COUNT(*) AS total_tickets,
        SUM(CASE WHEN is_repeat THEN 1 ELSE 0 END) AS repeat_tickets
    FROM fact_tickets
    GROUP BY customer_id
)
SELECT
    cohort_month,
    COUNT(*)                                                    AS cohort_size,
    ROUND(100.0 * SUM(CASE WHEN repeat_tickets > 0 THEN 1 ELSE 0 END) / COUNT(*), 1) AS repeat_customer_rate_pct
FROM cohorts
GROUP BY cohort_month
ORDER BY cohort_month;

-- Repeat rate and repeat-driven cost, by category
SELECT
    category,
    ROUND(100.0 * AVG(CASE WHEN is_repeat THEN 1 ELSE 0 END), 1) AS repeat_rate_pct,
    ROUND(SUM(CASE WHEN is_repeat THEN total_cost_usd ELSE 0 END), 0) AS repeat_driven_cost_usd
FROM fact_tickets
GROUP BY category
ORDER BY repeat_rate_pct DESC;

-- ---------------------------------------------------------------------
-- 8. CHURN CORRELATION: ticket volume per customer vs churn rate
-- ---------------------------------------------------------------------
WITH customer_ticket_counts AS (
    SELECT
        c.customer_id,
        c.churned,
        COUNT(t.ticket_id) AS ticket_count
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
    COUNT(*)                                            AS customer_count,
    ROUND(100.0 * AVG(CASE WHEN churned THEN 1 ELSE 0 END), 1) AS churn_rate_pct
FROM customer_ticket_counts
GROUP BY ticket_bucket
ORDER BY MIN(ticket_count);

-- ---------------------------------------------------------------------
-- 9. STAFFING MODEL INPUTS: current Tier-2 utilization
-- ---------------------------------------------------------------------
SELECT
    COUNT(DISTINCT a.agent_id) FILTER (WHERE a.tier = 'Tier-2')            AS tier2_headcount,
    ROUND(AVG(a.hourly_cost_usd) FILTER (WHERE a.tier = 'Tier-2'), 2)      AS avg_tier2_hourly_cost,
    ROUND(SUM(t.tier2_work_hours), 0)                                      AS total_tier2_work_hours,
    ROUND(SUM(t.tier2_work_hours) /
          (COUNT(DISTINCT a.agent_id) FILTER (WHERE a.tier = 'Tier-2') * 8 * 260), 3) AS utilization_ratio
FROM fact_tickets t
CROSS JOIN dim_agents a;

-- ---------------------------------------------------------------------
-- 10. MONTHLY VOLUME (input to the forecast model)
-- ---------------------------------------------------------------------
SELECT
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS ticket_count
FROM fact_tickets
GROUP BY month
ORDER BY month;
