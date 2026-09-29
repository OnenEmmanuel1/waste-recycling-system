const search = document.getElementById('centerSearch');
if (search) search.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll('.ewrap-center-entry').forEach((entry) => { const show = entry.querySelector('[data-search]').dataset.search.includes(query); entry.hidden = !show; if (show) visible += 1; });
  const count = document.getElementById('centerResultCount'); if (count) count.textContent = `${visible} ${visible === 1 ? 'location' : 'locations'}`;
});
