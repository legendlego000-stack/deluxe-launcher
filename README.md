# Deluxe Launcher website, updates and community chat

`index.html` is a standalone GitHub Pages landing page with an update download panel, an optional online counter, and a community chat. It uses local HTML/CSS/JavaScript and does not contain the Discord webhook.

## Configure

1. Copy `index.html` and `update-manifest.json` to the root of the GitHub Pages repository.
2. In `index.html`, set `COMMUNITY_API_BASE` to the public HTTPS URL for your Cloudflare Worker. The online count is fetched once at page load. Community chat polling starts only after the visitor presses **Открыть чат**; pressing **Закрыть** stops polling. A public chat post is forwarded by the Worker to the Discord webhook stored in a Cloudflare secret.
3. In `update-manifest.json`, set a version like `1.16.6`, an HTTPS URL to a published installer, a safe filename, a SHA-256 checksum and release notes. A blank URL or checksum is a placeholder—not a production release.
4. Commit/push the site. Configure the same `update-manifest.json` URL once in Deluxe Launcher → Settings → Update manifest. Keep the manifest URL stable and edit its contents for later releases; the launcher compares versions and download URLs.

## Using a Google Drive download URL

The website converts common Google Drive share URLs (`/file/d/FILE_ID/view` or `?id=FILE_ID`) into an `uc?export=download&id=...` URL. For large files, Google Drive can still show a confirmation page; a GitHub Release asset is more reliable for direct downloads. The update manifest should point to the final HTTPS installer URL, not to a web page that displays a file preview.

## Security and privacy

Never put a Discord webhook URL, Cloudflare API token, D1 credentials or another secret in this HTML or in any public JavaScript. If a webhook was pasted publicly, delete it and create a new one. Configure the replacement only with `npx wrangler secret put DISCORD_WEBHOOK_URL` in the Worker project. The chat is public and stores text plus display name in D1 for 30 days; anonymous mode hides the chosen nickname in the UI but does not hide the message from the server or Discord.

See `../presence/README.md` for deploying the Worker, database schema, rate limits and the update manifest workflow.


## Connect the release manifest to your existing larger landing page

The supplied site can also be added to an existing page that already has `downloadBtn` and `downloadBtnBottom`. Copy `release-manifest-snippet.js` beside that page and `update-manifest.json`. In the existing page's inline JavaScript, remove these two fixed-URL lines so their old placeholder click handlers are not attached:

```js
connectLink("downloadBtn", DOWNLOAD_URL, "DOWNLOAD_URL");
connectLink("downloadBtnBottom", DOWNLOAD_URL, "DOWNLOAD_URL");
```

Then add this before `</body>` (after the existing page script):

```html
<script src="./release-manifest-snippet.js" defer></script>
```

This script reads the manifest on the page, fills both download buttons with the current direct HTTPS URL, converts common Google Drive share links, and refuses to enable the buttons until a valid SHA-256 is present. It does not upload or contain a webhook. `releaseVersion` and `releaseNotes` are optional IDs; if they exist, their text is updated too.
