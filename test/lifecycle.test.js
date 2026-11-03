const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { registerShutdownHandlers, startAfterReady } = require('../lib/lifecycle');

test('starts the HTTP server only after the database is ready', async () => {
  let resolveDatabase;
  let started = false;
  const databaseReady = new Promise((resolve) => { resolveDatabase = resolve; });
  const startup = startAfterReady(databaseReady, () => { started = true; });

  assert.equal(started, false);
  resolveDatabase();
  await startup;
  assert.equal(started, true);
});

test('does not start the HTTP server when database startup fails', async () => {
  let started = false;
  await assert.rejects(
    startAfterReady(Promise.reject(new Error('database unavailable')), () => { started = true; }),
    /database unavailable/,
  );
  assert.equal(started, false);
});

test('closes the HTTP listener before the database and handles shutdown once', async () => {
  const processLike = new EventEmitter();
  let listenerClosed = false;
  let databaseClosed = false;
  let closeCount = 0;
  const server = {
    listening: true,
    close(callback) {
      closeCount += 1;
      listenerClosed = true;
      callback();
    },
  };
  const shutdown = registerShutdownHandlers({
    server,
    processLike,
    closeDatabase: async () => {
      assert.equal(listenerClosed, true);
      databaseClosed = true;
    },
  });

  processLike.emit('SIGTERM');
  await shutdown();
  processLike.emit('SIGINT');
  await shutdown();

  assert.equal(closeCount, 1);
  assert.equal(databaseClosed, true);
});
