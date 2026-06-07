// Poker Edge marketing + legal site (Cloudflare Worker).
// Serves the landing page and the legal pages required for App Store review:
// /privacy, /terms, /support. House brand navy + gold.

const APP_STORE_URL = 'https://apps.apple.com/app/id6777580813';
const SUPPORT_EMAIL = 'marklgabriellijr@gmail.com';

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B1120;color:#F5F7FA;line-height:1.6}
a{color:#C8A84E}
.wrap{max-width:880px;margin:0 auto;padding:0 24px}
header{padding:28px 0;border-bottom:1px solid #27374F}
header .wrap{display:flex;align-items:center;justify-content:space-between}
.logo{font-weight:800;font-size:24px;letter-spacing:.5px}.logo b{color:#C8A84E;font-weight:800}
nav a{margin-left:22px;text-decoration:none;font-size:15px;color:#9AA7BD}
.hero{text-align:center;padding:90px 0 60px;background:radial-gradient(120% 80% at 50% -10%,#C8A84E22,transparent 60%)}
.hero h1{font-size:52px;line-height:1.05;letter-spacing:-.5px}.hero h1 b{color:#C8A84E}
.hero p{font-size:20px;color:#9AA7BD;margin:20px auto 32px;max-width:620px}
.btn{display:inline-block;background:#C8A84E;color:#0B1120;font-weight:700;padding:16px 30px;border-radius:14px;text-decoration:none;font-size:17px}
.btn.ghost{background:transparent;border:1px solid #27374F;color:#F5F7FA;margin-left:12px}
.feat{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;padding:50px 0}
.card{background:#1E2D45;border:1px solid #27374F;border-radius:16px;padding:24px}
.card h3{color:#C8A84E;font-size:18px;margin-bottom:8px}
.card p{color:#9AA7BD;font-size:15px}
.price{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;padding:20px 0 60px}
.plan{background:#16223A;border:1px solid #27374F;border-radius:18px;padding:30px;min-width:240px;text-align:center}
.plan.best{border-color:#C8A84E}
.plan .amt{font-size:40px;font-weight:800}.plan .amt span{font-size:16px;color:#9AA7BD;font-weight:400}
.tag{display:inline-block;background:#C8A84E22;color:#C8A84E;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:.5px}
footer{border-top:1px solid #27374F;padding:40px 0;color:#6B7894;font-size:14px;text-align:center}
footer a{color:#9AA7BD;margin:0 10px}
.legal{padding:50px 0;max-width:760px}
.legal h1{font-size:34px;margin-bottom:8px}.legal .upd{color:#6B7894;margin-bottom:24px}
.legal h2{color:#C8A84E;font-size:20px;margin:26px 0 8px}
.legal p{color:#C7D2E2;margin-bottom:12px}.legal ul{margin:0 0 12px 22px;color:#C7D2E2}
`;

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>${CSS}</style></head><body>
<header><div class="wrap"><div class="logo">POKER <b>EDGE</b></div>
<nav><a href="/">Home</a><a href="/support">Support</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></div></header>
${body}
<footer><div class="wrap">
<p>Poker Edge is a tracking and study tool. No real-money gambling happens in the app. You must be 18 or older.</p>
<p style="margin-top:8px">If gambling stops being fun, call <a href="tel:18004262537">1-800-GAMBLER</a>.</p>
<p style="margin-top:14px"><a href="/privacy">Privacy</a> <a href="/terms">Terms</a> <a href="/support">Support</a> <a href="mailto:${SUPPORT_EMAIL}">Contact</a></p>
<p style="margin-top:14px">&copy; 2026 WETYR Corp</p>
</div></footer></body></html>`;

const LANDING = page('Poker Edge - The serious live player\'s companion', `
<section class="hero"><div class="wrap">
<h1>Data, <b>not vibes.</b></h1>
<p>Track every live session and your bankroll offline, find your most profitable room and game, study ranges, and never miss a tournament.</p>
<a class="btn" href="${APP_STORE_URL}">Download on the App Store</a>
<a class="btn ghost" href="/support">Learn more</a>
<p style="margin-top:18px;font-size:14px"><span class="tag">7-day free trial</span></p>
</div></section>
<section class="wrap"><div class="feat">
<div class="card"><h3>Track every session</h3><p>Live timer, bankroll, rebuys, and notes. Fully offline, because card rooms are dead zones.</p></div>
<div class="card"><h3>Know your real hourly</h3><p>Win rate and hourly by room, stakes, day, and time of day, from your own results.</p></div>
<div class="card"><h3>Find the best room</h3><p>Rake, comps, and a transparent rake-friendliness score for every room.</p></div>
<div class="card"><h3>Never miss a tournament</h3><p>WSOP, WPT, and more. Filter, get reminders, add to your calendar.</p></div>
<div class="card"><h3>Read every opponent</h3><p>Tag players and log the hands they show down. Reads that follow you across sessions.</p></div>
<div class="card"><h3>Study away from the table</h3><p>Range charts, a player-type guide, a quiz trainer, equity, ICM, and AI explanations.</p></div>
</div>
<div class="price">
<div class="plan best"><div class="tag">Best value</div><div class="amt" style="margin-top:10px">$59.99<span>/year</span></div><p style="color:#9AA7BD;margin-top:6px">About $5/month. 7-day free trial.</p></div>
<div class="plan"><div class="amt">$9.99<span>/month</span></div><p style="color:#9AA7BD;margin-top:6px">7-day free trial.</p></div>
</div>
<p style="text-align:center;color:#6B7894;font-size:14px;padding-bottom:50px">Free tier includes session and bankroll tracking, basic schedule, and the room directory. Pro unlocks full analytics, the full range library, the trainer, equity and ICM tools, AI explanations, schedule alerts, and data export.</p>
</section>`);

const PRIVACY = page('Privacy Policy - Poker Edge', `<section class="wrap legal">
<h1>Privacy Policy</h1><div class="upd">Last updated: June 7, 2026</div>
<p>Poker Edge is built to keep your data yours. This policy explains what the app does and does not collect.</p>
<h2>Data we do not collect</h2>
<p>Poker Edge does not require an account and does not collect personal data on our servers. Your sessions, bankroll, opponent notes, and hand history are stored locally on your device.</p>
<h2>Reference data</h2>
<p>The app reads public reference data (poker rooms, schedules, and tournaments) from our own backend API. These requests do not include personal information and are not used to identify you.</p>
<h2>Opponent notes</h2>
<p>Opponent notes are your private observations of people in public card rooms, stored on your device. We recommend using descriptive labels rather than legal names. The app does not perform facial recognition and does not import other people's personal information.</p>
<h2>In-app purchases</h2>
<p>Subscriptions are processed by Apple. We do not receive or store your payment information. Subscription status is managed through Apple and our subscription provider (RevenueCat) using an anonymous identifier.</p>
<h2>Your control</h2>
<p>You can export your data at any time from the Profile tab, and you can delete all of your data from the device at any time.</p>
<h2>Responsible gaming</h2>
<p>Poker Edge is a tracking and study tool. No real-money gambling happens in the app. If gambling stops being fun, help is available at 1-800-GAMBLER.</p>
<h2>Contact</h2>
<p>Questions about privacy: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</section>`);

const TERMS = page('Terms of Use - Poker Edge', `<section class="wrap legal">
<h1>Terms of Use</h1><div class="upd">Last updated: June 7, 2026</div>
<h2>Acceptance</h2><p>By using Poker Edge you agree to these terms. You must be 18 years or older to use the app.</p>
<h2>What the app is</h2><p>Poker Edge is a tracking and study utility for live poker players. It does not offer real-money gambling, wagering, or games of chance. Study features are for use away from the table; do not use electronic assistance during live play, as this violates house rules.</p>
<h2>Subscriptions</h2><p>Poker Edge Pro is an auto-renewing subscription billed through your Apple ID. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your App Store account settings. A free trial, where offered, converts to a paid subscription unless cancelled before it ends.</p>
<h2>Accuracy</h2><p>Schedules, rake, comps, and room information change constantly and are provided for convenience with a freshness timestamp. Verify details with the venue or organizer before you travel or play.</p>
<h2>No warranty</h2><p>The app is provided "as is" without warranties of any kind. We are not liable for losses arising from use of the app.</p>
<h2>Contact</h2><p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</section>`);

const SUPPORT = page('Support - Poker Edge', `<section class="wrap legal">
<h1>Support</h1><div class="upd">We are here to help.</div>
<h2>Contact</h2><p>Email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> and we will get back to you.</p>
<h2>Common questions</h2>
<p><b>Does it work offline?</b> Yes. Session tracking, bankroll, notes, and study charts work with no signal. Schedule and room data is cached and shown with a freshness timestamp.</p>
<p><b>How do I restore my subscription?</b> Open Profile and tap Restore Purchases.</p>
<p><b>How do I cancel?</b> Manage your subscription in your iPhone Settings under your Apple ID, or in the App Store app.</p>
<p><b>How do I export or delete my data?</b> Open the Profile tab to export (CSV or JSON) or delete all data.</p>
<h2>Responsible gaming</h2><p>If gambling stops being fun, call <a href="tel:18004262537">1-800-GAMBLER</a>.</p>
</section>`);

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const routes = { '/': LANDING, '/privacy': PRIVACY, '/terms': TERMS, '/support': SUPPORT };
    if (url.pathname === '/health') return new Response('ok');
    const html = routes[url.pathname];
    if (html) return new Response(html, { headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=300' } });
    return new Response(routes['/'], { status: 404, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  },
};
