import fs from 'fs';
const dash = fs.readFileSync('/tmp/dash_b64.txt','utf8').trim();
const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Ubuntu Sans','Ubuntu',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
.wrap{width:1600px;height:1000px;background:radial-gradient(1200px 700px at 78% 18%,#15324c 0%,#0b1c2c 55%,#081521 100%);position:relative;overflow:hidden;color:#fff;}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:46px 46px;}
.glow{position:absolute;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(20,184,166,.32),transparent 65%);top:-140px;right:120px;filter:blur(10px);}
.left{position:absolute;left:84px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;z-index:5;}
.brand{display:flex;align-items:center;gap:14px;margin-bottom:30px;}
.logo{width:58px;height:58px;border-radius:15px;background:linear-gradient(135deg,#14b8a6,#0d9488);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(13,148,136,.45);}
.brand b{font-size:27px;font-weight:700;letter-spacing:-.5px;}
.brand span{display:block;font-size:11px;color:#7d9ab0;letter-spacing:3px;text-transform:uppercase;margin-top:2px;}
.tag{display:inline-flex;align-items:center;gap:8px;background:rgba(20,184,166,.13);border:1px solid rgba(20,184,166,.35);color:#5eead4;font-size:13px;font-weight:600;padding:7px 15px;border-radius:30px;width:fit-content;margin-bottom:22px;}
h1{font-size:52px;line-height:1.08;font-weight:700;letter-spacing:-1.4px;margin-bottom:20px;}
h1 em{font-style:normal;background:linear-gradient(120deg,#2dd4bf,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent;}
.sub{font-size:18px;line-height:1.6;color:#aec4d6;margin-bottom:34px;max-width:500px;}
.feat{display:flex;flex-direction:column;gap:13px;}
.feat div{display:flex;align-items:center;gap:12px;font-size:15.5px;color:#d4e2ee;}
.feat .ck{width:25px;height:25px;border-radius:7px;background:rgba(20,184,166,.16);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.stackline{position:absolute;left:84px;bottom:50px;display:flex;gap:10px;flex-wrap:wrap;max-width:560px;z-index:5;}
.stackline span{font-size:12px;color:#86a3b8;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);padding:5px 12px;border-radius:7px;}
.shot{position:absolute;right:-70px;top:206px;width:1000px;border-radius:14px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08);transform:perspective(1800px) rotateY(-15deg) rotateX(3deg) scale(1.02);}
.shot .bar{height:34px;background:#0e2436;display:flex;align-items:center;gap:7px;padding:0 14px;}
.shot .bar i{width:11px;height:11px;border-radius:50%;}
.shot img{display:block;width:100%;}
</style></head><body>
<div class="wrap">
  <div class="grid"></div><div class="glow"></div>
  <div class="shot">
    <div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
    <img src="${dash}"/>
  </div>
  <div class="left">
    <div class="brand"><div class="logo"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg></div><div><b>MarketPulse</b><span>Market Intelligence SaaS</span></div></div>
    <div class="tag"><span style="width:8px;height:8px;border-radius:50%;background:#2dd4bf;"></span>SaaS Platform · Full-Stack</div>
    <h1>Bayini, rakibini ve <em>pazar sinyalini</em> tek panelden izle</h1>
    <div class="sub">Türk KOBİ ve sanayi firmaları için scraper destekli lead üretimi, churn riski ve rakip takibi — tek hesap, tek panel.</div>
    <div class="feat">
      <div><span class="ck"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>Lead Machine — Amazon · B2B Dizin · Fuar taraması</div>
      <div><span class="ck"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>Otomatik churn risk skoru & pazar sinyalleri</div>
      <div><span class="ck"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>AI outreach + haftalık PDF raporu</div>
    </div>
  </div>
  <div class="stackline">
    <span>Next.js 16</span><span>React 19</span><span>TypeScript</span><span>Tailwind v4</span><span>Fastify</span><span>Drizzle ORM</span><span>MySQL</span><span>Bun</span><span>Python Scraper</span><span>Docker</span>
  </div>
</div></body></html>`;
fs.writeFileSync('00-cover.html', html);
console.log('written');
