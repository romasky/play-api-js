const { ContractError } = require('../contracts');

/**
 * Create something server-side, register its deletion (from the 201 body), save the response.
 *
 * The cleanup is registered even when the 201 body violates its contract — the client throws ContractError
 * after the resource exists, and a leaked inbox / upload counts against a per-IP quota (20 active webhook
 * inboxes; shared file storage).
 */
async function saveCreated(world, varName, create, cleanup) {
  let res;
  try {
    res = await create();
  } catch (err) {
    if (err instanceof ContractError && err.response.status === 201) {
      const body = err.response.data;
      world.defer(() => cleanup(body));
    }
    throw err;
  }
  if (res.status === 201) world.defer(() => cleanup(res.data));
  world.save(varName, res);
}

module.exports = { saveCreated };
