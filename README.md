# Support Operations Analytics Project

An end-to-end support operations analytics project: synthetic data generation, SQL analytics layer,
Python analysis engine, and an interactive React dashboard. Built to demonstrate BA/data-analyst
capability with dollarized business impact, root-cause segmentation, and a defensible staffing ROI model.

## Project Structure

```
├── README.md                    ← you are here
├── executive-summary.md         ← findings, resume bullet, interview talking points
├── generate_data.py             ← synthetic data generator (15,400 tickets, intentional patterns)
├── analyze.py                   ← analysis engine (cost, RCA, churn, staffing ROI, forecast)
├── schema_and_queries.sql        ← PostgreSQL star schema + 10 analytical queries
├── support-ops-dashboard.jsx     ← interactive React dashboard (recharts, live staffing simulator)
└── data/
    ├── tickets.csv               ← 15,400 tickets (fact table)
    ├── agents.csv                ← 42 agents (dim table)
    ├── customers.csv             ← 6,200 customers with churn flag (dim table)
    └── analysis_output.json      ← computed analysis, consumed by the dashboard
```

## How to Run It

### 1. Regenerate the data (optional — CSVs are already included)
```bash
pip install pandas numpy
python3 generate_data.py    # writes data/tickets.csv, agents.csv, customers.csv
```

### 2. Run the analysis engine
```bash
python3 analyze.py          # writes data/analysis_output.json, prints findings to console
```

### 3. Load into PostgreSQL (optional — for the SQL portion of the story)
```bash
psql -d your_db -f schema_and_queries.sql   # creates schema; then COPY the CSVs in, or use \copy
```
Example load after creating tables:
```sql
\copy dim_agents FROM 'data/agents.csv' CSV HEADER;
\copy dim_customers FROM 'data/customers.csv' CSV HEADER;
\copy fact_tickets FROM 'data/tickets.csv' CSV HEADER;
```
Then run any of the 10 analytical queries in the file — each one maps directly to a finding
in the dashboard and in `executive-summary.md`.

### 4. View the dashboard
`support-ops-dashboard.jsx` is a self-contained React component with the analysis results embedded
directly (no backend needed). Drop it into any React + Tailwind + recharts environment, or open it
as a Claude artifact. If you regenerate the data and want the dashboard to reflect new numbers, copy
the updated values from `data/analysis_output.json` into the `DATA` object at the top of the file.

## The Five Findings (short version)

| # | Finding | Business impact |
|---|---------|------------------|
| A | Technical Issue tickets cost 2.1× more than Account Management | $245,933/yr is the single largest cost bucket |
| B | 70% of Password Reset tickets are needlessly escalated Tier-1→Tier-2; new agents escalate complex tickets 2.3× more | Process waste + training gap, not a headcount problem |
| C | Billing has a 9.9% repeat rate (5× other categories); repeat customers churn at 2.79× baseline | Repeat tickets are a documentation/product signal, not just a support KPI |
| D | Every permanent-hire staffing scenario is net-negative (2 agents: $110,608 cost vs $26,248 return) | Counter-intuitive, defensible finding — fix process before hiring |
| E | Three layered recommendations, ordered by cost and timeline | $64,137/yr quick win + process redesign + targeted seasonal-only surge staffing |

Full detail, resume bullet, and interview talking points are in `executive-summary.md`.
