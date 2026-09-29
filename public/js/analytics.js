const esc = (value) => { const node = document.createElement('span'); node.textContent = value ?? ''; return node.innerHTML; };
fetch('/api/analytics').then((response) => { if (!response.ok) throw new Error('Analytics unavailable'); return response.json(); }).then((data) => {
  const bars = document.getElementById('ewrap-analytics');
  const reports = data.reports || [];
  if (bars) {
    if (!reports.length) bars.textContent = 'No reports have been submitted yet.';
    else {
      const max = Math.max(...reports.map((row) => Number(row.count)), 1);
      bars.innerHTML = reports.map((row) => `<div class="ewrap-bar"><strong>${esc(row.itemType)}</strong><div class="ewrap-bar-track"><div class="ewrap-bar-fill" style="width:${Math.max(4, 100 * Number(row.count) / max)}%"></div></div><span>${Number(row.count)}</span></div>`).join('');
    }
  }
  const monthly = document.getElementById('ewrap-monthly');
  if (monthly) monthly.innerHTML = data.monthly.length ? data.monthly.map((row) => `<div class="ewrap-month-card"><strong>${esc(row.actions)}</strong><span>${esc(row.month)}</span></div>`).join('') : '<p class="ewrap-empty">No recycling activity has been logged yet.</p>';
}).catch(() => { const bars = document.getElementById('ewrap-analytics'); if (bars) bars.textContent = 'Analytics could not be loaded.'; const monthly = document.getElementById('ewrap-monthly'); if (monthly) monthly.textContent = ''; });
