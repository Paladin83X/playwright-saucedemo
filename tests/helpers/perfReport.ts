import type { TestInfo } from '@playwright/test';

export type PerfStep = { action: string; duration: number };

export function renderPerfHtml(steps: PerfStep[], meta?: Record<string, string>) {
  const rows = steps
    .map(s => `<tr><td>${escapeHtml(s.action)}</td><td style="text-align:right">${s.duration} ms</td></tr>`)
    .join('');
  const metaRows = meta
    ? Object.entries(meta)
        .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
        .join('')
    : '';
  const total = steps.reduce((acc, s) => acc + s.duration, 0);

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Performance Report</title>
<style>
  body{font:14px/1.4 system-ui,Segoe UI,Roboto,Helvetica,Arial}
  h1{margin:0 0 12px 0}
  table{border-collapse:collapse;width:100%;max-width:860px}
  th,td{border:1px solid #ddd;padding:8px}
  th{text-align:left;background:#f7f7f7}
  tfoot td{font-weight:600;background:#fafafa}
  .meta{margin:12px 0 20px 0;max-width:860px}
</style>
</head><body>
  <h1>Performance Report</h1>
  ${meta ? `<table class="meta"><tbody>${metaRows}</tbody></table>` : ''}
  <table>
    <thead><tr><th>Action</th><th style="text-align:right">Duration</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td>Total</td><td style="text-align:right">${total} ms</td></tr></tfoot>
  </table>
</body></html>`;
}

export async function saveAndAttachPerfHtml(testInfo: TestInfo, html: string, filename = 'performance-report.html') {
  const filePath = testInfo.outputPath(filename);
  await testInfo.attach(filename, { body: Buffer.from(html), contentType: 'text/html' });
  // optional zusätzlich als Datei ablegen:
  await testInfo.attach('performance.json', {
    body: Buffer.from(JSON.stringify({ steps: testInfo.annotations, createdAt: new Date().toISOString() })),
    contentType: 'application/json'
  });
  return filePath;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
}