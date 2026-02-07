import type { SessionResult } from '../types';

const BADGE_WIDTH = 600;
const BADGE_HEIGHT = 340;

const GRADIENTS: Record<string, [string, string]> = {
  amber: ['#1a0f00', '#3d2200'],
  rose: ['#1a0008', '#3d0020'],
  teal: ['#001a1a', '#003d3d'],
  default: ['#0a1628', '#162a3e'],
};

export async function generateBadgeBlob(
  result: SessionResult,
  gradient?: string
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = BADGE_WIDTH;
  canvas.height = BADGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const [c1, c2] = GRADIENTS[gradient ?? 'default'] ?? GRADIENTS.default;
  const bg = ctx.createLinearGradient(0, 0, BADGE_WIDTH, BADGE_HEIGHT);
  bg.addColorStop(0, c1);
  bg.addColorStop(1, c2);
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, BADGE_WIDTH, BADGE_HEIGHT, 24);
  ctx.fill();

  ctx.strokeStyle = 'rgba(212, 165, 116, 0.25)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 0.75, 0.75, BADGE_WIDTH - 1.5, BADGE_HEIGHT - 1.5, 24);
  ctx.stroke();

  drawDecorativeDots(ctx);

  ctx.fillStyle = '#d4a574';
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'center';
  ctx.fillText('NAAM JAPA', BADGE_WIDTH / 2, 50);

  ctx.fillStyle = '#f0f4f8';
  ctx.font = '600 28px "Playfair Display", Georgia, serif';
  ctx.letterSpacing = '0px';
  ctx.fillText(result.chantName, BADGE_WIDTH / 2, 110);

  const countText = result.mode === 'rounds'
    ? `${Math.ceil(result.completedCount / 108)} Rounds`
    : result.completedCount.toLocaleString();

  ctx.fillStyle = '#d4a574';
  ctx.font = '700 64px "Playfair Display", Georgia, serif';
  ctx.fillText(countText, BADGE_WIDTH / 2, 200);

  ctx.fillStyle = 'rgba(212, 165, 116, 0.6)';
  ctx.font = '400 14px Inter, system-ui, sans-serif';
  const label = result.wasCompleted ? 'Repetitions Completed' : 'Repetitions Practiced';
  ctx.fillText(label, BADGE_WIDTH / 2, 235);

  const duration = formatDuration(result.durationMs);
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  ctx.fillStyle = 'rgba(212, 165, 116, 0.4)';
  ctx.font = '400 12px Inter, system-ui, sans-serif';
  ctx.fillText(`${duration}  |  ${today}`, BADGE_WIDTH / 2, 310);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDecorativeDots(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(212, 165, 116, 0.08)';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * BADGE_WIDTH;
    const y = Math.random() * BADGE_HEIGHT;
    const r = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export async function shareResult(result: SessionResult, gradient?: string) {
  const blob = await generateBadgeBlob(result, gradient);

  const shareText = [
    `${result.chantName} - ${result.completedCount.toLocaleString()} repetitions`,
    result.wasCompleted ? 'Session completed' : 'Practice session',
    'via Naam Japa',
  ].join('\n');

  if (navigator.share) {
    const shareData: ShareData = { text: shareText };

    if (blob) {
      try {
        const file = new File([blob], 'naam-japa-session.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          shareData.files = [file];
        }
      } catch {}
    }

    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
    }
  }

  if (blob) {
    return await downloadBadge(blob);
  }

  try {
    await navigator.clipboard.writeText(shareText);
    return 'copied';
  } catch {
    return 'failed';
  }
}

async function downloadBadge(blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'naam-japa-session.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return 'downloaded';
}
