import QRCode from 'qrcode';

// Renders an inline <svg> (no XML prolog) sized to fill its container via
// CSS, so the printed invoice controls the physical QR size (mm), not the
// number of modules.
export async function renderQrSvg(text: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  const markup = svg.slice(svg.indexOf('<svg'));
  return markup
    .replace(/width="\d+(\.\d+)?"/, 'width="100%"')
    .replace(/height="\d+(\.\d+)?"/, 'height="100%"');
}
