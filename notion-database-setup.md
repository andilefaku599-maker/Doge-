# Notion Database Setup — ERP Readiness Evaluator

## Overview

This guide sets up the ERP Evaluator as a **proper Notion workspace** with:
- A reusable **Assessment Template** page
- A **Responses Database** that tracks all completed assessments
- **Formula properties** that calculate scores automatically

---

## Step 1 — Create the Workspace Structure

In Notion, create a new page called **"ERP Readiness Evaluator"** and add these sub-pages:

```
📁 ERP Readiness Evaluator
├── 📄 How to Use
├── 📋 Assessment Template  ← duplicate this for each new assessment
├── 🗃️ Responses Database   ← all completed assessments go here
└── 📊 Dashboard            ← view all results at a glance
```

---

## Step 2 — Set Up the Responses Database

Create a new **full-page database** called `Responses Database`.

Add the following **properties** (columns):

### Text Properties
| Property Name | Type | Notes |
|---|---|---|
| Name | Title | Company name (auto-filled) |
| Assessed By | Text | Respondent name |
| Job Title | Text | |
| Industry | Select | See options below |
| Revenue Range | Select | See options below |
| Current ERP | Text | |
| Date | Date | |

### Number Properties (one per question)
| Property Name | Type | Min | Max |
|---|---|---|---|
| Q1 Score | Number | 1 | 4 |
| Q2 Score | Number | 1 | 4 |
| Q3 Score | Number | 1 | 4 |
| Q4 Score | Number | 1 | 4 |
| Q5 Score | Number | 1 | 4 |
| Q6 Score | Number | 1 | 4 |
| Q7 Score | Number | 1 | 4 |
| Q8 Score | Number | 1 | 4 |
| Q9 Score | Number | 1 | 4 |
| Q10 Score | Number | 1 | 4 |

### Formula Properties (auto-calculated)

**Financial Score** (Formula property):
```
prop("Q1 Score") + prop("Q2 Score") + prop("Q3 Score")
```

**Operations Score** (Formula property):
```
prop("Q4 Score") + prop("Q5 Score") + prop("Q6 Score")
```

**Compliance Score** (Formula property):
```
prop("Q7 Score") + prop("Q8 Score")
```

**Growth Score** (Formula property):
```
prop("Q9 Score") + prop("Q10 Score")
```

**Total Score** (Formula property):
```
prop("Q1 Score") + prop("Q2 Score") + prop("Q3 Score") + prop("Q4 Score") + prop("Q5 Score") + prop("Q6 Score") + prop("Q7 Score") + prop("Q8 Score") + prop("Q9 Score") + prop("Q10 Score")
```

**Verdict** (Formula property — paste this exactly):
```
if(prop("Total Score") <= 17, "🟢 Low Urgency", if(prop("Total Score") <= 25, "🟡 Moderate Risk", if(prop("Total Score") <= 33, "🔴 High Risk", "🆘 Critical")))
```

**Risk Level** (Formula property — for color-coded select):
```
if(prop("Total Score") <= 17, "Low", if(prop("Total Score") <= 25, "Moderate", if(prop("Total Score") <= 33, "High", "Critical")))
```

---

### Industry Select Options
Add these options to the Industry select property:
- Discrete Manufacturing
- Process Manufacturing
- Food & Beverage
- Automotive
- Electronics
- Pharmaceuticals
- Chemicals
- Aerospace & Defence
- Consumer Goods
- Other Manufacturing

### Revenue Range Select Options
- Under R10M / $500K
- R10M–R50M / $500K–$3M
- R50M–R200M / $3M–$12M
- R200M–R1B / $12M–$60M
- Over R1B / $60M+

---

## Step 3 — Create the Assessment Template

1. Open **Assessment Template** page
2. Paste the full content from `notion-template.md` into this page
3. Click the `•••` menu → **Turn into template**
4. Name it: `New ERP Assessment`

Now every time you click **"New"** in your database, it uses this template automatically.

---

## Step 4 — Set Up the Dashboard View

In your `Responses Database`, create these **Views**:

### View 1: All Assessments (Table)
- Default table view
- Show columns: Name, Date, Total Score, Verdict, Financial Score, Operations Score

### View 2: By Risk Level (Board)
- Group by: **Verdict** property
- Columns: 🟢 Low Urgency | 🟡 Moderate Risk | 🔴 High Risk | 🆘 Critical
- Each card shows: Company name, Total Score, Date

### View 3: High Priority (Filter)
- Filter: `Total Score` is greater than `25`
- Sort: Total Score descending
- Use this view to see all companies needing urgent action

### View 4: This Month (Filter)
- Filter: `Date` is within `this month`
- Sort: Date descending

---

## Step 5 — Using the Template (Workflow)

Each time you run a new assessment:

1. Go to `Responses Database`
2. Click **+ New** → select `New ERP Assessment` template
3. Enter company name in the title
4. Open the page — the full assessment form loads
5. Fill in Company Information table
6. Work through Questions 1–10, noting the score for each
7. Scroll to **Scoring Calculator** table and enter all 10 scores
8. Go back to the database — **Total Score** and **Verdict** auto-calculate
9. Enter the individual Q1–Q10 scores in the database properties (so formulas work)

> **Tip:** Pin the Responses Database to your Notion sidebar for quick access.

---

## Step 6 — Sharing Assessments

### Option A: Share the Notion page
- Open the completed assessment page
- Click **Share** → **Publish to web**
- Toggle on "Allow duplicate as template"
- Send the link to the client — they can view their results

### Option B: Export as PDF
- Open the completed assessment page
- Click `•••` → **Export** → **PDF**
- The full results page exports as a clean PDF
- Email this to the client

### Option C: Duplicate the workspace
- Share the entire **ERP Readiness Evaluator** workspace as a template
- Client clicks **Duplicate** and gets their own copy
- They fill it out themselves

---

## Database Formula Reference (Copy-Paste Ready)

If Notion gives you a formula error, use these exact strings:

```
# Total Score
prop("Q1 Score") + prop("Q2 Score") + prop("Q3 Score") + prop("Q4 Score") + prop("Q5 Score") + prop("Q6 Score") + prop("Q7 Score") + prop("Q8 Score") + prop("Q9 Score") + prop("Q10 Score")

# Verdict
if(prop("Total Score") <= 17, "🟢 Low Urgency", if(prop("Total Score") <= 25, "🟡 Moderate Risk", if(prop("Total Score") <= 33, "🔴 High Risk", "🆘 Critical")))

# Financial Score
prop("Q1 Score") + prop("Q2 Score") + prop("Q3 Score")

# Operations Score
prop("Q4 Score") + prop("Q5 Score") + prop("Q6 Score")

# Compliance Score
prop("Q7 Score") + prop("Q8 Score")

# Growth Score
prop("Q9 Score") + prop("Q10 Score")
```

---

## Notion AI Enhancement (Optional)

If you have **Notion AI**, you can add an AI summary block at the bottom of each assessment:

1. In the results section, type `/AI`
2. Select **"Summarize this page"**
3. Notion AI reads the scores and generates a natural-language summary
4. You can also prompt it: *"Based on these scores, write a 3-sentence executive summary for the CFO"*

---

*ERP Readiness Evaluator · Notion Template Guide*
