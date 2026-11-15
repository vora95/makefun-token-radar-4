// Launch Radar dashboard (radar-4): table first, farm plan first, method in one viewport.
// All numbers come from data.js; nothing here fetches or guesses.
const D = window.RADAR;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const money2 = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const signed2 = (n) => (n > 0 ? '+' : '') + money2(n);
const fmtX = (n) => 'x' + Number(n).toFixed(2);
const fmtPct = (n) => (n * 100).toFixed(0) + '%';

function hashState() {
  const h = new URLSearchParams(location.hash.slice(1));
  return { tab: h.get('tab') || 'board', p: h.get('p') || '', verdict: h.get('verdict') || '', q: h.get('q') || '', fam: h.get('fam') || '', chain: h.get('chain') || '', tvl: h.get('tvl') || '' };
}
function go(patch) {
  const s = { ...hashState(), ...patch };
  const h = new URLSearchParams();
  for (const [k, v] of Object.entries(s)) if (v) h.set(k, v);
  location.hash = h.toString();
}
function pill(v) { return `<span class="pill ${v}">${v}</span>`; }

function renderHero(slim) {
  const b = D.backtest;
  const top = D.rows[0];
  const v = D.verdicts;
  if (slim) {
    $('#hero').className = 'slim';
    $('#hero').innerHTML = `<h1>Launch Radar: comps curve tested blind, costed farm plan for every pre-token protocol</h1><p>Method and backtest — every number below is computed from the sealed snapshot by the program, so a reader can check it instead of trusting it.</p>`;
    return;
  }
  $('#hero').className = '';
  $('#hero').innerHTML = `<h1>Launch Radar: comps curve tested blind, costed farm plan for every pre-token protocol</h1>
<p>${D.board_size} protocols record no token. Here is what each launch would be worth, and what farming it costs. Values are this radar's own estimate from the snapshot, not a forecast that a token will launch.</p>
<div class="stats">
<span class="stat"><b>${D.board_size}</b><span>ranked pre-token</span></span>
<span class="stat"><b>${D.live_size}</b><span>traded apart</span></span>
<span class="stat"><b>${D.set_aside}</b><span>set aside</span></span>
<span class="stat"><b>${v.ROBUST} robust · ${v.FARM} farm</b><span>${v.THIN} thin, ${v.SKIP} skip at $1K</span></span>
<span class="stat"><b>${money(top.implied_value_usd)}</b><span>top implied value</span></span>
</div>
<p><b>How a launch is priced:</b> value = 10^${D.curve.a.toFixed(2)} × (TVL / $100M)^${D.curve.b.toFixed(3)} × family × growth × seasoning × sibling — a power-law curve fit by least squares on ${D.curve.n + D.backtest.robustDropped} traded tokens, ${D.backtest.robustDropped} outliers trimmed (&gt;2 sd), refit on ${D.curve.n}.</p>
<p><b>Blind test (leave-one-out):</b> median miss ${fmtX(b.looMedian)} vs ${fmtX(b.looFlatMedian)} for a flat multiple; ${fmtPct(b.looWithin3)} within 3x of the real cap (flat ${fmtPct(b.looFlatWithin3)}). Time splits: ${fmtX(b.timeSplitMedian)} (pre-2024, n=${b.timeSplitTestN}) and ${fmtX(b.timeSplit2Median)} (pre-2025, n=${b.timeSplit2TestN}). R² ${b.rSquared}.</p>
<p><b>Best net per hour on the whole board:</b> ${D.best_per_hour.map((x) => `${esc(x.name)} ${signed2(x.per_hour)}/h`).join(', ')}</p>
<p><b>Farm verdicts are net of every fee and the 4% T-bill given up:</b> ROBUST beats all of it even at the low end of the value band (P25), FARM beats all of it, THIN beats fees only, SKIP does not.</p>`;
}

function renderTabs(st) {
  const tabs = [['board', `No token yet ${D.board_size}`], ['live', `Token trades ${D.live_size}`], ['setaside', `Set aside ${D.set_aside}`], ['method', 'Method and backtest']];
  $('#tabs').innerHTML = tabs.map(([k, label]) => `<button class="${st.tab === k ? 'on' : ''}" data-tab="${k}">${label}</button>`).join('');
  $('#tabs').querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => go({ tab: btn.dataset.tab, p: '' })));
}

function boardRows(st) {
  let rows = D.rows;
  if (st.verdict) rows = rows.filter((r) => r.verdict === st.verdict);
  if (st.fam) rows = rows.filter((r) => r.category === st.fam);
  if (st.chain) rows = rows.filter((r) => r.chains.includes(st.chain));
  if (st.tvl === '50m') rows = rows.filter((r) => r.tvl_usd >= 5e7);
  if (st.tvl === '500m') rows = rows.filter((r) => r.tvl_usd >= 5e8);
  if (st.q) {
    const q = st.q.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.slug.includes(q));
  }
  return rows;
}

function renderBoard(st) {
  const rows = boardRows(st);
  const fams = [...new Set(D.rows.map((r) => r.category).filter(Boolean))].sort();
  const chains = [...new Set(D.rows.flatMap((r) => r.chains))].sort();
  const shown = rows.slice(0, 60);
  $('#view').innerHTML = `
<div class="filters">
<input id="fq" type="search" placeholder="Search protocol…" value="${esc(st.q)}">
<label>Family <select id="ffam"><option value="">All families</option>${fams.map((f) => `<option ${st.fam === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
<label>Chain <select id="fchain"><option value="">All chains</option>${chains.map((c) => `<option ${st.chain === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
<label>Verdict <select id="fver"><option value="">Any verdict</option>${['ROBUST', 'FARM', 'THIN', 'SKIP'].map((v) => `<option ${st.verdict === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
<label>Min TVL <select id="ftvl"><option value="">Any TVL</option><option value="50m" ${st.tvl === '50m' ? 'selected' : ''}>$50M+</option><option value="500m" ${st.tvl === '500m' ? 'selected' : ''}>$500M+</option></select></label>
</div>
<p class="count">${rows.length} of ${D.rows.length} rows shown (first ${shown.length}). Click a row for its detail, its build and its farm plan.</p>
<table><thead><tr><th class="num">#</th><th>Protocol</th><th class="num">TVL</th><th class="num">7d</th><th class="num">Implied value</th><th class="num">Impl / TVL</th><th>Verdict</th><th class="num">Net at $1K</th><th class="num">Net / h</th></tr></thead>
<tbody>${shown.map((r) => `<tr class="click" data-slug="${esc(r.slug)}"><td class="num">${r.rank}</td><td><span class="name">${esc(r.name)}</span>${r.watchlist ? ' ★' : ''}<br><span class="sub">${esc(r.category || 'Uncategorized')} · ${esc(r.chains.slice(0, 2).join(', '))}</span></td><td class="num">${money(r.tvl_usd)}</td><td class="num">${r.change_7d === null ? '—' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(1) + '%'}</td><td class="num"><b>${money(r.implied_value_usd)}</b></td><td class="num">${r.implied_tvl_multiple.toFixed(2)}x</td><td>${pill(r.verdict)}</td><td class="num">${signed2(r.net)}</td><td class="num">${signed2(r.per_hour)}</td></tr>`).join('')}</tbody></table>
<canvas id="chart" width="1400" height="220"></canvas>`;
  $('#fq').addEventListener('change', (e) => go({ q: e.target.value }));
  $('#ffam').addEventListener('change', (e) => go({ fam: e.target.value }));
  $('#fchain').addEventListener('change', (e) => go({ chain: e.target.value }));
  $('#fver').addEventListener('change', (e) => go({ verdict: e.target.value }));
  $('#ftvl').addEventListener('change', (e) => go({ tvl: e.target.value }));
  $('#view').querySelectorAll('tr.click').forEach((tr) => tr.addEventListener('click', () => go({ p: tr.dataset.slug })));
  drawChart();
}

function drawChart() {
  const cv = $('#chart');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = 1400, H = 220, padL = 64, padR = 16, padT = 14, padB = 26;
  const lx = (v) => padL + (Math.log10(v) - 6) / (10 - 6) * (W - padL - padR);
  const ly = (v) => padT + (1 - (Math.log10(v) - 5) / (10 - 5)) * (H - padT - padB);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#b9a894'; ctx.font = '12px system-ui';
  ctx.fillText('Traded tokens and the curve: grey = 101 traded tokens, amber = this board, line = value = 10^' + D.curve.a.toFixed(2) + ' × (TVL/$100M)^' + D.curve.b.toFixed(3), padL, 12);
  ctx.strokeStyle = '#3a2f26'; ctx.beginPath();
  for (const g of [6, 7, 8, 9, 10]) { ctx.moveTo(lx(Math.pow(10, g)), padT); ctx.lineTo(lx(Math.pow(10, g)), H - padB); }
  for (const g of [5, 6, 7, 8, 9, 10]) { ctx.moveTo(padL, ly(Math.pow(10, g))); ctx.lineTo(W - padR, ly(Math.pow(10, g))); }
  ctx.stroke();
  ctx.fillStyle = '#b9a894';
  for (const g of [6, 7, 8, 9, 10]) ctx.fillText('$' + Math.pow(10, g - 9) + (g === 9 ? 'B' : g === 6 ? 'M' : '0M'), lx(Math.pow(10, g)) - 8, H - 8);
  for (const g of [6, 7, 8, 9]) ctx.fillText('$' + Math.pow(10, g - 6) + 'M', 8, ly(Math.pow(10, g)) + 4);
  for (const p of D.curve_points) {
    ctx.fillStyle = 'rgba(185,168,148,0.55)';
    ctx.fillRect(lx(Math.max(1e6, p.tvl)) - 1.5, ly(Math.max(1e5, p.mcap)) - 1.5, 3, 3);
  }
  for (const r of D.rows) {
    ctx.fillStyle = '#f5b942';
    ctx.fillRect(lx(Math.max(1e6, r.tvl_usd)) - 2, ly(Math.max(1e5, r.implied_value_usd)) - 2, 4, 4);
  }
  ctx.strokeStyle = '#f5b942'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 6; x <= 10; x += 0.05) {
    const tvl = Math.pow(10, x);
    const v = Math.pow(10, D.curve.a + D.curve.b * Math.log10(tvl / 1e8));
    const px = lx(tvl), py = ly(Math.max(1e5, v));
    if (x === 6) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function peersOf(r) {
  return [...D.curve_points]
    .map((p) => ({ ...p, gap: Math.abs(Math.log10(p.tvl / r.tvl_usd)) }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 5);
}

function renderDetail(r) {
  const b = D.backtest;
  const ageY = r.age_days === null ? 'unknown age' : (r.age_days / 365).toFixed(1) + 'y';
  const peers = peersOf(r);
  $('#view').innerHTML = `
<div class="detail-head">
<button class="back" id="back">← Back to the board</button>
<h1>${esc(r.name)} — implied ${money(r.implied_value_usd)}</h1>
<p>Rank ${r.rank} of ${D.rows.length} · ${esc(r.category || 'Uncategorized')} · TVL ${money(r.tvl_usd)} · 7-day ${r.change_7d === null ? '—' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(2) + '%'} · no token for ${ageY}${r.listed_at ? ' (since ' + esc(r.listed_at) + ')' : ''}${r.watchlist ? ' · on the watchlist' : ''}</p>
</div>
<h2>How ${money(r.implied_value_usd)} is built</h2>
<table><tbody>
<tr><td>Size curve</td><td class="num">${money(r.curve_usd)}</td><td>10^${D.curve.a.toFixed(2)} × (TVL/$100M)^${D.curve.b.toFixed(3)}</td></tr>
<tr><td>Family (${esc(r.category || 'Uncategorized')})</td><td class="num">×${r.family_factor.toFixed(2)}</td><td>mean residual of its traded peers, shrunk n/(n+20)</td></tr>
<tr><td>Growth (7-day ${r.change_7d === null ? '—' : r.change_7d.toFixed(2) + '%'})</td><td class="num">×${r.growth_factor.toFixed(2)}</td><td>TVL two weeks ahead at the 7-day rate, through the slope</td></tr>
<tr><td>Seasoning (${ageY})</td><td class="num">×${r.seasoning_factor.toFixed(2)}</td><td>x0.70 at launch, x1.15 at 18 months, x0.95 at 5 years</td></tr>
<tr><td>Sibling</td><td class="num">×${r.sibling_factor.toFixed(2)}</td><td>${r.sibling_factor < 1 ? 'shares a first word with a traded token, on the watchlist' : 'no traded sibling'}</td></tr>
<tr><td><b>Implied value</b></td><td class="num"><b>${money(r.implied_value_usd)}</b></td><td>P25–P75 ${money(r.implied_value_usd * b.p25)} – ${money(r.implied_value_usd * b.p75)}; P10–P90 ${money(r.p10_usd)} – ${money(r.p90_usd)}, the blind residual range</td></tr>
<tr><td>Implied / TVL</td><td class="num">${r.implied_tvl_multiple.toFixed(2)}x</td><td>a flat multiple would price this row at ${money(r.tvl_usd * (D.curve_points.reduce((a, p) => a + p.mcap / p.tvl, 0) / D.curve_points.length))}</td></tr>
</tbody></table>
<h2>Farm plan at $1,000 — ${pill(r.verdict)}</h2>
<p>Slice ${money(r.slice)} · fees ${money(r.fees)} on ${esc(r.chain)} · T-bill ${money(r.tbill)} · <b>net ${signed2(r.net)}</b> (net at the low end, P25: ${signed2(r.net_low)}) · ${signed2(r.per_hour)}/h · hold ${r.hold_days} days · smallest deposit that clears the costs: ${r.min_deposit === null ? 'none' : money(r.min_deposit)}</p>
<ol class="plan">${r.farm_steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<h2>Against traded peers</h2>
<table><thead><tr><th>Nearest traded token by TVL</th><th class="num">TVL</th><th class="num">Market cap</th><th class="num">Mcap / TVL</th></tr></thead>
<tbody>${peers.map((p) => `<tr><td>${esc(p.name)}</td><td class="num">${money(p.tvl)}</td><td class="num">${money(p.mcap)}</td><td class="num">${(p.mcap / p.tvl).toFixed(2)}x</td></tr>`).join('')}</tbody></table>
<h2>If the value comes in lower</h2>
<table><thead><tr><th>Value drop</th><th class="num">$1,000 in</th><th class="num">$10,000 in</th><th class="num">$100,000 in</th></tr></thead>
<tbody>${r.sensitivity.map((row, i) => `<tr><td>−${[5, 10, 20][i]}%</td>${row.map((v) => `<td class="num">${signed2(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p class="small">Net after the same fees and T-bill. A negative cell is a position that does not pay at that size and that drop.</p>`;
  $('#back').addEventListener('click', () => go({ p: '' }));
}

function renderLive() {
  $('#view').innerHTML = `<p class="count">${D.live.length} largest live-token protocols, by market cap. These are the comparables the curve is fit from — the board never ranks them.</p>
<table><thead><tr><th>Protocol</th><th class="num">TVL</th><th class="num">Market cap</th><th class="num">7d</th><th class="num">Mcap / TVL</th></tr></thead>
<tbody>${D.live.map((p) => `<tr><td><span class="name">${esc(p.name)}</span><br><span class="sub">${esc(p.category || 'Uncategorized')} · ${esc(p.chains.slice(0, 2).join(', '))}</span></td><td class="num">${money(p.tvl_usd)}</td><td class="num">${p.mcap_usd === null ? '—' : money(p.mcap_usd)}</td><td class="num">${p.change_7d === null ? '—' : (p.change_7d > 0 ? '+' : '') + p.change_7d.toFixed(1) + '%'}</td><td class="num">${p.fdv_tvl === null ? '—' : p.fdv_tvl.toFixed(2) + 'x'}</td></tr>`).join('')}</tbody></table>`;
}

function renderSetAside() {
  $('#view').innerHTML = `<p class="count">${D.set_aside_rows.length} pre-token protocols set aside, largest first. Each names the rule that set it aside.</p>
<table><thead><tr><th>Protocol</th><th class="num">TVL</th><th>Why it is set aside</th></tr></thead>
<tbody>${D.set_aside_rows.map((p) => `<tr><td><span class="name">${esc(p.name)}</span><br><span class="sub">${esc(p.category || 'Uncategorized')}</span></td><td class="num">${money(p.tvl_usd)}</td><td>${esc(p.reason)}</td></tr>`).join('')}</tbody></table>`;
}

function med(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

function renderMethod() {
  const b = D.backtest;
  const skips = D.rows.filter((r) => r.verdict === 'SKIP');
  const auditSlice = med(skips.map((r) => r.slice));
  const auditFees = med(skips.map((r) => r.fees));
  const auditTbill = med(skips.map((r) => r.tbill));
  $('#view').innerHTML = `<div class="cols"><div>
<h2>Universe</h2>
<p>The snapshot holds ${D.live_size + D.board_size + D.set_aside} protocols at $5M+ TVL, fetched ${esc(D.as_of)}. The watchlist keeps ${D.watchlist_size} of them: TVL at or above $50M, no token recorded, not a wrapped, staked or bridged product of a token that trades. The board ranks ${D.board_size}: the watchlist plus ${D.early_size} more rankable pre-token protocols below the floor. ${D.set_aside} are set aside by the rules on the Set aside tab.</p>
<h2>The curve</h2>
<p>value = 10^${D.curve.a.toFixed(2)} × (TVL / $100M)^${D.curve.b.toFixed(3)} × family × growth × seasoning × sibling. Least squares on log10(market cap) against log10(TVL / $100M), fit from ${D.curve.n + b.robustDropped} traded tokens (bridges, version listings and CEX tokens dropped; mcap/TVL outside [1/500, 50] trimmed). ${b.robustDropped} points sat beyond 2 standard deviations of the first fit and were trimmed; the curve was refit on the ${D.curve.n} that remained. R² ${b.rSquared}: the curve explains ${(b.rSquared * 100).toFixed(0)}% of the log-cap spread.</p>
<h2>Family, growth, seasoning</h2>
<p>Family: each category's mean log residual against the curve, shrunk n/(n+20), capped [0.5, 2.5] — ${D.family.length} categories, full table below. Growth: the TVL carried two weeks ahead at its 7-day rate (clamped ±30%), through the slope. Seasoning: x0.70 at launch, rising to x1.15 at 18 months, back to x0.95 at 5 years. Sibling: x0.50 for a watchlist protocol sharing a first word with a traded token.</p>
<h2>Family factors</h2>
<div class="famgrid">${D.family.map((f) => `<div><span>${esc(f.category)} (${f.tokens})</span><b>×${f.factor.toFixed(2)}</b></div>`).join('')}</div>
<h2>Farm plans and verdicts</h2>
<p>One $1,000 position per row. Slice = capital / (TVL + capital) × 10% airdrop share × implied value. Fees are the gas and bridge of the cheapest of the protocol's first three chains, from one public table (Ethereum $18, Arbitrum $2.50, Base $1.60, Solana $2.05; a chain the table does not name costs $3.50). T-bill is the 4% a year the capital gives up over the hold. ROBUST: net &gt; 0 even at the P25 value. FARM: net &gt; 0. THIN: slice beats fees only. SKIP: neither.</p>
<p><b>Fee audit:</b> ${skips.length} rows are SKIP. Their median slice is ${money(auditSlice)} against median fees ${money(auditFees)} and median T-bill ${money(auditTbill)} — the slice itself is too small at $1,000 of capital, not the fees. The fee table was not recalibrated: no evidence it overstates costs, and the same table prices the ROBUST and FARM rows that do clear it.</p>
<h2>Limits</h2>
<ul><li>One snapshot, one day: a protocol's TVL, growth and age are all from ${esc(D.as_of)}.</li>
<li>The 10% airdrop share is an assumption, not a promise: a protocol may give less, more, or nothing.</li>
<li>Implied values are estimates from traded comparables, not forecasts that a token launches or lists.</li></ul>
</div><div>
<h2>Tests — all computed from the snapshot</h2>
<table><tbody>
<tr><td>Leave-one-out, median miss</td><td class="num">${fmtX(b.looMedian)}</td><td class="num">flat ${fmtX(b.looFlatMedian)}</td></tr>
<tr><td>Leave-one-out, within 3x / 10x</td><td class="num">${fmtPct(b.looWithin3)} / ${fmtPct(b.looWithin10)}</td><td class="num">flat ${fmtPct(b.looFlatWithin3)}</td></tr>
<tr><td>Time split, fit before 2024 (n=${b.timeSplitTestN})</td><td class="num">${fmtX(b.timeSplitMedian)}</td><td class="num">flat ${fmtX(b.timeSplitFlatMedian)}</td></tr>
<tr><td>Time split, fit before 2025 (n=${b.timeSplit2TestN})</td><td class="num">${fmtX(b.timeSplit2Median)}</td><td class="num">flat ${fmtX(b.timeSplit2FlatMedian)}</td></tr>
<tr><td>R² of the curve (log space)</td><td class="num">${b.rSquared}</td><td></td></tr>
<tr><td>Bootstrap, 200 draws: slope P5–P95</td><td class="num">${b.bootstrap.slopeP5} – ${b.bootstrap.slopeP95}</td><td class="num">median ${b.bootstrap.slopeP50}</td></tr>
<tr><td>Bootstrap: top value P5–P95</td><td class="num">${money(b.bootstrap.topP5)} – ${money(b.bootstrap.topP95)}</td><td class="num">median ${money(b.bootstrap.topP50)}</td></tr>
<tr><td>Value bands P10 / P25 / P75 / P90</td><td class="num">${fmtX(b.p10)} / ${fmtX(b.p25)} / ${fmtX(b.p75)} / ${fmtX(b.p90)}</td><td></td></tr>
<tr><td>Band coverage, 50% / 80% bands</td><td class="num">${fmtPct(b.band50)} / ${fmtPct(b.band80)}</td><td></td></tr>
<tr><td>Factor check: blind residual vs growth / log age</td><td class="num">r ${b.factorGrowthR} / ${b.factorAgeR}</td><td></td></tr>
</tbody></table>
<h2>Which model — 8 variants, one shared split</h2>
<p class="small">Train: tokens listed before 2024. Test: the ${b.timeSplitTestN} listed after. Median miss and shares within 2x / 3x / 10x.</p>
<table><thead><tr><th>Variant</th><th class="num">Median</th><th class="num">≤2x</th><th class="num">≤3x</th><th>Status</th></tr></thead>
<tbody>${b.variants.map((v) => `<tr><td>${esc(v.name)}</td><td class="num">${fmtX(v.median)}</td><td class="num">${fmtPct(v.within2)}</td><td class="num">${fmtPct(v.within3)}</td><td>${v.status === 'CHOSEN' ? '<b>CHOSEN</b>' : 'rejected'}</td></tr>`).join('')}</tbody></table>
<p class="small">${b.variants.map((v) => `${esc(v.name)}: ${esc(v.reason)}`).join(' ')}</p>
</div></div>`;
}

function render() {
  const st = hashState();
  const row = st.p ? D.rows.find((r) => r.slug === st.p) : null;
  if (row) {
    $('#hero').style.display = 'none';
    renderTabs(st);
    renderDetail(row);
    return;
  }
  $('#hero').style.display = '';
  renderHero(st.tab === 'method');
  renderTabs(st);
  if (st.tab === 'live') renderLive();
  else if (st.tab === 'setaside') renderSetAside();
  else if (st.tab === 'method') renderMethod();
  else renderBoard(st);
}

window.addEventListener('hashchange', render);
render();
