/** `event: x` / `data: {…}` pairs of a Server-Sent Events body → [{ event, data }]. */
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

module.exports = { parseSse };
