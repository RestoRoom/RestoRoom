"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { json, notFound, parseJsonBody } = require("../shared/http");

const PORT = Number(process.env.PORT || 7001);
const USERS_FILE =
  process.env.USERS_FILE ||
  path.resolve(__dirname, "..", "..", "data", "users.json");
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 3600);

function ensureUsersFile() {
  const dir = path.dirname(USERS_FILE);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function loadUsers() {
  ensureUsersFile();
  const raw = fs.readFileSync(USERS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.users) ? parsed.users : [];
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), "utf8");
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

function buildPublicUser(user) {
  return {
    userId: user.userId,
    username: user.username,
    createdAt: user.createdAt,
  };
}

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (method === "GET" && url.pathname === "/health") {
    json(res, 200, {
      service: "auth",
      ok: true,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (method === "POST" && url.pathname === "/register") {
    try {
      const body = await parseJsonBody(req);
      const username = (body.username || "").trim();
      const password = String(body.password || "");

      if (username.length < 3 || password.length < 8) {
        json(res, 400, {
          error: "invalid_payload",
          message: "username must be >= 3 chars and password >= 8 chars",
        });
        return;
      }

      const users = loadUsers();
      const existing = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (existing) {
        json(res, 409, {
          error: "username_taken",
          message: "username already exists",
        });
        return;
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const user = {
        userId: crypto.randomUUID(),
        username,
        salt,
        passwordHash: hashPassword(password, salt),
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      saveUsers(users);

      json(res, 201, {
        ok: true,
        user: buildPublicUser(user),
      });
    } catch (error) {
      json(res, 400, {
        error: "bad_request",
        message: error.message || "invalid request",
      });
    }
    return;
  }

  if (method === "POST" && url.pathname === "/login") {
    try {
      const body = await parseJsonBody(req);
      const username = (body.username || "").trim();
      const password = String(body.password || "");
      const users = loadUsers();
      const user = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );

      if (!user) {
        json(res, 401, { error: "invalid_credentials" });
        return;
      }

      const attemptedHash = hashPassword(password, user.salt);
      if (attemptedHash !== user.passwordHash) {
        json(res, 401, { error: "invalid_credentials" });
        return;
      }

      json(res, 200, {
        ok: true,
        token: createToken(),
        tokenType: "Bearer",
        expiresInSeconds: TOKEN_TTL_SECONDS,
        user: buildPublicUser(user),
      });
    } catch (error) {
      json(res, 400, {
        error: "bad_request",
        message: error.message || "invalid request",
      });
    }
    return;
  }

  notFound(res);
});

server.listen(PORT, () => {
  console.log(`[auth] listening on :${PORT}`);
});
