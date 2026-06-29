// Smart fix for double-encoded UTF-8 files
// Only fixes recognizable double-encoded sequences (Latin characters like ã, é, ç, etc.)
// while preserving already-correct UTF-8 sequences (like emojis).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');

// Double-encoded UTF-8 mapping
// When a UTF-8 character (2-byte) is read as Windows-1252 and re-encoded as UTF-8,
// each original byte becomes its own multi-byte sequence.
// Original UTF-8: C3 XX  (where XX is 80-BF for Latin chars like à, á, ã, ç, é, etc.)
// Read as Win-1252: C3 -> Ã (U+00C3), XX -> some char
// Re-encoded as UTF-8: C3 83 (Ã) + encoding of the Win-1252 char for XX
//
// For bytes 80-9F in Win-1252, these map to special characters (€, ‚, ƒ, etc.)
// which have different UTF-8 encodings than if they were Latin-1.
// For bytes A0-BF, Win-1252 = Latin-1, so they encode as C2 XX in UTF-8.

// Build replacement map: double-encoded sequence -> correct UTF-8 sequence
const replacements = {};

// C3 followed by A0-BF: in Win-1252/Latin-1, these are the same, so double encoding produces: C3 83 C2 XX
// Original: C3 XX -> char like à(C3 A0), á(C3 A1), â(C3 A2), ã(C3 A3), ç(C3 A7), é(C3 A9), etc.
for (let xx = 0xA0; xx <= 0xBF; xx++) {
  const doubleEncoded = Buffer.from([0xC3, 0x83, 0xC2, xx]);
  const correct = Buffer.from([0xC3, xx]);
  replacements[doubleEncoded.toString('hex')] = { search: doubleEncoded, replace: correct };
}

// C3 followed by 80-9F: these are special in Win-1252
// Win-1252 0x80-0x9F map to specific Unicode codepoints
const win1252Special = {
  0x80: 0x20AC, // €
  0x81: 0x0081, // control
  0x82: 0x201A, // ‚
  0x83: 0x0192, // ƒ
  0x84: 0x201E, // „
  0x85: 0x2026, // …
  0x86: 0x2020, // †
  0x87: 0x2021, // ‡
  0x88: 0x02C6, // ˆ
  0x89: 0x2030, // ‰
  0x8A: 0x0160, // Š
  0x8B: 0x2039, // ‹
  0x8C: 0x0152, // Œ
  0x8D: 0x008D, // control
  0x8E: 0x017D, // Ž
  0x8F: 0x008F, // control
  0x90: 0x0090, // control
  0x91: 0x2018, // '
  0x92: 0x2019, // '
  0x93: 0x201C, // "
  0x94: 0x201D, // "
  0x95: 0x2022, // •
  0x96: 0x2013, // –
  0x97: 0x2014, // —
  0x98: 0x02DC, // ˜
  0x99: 0x2122, // ™
  0x9A: 0x0161, // š
  0x9B: 0x203A, // ›
  0x9C: 0x0153, // œ
  0x9D: 0x009D, // control
  0x9E: 0x017E, // ž
  0x9F: 0x0178, // Ÿ
};

for (let xx = 0x80; xx <= 0x9F; xx++) {
  const codepoint = win1252Special[xx];
  // UTF-8 encode the Win-1252 interpretation of this byte
  const charStr = String.fromCodePoint(codepoint);
  const charUtf8 = Buffer.from(charStr, 'utf-8');
  // Double-encoded: C3 83 + UTF-8 encoding of Win1252[xx]
  const doubleEncoded = Buffer.concat([Buffer.from([0xC3, 0x83]), charUtf8]);
  const correct = Buffer.from([0xC3, xx]);
  replacements[doubleEncoded.toString('hex')] = { search: doubleEncoded, replace: correct };
}

// Also handle C2 prefix (for U+0080-U+00BF range, single-byte chars in Latin-1)
// Original: C2 XX -> double encoded as C3 82 + encoding of Win1252[XX]
for (let xx = 0xA0; xx <= 0xBF; xx++) {
  const doubleEncoded = Buffer.from([0xC3, 0x82, 0xC2, xx]);
  const correct = Buffer.from([0xC2, xx]);
  replacements[doubleEncoded.toString('hex')] = { search: doubleEncoded, replace: correct };
}

for (let xx = 0x80; xx <= 0x9F; xx++) {
  const codepoint = win1252Special[xx];
  const charStr = String.fromCodePoint(codepoint);
  const charUtf8 = Buffer.from(charStr, 'utf-8');
  const doubleEncoded = Buffer.concat([Buffer.from([0xC3, 0x82]), charUtf8]);
  const correct = Buffer.from([0xC2, xx]);
  replacements[doubleEncoded.toString('hex')] = { search: doubleEncoded, replace: correct };
}

// Also handle emojis that got double-encoded
// Emojis like 🎮 are F0 9F 8E AE in UTF-8
// Read as Win-1252: F0->ð(C3 B0), 9F->Ÿ(C5 B8 per Win1252), 8E->Ž(C5 BD), AE->®(C2 AE)
// So F0 XX YY ZZ becomes C3 B0 + enc(XX) + enc(YY) + enc(ZZ)

// For 3-byte UTF-8 sequences (U+0800-U+FFFF): E2, E2, etc.
// E2 80 94 (—) -> C3 A2 C2 80 C2 94
// Actually let me take a different, simpler approach for the files that have issues:
// Just do targeted string replacements for known corrupted text.

function fixFileWithByteReplacements(filePath) {
  let buf = fs.readFileSync(filePath);
  let changed = false;
  
  // Sort replacements by length (longest first) to avoid partial matches
  const sortedReplacements = Object.values(replacements).sort((a, b) => b.search.length - a.search.length);
  
  for (const { search, replace } of sortedReplacements) {
    let idx = 0;
    while ((idx = buf.indexOf(search, idx)) !== -1) {
      // Replace in-place
      const before = buf.slice(0, idx);
      const after = buf.slice(idx + search.length);
      buf = Buffer.concat([before, replace, after]);
      idx += replace.length;
      changed = true;
    }
  }
  
  return { buf, changed };
}

const filesToFix = [
  'pages/AdminBadges.jsx',
  'pages/AdminBatchBadge.jsx',
  'pages/AdminDashboard.jsx',
  'pages/AdminGrantBadge.jsx',
  'pages/AdminLandingConfig.jsx',
  'pages/BadgeCollection.jsx',
  'pages/BadgeDetail.jsx',
  'pages/ClubHub.jsx',
  'pages/EditProfile.jsx',
  'pages/Landing.jsx',
  'pages/Leaderboard.jsx',
  'pages/Profile.jsx',
  'pages/PublicProfile.jsx',
];

let totalFixed = 0;

for (const relPath of filesToFix) {
  const fullPath = path.join(srcDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ Skipping ${relPath} (not found)`);
    continue;
  }
  
  const { buf, changed } = fixFileWithByteReplacements(fullPath);
  
  if (changed) {
    fs.writeFileSync(fullPath, buf);
    // Verify the result
    const text = buf.toString('utf-8');
    const badChars = (text.match(/\uFFFD/g) || []).length;
    if (badChars > 0) {
      console.log(`⚠️ ${relPath}: Fixed but still has ${badChars} replacement chars`);
    } else {
      console.log(`✅ Fixed: ${relPath}`);
    }
    totalFixed++;
  } else {
    console.log(`- ${relPath}: no double-encoded sequences found`);
  }
}

console.log(`\n🎉 Done. Fixed ${totalFixed} files.`);

// Now let's also do a quick spot-check on ClubHub.jsx
const hubPath = path.join(srcDir, 'pages/ClubHub.jsx');
const hubText = fs.readFileSync(hubPath, 'utf-8');
const checks = ['Úteis', 'coleção', 'próxima', 'Notícias', 'Líder'];
for (const word of checks) {
  if (hubText.includes(word)) {
    console.log(`✓ Found "${word}" correctly encoded`);
  } else {
    console.log(`✗ Missing "${word}" - may still be corrupted`);
  }
}
