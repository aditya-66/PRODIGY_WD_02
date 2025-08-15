    // --- Stopwatch State ---
    let running = false;
    let startTime = 0;      // performance.now() reference when started
    let elapsed = 0;        // accumulated ms when paused
    let rafId = null;       // requestAnimationFrame id

    let lastLapElapsed = 0; // total elapsed at last lap
    const laps = [];        // { index, lapMs, totalMs }

    // --- DOM Elements ---
    const timeEl = document.getElementById('time');
    const startStopBtn = document.getElementById('startStop');
    const lapBtn = document.getElementById('lap');
    const resetBtn = document.getElementById('reset');
    const lapsBody = document.getElementById('lapsBody');
    const clearLapsBtn = document.getElementById('clearLaps');
    const exportCsvBtn = document.getElementById('exportCsv');

    // --- Utilities ---
    function formatTime(ms) {
      const totalMs = Math.max(0, Math.floor(ms));
      const hours = Math.floor(totalMs / 3600000);
      const minutes = Math.floor((totalMs % 3600000) / 60000);
      const seconds = Math.floor((totalMs % 60000) / 1000);
      const centis = Math.floor((totalMs % 1000) / 10);
      const h = String(hours).padStart(2, '0');
      const m = String(minutes).padStart(2, '0');
      const s = String(seconds).padStart(2, '0');
      const c = String(centis).padStart(2, '0');
      return `${h}:${m}:${s}.${c}`;
    }

    function nowElapsed() {
      return running ? (performance.now() - startTime) : elapsed;
    }

    function renderTime() {
      timeEl.textContent = formatTime(nowElapsed());
    }

    function tick() {
      renderTime();
      if (running) rafId = requestAnimationFrame(tick);
    }

    function setButtons() {
      startStopBtn.textContent = running ? 'Stop' : 'Start';
      startStopBtn.setAttribute('aria-pressed', String(running));
      lapBtn.disabled = !running;
      const hasHistory = elapsed > 0 || laps.length > 0 || running;
      resetBtn.disabled = running || !hasHistory || elapsed === 0 && laps.length === 0;
      clearLapsBtn.disabled = laps.length === 0;
      exportCsvBtn.disabled = laps.length === 0;
    }

    function renderLaps() {
      if (laps.length === 0) {
        lapsBody.innerHTML = '<tr><td colspan="3" style="color: var(--muted);">No laps yet.</td></tr>';
        return;
      }
      const rows = laps.map(l => `
        <tr>
          <td>${l.index}</td>
          <td>${formatTime(l.lapMs)}</td>
          <td>${formatTime(l.totalMs)}</td>
        </tr>
      `).join('');
      lapsBody.innerHTML = rows;
    }

    // --- Actions ---
    function start() {
      if (running) return;
      running = true;
      startTime = performance.now() - elapsed; // resume from paused elapsed
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
      setButtons();
    }

    function stop() {
      if (!running) return;
      running = false;
      elapsed = performance.now() - startTime; // freeze elapsed
      cancelAnimationFrame(rafId);
      renderTime();
      setButtons();
    }

    function reset() {
      running = false;
      cancelAnimationFrame(rafId);
      elapsed = 0;
      startTime = 0;
      lastLapElapsed = 0;
      laps.splice(0, laps.length);
      renderTime();
      renderLaps();
      setButtons();
    }

    function addLap() {
      if (!running) return;
      const total = nowElapsed();
      const lapMs = total - lastLapElapsed;
      lastLapElapsed = total;
      laps.unshift({ // newest on top
        index: laps.length + 1,
        lapMs,
        totalMs: total,
      });
      renderLaps();
      setButtons();
    }

    function exportCSV() {
      if (laps.length === 0) return;
      const header = 'Lap #,Lap Time,Total Time\n';
      const body = laps.map(l => `${l.index},${formatTime(l.lapMs)},${formatTime(l.totalMs)}`).join('\n');
      const blob = new Blob([header + body], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'laps.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function clearLaps() {
      laps.splice(0, laps.length);
      renderLaps();
      setButtons();
    }

    // --- Event Listeners ---
    startStopBtn.addEventListener('click', () => running ? stop() : start());
    lapBtn.addEventListener('click', addLap);
    resetBtn.addEventListener('click', reset);
    clearLapsBtn.addEventListener('click', clearLaps);
    exportCsvBtn.addEventListener('click', exportCSV);

    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return; // ignore typing in inputs
      if (e.code === 'Space') { e.preventDefault(); running ? stop() : start(); }
      else if (e.key.toLowerCase() === 'l') { e.preventDefault(); addLap(); }
      else if (e.key.toLowerCase() === 'r') { e.preventDefault(); reset(); }
    });

    // --- Init ---
    renderTime();
    renderLaps();
    setButtons();
