import { loadEmbeddedFonts } from './fonts';

export function buildStyles(): string {
  const { regular, bold } = loadEmbeddedFonts();
  return `
    @font-face {
      font-family: 'Noto Sans';
      src: url(data:font/ttf;base64,${regular}) format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Noto Sans';
      src: url(data:font/ttf;base64,${bold}) format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    * { box-sizing: border-box; }
    html, body {
      hyphens: none;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    body {
      font-family: 'Noto Sans', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #111827;
      margin: 0;
      padding: 32px 40px;
    }
    .no-break {
      white-space: nowrap;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .block-title {
      font-weight: 700;
      margin-bottom: 4px;
    }
    .dates {
      text-align: right;
    }
    .status {
      font-weight: 700;
      margin-top: 4px;
    }
    .title {
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      margin: 24px 0;
    }
    table.line-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.line-items th,
    table.line-items td {
      border-bottom: 1px solid #d1d5db;
      padding: 6px 8px;
      text-align: right;
    }
    table.line-items th:first-child,
    table.line-items td:first-child {
      text-align: left;
    }
    .amount-words {
      font-style: italic;
      margin: 16px 0;
    }
    .totals {
      margin-left: auto;
      width: 320px;
      margin-bottom: 16px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    .totals-row.total {
      border-top: 1px solid #111827;
      font-weight: 700;
    }
    .totals-row.due {
      font-weight: 700;
    }
    .exemption {
      margin-bottom: 16px;
    }
    .issuer-block {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px 24px;
      border-top: 1px solid #d1d5db;
      padding-top: 12px;
      margin-top: 24px;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
    }
  `;
}
