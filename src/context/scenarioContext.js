const globalCtx = {};
const localCtx  = {};

let currentScenario = null;

function setScenario(scenario) {
  currentScenario = scenario;
}

function save(key, value) {
  if (key.endsWith('_g')) {
    const cleanKey = key.slice(0, -2);
    globalCtx[cleanKey] = value;
  } else {
    const cleanKey = key.endsWith('_l') ? key.slice(0, -2) : key;
    const name = currentScenario.pickle.name;
    if (!localCtx[name]) localCtx[name] = {};
    localCtx[name][cleanKey] = value;
  }
}

function get(key, failIfMissing = false) {
  const isGlobal = key.endsWith('_g');
  const isLocal  = key.endsWith('_l');
  const cleanKey = (isGlobal || isLocal) ? key.slice(0, -2) : key;

  let value;
  if (isGlobal) {
    value = globalCtx[cleanKey];
  } else {
    const name = currentScenario.pickle.name;
    value = localCtx[name]?.[cleanKey];
    if (value === undefined) value = globalCtx[cleanKey];
  }

  if (value === undefined && failIfMissing) {
    throw new Error(`Context variable '${cleanKey}' not found`);
  }
  return value !== undefined ? value : key;
}

function str(key) {
  return String(get(key));
}

function assertStatusCode(expected, varName) {
  const response = get(varName, true);
  const actual = response.status;
  if (actual !== expected) {
    throw new Error(
      `Expected status ${expected} but got ${actual}. Body: ${JSON.stringify(response.data)}`
    );
  }
}

module.exports = { setScenario, save, get, str, assertStatusCode };
