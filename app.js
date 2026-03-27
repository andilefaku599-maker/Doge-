/* ═══════════════════════════════════════════════
   ERP Readiness Evaluator — Scoring Engine & PDF
   ═══════════════════════════════════════════════ */

'use strict';

// ── Scoring Config ──────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'financial',
    label: 'Financial Visibility & Reporting',
    questions: ['q1', 'q2', 'q3'],
    maxScore: 12,
  },
  {
    id: 'operations',
    label: 'Operations & Inventory',
    questions: ['q4', 'q5', 'q6'],
    maxScore: 12,
  },
  {
    id: 'compliance',
    label: 'Compliance & Audit Readiness',
    questions: ['q7', 'q8'],
    maxScore: 8,
  },
  {
    id: 'growth',
    label: 'Growth & Scalability',
    questions: ['q9', 'q10'],
    maxScore: 8,
  },
];

const VERDICTS = [
  {
    min: 10, max: 17,
    label: '✅  Optimise — Low Urgency',
    labelShort: 'Low Urgency',
    color: '#0a7c44',
    bgColor: '#d1fae5',
    text: 'Your ERP is performing reasonably well for current needs. Focus on targeted optimisation — process automation, better reporting, and user training — before investing in a full platform change.',
    steps: [
      'Conduct a structured process-improvement review to identify quick wins within your current system.',
      'Evaluate add-on modules or integrations (BI, WMS, MES) that can extend your ERP\'s capabilities without a full replacement.',
      'Benchmark your close cycle and manual-effort hours against industry peers to set improvement targets.',
      'Document your 3-year growth plan to establish a clear trigger point for re-evaluating ERP needs.',
    ],
  },
  {
    min: 18, max: 25,
    label: '⚠️  Evaluate — Moderate Risk',
    labelShort: 'Moderate Risk',
    color: '#b45309',
    bgColor: '#fef3c7',
    text: 'Your current system is showing measurable strain. Targeted module upgrades or middleware integrations may extend its life, but a structured ERP evaluation should begin within the next 12 months to avoid cost escalation.',
    steps: [
      'Prioritise the two or three highest-scoring pain areas from this assessment and quantify their annual cost impact.',
      'Issue an internal RFI to two or three ERP vendors aligned to your manufacturing segment to understand fit and pricing.',
      'Develop a business case that models the ROI of upgrading vs. patching — include hidden costs of manual workarounds.',
      'Establish a cross-functional steering committee (Finance, Operations, IT) to own the evaluation process.',
      'Set a 90-day decision deadline to avoid evaluation fatigue and maintain momentum.',
    ],
  },
  {
    min: 26, max: 33,
    label: '🔴  Upgrade — High Risk',
    labelShort: 'High Risk',
    color: '#be123c',
    bgColor: '#ffe4e6',
    text: 'Your ERP is a material operational and financial risk. System fragmentation, manual overhead, and limited visibility are likely costing you more than an upgrade would. A formal selection process should begin immediately.',
    steps: [
      'Quantify the full cost of your current system\'s limitations: manual labour hours × loaded cost, error correction time, audit exposure, and opportunity cost of delayed decisions.',
      'Issue a formal RFP to 3–5 qualified ERP vendors; include manufacturing-specific requirements (BOM, routings, MRP, costing).',
      'Engage an independent ERP advisory firm to validate vendor shortlist and manage the selection process.',
      'Build an implementation roadmap with phased rollout — prioritise financial modules and inventory first.',
      'Secure board-level sponsorship and budget allocation within the current planning cycle.',
      'Begin change management planning — ERP transitions succeed or fail on adoption, not technology.',
    ],
  },
  {
    min: 34, max: 40,
    label: '🚨  Critical — Act Now',
    labelShort: 'Critical',
    color: '#7c1d1d',
    bgColor: '#fee2e2',
    text: 'Your current system represents a critical business risk. Financial reporting integrity, operational continuity, and compliance exposure require immediate executive attention. An ERP selection and transition should be treated as a strategic priority.',
    steps: [
      'Convene an emergency executive review within 2 weeks to align on ERP replacement as a top-3 strategic initiative.',
      'Retain an ERP implementation partner immediately to begin requirements gathering and vendor shortlisting in parallel.',
      'Implement interim controls (additional reconciliation checkpoints, manual audit trails) to reduce risk during the transition period.',
      'Fast-track the RFP process — target vendor selection within 60–90 days.',
      'Allocate dedicated finance and IT resources to the programme; do not run this as a side project.',
      'Communicate the timeline and rationale to your board, audit committee, and key financial stakeholders.',
    ],
  },
];

// ── State ──────────────────────────────────────────────────────────────────

let companyInfo = {};
let answers = {};

// ── Navigation ─────────────────────────────────────────────────────────────

function goToPage(n) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page' + n).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateStepBar(n);
}

function updateStepBar(n) {
  [1, 2, 3].forEach(i => {
    const dot = document.getElementById('step' + i + 'Dot');
    dot.classList.remove('active', 'done');
    if (i < n) dot.classList.add('done');
    if (i === n) dot.classList.add('active');
  });
}

// ── Page 1: Info Form ──────────────────────────────────────────────────────

document.getElementById('infoForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const company = document.getElementById('companyName').value.trim();
  const respondent = document.getElementById('respondentName').value.trim();

  let valid = true;
  [document.getElementById('companyName'), document.getElementById('respondentName')].forEach(el => {
    if (!el.value.trim()) {
      el.classList.add('invalid');
      valid = false;
    } else {
      el.classList.remove('invalid');
    }
  });

  if (!valid) return;

  companyInfo = {
    company,
    respondent,
    title: document.getElementById('jobTitle').value.trim(),
    industry: document.getElementById('industry').value,
    revenue: document.getElementById('revenue').value,
    currentErp: document.getElementById('currentErp').value.trim(),
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  goToPage(2);
});

// ── Page 2: Assessment Form ────────────────────────────────────────────────

// Live progress update as questions are answered
document.getElementById('assessmentForm').addEventListener('change', function (e) {
  if (e.target.type !== 'radio') return;

  const name = e.target.name;
  answers[name] = parseInt(e.target.value, 10);

  // highlight selected option
  document.querySelectorAll(`[name="${name}"]`).forEach(r => {
    r.closest('.opt').classList.remove('selected');
  });
  e.target.closest('.opt').classList.add('selected');

  // mark card answered
  const card = e.target.closest('.question-card');
  card.classList.add('answered');

  // update progress
  const answered = Object.keys(answers).length;
  document.getElementById('progressBar').style.width = (answered / 10 * 100) + '%';
  document.getElementById('progressLabel').textContent = `${answered} of 10 questions answered`;
});

document.getElementById('assessmentForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Validate all 10 questions answered
  const unanswered = [];
  for (let i = 1; i <= 10; i++) {
    if (!answers['q' + i]) unanswered.push(i);
  }

  if (unanswered.length > 0) {
    // highlight unanswered
    unanswered.forEach(n => {
      const card = document.querySelector(`.question-card[data-q="${n}"]`);
      card.querySelectorAll('.opt').forEach(o => o.classList.add('error-opt'));
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return;
  }

  calculateAndShowResults();
});

// ── Scoring Engine ─────────────────────────────────────────────────────────

function calculateAndShowResults() {
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);

  // Find verdict
  const verdict = VERDICTS.find(v => totalScore >= v.min && totalScore <= v.max);

  // Compute section scores
  const sectionScores = SECTIONS.map(sec => {
    const raw = sec.questions.reduce((sum, q) => sum + (answers[q] || 0), 0);
    return { ...sec, raw, pct: raw / sec.maxScore };
  });

  // Populate results page
  document.getElementById('resultCompany').textContent = companyInfo.company;
  document.getElementById('resultDate').textContent =
    `Assessed: ${companyInfo.date}${companyInfo.respondent ? '  ·  ' + companyInfo.respondent : ''}`;
  document.getElementById('scoreNum').textContent = totalScore;

  // Verdict box
  document.getElementById('verdictLabel').textContent = verdict.label;
  document.getElementById('verdictLabel').style.color = verdict.color;
  document.getElementById('verdictText').textContent = verdict.text;

  // Score circle colour
  const circle = document.getElementById('scoreCircle');
  circle.style.borderColor = verdict.color;
  circle.style.background = verdict.bgColor + '22'; // very transparent

  // Breakdown grid
  const grid = document.getElementById('breakdownGrid');
  grid.innerHTML = sectionScores.map(sec => {
    const sev = sec.pct < 0.45 ? 'sev-low' : sec.pct < 0.70 ? 'sev-medium' : 'sev-high';
    const note = sec.pct < 0.45 ? 'Well-controlled'
                : sec.pct < 0.70 ? 'Needs attention'
                : 'High risk area';
    return `
      <div class="breakdown-item ${sev}">
        <div class="b-label">${sec.label}</div>
        <div class="b-score">${sec.raw} <small style="font-size:13px;font-weight:500;opacity:.6">/ ${sec.maxScore}</small></div>
        <div class="b-bar-wrap"><div class="b-bar" style="width:${sec.pct * 100}%"></div></div>
        <div class="b-note">${note}</div>
      </div>`;
  }).join('');

  // Next steps
  const stepsList = document.getElementById('nextSteps');
  stepsList.innerHTML = verdict.steps.map((s, i) => `
    <li><span class="step-num">${i + 1}</span><span>${s}</span></li>
  `).join('');

  goToPage(3);
}

// ── PDF Generation ─────────────────────────────────────────────────────────

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210; // A4 width mm
  const MARGIN = 18;
  const COL = W - MARGIN * 2;
  let y = 0;

  // ── Colour palette
  const DARK   = [15, 23, 42];
  const BLUE   = [26, 86, 219];
  const LIGHT  = [249, 250, 251];
  const BORDER = [229, 231, 235];
  const MID    = [75, 85, 99];
  const WHITE  = [255, 255, 255];

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const verdict = VERDICTS.find(v => totalScore >= v.min && totalScore <= v.max);
  const sectionScores = SECTIONS.map(sec => {
    const raw = sec.questions.reduce((sum, q) => sum + (answers[q] || 0), 0);
    return { ...sec, raw, pct: raw / sec.maxScore };
  });

  // Parse verdict colour (hex → rgb)
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }
  const VERDICT_COLOR = hexToRgb(verdict.color);
  const VERDICT_BG    = hexToRgb(verdict.bgColor);

  // ── Helper functions ─────────────────────────────────────

  function setFont(style, size, color) {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...(color || DARK));
  }

  function rect(x, rx, ry, rw, rh, fillColor, strokeColor) {
    if (fillColor) { doc.setFillColor(...fillColor); }
    if (strokeColor) { doc.setDrawColor(...strokeColor); doc.setLineWidth(0.3); }
    if (fillColor && strokeColor) doc.roundedRect(rx, ry, rw, rh, 2, 2, 'FD');
    else if (fillColor) doc.roundedRect(rx, ry, rw, rh, 2, 2, 'F');
    else if (strokeColor) doc.roundedRect(rx, ry, rw, rh, 2, 2, 'S');
  }

  function line(lx, ly, lx2, ly2, color) {
    doc.setDrawColor(...(color || BORDER));
    doc.setLineWidth(0.3);
    doc.line(lx, ly, lx2, ly2);
  }

  // ── HEADER BLOCK ─────────────────────────────────────────

  // Dark navy header
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 46, 'F');

  // Badge
  doc.setFillColor(255, 255, 255, 30);
  doc.setFillColor(40, 60, 90);
  doc.roundedRect(MARGIN, 8, 38, 6, 1, 1, 'F');
  setFont('bold', 7, [160, 180, 210]);
  doc.text('CFO DECISION TOOL', MARGIN + 2, 12.5);

  // Title
  setFont('bold', 18, WHITE);
  doc.text('ERP Readiness Assessment', MARGIN, 24);

  // Subtitle
  setFont('normal', 9, [160, 180, 210]);
  doc.text('Manufacturing CFO Evaluation Report', MARGIN, 31);

  // Score circle (top right)
  const cx = W - MARGIN - 16, cy = 23;
  doc.setFillColor(255, 255, 255, 15);
  doc.setFillColor(30, 50, 80);
  doc.circle(cx, cy, 14, 'F');
  doc.setDrawColor(...VERDICT_COLOR);
  doc.setLineWidth(1.2);
  doc.circle(cx, cy, 14, 'S');
  setFont('bold', 18, WHITE);
  doc.text(String(totalScore), cx, cy + 2, { align: 'center' });
  setFont('normal', 7, [160, 180, 210]);
  doc.text('/40', cx, cy + 7, { align: 'center' });

  y = 50;

  // ── META ROW ─────────────────────────────────────────────

  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, COL, 16, 2, 2, 'FD');

  const metaItems = [
    ['Company', companyInfo.company || '—'],
    ['Assessed by', (companyInfo.respondent || '—') + (companyInfo.title ? ', ' + companyInfo.title : '')],
    ['Date', companyInfo.date],
  ];
  const mw = COL / 3;
  metaItems.forEach((m, i) => {
    const mx = MARGIN + i * mw + 6;
    setFont('bold', 7, MID);
    doc.text(m[0].toUpperCase(), mx, y + 5.5);
    setFont('bold', 9, DARK);
    doc.text(m[1].slice(0, 28), mx, y + 11);
  });

  y += 22;

  // ── VERDICT BOX ──────────────────────────────────────────

  doc.setFillColor(...VERDICT_BG);
  doc.setDrawColor(...VERDICT_COLOR);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, y, COL, 22, 2, 2, 'FD');

  setFont('bold', 9, VERDICT_COLOR);
  doc.text(verdict.labelShort.toUpperCase() + ' · Score ' + totalScore + '/40', MARGIN + 6, y + 7);

  setFont('normal', 8.5, DARK);
  const splitVerdict = doc.splitTextToSize(verdict.text, COL - 12);
  doc.text(splitVerdict, MARGIN + 6, y + 13);

  y += 28;

  // ── SECTION BREAKDOWN ────────────────────────────────────

  setFont('bold', 10, DARK);
  doc.text('Score Breakdown by Category', MARGIN, y);
  y += 5;

  const bw = (COL - 6) / 2;
  const bh = 22;

  sectionScores.forEach((sec, i) => {
    const bx = MARGIN + (i % 2) * (bw + 6);
    const by = y + Math.floor(i / 2) * (bh + 4);
    const sev = sec.pct < 0.45 ? 'low' : sec.pct < 0.70 ? 'med' : 'high';
    const sevColor = sev === 'low' ? [10, 124, 68] : sev === 'med' ? [180, 83, 9] : [190, 18, 60];
    const sevBg    = sev === 'low' ? [209, 250, 229] : sev === 'med' ? [254, 243, 199] : [255, 228, 230];
    const sevNote  = sev === 'low' ? 'Well-controlled' : sev === 'med' ? 'Needs attention' : 'High risk area';

    doc.setFillColor(...sevBg);
    doc.setDrawColor(...sevColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, by, bw, bh, 2, 2, 'FD');

    // Section name
    setFont('bold', 7, [100, 110, 120]);
    doc.text(sec.label.toUpperCase().slice(0, 30), bx + 4, by + 5);

    // Score
    setFont('bold', 14, sevColor);
    doc.text(String(sec.raw), bx + 4, by + 13);
    setFont('normal', 7.5, MID);
    doc.text(`/ ${sec.maxScore}`, bx + 10, by + 13);

    // Bar
    const barX = bx + 18, barY = by + 11, barW = bw - 24, barH = 3;
    doc.setFillColor(220, 225, 230);
    doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');
    doc.setFillColor(...sevColor);
    doc.roundedRect(barX, barY, barW * sec.pct, barH, 1, 1, 'F');

    // Note
    setFont('normal', 7, MID);
    doc.text(sevNote, bx + 4, by + 19.5);
  });

  y += Math.ceil(sectionScores.length / 2) * (bh + 4) + 6;

  // ── NEXT STEPS ───────────────────────────────────────────

  setFont('bold', 10, DARK);
  doc.text('Recommended Next Steps', MARGIN, y);
  y += 5;

  verdict.steps.slice(0, 4).forEach((step, i) => {
    // Bullet circle
    doc.setFillColor(...BLUE);
    doc.circle(MARGIN + 3, y + 2.5, 2.5, 'F');
    setFont('bold', 8, WHITE);
    doc.text(String(i + 1), MARGIN + 3, y + 3.3, { align: 'center' });

    // Step text
    setFont('normal', 8, DARK);
    const lines = doc.splitTextToSize(step, COL - 12);
    doc.text(lines, MARGIN + 9, y + 3.5);
    const lineH = lines.length * 4;

    // light separator
    if (i < verdict.steps.length - 1) {
      line(MARGIN + 9, y + lineH + 2, MARGIN + COL, y + lineH + 2);
    }
    y += lineH + 5;
  });

  y += 2;

  // ── FOOTER ───────────────────────────────────────────────

  line(MARGIN, y, W - MARGIN, y, BORDER);
  y += 4;

  const footerLeft = 'ERP Readiness Evaluator · Manufacturing CFO Assessment';
  const footerRight = `Generated ${companyInfo.date}`;
  setFont('normal', 7, [160, 170, 180]);
  doc.text(footerLeft, MARGIN, y);
  doc.text(footerRight, W - MARGIN, y, { align: 'right' });

  y += 4;
  const disclaimer = 'This report is a directional decision-support tool for internal use only. Scores are based on self-reported responses. Consult a qualified ERP advisor before any procurement decision.';
  setFont('normal', 6.5, [180, 190, 200]);
  const dLines = doc.splitTextToSize(disclaimer, COL);
  doc.text(dLines, MARGIN, y);

  // ── Save ──────────────────────────────────────────────────

  const safeCompany = (companyInfo.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`ERP_Readiness_${safeCompany}.pdf`);
}

// ── PWA: Service Worker Registration ───────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ── PWA: Install Banner ─────────────────────────────────────────────────────

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.remove('hidden');
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('installBanner').classList.add('hidden');
});

document.getElementById('installDismiss')?.addEventListener('click', () => {
  document.getElementById('installBanner').classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
  document.getElementById('installBanner')?.classList.add('hidden');
  deferredInstallPrompt = null;
});

// ── Initialise ─────────────────────────────────────────────────────────────

goToPage(1);
