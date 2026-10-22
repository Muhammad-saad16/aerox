/* ---------- tech visuals (inline SVG) ---------- */
const T = {deep:'#0F2F29', acc:'#2E8C7B', glow:'#5FE3C4', glow2:'#8DF0D6', ink:'#141516'};
const bgs = {
  steel:'radial-gradient(circle at 50% 40%,#2a3a40,#0d1416 75%)',
  sky:'radial-gradient(circle at 30% 20%,#1d4a45,#0a1517 75%)',
  dark:'radial-gradient(circle at 50% 30%,#1a2427,#070b0c 75%)',
  teal:'radial-gradient(circle at 70% 20%,#2E8C7B,#0F2F29 70%)',
};
const vis = {
  neural(c){
    const L=[[60,90,150,210,240],[70,120,180,230],[90,150,210],[150]], xs=[70,160,250,340];
    let s='';
    L.forEach((col,i)=>{ if(i<L.length-1) col.forEach(y=>L[i+1].forEach(y2=>s+=`<line x1="${xs[i]}" y1="${y}" x2="${xs[i+1]}" y2="${y2}" stroke="${c}" stroke-opacity=".35"/>`)); });
    L.forEach((col,i)=>col.forEach((y,j)=>{const r=i===3?11:7;s+=`<circle cx="${xs[i]}" cy="${y}" r="${r}" fill="${(i+j)%3===0?T.glow:c}"><animate attributeName="r" values="${r};${r+3};${r}" dur="${2+j*.4}s" repeatCount="indefinite"/></circle>`}));
    return s;
  },
  arm(c){
    return `<ellipse cx="210" cy="275" rx="90" ry="10" fill="#000" opacity=".12"/>
      <rect x="150" y="250" width="120" height="22" rx="6" fill="${c}"/>
      <rect x="180" y="230" width="60" height="24" rx="6" fill="${c}" opacity=".85"/>
      <g><animateTransform attributeName="transform" type="rotate" values="-6 210 230;8 210 230;-6 210 230" dur="5s" repeatCount="indefinite"/>
        <rect x="200" y="120" width="20" height="115" rx="10" fill="${c}"/>
        <circle cx="210" cy="230" r="16" fill="${T.ink}"/><circle cx="210" cy="230" r="6" fill="${T.glow}"/>
        <g><animateTransform attributeName="transform" type="rotate" values="10 210 125;-20 210 125;10 210 125" dur="5s" repeatCount="indefinite"/>
          <rect x="205" y="115" width="110" height="18" rx="9" fill="${c}"/>
          <circle cx="210" cy="125" r="13" fill="${T.ink}"/><circle cx="210" cy="125" r="5" fill="${T.glow}"/>
          <path d="M315 112 l22 -10 M315 136 l22 10" stroke="${T.ink}" stroke-width="7" stroke-linecap="round"/>
          <circle cx="315" cy="124" r="9" fill="${T.glow}"/>
        </g>
      </g>`;
  },
  chip(c){
    let s='';
    for(let i=0;i<5;i++){const o=150+i*25;
      s+=`<path d="M${o} 110 V40" stroke="${c}" stroke-opacity=".5"/><circle cx="${o}" cy="40" r="4" fill="${c}"/>`;
      s+=`<path d="M${o} 240 V310" stroke="${c}" stroke-opacity=".5"/><circle cx="${o}" cy="310" r="4" fill="${c}"/>`;
      s+=`<path d="M150 ${o-20} H70" stroke="${c}" stroke-opacity=".5"/><circle cx="70" cy="${o-20}" r="4" fill="${c}"/>`;
      s+=`<path d="M270 ${o-20} H350" stroke="${c}" stroke-opacity=".5"/><circle cx="350" cy="${o-20}" r="4" fill="${c}"/>`;}
    return s+`<rect x="145" y="105" width="130" height="140" rx="14" fill="${T.ink}" stroke="${T.glow}" stroke-width="2"/>
      <text x="210" y="190" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="48" fill="${T.glow}">AI</text>
      <rect x="145" y="105" width="130" height="140" rx="14" fill="none" stroke="${T.glow2}" stroke-width="2" stroke-dasharray="60 480"><animate attributeName="stroke-dashoffset" values="0;-540" dur="3s" repeatCount="indefinite"/></rect>`;
  },
  orb(c){
    return `<rect x="70" y="200" width="110" height="160" rx="4" fill="${c}" opacity=".9"/>
      <rect x="260" y="150" width="70" height="210" rx="4" fill="${c}" opacity=".5"/>
      <circle cx="125" cy="160" r="40" fill="${T.ink}"/>
      <circle cx="125" cy="160" r="14" fill="${T.glow}"><animate attributeName="opacity" values="1;.4;1" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="125" cy="160" r="26" fill="none" stroke="${T.glow}"><animate attributeName="r" values="20;60" dur="2.4s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".7;0" dur="2.4s" repeatCount="indefinite"/></circle>`;
  },
  radar(c){
    return `<g transform="translate(210 170)">
      ${[40,80,120].map(r=>`<circle r="${r}" fill="none" stroke="${c}" stroke-opacity=".4"/>`).join('')}
      <line x1="-130" x2="130" stroke="${c}" stroke-opacity=".25"/><line y1="-130" y2="130" stroke="${c}" stroke-opacity=".25"/>
      <g><animateTransform attributeName="transform" type="rotate" values="0;360" dur="4s" repeatCount="indefinite"/>
        <path d="M0 0 L120 0 A120 120 0 0 0 85 -85 Z" fill="${T.glow}" opacity=".3"/><line x2="120" stroke="${T.glow}" stroke-width="2"/></g>
      <circle cx="60" cy="-40" r="5" fill="${T.glow}"/><circle cx="-70" cy="30" r="5" fill="${T.glow}"/><circle cx="20" cy="90" r="4" fill="${T.glow}"/>
    </g>`;
  },
  bot(c){ // robot head, like the RoboX camera unit
    return `<ellipse cx="210" cy="345" rx="110" ry="12" fill="#000" opacity=".12"/>
      <rect x="125" y="80" width="170" height="190" rx="46" fill="${c}"/>
      <rect x="150" y="105" width="120" height="70" rx="24" fill="${T.ink}"/>
      <ellipse cx="185" cy="140" rx="12" ry="12" fill="${T.glow}"><animate attributeName="ry" values="12;1;12;12" keyTimes="0;.04;.08;1" dur="4s" repeatCount="indefinite"/></ellipse>
      <ellipse cx="235" cy="140" rx="12" ry="12" fill="${T.glow}"><animate attributeName="ry" values="12;1;12;12" keyTimes="0;.04;.08;1" dur="4s" repeatCount="indefinite"/></ellipse>
      <text x="275" y="215" text-anchor="end" font-family="Archivo,Arial" font-weight="700" font-size="30" fill="${T.ink}" opacity=".25">02</text>
      <circle cx="210" cy="225" r="14" fill="${T.ink}"/><circle cx="210" cy="225" r="6" fill="${T.glow}"/>
      <rect x="160" y="270" width="100" height="60" rx="14" fill="${T.ink}"/>`;
  },
};
function art(kind, bg, label){
  const dark = bg==='dark'||bg==='teal';
  const c = dark ? T.glow2 : '#F5F7FA';
  return `<div class="art${dark?' dark':''}" style="background:${bgs[bg]}">
    ${label?`<span class="chip-lbl">${label}</span>`:''}
    <svg class="vis" viewBox="0 0 420 340" preserveAspectRatio="xMidYMid slice" fill="none">${vis[kind](c)}</svg></div>`;
}
const $ = id => document.getElementById(id);
