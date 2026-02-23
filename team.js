/* ================================================
   AktaşScore — team.js  v0.3
   ================================================ */
AS.requireAuth();

const params = new URLSearchParams(location.search);
const teamId = params.get('id') || 'gs';
const team   = TEAM_PROFILES[teamId];
if (!team) { window.location.replace('home.html'); }

// ── BACK ─────────────────────────────────────────
document.getElementById('back-btn').addEventListener('click', () => goBack('home.html'));

// ── HERO ─────────────────────────────────────────
document.getElementById('topbar-league').textContent = team.league || '';
document.getElementById('hero-name').textContent    = team.name;
document.getElementById('hero-league').textContent  = team.league || '';
document.getElementById('hero-logo').innerHTML      = buildLogo(teamId, 'xl');

document.getElementById('hero-bg').style.cssText = `
  background: linear-gradient(135deg,${team.color}45 0%,${team.color}18 50%,transparent 100%),
              linear-gradient(180deg,var(--bg2) 0%,var(--bg) 100%);
`;

// Topbar scroll
const tabContent = document.getElementById('tab-content');
tabContent.addEventListener('scroll', () => {
  document.getElementById('topbar').classList.toggle('scrolled', tabContent.scrollTop > 20);
});

// ── FAV TOGGLE ────────────────────────────────────
const favBtn = document.getElementById('fav-toggle');
function syncFav() {
  const on = AS.isFavTeam(teamId);
  favBtn.classList.toggle('active', on);
  favBtn.title = on ? 'Favorilerden çıkar' : 'Favorilere ekle';
}
syncFav();
favBtn.addEventListener('click', () => {
  const added = AS.toggleFavTeam({
    id: teamId, name: team.name, short: team.short,
    color: team.color, color2: team.color2, league: team.league
  });
  syncFav();
  showToast(added ? '⭐' : '💔', added ? `${team.name} favorilere eklendi` : `${team.name} favorilerden çıkarıldı`, '', added ? 'goal' : 'neutral');
});

// ── TABS ─────────────────────────────────────────
const tabEls  = document.querySelectorAll('.tab');
const tabLine = document.getElementById('tab-line');
let curTab    = 'squad';

function moveTabLine(el) {
  const pr = document.querySelector('.tabs').getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  tabLine.style.left  = (r.left - pr.left) + 'px';
  tabLine.style.width = r.width + 'px';
}
tabEls.forEach(tab => {
  tab.addEventListener('click', () => {
    tabEls.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    curTab = tab.dataset.tab;
    moveTabLine(tab);
    renderTab(curTab);
  });
});
setTimeout(() => moveTabLine(document.querySelector('.tab.active')), 50);

// ── RENDER ───────────────────────────────────────
function renderTab(tab) {
  const c = document.getElementById('tab-content');
  c.scrollTop = 0;
  c.classList.remove('fade-in'); void c.offsetWidth; c.classList.add('fade-in');
  if (tab === 'squad') renderSquad();
  else                  renderRecent();
}

function emptyHtml(icon, title, sub) {
  return `<div class="empty-tab"><div class="ei">${icon}</div><h3>${title}</h3><p>${sub}</p></div>`;
}

// ── KADRO ─────────────────────────────────────────
function renderSquad() {
  const c      = document.getElementById('tab-content');
  const squad  = team.squad   || [];
  const coach  = team.coach;
  const injured= team.injured || [];

  const posOrder = ['GK', 'DEF', 'MID', 'FWD'];
  const posLabel = { GK:'Kaleci', DEF:'Defans', MID:'Orta Saha', FWD:'Forvet' };
  const posClass = { GK:'pos-gk', DEF:'pos-def', MID:'pos-mid', FWD:'pos-fwd' };

  let html = '';

  // Teknik Direktör
  if (coach) {
    const initials = coach.name.split(' ').filter((_, i, a) => i === 0 || i === a.length-1).map(w => w[0]).join('').toUpperCase();
    html += `<div class="sec-title">Teknik Direktör</div>
    <div class="coach-card">
      <div class="coach-av">${initials}</div>
      <div>
        <div class="coach-name">${coach.name}</div>
        <div class="coach-meta">${coach.nat} · ${coach.since}'dan beri</div>
        <div class="coach-badge">${coach.formation}</div>
      </div>
    </div>`;
  }

  // Kadro gruplu
  if (squad.length) {
    posOrder.forEach(pos => {
      const group = squad.filter(p => p.pos === pos);
      if (!group.length) return;
      html += `<div class="sec-title">${posLabel[pos]}</div>
      <div class="pl-list">
        ${group.map(p => `<div class="pl-row">
          <div class="pl-num">${p.num}</div>
          <div class="pl-name">${p.name}</div>
          <div class="pl-pos ${posClass[p.pos]||''}">${p.pos}</div>
        </div>`).join('')}
      </div>`;
    });
  } else {
    html += emptyHtml('👥', 'Kadro Bilgisi Yok', 'Bu takım için oyuncu listesi henüz eklenmemiş.');
  }

  // Oynayamayacaklar
  html += `<div class="sec-title">Oynayamayacaklar</div>`;
  if (!injured.length) {
    html += `<div class="no-inj">Sakatı veya cezalısı bulunmuyor.</div>`;
  } else {
    html += injured.map(p => `<div class="inj-card">
      <div style="flex:1">
        <div class="inj-name">${p.name}</div>
        <div class="inj-reason">${p.reason}</div>
        <div class="inj-until">Tahmini dönüş: ${p.until}</div>
      </div>
      <div class="inj-num">#${p.num}</div>
    </div>`).join('');
  }

  html += '<div style="height:24px"></div>';
  c.innerHTML = html;
}

// ── SON MAÇLAR ────────────────────────────────────
function renderRecent() {
  const c   = document.getElementById('tab-content');
  const ids = team.recentMatchIds || [];
  const matches = ids.map(id => MATCHES.getMatch(id)).filter(Boolean);

  if (!matches.length) {
    c.innerHTML = emptyHtml('📅', 'Son Maç Yok', 'Bu takımın son maçları henüz eklenmemiş.');
    return;
  }

  let html = '<div class="sec-title">Son Maçlar</div>';
  matches.forEach(m => {
    const isHome = m.home.id === teamId;
    const myGoals   = isHome ? m.score.home : m.score.away;
    const oppGoals  = isHome ? m.score.away : m.score.home;
    const opponent  = isHome ? m.away.name  : m.home.name;
    const hasScore  = m.score.home !== null;
    let result = 'd', resultLabel = 'B';
    if (hasScore) {
      if (myGoals > oppGoals)       { result = 'w'; resultLabel = 'G'; }
      else if (myGoals < oppGoals)  { result = 'l'; resultLabel = 'M'; }
    }
    const scoreText = hasScore ? `${myGoals} - ${oppGoals}` : 'vs';
    const locationLabel = isHome ? 'İç saha' : 'Deplasman';

    html += `<div class="recent-match" data-mid="${m.id}">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;width:28px">
        ${buildLogo(isHome ? m.away.id : m.home.id, 'xs')}
      </div>
      <div class="rm-teams">
        <div style="font-weight:600;font-size:13px">${team.name} vs ${opponent}</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px">${m.leagueName} · ${locationLabel} · ${m.date}</div>
      </div>
      <div class="rm-score">${scoreText}</div>
      ${hasScore ? `<div class="rm-result ${result}">${resultLabel}</div>` : ''}
    </div>`;
  });

  html += '<div style="height:24px"></div>';
  c.innerHTML = html;

  c.querySelectorAll('.recent-match').forEach(row => {
    row.addEventListener('click', () => goTo(`match.html?id=${row.dataset.mid}&from=team.html?id=${teamId}`));
  });
}

renderTab('squad');
