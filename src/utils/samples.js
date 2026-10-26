/**
 * In-memory test files for /files/upload — no binary fixtures in the repo.
 *
 * `sample(name)` → { filename, content (Buffer), type (declared content type) }. Sizes are exact so boundary
 * scenarios can assert them: the upload part limit is 5 MiB (5 242 880 bytes) and the whole multipart body may
 * exceed that by at most 64 KiB.
 */
const zlib = require('zlib');
const { choose } = require('./lookup');

const FILE_LIMIT = 5 * 1024 * 1024;
const WEBHOOK_BODY_LIMIT = 64 * 1024;

function png1x1() {
  const uint32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0); return b; };
  const chunk = (kind, data) => Buffer.concat([uint32(data.length), Buffer.from(kind), data, uint32(zlib.crc32(Buffer.concat([Buffer.from(kind), data])))]);
  const ihdr = Buffer.concat([uint32(1), uint32(1), Buffer.from([8, 6, 0, 0, 0])]); // 1×1, 8-bit RGBA
  const idat = zlib.deflateSync(Buffer.from([0, 0, 0, 0, 0]));                     // filter byte + one transparent pixel
  return Buffer.concat([Buffer.from('\x89PNG\r\n\x1a\n', 'latin1'), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const PDF = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n';
const BINARY = Buffer.concat([Buffer.from([0xff, 0xfe, 0x00, 0x01]), Buffer.from('binary')]);

const SAMPLES = {
  'tiny.png':    [png1x1(), 'image/png'],
  'tiny.pdf':    [Buffer.from(PDF), 'application/pdf'],
  'note.txt':    [Buffer.from('hello from play-api-js\n'), 'text/plain'],
  'data.csv':    [Buffer.from('id,name\n1,alice\n'), 'text/csv'],
  'data.json':   [Buffer.from('{"hello":"world"}'), 'application/json'],
  'отчёт 1.txt': [Buffer.from('отчёт\n'), 'text/plain'],
  'fake.png':    [Buffer.from('this is plain text pretending to be a PNG'), 'image/png'],
  'program.exe': [Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]), Buffer.alloc(56)]), 'application/octet-stream'],
  // NUL-leading bytes: Go's sniffer reads a leading ff fe as a UTF-16 BOM (→ text/plain), not binary
  'noextension': [Buffer.from(Array.from({ length: 128 }, (_, i) => i % 32)), 'application/octet-stream'],
  'empty.txt':   [Buffer.alloc(0), 'text/plain'],
};
// size boundaries, built on demand (≈ 5 MiB each)
const SIZED = {
  'exactly-5mib.txt':    FILE_LIMIT,
  '5mib-plus-1.txt':     FILE_LIMIT + 1,
  '5mib-plus-70kib.txt': FILE_LIMIT + 70 * 1024,
};

function sample(name) {
  if (Object.hasOwn(SIZED, name)) return { filename: name, content: Buffer.alloc(SIZED[name], 'a'), type: 'text/plain' };
  const [content, type] = choose(SAMPLES, name, `sample (or one of ${Object.keys(SIZED).join(', ')})`);
  return { filename: name, content, type };
}

module.exports = { sample, BINARY, WEBHOOK_BODY_LIMIT };
