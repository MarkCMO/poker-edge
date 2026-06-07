/**
 * Generates App Store 6.7" screenshot pages (1290 x 2796) as self-contained
 * HTML, recreating the Poker Edge UI with the house brand. Rendered to PNG by
 * Playwright (see the runner that follows). Five hero screens with captions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'store-assets', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const C = {
  bg: '#0B1120', surface: '#1E2D45', surfaceAlt: '#16223A', accent: '#C8A84E',
  text: '#F5F7FA', dim: '#9AA7BD', faint: '#6B7894', border: '#27374F',
  win: '#3FB477', loss: '#E2574C', info: '#5B8DEF', warn: '#E8B339',
};

const shell = (caption, sub, body) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  html,body { width:1290px; height:2796px; }
  body { background:linear-gradient(160deg,#0B1120,#16223A 60%,#0B1120); font-family:'Barlow',sans-serif; color:${C.text}; overflow:hidden; }
  .cap { padding:120px 90px 50px; text-align:center; }
  .cap h1 { font-family:'Bebas Neue',sans-serif; font-size:118px; line-height:1.02; letter-spacing:2px; color:${C.text}; }
  .cap h1 b { color:${C.accent}; font-weight:400; }
  .cap p { font-size:42px; color:${C.dim}; margin-top:26px; font-weight:500; }
  .phone { margin:30px auto 0; width:1020px; height:2010px; background:${C.bg};
    border:14px solid #0a1426; border-radius:90px;
    box-shadow:0 40px 120px rgba(0,0,0,.6), inset 0 0 0 3px ${C.border}; padding:64px 54px; position:relative; overflow:hidden; }
  .nav { display:flex; justify-content:space-between; align-items:center; margin-bottom:34px; }
  .nav .title { font-family:'Bebas Neue',sans-serif; font-size:64px; letter-spacing:1.5px; }
  .nav .acc { color:${C.accent}; }
  .card { background:${C.surface}; border:2px solid ${C.border}; border-radius:40px; padding:46px; margin-bottom:30px; }
  .card.gold { border-color:${C.accent}; }
  .row { display:flex; justify-content:space-between; align-items:center; }
  .pill { border:2px solid; border-radius:999px; padding:8px 22px; font-size:30px; font-weight:600; text-transform:uppercase; letter-spacing:1px; display:inline-block; }
  .muted { color:${C.dim}; font-size:36px; }
  .big { font-family:'Bebas Neue',sans-serif; letter-spacing:1px; }
  .stat { flex:1; }
  .stat .v { font-family:'Bebas Neue',sans-serif; font-size:70px; }
  .stat .l { color:${C.dim}; font-size:28px; text-transform:uppercase; letter-spacing:1px; }
  .btn { background:${C.accent}; color:${C.bg}; border-radius:28px; padding:30px; text-align:center; font-weight:700; font-size:40px; }
  .btn.ghost { background:transparent; border:2px solid ${C.border}; color:${C.text}; }
  .chips span { display:inline-block; border:2px solid ${C.border}; background:${C.surfaceAlt}; color:${C.dim}; border-radius:999px; padding:14px 28px; font-size:32px; font-weight:600; margin:0 14px 14px 0; }
  .chips span.on { background:${C.accent}; color:${C.bg}; border-color:${C.accent}; }
  .grid { display:grid; grid-template-columns:repeat(13,1fr); gap:5px; margin-top:20px; }
  .grid div { aspect-ratio:1; border-radius:7px; background:${C.surfaceAlt}; display:flex; align-items:center; justify-content:center; font-size:17px; color:${C.faint}; }
  .grid div.on { background:${C.accent}; color:${C.bg}; font-weight:600; }
  .banner { background:rgba(232,179,57,.12); border:2px solid ${C.warn}; color:${C.warn}; border-radius:24px; padding:30px; font-size:32px; font-weight:600; }
</style></head><body>
  <div class="cap"><h1>${caption}</h1><p>${sub}</p></div>
  <div class="phone">${body}</div>
</body></html>`;

const slides = {
  '01-sessions': shell(
    'Track every <b>session</b>',
    'Live timer, bankroll, and notes. Fully offline.',
    `<div class="nav"><div class="title">Sessions</div></div>
     <div class="card gold">
       <div class="row"><span class="pill" style="border-color:${C.win};color:${C.win}">Live session</span><span class="big" style="font-size:80px">3:42</span></div>
       <div class="muted" style="margin:20px 0 10px">NLHE 2/5 at Bellagio</div>
       <div style="text-align:center;padding:30px 0"><div class="big" style="font-size:150px;color:${C.win}">+$640</div><div class="stat l" style="text-align:center">Current result</div></div>
       <div class="row" style="gap:24px"><div class="btn ghost" style="flex:1">Tag player</div><div class="btn ghost" style="flex:1">Log hand</div></div>
       <div class="btn" style="margin-top:24px">End session</div>
     </div>
     <div class="card"><div class="row"><span class="big" style="font-size:46px">NLHE 5/10</span><span class="big" style="font-size:46px;color:${C.win}">+$1,250</span></div>
       <div class="row"><span class="muted">May 28 - Wynn</span><span class="muted">6h 10m - +$202/hr</span></div></div>
     <div class="card"><div class="row"><span class="big" style="font-size:46px">PLO 2/5</span><span class="big" style="font-size:46px;color:${C.loss}">-$310</span></div>
       <div class="row"><span class="muted">May 26 - Aria</span><span class="muted">3h 05m - -$100/hr</span></div></div>`
  ),
  '02-analytics': shell(
    'Know your <b>real numbers</b>',
    'Hourly by room, stakes, and time. From your own results.',
    `<div class="nav"><div class="title">Analytics</div></div>
     <div class="card"><div class="big" style="color:${C.accent};font-size:46px;margin-bottom:20px">Bankroll</div>
       <svg width="100%" height="300" viewBox="0 0 900 300">
         <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.win}" stop-opacity=".3"/><stop offset="1" stop-color="${C.win}" stop-opacity="0"/></linearGradient></defs>
         <polygon points="20,260 20,210 180,225 340,160 500,175 660,90 840,40 840,260" fill="url(#g)"/>
         <polyline points="20,210 180,225 340,160 500,175 660,90 840,40" fill="none" stroke="${C.win}" stroke-width="7" stroke-linejoin="round"/>
         <circle cx="840" cy="40" r="11" fill="${C.win}"/>
       </svg>
       <div class="row" style="margin-top:24px"><div class="stat"><div class="v" style="color:${C.win}">+$4,820</div><div class="l">Net</div></div><div class="stat"><div class="v">162</div><div class="l">Hours</div></div><div class="stat"><div class="v" style="color:${C.win}">+$30/hr</div><div class="l">Per hour</div></div></div>
     </div>
     <div class="card"><div class="big" style="color:${C.accent};font-size:46px;margin-bottom:24px">Hourly by room</div>
       ${[['Wynn',38,'#3FB477','+$38/hr'],['Bellagio',22,'#3FB477','+$22/hr'],['Aria',-9,'#E2574C','-$9/hr']].map(([n,w,c,v])=>`<div style="margin-bottom:24px"><div class="row"><span style="font-size:34px">${n}</span><span style="font-size:34px;color:${c};font-weight:600">${v}</span></div><div style="height:16px;background:${C.surfaceAlt};border-radius:8px;margin-top:8px"><div style="width:${Math.abs(w)*2}%;height:16px;border-radius:8px;background:${c}"></div></div></div>`).join('')}
     </div>`
  ),
  '03-rooms': shell(
    'Find the <b>profitable room</b>',
    'Rake, comps, and an honest score.',
    `<div class="nav"><div class="title">Rooms</div></div>
     <div class="chips"><span class="on">LV Strip</span><span>Atlantic City</span><span>Distance</span></div>
     ${[['Wynn Poker Room','Las Vegas, NV - 28 tables',92,'Strong',C.win,['Rake cap $5','No promo drop','Comp $1/hr']],
        ['Bellagio Poker Room','Las Vegas, NV - 37 tables',84,'Strong',C.win,['Rake cap $5','Comp $2/hr']],
        ['Borgata Poker Room','Atlantic City, NJ - 65 tables',72,'Fair',C.warn,['Rake cap $4','Drop $1']]]
       .map(([n,m,s,b,c,pills])=>`<div class="card"><div class="row"><div><div class="big" style="font-size:50px">${n}</div><div class="muted" style="margin-top:8px">${m}</div></div><div style="text-align:center"><div class="big" style="font-size:90px;color:${c}">${s}</div><div class="l" style="font-size:26px;color:${C.dim}">${b}</div></div></div>
        <div style="margin-top:20px">${pills.map(p=>`<span class="pill" style="border-color:${C.border};color:${C.dim};margin-right:14px;font-size:26px">${p}</span>`).join('')}</div></div>`).join('')}`
  ),
  '04-schedule': shell(
    'Never miss a <b>tournament</b>',
    'WSOP, WPT, and every major series.',
    `<div class="nav"><div class="title">Schedule</div></div>
     <div class="chips"><span class="on">2026</span><span>This month</span><span>WSOP</span><span>WPT</span></div>
     <div class="big" style="color:${C.accent};font-size:48px;margin:20px 0 6px">World Series of Poker 2026</div>
     <div class="muted" style="margin-bottom:24px">WSOP - Horseshoe &amp; Paris Las Vegas</div>
     ${[['WSOP $10,000 Main Event','Jul 2, 10:00 AM - Horseshoe','$10,000',''],
        ['WSOP $1,500 Monster Stack','Jun 19, 10:00 AM - Paris','$1,500',''],
        ['WSOP $50,000 Players Championship','Jun 24, 2:00 PM - Horseshoe','$50,000','']]
       .map(([n,m,b])=>`<div class="card"><div class="row"><div class="big" style="font-size:46px;max-width:640px">${n}</div><div class="big" style="font-size:50px;color:${C.accent}">${b}</div></div><div class="muted" style="margin-top:10px">${m}</div></div>`).join('')}
     <div class="card gold"><div class="row"><span style="font-size:40px">Remind me 2h before</span><span class="pill" style="border-color:${C.accent};color:${C.accent}">Set</span></div></div>`
  ),
  '05-study': shell(
    'Study away from <b>the table</b>',
    'Ranges, reads, quizzes, and an equity calculator.',
    `<div class="nav"><div class="title">Study</div></div>
     <div class="banner" style="margin-bottom:30px">Study mode. Do not use at the table.</div>
     <div class="card"><div class="row"><span class="big" style="font-size:48px">Button open</span><span class="pill" style="border-color:${C.info};color:${C.info}">Cash</span></div>
       <div class="muted" style="margin:10px 0 20px">100bb (6-max) - Raise first in</div>
       <div class="grid" id="grid"></div>
     </div>
     <div class="card"><div class="big" style="color:${C.accent};font-size:44px">Equity calculator</div><div class="row" style="margin-top:20px"><span style="font-size:40px">AhKh vs QsQd</span><span class="big" style="font-size:60px;color:${C.win}">46.0%</span></div>
       <div style="height:34px;border-radius:12px;overflow:hidden;background:${C.loss};margin-top:16px"><div style="width:46%;height:34px;background:${C.win}"></div></div></div>
     <script>
       const ranks=['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
       const on=new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','65s','AKo','AQo','AJo','ATo','KQo','KJo','QJo','JTo']);
       const g=document.getElementById('grid');
       for(let i=0;i<13;i++)for(let j=0;j<13;j++){const lab=i===j?ranks[i]+ranks[i]:(j>i?ranks[i]+ranks[j]+'s':ranks[j]+ranks[i]+'o');const d=document.createElement('div');d.textContent=lab.replace(/[so]$/,'');if(on.has(lab))d.className='on';g.appendChild(d);}
     </script>`
  ),
};

for (const [name, html] of Object.entries(slides)) {
  fs.writeFileSync(path.join(outDir, `${name}.html`), html);
  console.log(`wrote store-assets/screenshots/${name}.html`);
}
