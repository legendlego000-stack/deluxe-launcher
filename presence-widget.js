/*
 * Public website widget. No API key or secret belongs in this file.
 * Replace PRESENCE_API_BASE with the public HTTPS base URL of your Worker.
 */
(() => {
  'use strict';
  const PRESENCE_API_BASE = 'https://REPLACE-WITH-YOUR-WORKER.workers.dev';
  const POLL_INTERVAL_MS = 30_000;
  const REQUEST_TIMEOUT_MS = 4_000;
  if (window.__deluxePresenceWidgetLoaded) return;
  window.__deluxePresenceWidgetLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    .deluxe-online-widget{display:inline-flex;align-items:center;gap:10px;margin-top:14px;padding:10px 14px;border:1px solid rgba(130,246,200,.24);border-radius:999px;background:linear-gradient(120deg,rgba(9,18,32,.78),rgba(19,12,39,.82));box-shadow:0 0 24px rgba(130,246,200,.06),inset 0 1px rgba(255,255,255,.06);color:#eef9ff;font:700 12px/1.3 Segoe UI,system-ui,sans-serif;backdrop-filter:blur(12px)}
    .deluxe-online-dot{width:8px;height:8px;flex:0 0 auto;border-radius:50%;background:#82f6c8;box-shadow:0 0 11px rgba(130,246,200,.75)}
    .deluxe-online-widget[data-state="error"] .deluxe-online-dot{background:#b8c0de;box-shadow:none}
    .deluxe-online-widget strong{font-size:14px;color:#fff;font-variant-numeric:tabular-nums}.deluxe-online-caption{color:#b8c0de;font-weight:600}
    @media(prefers-reduced-motion:no-preference){.deluxe-online-dot{animation:deluxe-online-pulse 1.8s ease-in-out infinite}@keyframes deluxe-online-pulse{50%{opacity:.55;transform:scale(.82)}}}
  `;
  document.head.appendChild(style);

  const host = document.createElement('div');
  host.className = 'deluxe-online-widget';
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  host.innerHTML = '<span class="deluxe-online-dot" aria-hidden="true"></span><span class="deluxe-online-caption">Сейчас в игре</span><strong>—</strong>';
  const count = host.querySelector('strong');
  const caption = host.querySelector('.deluxe-online-caption');
  const hero = document.querySelector('.trust-row') || document.querySelector('.hero-content') || document.querySelector('main');
  if (!hero) return;
  hero.appendChild(host);

  async function updateCount() {
    if (!/^https:\/\//i.test(PRESENCE_API_BASE) || /REPLACE-WITH-YOUR-WORKER/i.test(PRESENCE_API_BASE)) {
      host.dataset.state = 'error';
      count.textContent = '—';
      caption.textContent = 'Онлайн API не настроен';
      host.title = 'Открой website/presence-widget.js и укажи URL Worker';
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${PRESENCE_API_BASE.replace(/\/$/, '')}/online`, { method: 'GET', cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Number.isInteger(data.count) || data.count < 0) throw new Error('invalid response');
      count.textContent = String(data.count);
      caption.textContent = 'Сейчас в игре';
      host.dataset.state = 'online';
      host.title = `Обновлено ${new Date((data.updatedAt || Math.floor(Date.now()/1000))*1000).toLocaleTimeString()}; устаревшие сессии истекают через 5 минут`;
    } catch {
      host.dataset.state = 'error';
      // Never leave an old count visible after a failed poll.
      count.textContent = '—';
      caption.textContent = 'Онлайн временно недоступен';
      host.title = 'Не удалось обновить онлайн. Попробуем ещё раз автоматически.';
    } finally { clearTimeout(timer); }
  }
  updateCount();
  setInterval(() => { if (!document.hidden) updateCount(); }, POLL_INTERVAL_MS);
})();
