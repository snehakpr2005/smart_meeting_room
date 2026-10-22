import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";

process.env.ACCESS_TOKEN = "test-access-token-secret";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test("auth middleware rejects a missing Bearer token", async () => {
  const req = { headers: {} };
  const res = createResponse();
  let nextCalled = false;

  await authMiddleware(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("auth middleware rejects malformed authorization headers", async () => {
  const req = { headers: { authorization: "Token abc" } };
  const res = createResponse();
  let nextCalled = false;

  await authMiddleware(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("auth middleware rejects tokens without the required identity and role claims", async () => {
  const token = jwt.sign({ id: "user-1" }, process.env.ACCESS_TOKEN);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  let nextCalled = false;

  await authMiddleware(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("auth middleware attaches valid user and role claims", async () => {
  const token = jwt.sign(
    { userId: "user-1", role: "employee" },
    process.env.ACCESS_TOKEN,
    { expiresIn: "1m" }
  );
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  let nextCalled = false;

  await authMiddleware(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.user.userId, "user-1");
  assert.equal(req.user.role, "employee");
});

test("role middleware blocks unauthorized roles and accepts allowed roles", () => {
  const deniedResponse = createResponse();
  let deniedNextCalled = false;
  authorizeRoles("admin")(
    { user: { role: "employee" } },
    deniedResponse,
    () => { deniedNextCalled = true; }
  );

  assert.equal(deniedResponse.statusCode, 403);
  assert.equal(deniedNextCalled, false);

  const allowedResponse = createResponse();
  let allowedNextCalled = false;
  authorizeRoles("admin")(
    { user: { role: "admin" } },
    allowedResponse,
    () => { allowedNextCalled = true; }
  );

  assert.equal(allowedNextCalled, true);
});
