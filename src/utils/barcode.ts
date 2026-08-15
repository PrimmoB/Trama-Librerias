// Utility for audio feedback and barcode rendering

/**
 * Plays a pleasant crisp scanner beep using Web Audio API
 */
export function playScanBeep(success = true) {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    if (success) {
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Ignore audio errors if context blocked by browser policy
  }
}

/**
 * Simple SVG Barcode generator for ISBN / EAN / Code128 representation
 */
export function generateBarcodeSVGString(text: string): string {
  const clean = text.replace(/[^0-9A-Z]/gi, "") || "9789560000000";
  // Generate a deterministic visual bar pattern based on hash/chars
  const bars: boolean[] = [true, false, true]; // Start guard
  
  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    // Convert char to 5-bit binary pattern
    for (let b = 0; b < 5; b++) {
      bars.push(((charCode >> b) & 1) === 1);
    }
    bars.push(i % 2 === 0);
  }
  bars.push(true, false, true); // End guard

  const barWidth = 2;
  const height = 40;
  const totalWidth = bars.length * barWidth;

  let rects = "";
  let x = 0;
  for (let i = 0; i < bars.length; i++) {
    if (bars[i]) {
      rects += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="#000000" />`;
    }
    x += barWidth;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height + 15}" width="100%" height="100%">
    <rect width="${totalWidth}" height="${height + 15}" fill="#ffffff" />
    ${rects}
    <text x="${totalWidth / 2}" y="${height + 11}" font-family="monospace, sans-serif" font-size="9" font-weight="bold" text-anchor="middle" fill="#111827">${clean}</text>
  </svg>`;
}
