(() => {
  const element = document.getElementById('ewrap-map');
  if (!element || !window.L) return;
  const map = L.map(element, { scrollWheelZoom: false }).setView([4.95, 8.33], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  const escapeHtml = (value) => { const node = document.createElement('span'); node.textContent = value ?? ''; return node.innerHTML; };
  fetch('/api/centers').then((response) => { if (!response.ok) throw new Error('Map data unavailable'); return response.json(); }).then((centers) => {
    const points = [];
    centers.forEach((center) => {
      const point = [Number(center.latitude), Number(center.longitude)]; points.push(point);
      const direction = `https://www.openstreetmap.org/?mlat=${point[0]}&mlon=${point[1]}#map=16/${point[0]}/${point[1]}`;
      L.marker(point).addTo(map).bindPopup(`<strong>${escapeHtml(center.name)}</strong><br>${escapeHtml(center.address)}<br>${escapeHtml(center.certifiedStatus)}<br><a href="${direction}" target="_blank" rel="noopener">Open directions</a>`);
    });
    if (points.length) map.fitBounds(points, { padding: [28, 28], maxZoom: 14 });
    const nearest = document.getElementById('ewrap-nearest');
    if (!navigator.geolocation) { if (nearest) nearest.textContent = 'Your browser does not support location sharing.'; return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const here = [coords.latitude, coords.longitude];
      L.circleMarker(here, { radius: 9, color: '#bb533b', fillColor: '#e68870', fillOpacity: .9 }).addTo(map).bindPopup('Your approximate location');
      if (!centers.length) return;
      const distance = (a, b) => { const rad = (x) => x * Math.PI / 180; const dLat = rad(b[0] - a[0]); const dLon = rad(b[1] - a[1]); return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2)); };
      const closest = centers.map((center) => ({ center, km: distance(here, [Number(center.latitude), Number(center.longitude)]) })).sort((a, b) => a.km - b.km)[0];
      const nearestPoint = [Number(closest.center.latitude), Number(closest.center.longitude)];
      L.circleMarker(nearestPoint, { radius: 13, color: '#153e34', weight: 3, fillColor: '#9ed4b1', fillOpacity: .95 }).addTo(map).bindPopup(`Nearest listed point: <strong>${escapeHtml(closest.center.name)}</strong>`);
      if (nearest) nearest.innerHTML = `Nearest listed point: <strong>${escapeHtml(closest.center.name)}</strong> · about ${closest.km.toFixed(1)} km away.`;
      map.setView(here, Math.max(map.getZoom(), 13));
    }, () => { if (nearest) nearest.textContent = 'Location permission was not granted. Browse the directory or use a centre marker.'; }, { timeout: 7000, maximumAge: 300000 });
  }).catch(() => { const note = document.getElementById('ewrap-nearest'); if (note) note.textContent = 'Collection points could not be loaded. Please refresh the page.'; });
})();
