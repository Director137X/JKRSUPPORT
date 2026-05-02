import fs from 'node:fs';
import path from 'node:path';

export type ForemanModule = {
  module_id: string;
  module_number: number;
  slug: string;
  file: string;
  title: string;
  subtitle?: string;
  headings: string[];
  callouts: { label: string; text: string }[];
  word_tracks: { label?: string; text: string }[];
  dialogues: { label?: string; lines: { speaker: string; text: string }[] }[];
  steps: { num?: string; title?: string; text: string }[];
  practices: { label?: string; text: string }[];
  raw_text: string;
};

export const MODULE_FILES: { id: string; n: number; file: string; title: string; description: string }[] = [
  { id: '01-kpis',       n: 1, file: '01-kpis.html',       title: 'Key Performance Indicators',       description: 'TOD, DMC, ODM, UBC, SFC, SIGNED, SOLD — the metrics that drive correction.' },
  { id: '02-roadmap',    n: 2, file: '02-roadmap.html',    title: 'The Roadmap (V3)',                  description: 'Phased execution from approach through close.' },
  { id: '03-discovery',  n: 3, file: '03-discovery.html',  title: 'Discovery',                         description: 'Diagnose before you prescribe — questions that earn the right to pitch.' },
  { id: '04-advanced',   n: 4, file: '04-advanced.html',   title: 'Advanced Training',                 description: 'Drills, frameworks, and field protocols for the seasoned operator.' },
  { id: '05-nonverbals', n: 5, file: '05-nonverbals.html', title: 'Nonverbals',                        description: 'Posture, pace, tonality — rapport before words.' },
  { id: '06-humanizing', n: 6, file: '06-humanizing.html', title: 'Humanizing',                        description: 'Become a person, not a pitch — earn the room.' },
  { id: '07-anchors',    n: 7, file: '07-anchors.html',    title: 'Anchors',                           description: 'Price psychology — the first number sets the range.' },
  { id: '08-analogies',  n: 8, file: '08-analogies.html',  title: 'Analogies',                         description: 'Pattern-recognition tools that bypass cognitive load.' },
];

let CACHE: ForemanModule[] | null = null;
let CACHE_AT = 0;
const TTL_MS = 5 * 60 * 1000;

const TRAINING_DIR = path.join(process.cwd(), 'public', 'training');

export function getForemanCorpus(): ForemanModule[] {
  const now = Date.now();
  if (CACHE && now - CACHE_AT < TTL_MS) return CACHE;
  CACHE = MODULE_FILES.map(parseFile);
  CACHE_AT = now;
  return CACHE;
}

function parseFile(meta: (typeof MODULE_FILES)[number]): ForemanModule {
  const filePath = path.join(TRAINING_DIR, meta.file);
  const html = fs.readFileSync(filePath, 'utf8');
  return parseHtml(html, meta);
}

function parseHtml(html: string, meta: (typeof MODULE_FILES)[number]): ForemanModule {
  const body = extractBetween(html, '<body', '</body>') ?? html;

  const titleMatch = body.match(/<div class="pg-title">([\s\S]*?)<\/div>/i);
  const subtitleMatch = body.match(/<div class="pg-sub">([\s\S]*?)<\/div>/i);

  const headings: string[] = [];
  for (const m of body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)) {
    headings.push(stripTagsDecode(m[1]));
  }
  for (const m of body.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)) {
    headings.push(stripTagsDecode(m[1]));
  }

  const callouts: { label: string; text: string }[] = [];
  for (const block of matchBlocks(body, 'callout')) {
    const label = stripTagsDecode(extractClass(block, 'callout-label') ?? '');
    const text = stripTagsDecode(stripClass(block, 'callout-label')).trim();
    if (text) callouts.push({ label, text });
  }

  const word_tracks: { label?: string; text: string }[] = [];
  for (const block of matchBlocks(body, 'word-track')) {
    const label = stripTagsDecode(extractClass(block, 'wt-label') ?? '') || undefined;
    const text = stripTagsDecode(stripClass(block, 'wt-label')).trim();
    if (text) word_tracks.push({ label, text });
  }

  const dialogues: { label?: string; lines: { speaker: string; text: string }[] }[] = [];
  for (const block of matchBlocks(body, 'dialogue')) {
    const label = stripTagsDecode(extractClass(block, 'd-label') ?? '') || undefined;
    const lines: { speaker: string; text: string }[] = [];
    for (const row of block.matchAll(/<div class="dl[^"]*">([\s\S]*?)<\/div>\s*<\/div>/gi)) {
      const speaker = stripTagsDecode(extractClass(row[0], 'dl-s') ?? '');
      const text = stripTagsDecode(extractClass(row[0], 'dl-t') ?? '');
      if (speaker || text) lines.push({ speaker, text });
    }
    if (lines.length === 0) {
      for (const row of block.matchAll(/<div class="dl"[^>]*>([\s\S]*?)<\/div>/gi)) {
        const inner = row[1];
        const sMatch = inner.match(/<div class="dl-s[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        const tMatch = inner.match(/<div class="dl-t[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (sMatch || tMatch) {
          lines.push({
            speaker: stripTagsDecode(sMatch?.[1] ?? ''),
            text: stripTagsDecode(tMatch?.[1] ?? ''),
          });
        }
      }
    }
    if (lines.length) dialogues.push({ label, lines });
  }

  const steps: { num?: string; title?: string; text: string }[] = [];
  for (const block of matchBlocks(body, 'step')) {
    const num = stripTagsDecode(extractClass(block, 'step-num') ?? '') || undefined;
    const title = stripTagsDecode(extractClass(block, 'step-title') ?? '') || undefined;
    const text = stripTagsDecode(stripClass(stripClass(block, 'step-num'), 'step-title')).trim();
    if (text || title) steps.push({ num, title, text });
  }

  const practices: { label?: string; text: string }[] = [];
  for (const block of matchBlocks(body, 'practice')) {
    const label = stripTagsDecode(extractClass(block, 'p-label') ?? '') || undefined;
    const text = stripTagsDecode(stripClass(block, 'p-label')).trim();
    if (text) practices.push({ label, text });
  }

  const raw_text = stripTagsDecode(body).replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return {
    module_id: meta.id,
    module_number: meta.n,
    slug: meta.id,
    file: meta.file,
    title: titleMatch ? stripTagsDecode(titleMatch[1]) : meta.title,
    subtitle: subtitleMatch ? stripTagsDecode(subtitleMatch[1]) : undefined,
    headings,
    callouts,
    word_tracks,
    dialogues,
    steps,
    practices,
    raw_text,
  };
}

function extractBetween(s: string, openTag: string, closeTag: string): string | null {
  const start = s.indexOf(openTag);
  if (start === -1) return null;
  const open = s.indexOf('>', start);
  if (open === -1) return null;
  const end = s.indexOf(closeTag, open);
  if (end === -1) return null;
  return s.slice(open + 1, end);
}

function matchBlocks(html: string, className: string): string[] {
  const blocks: string[] = [];
  const open = new RegExp(`<div\\s+class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*>`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = open.exec(html)) !== null) {
    const startIdx = m.index;
    const tagEnd = open.lastIndex;
    let depth = 1;
    let i = tagEnd;
    while (i < html.length && depth > 0) {
      const nextOpen = html.indexOf('<div', i);
      const nextClose = html.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        i = nextClose + 6;
      }
    }
    blocks.push(html.slice(startIdx, i));
  }
  return blocks;
}

function extractClass(html: string, className: string): string | null {
  const re = new RegExp(
    `<(?:div|span|p)\\s+class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*>([\\s\\S]*?)<\\/(?:div|span|p)>`,
    'i',
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

function stripClass(html: string, className: string): string {
  const re = new RegExp(
    `<(?:div|span|p)\\s+class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*>[\\s\\S]*?<\\/(?:div|span|p)>`,
    'gi',
  );
  return html.replace(re, '');
}

function stripTagsDecode(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&middot;/g, '·')
    .replace(/&hellip;/g, '…')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8592;/g, '←')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));
}

export function corpusForPrompt(): string {
  const modules = getForemanCorpus();
  const parts = modules.map((m) => {
    const sections: string[] = [];
    sections.push(`================ MODULE ${m.module_number} — ${m.title} ================`);
    if (m.subtitle) sections.push(m.subtitle);
    sections.push('');
    sections.push(`HEADINGS:\n${m.headings.map((h) => `  • ${h}`).join('\n')}`);
    sections.push('');
    if (m.callouts.length) {
      sections.push('CALLOUTS:');
      for (const c of m.callouts) sections.push(`  [${c.label}] ${c.text}`);
      sections.push('');
    }
    if (m.word_tracks.length) {
      sections.push('WORD TRACKS:');
      for (const w of m.word_tracks) sections.push(`  ${w.label ? `[${w.label}] ` : ''}${w.text}`);
      sections.push('');
    }
    if (m.dialogues.length) {
      sections.push('DIALOGUES:');
      for (const d of m.dialogues) {
        if (d.label) sections.push(`  [${d.label}]`);
        for (const l of d.lines) sections.push(`    ${l.speaker}: ${l.text}`);
      }
      sections.push('');
    }
    if (m.steps.length) {
      sections.push('STEPS / DRILLS:');
      for (const s of m.steps) {
        sections.push(`  ${s.num ? `[${s.num}] ` : ''}${s.title ? s.title + ' — ' : ''}${s.text}`);
      }
      sections.push('');
    }
    if (m.practices.length) {
      sections.push('PRACTICE / HOMEWORK:');
      for (const p of m.practices) sections.push(`  ${p.label ? `[${p.label}] ` : ''}${p.text}`);
      sections.push('');
    }
    sections.push('FULL TEXT:');
    sections.push(m.raw_text);
    return sections.join('\n');
  });
  return parts.join('\n\n');
}
