/*
 * Optional glue for the user's existing Deluxe landing page.
 * Keep update-manifest.json beside index.html and this file.
 * This file intentionally contains no secrets or hard-coded installer URL.
 */
(async function connectReleaseManifest() {
  'use strict';
  const manifestUrl = new URL('./update-manifest.json', window.location.href).toString();
  const buttons = ['downloadBtn', 'downloadBtnBottom']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!buttons.length) return;

  const safeText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  function directDownloadUrl(raw) {
    const url = new URL(String(raw || ''));
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
      throw new Error('Ссылка на установщик должна быть HTTPS без логина/пароля/hash.');
    }
    if (url.hostname.toLowerCase() === 'drive.google.com') {
      const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
      if (id && /^[\w-]{10,}$/.test(id)) {
        return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
      }
    }
    return url.toString();
  }

  try {
    const response = await fetch(manifestUrl, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`Манифест вернул HTTP ${response.status}.`);
    const manifest = await response.json();
    if (!/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(String(manifest.version || ''))) {
      throw new Error('В update-manifest.json указан неверный номер версии.');
    }
    if (!manifest.sha256 || !/^[a-f0-9]{64}$/i.test(String(manifest.sha256))) {
      throw new Error('Добавь SHA-256 установщика в update-manifest.json.');
    }
    const downloadUrl = directDownloadUrl(manifest.url);
    const label = `↓ Скачать Deluxe Launcher ${manifest.version}`;
    for (const button of buttons) {
      button.href = downloadUrl;
      button.removeAttribute('aria-disabled');
      button.removeAttribute('disabled');
      button.target = '_self';
      button.rel = 'noopener noreferrer';
      button.setAttribute('download', String(manifest.filename || `Deluxe-Launcher-${manifest.version}.exe`).slice(0, 120));
      button.textContent = label;
      button.title = `Версия ${manifest.version}. SHA-256 опубликован в update-manifest.json.`;
    }
    safeText('releaseVersion', manifest.version);
    safeText('releaseNotes', String(manifest.notes || 'Доступно обновление.').slice(0, 2000));
  } catch (error) {
    for (const button of buttons) {
      button.href = '#download';
      button.setAttribute('aria-disabled', 'true');
      button.title = String(error?.message || 'Ссылка на обновление пока не настроена.');
    }
    safeText('releaseNotes', String(error?.message || 'Ссылка на обновление пока не настроена.'));
  }
})();
