const test = require('node:test');
const assert = require('node:assert/strict');
const { createErrorHandler } = require('../lib/error-handler');

function createResponse(headersSent = false) {
  return {
    headersSent,
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('returns safe client errors and logs internal errors', () => {
  const logged = [];
  const handler = createErrorHandler({ error: (error) => logged.push(error) });
  const clientResponse = createResponse();
  handler({ status: 400, message: 'Invalid payload' }, {}, clientResponse, () => {});

  const internalError = new Error('database connection string');
  const serverResponse = createResponse();
  handler(internalError, {}, serverResponse, () => {});

  assert.equal(clientResponse.statusCode, 400);
  assert.deepEqual(clientResponse.body, { message: 'Invalid payload' });
  assert.equal(serverResponse.statusCode, 500);
  assert.deepEqual(serverResponse.body, { message: 'Internal server error' });
  assert.deepEqual(logged, [internalError]);
});

test('delegates errors when the response has already started', () => {
  const handler = createErrorHandler({ error() {} });
  const response = createResponse(true);
  let forwarded;
  const error = new Error('stream error');

  handler(error, {}, response, (received) => { forwarded = received; });

  assert.equal(forwarded, error);
  assert.equal(response.statusCode, undefined);
});
