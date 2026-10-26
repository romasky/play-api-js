/**
 * Streaming endpoints — Server-Sent Events (GET /sse/progress) and the WebSocket echo (GET /ws/echo).
 *
 * The SSE stream closes after its `done` event, so one ordinary request reads it whole. The WebSocket uses
 * Node's built-in client on the same base URL (https → wss); every frame is its own Allure step.
 */
const { step } = require('allure-js-commons');
const config = require('../config/config');
const paths = require('../http/paths');
const { request } = require('../http/client');
const { attach, attachJson } = require('../http/attach');

/** `event: x` / `data: {…}` pairs of an SSE body → [{ event, data }]. */
function parseSse(text) {
  const events = [];
  let event = 'message';
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) {
      events.push({ event, data: JSON.parse(line.slice(5).trim()) });
      event = 'message';
    }
  }
  return events;
}

async function sseProgress(params) {
  const res = await request('GET', paths.SSE_PROGRESS, { params });
  if (res.status !== 200) throw new Error(`SSE stream answered ${res.status}`);
  const events = parseSse(res.raw.toString('utf8'));
  await step('SSE events', () => attachJson('SSE events', events));
  return events;
}

/** One WebSocket connection; frames are queued as they arrive so none is lost between steps. */
class WsSession {
  constructor(socket) {
    this.socket = socket;
    this.frames = [];
    this.waiting = null;
    socket.addEventListener('message', ({ data }) => {
      const frame = typeof data === 'string' ? data : Buffer.from(data);
      if (this.waiting) { this.waiting(frame); this.waiting = null; } else this.frames.push(frame);
    });
  }

  next() {
    if (this.frames.length > 0) return Promise.resolve(this.frames.shift());
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.waiting = null; reject(new Error('no WebSocket frame within the request timeout')); }, config.requestTimeout);
      this.waiting = (frame) => { clearTimeout(timer); resolve(frame); };
    });
  }

  receiveJson() {
    return step('WebSocket receive (JSON)', async () => {
      const frame = await this.next();
      await attach('Frame', String(frame));
      return JSON.parse(frame);
    });
  }

  /** Send one frame and return the reply (same frame type expected). */
  echo(frame) {
    return step(`WebSocket echo (${typeof frame === 'string' ? 'text' : 'binary'})`, async () => {
      this.socket.send(frame);
      const reply = await this.next();
      await attach('Reply', typeof reply === 'string' ? reply : `<${reply.length} bytes: ${reply.toString('hex')}>`);
      return reply;
    });
  }

  close() {
    this.socket.close();
  }
}

function wsConnect() {
  const url = config.baseUrl.replace(/^http/, 'ws') + paths.WS_ECHO;
  return step(`WebSocket connect ${paths.WS_ECHO}`, () => new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    const session = new WsSession(socket); // listen before `open`: the welcome frame follows immediately
    socket.addEventListener('open', () => resolve(session), { once: true });
    socket.addEventListener('error', () => reject(new Error(`WebSocket connect to ${url} failed`)), { once: true });
  }));
}

module.exports = {
  sseProgress,
  // non-streaming call — for the 400 validation answers
  sseProgressResponse: (params) => request('GET', paths.SSE_PROGRESS, { params }),
  wsConnect,
  // an ordinary HTTP GET without the Upgrade handshake → 426 UPGRADE_REQUIRED
  wsPlainGet: () => request('GET', paths.WS_ECHO),
};
