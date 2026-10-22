(() => {
  let data, loading, failed = false;
  const content = document.querySelector('#content');
  const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = (en, he) => document.documentElement.lang === 'he' ? he : en;
  function draw() {
    if (!content.querySelector('#lookupForm')) return;
    let board = content.querySelector('#airportBoard');
    if (!board) {
      board = document.createElement('section');
      board.id = 'airportBoard';
      board.className = 'card';
      content.prepend(board);
    }
    const stale = data && Date.now() - Date.parse(data.updatedAt) > 90 * 60000;
    const title = text('Ben Gurion flight board · TLV', 'לוח טיסות נתב״ג · TLV');
    if (!data) {
      board.innerHTML = '<h2>' + title + '</h2><p role="status">' + (failed
        ? text('The flight board is not available yet. Try again later.', 'לוח הטיסות עדיין אינו זמין. נסו שוב מאוחר יותר.')
        : text('Loading flight board…', 'טוען לוח טיסות…')) + '</p>';
      return;
    }
    const labels = {Departed:['Departed','המריאה'],Arrived:['Arrived','נחתה'],Expected:['Expected','צפויה'],Delayed:['Delayed','באיחור'],Canceled:['Canceled','בוטלה'],Boarding:['Boarding','עלייה למטוס'],CheckIn:['Check-in','צ׳ק אין'],EnRoute:['En route','בדרך'],Unknown:['Unknown','לא ידוע']};
    const rows = data.flights.filter(f => f.direction === (board.dataset.direction || 'Departure'));
    board.innerHTML = '<div class="section-head"><h2>' + title + '</h2><button type="button" data-board-refresh>' + text('Refresh','רענון') + '</button></div>' +
      '<p class="muted">' + text('Updated','עודכן') + ': ' + h(new Intl.DateTimeFormat(document.documentElement.lang === 'he' ? 'he-IL' : 'en-GB', {dateStyle:'short',timeStyle:'short',timeZone:'Asia/Jerusalem'}).format(new Date(data.updatedAt))) +
      ' · ' + text('Israel time · refreshes hourly','שעון ישראל · מתעדכן מדי שעה') + '</p>' +
      (stale ? '<p role="status">' + text('Data is out of date. Check with the airline.', 'הנתונים אינם עדכניים. בדקו מול חברת התעופה.') + '</p>' : '') +
      '<div class="actions"><button type="button" data-board-direction="Departure" aria-pressed="' + ((board.dataset.direction || 'Departure') === 'Departure') + '">' + text('Departures','המראות') + '</button><button type="button" data-board-direction="Arrival" aria-pressed="' + (board.dataset.direction === 'Arrival') + '">' + text('Arrivals','נחיתות') + '</button></div>' +
      '<div style="overflow-x:auto"><table style="width:100%;text-align:start;border-collapse:collapse"><thead><tr>' +
      [text('Time','שעה'),text('Flight','טיסה'),text('Airline','חברה'),text('Destination / origin','יעד / מוצא'),text('Terminal','טרמינל'),text('Status','סטטוס')].map(s=>'<th style="padding:12px 8px">' + s + '</th>').join('') +
      '</tr></thead><tbody>' + rows.map(f=>'<tr>' + [f.time.slice(11,16),f.number,f.airline,f.airport,f.terminal,labels[f.status] ? text(...labels[f.status]) : f.status].map(v=>'<td style="padding:12px 8px;border-top:1px solid #ddd">' + h(v || '—') + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>' + (!rows.length ? '<p>' + text('No flights in this time window.','אין טיסות בטווח הזמן הזה.') + '</p>' : '') +
      '<p class="note">' + text('Source: AeroDataBox. Snapshot of current airport traffic; future trip details are separate. Confirm changes with your airline.', 'מקור: AeroDataBox. תמונת מצב של תנועת הטיסות כעת; פרטי הטיול העתידי מוצגים בנפרד. יש לאמת שינויים מול חברת התעופה.') + '</p>';
  }
  async function load() {
    if (loading) return loading;
    failed = false;
    loading = (async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/efratovv66-hub/roam-together/main/data/tlv-flights.json?t=' + Math.floor(Date.now()/60000), {cache:'no-store'});
        if (!response.ok) throw Error();
        const value = await response.json();
        if (!Array.isArray(value.flights) || !Number.isFinite(Date.parse(value.updatedAt))) throw Error();
        data = value;
      } catch { failed = true; }
      finally { loading = null; draw(); }
    })();
    return loading;
  }
  const observer = new MutationObserver(() => {
    if (!content.querySelector('#lookupForm') || content.querySelector('#airportBoard')) return;
    draw();
    if (!data && !failed) load();
  });
  observer.observe(content, {childList:true});
  content.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.boardDirection) {
      content.querySelector('#airportBoard').dataset.direction = button.dataset.boardDirection;
      draw();
    }
    if (button.hasAttribute('data-board-refresh')) load();
  });
  setInterval(() => { if (content.querySelector('#airportBoard')) load(); }, 300000);
  draw();
})();
