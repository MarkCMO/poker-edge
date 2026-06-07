/**
 * Generates 10 App Store 6.7" screenshots (1290 x 2796) as self-contained HTML,
 * rendered to PNG by Playwright. Marketing style: bold headline + framed device
 * + vibrant accent glow. House brand navy + gold, with a shifting secondary
 * accent per slide for energy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'store-assets', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const C = {
  bg: '#0B1120', surface: '#16223A', surface2: '#1E2D45', gold: '#C8A84E',
  text: '#F6F8FC', dim: '#9DB0CC', faint: '#6B7894', border: '#2A3B57',
  win: '#3FB477', loss: '#E2574C', blue: '#5B8DEF', purple: '#9B7BFF', teal: '#2BC0AE', warn: '#E8B339',
};

const shell = ({ eyebrow, title, sub, accent, body, dots }) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
 *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
 html,body{width:1290px;height:2796px;overflow:hidden}
 body{font-family:'Barlow',sans-serif;color:${C.text};
   background:
     radial-gradient(130% 85% at 50% -12%, ${accent}3D, transparent 58%),
     radial-gradient(120% 70% at 50% 118%, ${accent}26, transparent 55%),
     linear-gradient(165deg,#0B1120,#0E1A33 52%,#0A0F1C);}
 .wrap{position:relative;height:100%;padding:130px 96px 0;text-align:center}
 .eyebrow{font-family:'Barlow';font-weight:700;font-size:34px;letter-spacing:6px;text-transform:uppercase;color:${accent}}
 h1{font-family:'Bebas Neue';font-size:128px;line-height:.96;letter-spacing:1.5px;margin-top:20px;text-shadow:0 6px 40px ${accent}55}
 h1 b{color:${accent};font-weight:400}
 .sub{font-size:40px;font-weight:500;color:${C.dim};margin-top:26px}
 .glow{position:absolute;left:50%;top:1030px;transform:translateX(-50%);width:1100px;height:1100px;border-radius:50%;
   background:radial-gradient(circle, ${accent}55, transparent 62%);filter:blur(30px)}
 .phone{position:absolute;left:50%;top:760px;transform:translateX(-50%);width:880px;height:1880px;
   background:${C.bg};border:13px solid #0a1426;border-radius:82px;
   box-shadow:0 50px 130px rgba(0,0,0,.65), 0 0 0 3px ${C.border}, 0 0 120px ${accent}40;
   padding:54px 46px;overflow:hidden}
 .island{width:280px;height:34px;background:#05media;background:#060b16;border-radius:20px;margin:6px auto 30px}
 .nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}
 .nav .t{font-family:'Bebas Neue';font-size:62px;letter-spacing:1.5px}
 .card{background:${C.surface2};border:2px solid ${C.border};border-radius:38px;padding:42px;margin-bottom:26px}
 .card.acc{border-color:${accent};box-shadow:0 0 50px ${accent}33}
 .row{display:flex;justify-content:space-between;align-items:center}
 .pill{border:2px solid;border-radius:999px;padding:7px 20px;font-size:27px;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:inline-block}
 .muted{color:${C.dim};font-size:34px}
 .mono{font-family:'Bebas Neue';letter-spacing:1px}
 .big{font-family:'Bebas Neue';letter-spacing:1px}
 .stat{flex:1}
 .stat .v{font-family:'Bebas Neue';font-size:66px}
 .stat .l{color:${C.dim};font-size:25px;text-transform:uppercase;letter-spacing:1px}
 .btn{background:${accent};color:#0B1120;border-radius:26px;padding:28px;text-align:center;font-weight:800;font-size:38px}
 .chip{display:inline-block;border:2px solid ${C.border};background:${C.surface};color:${C.dim};border-radius:999px;padding:12px 26px;font-size:30px;font-weight:600;margin:0 12px 12px 0}
 .chip.on{background:${accent};color:#0B1120;border-color:${accent}}
 .grid{display:grid;grid-template-columns:repeat(13,1fr);gap:5px}
 .grid div{aspect-ratio:1;border-radius:6px;background:${C.surface};display:flex;align-items:center;justify-content:center;font-size:15px;color:${C.faint}}
 .grid div.on{background:${accent};color:#0B1120;font-weight:700}
 .bar{height:30px;border-radius:12px;background:${C.loss};overflow:hidden;position:relative}
 .bar>div{position:absolute;left:0;top:0;bottom:0;background:${C.win}}
 .dots{position:absolute;left:0;right:0;bottom:64px;display:flex;justify-content:center;gap:16px}
 .dots span{width:18px;height:18px;border-radius:50%;background:${C.border}}
 .dots span.on{background:${accent};width:54px;border-radius:9px}
 .glass{background:rgba(255,255,255,.05);border:2px solid ${accent}55;border-radius:30px;padding:34px}
</style></head><body>
 <div class="wrap">
  <div class="eyebrow">${eyebrow}</div>
  <h1>${title}</h1>
  <div class="sub">${sub}</div>
 </div>
 <div class="glow"></div>
 <div class="phone"><div class="island"></div>${body}</div>
 <div class="dots">${Array.from({length:10},(_,i)=>`<span class="${i===dots?'on':''}"></span>`).join('')}</div>
</body></html>`;

const bars = (rows) => rows.map(([n, w, c, v]) => `<div style="margin-bottom:26px"><div class="row"><span style="font-size:34px">${n}</span><span style="font-size:34px;color:${c};font-weight:700">${v}</span></div><div style="height:16px;background:${C.surface};border-radius:8px;margin-top:10px"><div style="width:${w}%;height:16px;border-radius:8px;background:${c}"></div></div></div>`).join('');

const rangeGrid = () => {
  const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
  const on = new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','65s','AKo','AQo','AJo','ATo','KQo','KJo','QJo','JTo']);
  let cells = '';
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
    const lab = i === j ? ranks[i] + ranks[i] : (j > i ? ranks[i] + ranks[j] + 's' : ranks[j] + ranks[i] + 'o');
    cells += `<div class="${on.has(lab) ? 'on' : ''}">${lab.replace(/[so]$/, '')}</div>`;
  }
  return `<div class="grid">${cells}</div>`;
};

const slides = {
  '01-hero': shell({ accent: C.gold, dots: 0,
    eyebrow: 'The serious player\'s edge',
    title: 'DATA,<br><b>NOT VIBES</b>',
    sub: 'Track, study, and win at live poker.',
    body: `<div class="nav"><div class="t" style="color:${C.gold}">POKER EDGE</div></div>
      <div class="card acc"><div class="row"><span class="pill" style="border-color:${C.win};color:${C.win}">Live</span><span class="big" style="font-size:74px">3:42</span></div>
      <div class="muted" style="margin:16px 0">NLHE 2/5 - Bellagio</div>
      <div style="text-align:center;padding:24px 0"><div class="big" style="font-size:150px;color:${C.win}">+$640</div><div class="stat l">This session</div></div></div>
      <div class="card"><div class="row"><span class="big" style="font-size:46px">Net this month</span><span class="big" style="font-size:60px;color:${C.gold}">+$4,820</span></div></div>
      <div class="card"><div class="row"><div class="stat"><div class="v">162</div><div class="l">Hours</div></div><div class="stat"><div class="v" style="color:${C.win}">+$30</div><div class="l">Per hr</div></div><div class="stat"><div class="v">58%</div><div class="l">Win rate</div></div></div></div>` }),

  '02-track': shell({ accent: C.win, dots: 1,
    eyebrow: 'Offline-first',
    title: 'TRACK EVERY<br><b>SESSION</b>',
    sub: 'Works with no signal. Card rooms are dead zones.',
    body: `<div class="nav"><div class="t">Sessions</div></div>
      <div class="card acc"><div class="row"><span class="pill" style="border-color:${C.win};color:${C.win}">Live session</span><span class="big" style="font-size:70px">3:42</span></div>
      <div class="muted" style="margin:14px 0">NLHE 2/5 at Bellagio</div>
      <div style="text-align:center;padding:30px 0"><div class="big" style="font-size:160px;color:${C.win}">+$640</div><div class="stat l">Current result</div></div>
      <div class="row" style="gap:20px"><div class="chip" style="flex:1;text-align:center">+ Rebuy</div><div class="chip" style="flex:1;text-align:center">Tag player</div></div>
      <div class="btn" style="margin-top:14px">End session</div></div>
      <div class="card"><div class="row"><span class="big" style="font-size:44px">NLHE 5/10 - Wynn</span><span class="big" style="font-size:46px;color:${C.win}">+$1,250</span></div></div>` }),

  '03-numbers': shell({ accent: C.blue, dots: 2,
    eyebrow: 'Your own results',
    title: 'KNOW YOUR<br><b>REAL HOURLY</b>',
    sub: 'By room, stakes, day, and time of day.',
    body: `<div class="nav"><div class="t">Analytics</div></div>
      <div class="card acc"><div class="big" style="color:${C.blue};font-size:44px;margin-bottom:18px">Bankroll</div>
      <svg width="100%" height="280" viewBox="0 0 760 280"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.win}" stop-opacity=".35"/><stop offset="1" stop-color="${C.win}" stop-opacity="0"/></linearGradient></defs>
      <polygon points="15,240 15,195 160,205 300,150 440,165 580,80 740,35 740,240" fill="url(#g)"/>
      <polyline points="15,195 160,205 300,150 440,165 580,80 740,35" fill="none" stroke="${C.win}" stroke-width="7" stroke-linejoin="round"/><circle cx="740" cy="35" r="11" fill="${C.win}"/></svg>
      <div class="row" style="margin-top:18px"><div class="stat"><div class="v" style="color:${C.win}">+$4,820</div><div class="l">Net</div></div><div class="stat"><div class="v">162</div><div class="l">Hours</div></div><div class="stat"><div class="v" style="color:${C.win}">+$30/hr</div><div class="l">Rate</div></div></div></div>
      <div class="card"><div class="big" style="color:${C.blue};font-size:40px;margin-bottom:22px">Hourly by room</div>${bars([['Wynn',95,C.win,'+$38'],['Bellagio',60,C.win,'+$22'],['Aria',24,C.loss,'-$9']])}</div>` }),

  '04-rooms': shell({ accent: C.gold, dots: 3,
    eyebrow: 'Rake and comps, scored',
    title: 'FIND THE<br><b>BEST ROOM</b>',
    sub: 'A transparent rake-friendliness score.',
    body: `<div class="nav"><div class="t">Rooms</div></div>
      ${[['Wynn','Las Vegas - 28 tables',92,C.win,['Cap $5','No drop','$1/hr']],['Bellagio','Las Vegas - 37 tables',84,C.win,['Cap $5','$2/hr']],['Borgata','Atlantic City - 65',72,C.warn,['Cap $4','Drop $1']]].map(([n,m,s,c,p])=>`<div class="card"><div class="row"><div><div class="big" style="font-size:50px">${n}</div><div class="muted" style="margin-top:6px">${m}</div></div><div style="text-align:center"><div class="big" style="font-size:96px;color:${c}">${s}</div></div></div><div style="margin-top:16px">${p.map(x=>`<span class="chip" style="font-size:26px">${x}</span>`).join('')}</div></div>`).join('')}` }),

  '05-schedule': shell({ accent: C.purple, dots: 4,
    eyebrow: 'WSOP - WPT - and more',
    title: 'NEVER MISS A<br><b>TOURNAMENT</b>',
    sub: 'Filter, get reminders, add to calendar.',
    body: `<div class="nav"><div class="t">Schedule</div></div>
      <div style="margin-bottom:22px">${['2026','This month','WSOP','WPT'].map((c,i)=>`<span class="chip ${i===0?'on':''}">${c}</span>`).join('')}</div>
      <div class="big" style="color:${C.purple};font-size:46px;margin-bottom:18px">World Series of Poker 2026</div>
      ${[['$10,000 Main Event','Jul 2 - Horseshoe','$10,000'],['$1,500 Monster Stack','Jun 19 - Paris','$1,500'],['Players Championship','Jun 24 - Horseshoe','$50,000']].map(([n,m,b])=>`<div class="card"><div class="row"><div class="big" style="font-size:44px;max-width:540px">${n}</div><div class="big" style="font-size:48px;color:${C.gold}">${b}</div></div><div class="muted" style="margin-top:8px">${m}</div></div>`).join('')}` }),

  '06-opponents': shell({ accent: C.loss, dots: 5,
    eyebrow: 'Cross-session reads',
    title: 'READ EVERY<br><b>OPPONENT</b>',
    sub: 'Tag players and log the hands they show.',
    body: `<div class="nav"><div class="t">Players</div></div>
      <div class="card acc"><div class="row"><div class="big" style="font-size:50px">Seat 4 - blue hat</div><span class="pill" style="border-color:${C.blue};color:${C.blue}">Station</span></div>
      <div class="muted" style="margin:16px 0">Calls too much. Never folds top pair.</div>
      <div class="glass"><div class="big" style="font-size:38px;color:${C.gold}">Showed down</div><div style="font-size:34px;margin-top:12px">A&#9824; K&#9830; - called 3bet, stacked off TPTK</div></div></div>
      <div class="card"><div class="row"><div class="big" style="font-size:48px">Older reg, seat 7</div><span class="pill" style="border-color:${C.loss};color:${C.loss}">Nit</span></div><div class="muted" style="margin-top:12px">Overfolds. Steal relentlessly.</div></div>` }),

  '07-study': shell({ accent: C.teal, dots: 6,
    eyebrow: 'Solver-derived',
    title: 'STUDY THE<br><b>RANGES</b>',
    sub: 'Opens, 3-bets, and shoves by position.',
    body: `<div class="nav"><div class="t">Ranges</div><span class="pill" style="border-color:${C.teal};color:${C.teal}">Button</span></div>
      <div class="card acc"><div class="row" style="margin-bottom:8px"><span class="big" style="font-size:46px">Button open</span><span class="muted">45% of hands</span></div>
      <div class="muted" style="margin-bottom:22px">100bb - raise first in</div>
      ${rangeGrid()}</div>
      <div class="card"><div class="big" style="font-size:40px;color:${C.teal}">Player-type guide</div><div class="muted" style="margin-top:12px">vs a station: stop bluffing, value bet thin and relentlessly.</div></div>` }),

  '08-equity': shell({ accent: C.win, dots: 7,
    eyebrow: 'Local, instant',
    title: 'EQUITY +<br><b>GTO SPOTS</b>',
    sub: 'Hand vs range, plus flop strategy.',
    body: `<div class="nav"><div class="t">Equity</div></div>
      <div class="card acc"><div class="row"><span class="big" style="font-size:50px">A&#9829;K&#9829; vs Q&#9824;Q&#9830;</span><span class="big" style="font-size:72px;color:${C.win}">46%</span></div>
      <div class="bar" style="margin-top:20px"><div style="width:46%"></div></div>
      <div class="muted" style="margin-top:16px">12,000 simulations</div></div>
      <div class="card"><div class="big" style="font-size:42px;color:${C.win}">Flop strategy</div><div class="muted" style="margin:12px 0">A&#9829; 7&#9827; 2&#9830; - dry high</div><div class="row"><div class="stat"><div class="v">78%</div><div class="l">C-bet</div></div><div class="stat"><div class="v">33%</div><div class="l">Sizing</div></div></div></div>` }),

  '09-ai': shell({ accent: C.purple, dots: 8,
    eyebrow: 'Built on the math',
    title: 'AI EXPLAINS<br><b>EVERY SPOT</b>',
    sub: 'Plain-language coaching that never contradicts the numbers.',
    body: `<div class="nav"><div class="t">AI Coach</div></div>
      <div class="card acc"><div class="big" style="font-size:42px;color:${C.purple};margin-bottom:18px">Why fold here?</div>
      <div style="font-size:36px;line-height:1.5;color:${C.text}">A nit's 3-bet is the top of their range. AhKh is dominated by their value. Fold and steal their blinds later instead.</div></div>
      <div class="card"><div class="big" style="font-size:40px;color:${C.purple}">Your leaks, ranked</div>
      <div class="row" style="margin-top:18px"><span style="font-size:36px">Fold to 3-bet</span><span class="pill" style="border-color:${C.loss};color:${C.loss}">-6 bb/100</span></div>
      <div class="muted" style="margin-top:12px">You overfold to 3-bets. Defend more.</div></div>` }),

  '10-cta': shell({ accent: C.gold, dots: 9,
    eyebrow: 'Free to start - Pro to dominate',
    title: 'GET THE<br><b>EDGE</b>',
    sub: 'The serious live player\'s companion.',
    body: `<div style="text-align:center;margin:30px 0 40px"><div class="big" style="font-size:120px;color:${C.gold}">&#9824;</div></div>
      <div class="card acc">${['Full analytics by room and stakes','Unlimited opponent reads','Full range library + trainer','Equity, ICM, and AI coaching','Schedule alerts + data export'].map(b=>`<div class="row" style="margin-bottom:20px"><span style="color:${C.win};font-size:42px;margin-right:18px">&#10003;</span><span style="font-size:36px;flex:1;text-align:left">${b}</span></div>`).join('')}</div>
      <div class="btn" style="font-size:44px;padding:34px">Start free</div>
      <div class="muted" style="text-align:center;margin-top:24px">21+ - No real-money gambling - 1-800-GAMBLER</div>` }),
};

for (const [name, html] of Object.entries(slides)) {
  fs.writeFileSync(path.join(outDir, `${name}.html`), html);
  console.log(`wrote ${name}.html`);
}
