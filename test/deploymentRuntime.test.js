import assert from "node:assert/strict";
import test from "node:test";
import ensureDatabase from "../middleware/ensureDatabase.js";

test("reports a retryable database error when the URI is not configured", async () => {
  const previousUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "";
  let statusCode;
  let responseBody;
  const headers = {};
  const response = {
    set: (name, value) => {
      headers[name] = value;
      return response;
    },
    status: (status) => {
      statusCode = status;
      return response;
    },
    json: (body) => {
      responseBody = body;
      return response;
    },
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await ensureDatabase({}, response, () => {
      assert.fail("next should not be called when the database URI is missing");
    });
  } finally {
    console.error = originalError;
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }

  assert.equal(statusCode, 503);
  assert.equal(headers["Retry-After"], "5");
  assert.match(responseBody.message, /Database unavailable/);
});
