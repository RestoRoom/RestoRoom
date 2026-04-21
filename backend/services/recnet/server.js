"use strict";

const crypto = require("crypto");
const http = require("http");
const { json, parseJsonBody } = require("../shared/http");
const { buildHostMap } = require("./subdomains");

const PORT = Number(process.env.PORT || 7000);
const BASE_DOMAIN = String(process.env.BASE_DOMAIN || "rec.net")
  .toLowerCase()
  .trim();
const ENABLE_TEST_SUBDOMAINS =
  String(process.env.ENABLE_TEST_SUBDOMAINS || "true").toLowerCase() !==
  "false";
const ENABLE_REC_NET_COMPAT =
  String(process.env.ENABLE_REC_NET_COMPAT || "true").toLowerCase() !== "false";
const API_FALLBACK_200 =
  String(process.env.API_FALLBACK_200 || "true").toLowerCase() !== "false";

const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6WfZQAAAAASUVORK5CYII=",
  "base64"
);

const state = {
  usersById: new Map(),
  usersByUsername: new Map(),
  tokens: new Map(),
  relationships: new Map(),
  messagesByPlayer: new Map(),
  rooms: new Map(),
  quickPlayQueue: [],
  imageCheers: new Map(),
  playerCheers: [],
  roomReports: [],
  moderationActions: [],
  inventionsByPlayer: new Map(),
  savedOutfitsByPlayer: new Map(),
};

function createHostRegistry() {
  const registry = new Map();

  const primary = buildHostMap(BASE_DOMAIN, ENABLE_TEST_SUBDOMAINS);
  for (const [host, meta] of primary.entries()) {
    registry.set(host, meta);
  }

  if (ENABLE_REC_NET_COMPAT && BASE_DOMAIN !== "rec.net") {
    const compat = buildHostMap("rec.net", ENABLE_TEST_SUBDOMAINS);
    for (const [host, meta] of compat.entries()) {
      registry.set(host, meta);
    }
  }

  return registry;
}

const hostRegistry = createHostRegistry();

function normalizeHost(hostHeader) {
  const value = String(hostHeader || "").trim().toLowerCase();
  if (!value) {
    return "";
  }

  const colonIndex = value.indexOf(":");
  return colonIndex === -1 ? value : value.slice(0, colonIndex);
}

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function stableNumber(input, mod) {
  const raw = String(input || "");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) % 2_147_483_647;
  }
  return mod <= 0 ? hash : hash % mod;
}

function hashPassword(password, salt) {
  return crypto
    .createHash("sha256")
    .update(`${salt}:${password}`, "utf8")
    .digest("hex");
}

function createUser(username, password) {
  const trimmed = String(username || "").trim();
  if (trimmed.length < 3) {
    throw new Error("username must be at least 3 characters");
  }

  const key = trimmed.toLowerCase();
  if (state.usersByUsername.has(key)) {
    throw new Error("username already exists");
  }

  const userId = newId("player");
  const salt = crypto.randomBytes(16).toString("hex");
  const user = {
    userId,
    username: trimmed,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };

  state.usersById.set(userId, user);
  state.usersByUsername.set(key, userId);
  return user;
}

function findUserByUsername(username) {
  const key = String(username || "").trim().toLowerCase();
  const userId = state.usersByUsername.get(key);
  return userId ? state.usersById.get(userId) : null;
}

function ensurePlayer(playerId) {
  const normalized = String(playerId || "").trim();
  if (!normalized) {
    return null;
  }

  const existing = state.usersById.get(normalized);
  if (existing) {
    return existing;
  }

  const generated = {
    userId: normalized,
    username: normalized,
    salt: "",
    passwordHash: "",
    createdAt: new Date().toISOString(),
  };
  state.usersById.set(normalized, generated);
  state.usersByUsername.set(normalized.toLowerCase(), normalized);
  return generated;
}

function issueToken(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  state.tokens.set(token, {
    userId,
    expiresAt: Date.now() + 3_600_000,
  });
  return token;
}

function parseBearerToken(authorizationHeader) {
  const value = String(authorizationHeader || "");
  const [scheme, token] = value.split(" ");
  if (!scheme || !token) {
    return "";
  }

  if (scheme.toLowerCase() !== "bearer") {
    return "";
  }

  return token.trim();
}

function resolveCurrentUser(req, url) {
  const explicitPlayerId = String(req.headers["x-player-id"] || "").trim();
  if (explicitPlayerId) {
    return ensurePlayer(explicitPlayerId);
  }

  const bearer = parseBearerToken(req.headers.authorization);
  if (bearer) {
    const record = state.tokens.get(bearer);
    if (record && record.expiresAt > Date.now()) {
      const user = ensurePlayer(record.userId);
      if (user) {
        return user;
      }
    }
  }

  const queryPlayerId =
    url.searchParams.get("playerId") || url.searchParams.get("id");
  if (queryPlayerId) {
    return ensurePlayer(queryPlayerId);
  }

  return ensurePlayer("dev_player");
}

function readMultiQueryValues(searchParams, key) {
  const values = [];
  const entries = searchParams.getAll(key);
  for (const entry of entries) {
    const split = String(entry || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    values.push(...split);
  }
  return [...new Set(values)];
}

function getRelationshipState(playerId) {
  if (!state.relationships.has(playerId)) {
    state.relationships.set(playerId, {
      friends: new Set(["storm_bot"]),
      ignored: new Set(),
      muted: new Set(),
    });
  }
  return state.relationships.get(playerId);
}

function getMessages(playerId) {
  if (!state.messagesByPlayer.has(playerId)) {
    state.messagesByPlayer.set(playerId, [
      {
        messageId: newId("msg"),
        fromPlayerId: "storm_bot",
        toPlayerId: playerId,
        body: "Welcome to Project Ultra backend.",
        sentAt: new Date().toISOString(),
      },
    ]);
  }
  return state.messagesByPlayer.get(playerId);
}

function getSavedOutfits(playerId) {
  if (!state.savedOutfitsByPlayer.has(playerId)) {
    state.savedOutfitsByPlayer.set(playerId, [
      {
        outfitId: newId("outfit"),
        name: "Default Storm Chaser",
        equippedItemIds: ["jacket_basic", "hat_weather", "boots_rubber"],
      },
    ]);
  }
  return state.savedOutfitsByPlayer.get(playerId);
}

function getInventions(playerId) {
  if (!state.inventionsByPlayer.has(playerId)) {
    state.inventionsByPlayer.set(playerId, [
      {
        inventionId: newId("inv"),
        name: "Portable Weather Station",
        roomId: "storm-chase-hub",
      },
    ]);
  }
  return state.inventionsByPlayer.get(playerId);
}

function sanitizeText(rawText) {
  const bannedWords = ["badword", "slur"];
  let result = String(rawText || "");
  for (const word of bannedWords) {
    const pattern = new RegExp(word, "gi");
    result = result.replace(pattern, "*".repeat(word.length));
  }
  return result;
}

function isPureText(rawText) {
  return sanitizeText(rawText) === String(rawText || "");
}

function toPublicUser(user) {
  return {
    userId: user.userId,
    username: user.username,
    createdAt: user.createdAt,
  };
}

function seedState() {
  if (state.rooms.size > 0) {
    return;
  }

  const room = {
    roomId: "storm-chase-hub",
    name: "Storm Chase Hub",
    tags: ["storm", "simulation", "vehicles"],
    maxPlayers: 12,
    rolesByPlayerId: {
      dev_player: ["Owner", "Moderator"],
    },
  };
  state.rooms.set(room.roomId, room);
  state.quickPlayQueue.push(room.roomId);
}

seedState();

function bootstrapPayload(req) {
  const scheme = String(req.headers["x-forwarded-proto"] || "http");
  const localAuthority = String(req.headers.host || `localhost:${PORT}`);
  const grouped = {};

  for (const meta of hostRegistry.values()) {
    if (!grouped[meta.service]) {
      grouped[meta.service] = [];
    }
    grouped[meta.service].push(`${scheme}://${meta.host}`);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort();
  }

  return {
    ok: true,
    baseDomain: BASE_DOMAIN,
    localProxyBase: `${scheme}://${localAuthority}`,
    services: grouped,
  };
}

function routeNotImplemented(res, context) {
  json(res, 404, {
    error: "route_not_implemented",
    method: context.method,
    path: context.pathname,
    host: context.host,
    service: context.hostMeta.service,
  });
}

function maybeServeAssetPlaceholder(res, context) {
  if (context.hostMeta.service !== "assets" || context.method !== "GET") {
    return false;
  }

  if (/\.(png|jpg|jpeg|gif|webp)$/i.test(context.pathname)) {
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": TRANSPARENT_PNG.length,
      "Cache-Control": "public, max-age=60",
    });
    res.end(TRANSPARENT_PNG);
    return true;
  }

  json(res, 200, {
    ok: true,
    placeholder: true,
    host: context.host,
    path: context.pathname,
    message: "asset host placeholder response",
  });
  return true;
}

async function readBody(req, res) {
  try {
    return await parseJsonBody(req);
  } catch (error) {
    json(res, 400, {
      error: "invalid_payload",
      message: error.message || "invalid json",
    });
    return null;
  }
}

async function handleRoute(context) {
  const { req, res, method, pathLower, pathname, url } = context;

  if (method === "GET" && pathLower === "/") {
    json(res, 200, {
      service: "recnet-gateway",
      ok: true,
      host: context.host,
      mappedService: context.hostMeta.service,
      endpointCount: 39,
    });
    return true;
  }

  if (method === "GET" && pathLower === "/subdomains") {
    json(res, 200, {
      ok: true,
      hosts: [...hostRegistry.keys()].sort(),
    });
    return true;
  }

  if (method === "POST" && (pathLower === "/register" || pathLower === "/auth/v1/register")) {
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }

    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    if (username.length < 3 || password.length < 8) {
      json(res, 400, {
        error: "invalid_credentials",
        message: "username >= 3 and password >= 8 required",
      });
      return true;
    }

    try {
      const user = createUser(username, password);
      json(res, 201, { ok: true, user: toPublicUser(user) });
    } catch (error) {
      json(res, 409, { error: "username_taken", message: error.message });
    }
    return true;
  }

  if (
    method === "POST" &&
    (pathLower === "/login" || pathLower === "/auth/v1/login" || pathLower === "/oauth/token")
  ) {
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }

    const username = String(body.username || body.email || "").trim();
    const password = String(body.password || "");
    const user = findUserByUsername(username);
    if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
      json(res, 401, { error: "invalid_credentials" });
      return true;
    }

    const token = issueToken(user.userId);
    json(res, 200, {
      ok: true,
      tokenType: "Bearer",
      token,
      expiresInSeconds: 3600,
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600,
      user: toPublicUser(user),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/relationships/v2/get") {
    const user = resolveCurrentUser(req, url);
    const rel = getRelationshipState(user.userId);
    json(res, 200, {
      playerId: user.userId,
      friends: [...rel.friends].map((id) => ({ playerId: id, relationship: "Friend" })),
      ignoredPlayerIds: [...rel.ignored],
      mutedPlayerIds: [...rel.muted],
    });
    return true;
  }

  if (method === "POST" && pathLower === "/api/relationships/v1/ignore") {
    const user = resolveCurrentUser(req, url);
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }
    const targetPlayerId = String(body.playerId || body.targetPlayerId || "").trim();
    if (!targetPlayerId) {
      json(res, 400, { error: "targetPlayerId is required" });
      return true;
    }
    const rel = getRelationshipState(user.userId);
    rel.ignored.add(targetPlayerId);
    json(res, 200, { ok: true, targetPlayerId, ignored: true });
    return true;
  }

  if (method === "POST" && pathLower === "/api/relationships/v1/unignore") {
    const user = resolveCurrentUser(req, url);
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }
    const targetPlayerId = String(body.playerId || body.targetPlayerId || "").trim();
    const rel = getRelationshipState(user.userId);
    rel.ignored.delete(targetPlayerId);
    json(res, 200, { ok: true, targetPlayerId, ignored: false });
    return true;
  }

  if (method === "POST" && pathLower === "/api/relationships/v1/mute") {
    const user = resolveCurrentUser(req, url);
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }
    const targetPlayerId = String(body.playerId || body.targetPlayerId || "").trim();
    if (!targetPlayerId) {
      json(res, 400, { error: "targetPlayerId is required" });
      return true;
    }
    const rel = getRelationshipState(user.userId);
    rel.muted.add(targetPlayerId);
    json(res, 200, { ok: true, targetPlayerId, muted: true });
    return true;
  }

  if (method === "POST" && pathLower === "/api/relationships/v1/unmute") {
    const user = resolveCurrentUser(req, url);
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }
    const targetPlayerId = String(body.playerId || body.targetPlayerId || "").trim();
    const rel = getRelationshipState(user.userId);
    rel.muted.delete(targetPlayerId);
    json(res, 200, { ok: true, targetPlayerId, muted: false });
    return true;
  }

  if (method === "GET" && pathLower === "/api/messages/v1/friendonlinestatus") {
    const ids = readMultiQueryValues(url.searchParams, "id");
    const statuses = ids.map((id) => ({
      playerId: id,
      isOnline: stableNumber(id, 2) === 0,
    }));
    json(res, 200, { statuses });
    return true;
  }

  if (method === "GET" && pathLower === "/api/messages/v2/get") {
    const user = resolveCurrentUser(req, url);
    json(res, 200, {
      messages: getMessages(user.userId),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/externalfriendinvite/v1/getplatformreferrers") {
    json(res, 200, {
      platformReferrers: ["steam", "xbox", "playstation", "meta"],
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/players/v1/playerphototaggingsetting") {
    json(res, 200, {
      enabled: true,
      scope: "friends",
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/players/v2/progression/bulk") {
    const ids = readMultiQueryValues(url.searchParams, "id");
    json(res, 200, {
      players: ids.map((id) => ({
        playerId: id,
        level: stableNumber(id, 50) + 1,
        xp: stableNumber(`${id}:xp`, 5000),
      })),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/progressionevents/active") {
    json(res, 200, {
      events: [
        {
          eventId: "storm-season-alpha",
          title: "Storm Season Alpha",
          isActive: true,
          multiplier: 1.25,
        },
      ],
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/progressionevents/event/id") {
    const eventId = String(url.searchParams.get("id") || "storm-season-alpha");
    json(res, 200, {
      eventId,
      isActive: true,
      rewardTrack: "alpha-track",
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/purchasablexpboosts/activations") {
    json(res, 200, { activations: [] });
    return true;
  }

  if (method === "GET" && pathLower === "/api/playerreputation/v2/bulk") {
    const ids = readMultiQueryValues(url.searchParams, "id");
    json(res, 200, {
      players: ids.map((id) => ({
        playerId: id,
        reputation: 100 - stableNumber(id, 12),
      })),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/rooms/v1/filters") {
    json(res, 200, {
      sort: ["hot", "new", "friends", "trending"],
      tags: ["storm", "sim", "vehicles", "co-op"],
    });
    return true;
  }

  if (method === "POST" && pathLower === "/api/rooms/v1/verifyrole") {
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }

    const roomId = String(body.roomId || "").trim();
    const playerId = String(body.playerId || "").trim();
    const role = String(body.role || "").trim();
    const room = state.rooms.get(roomId);
    if (!room) {
      json(res, 404, { error: "room_not_found", roomId });
      return true;
    }

    const roles = room.rolesByPlayerId[playerId] || [];
    json(res, 200, {
      roomId,
      playerId,
      requestedRole: role,
      hasRole: role ? roles.includes(role) : roles.length > 0,
      roles,
    });
    return true;
  }

  if (method === "POST" && pathLower === "/api/rooms/v3/report") {
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }

    const report = {
      reportId: newId("report"),
      roomId: String(body.roomId || ""),
      reason: String(body.reason || "unspecified"),
      details: String(body.details || ""),
      createdAt: new Date().toISOString(),
    };
    state.roomReports.push(report);
    json(res, 200, { ok: true, reportId: report.reportId });
    return true;
  }

  if (method === "POST" && pathLower === "/api/quickplay/v1/getandclear") {
    const queued = state.quickPlayQueue.shift();
    const fallback = state.rooms.keys().next().value || null;
    const roomId = queued || fallback;
    const room = roomId ? state.rooms.get(roomId) : null;

    json(res, 200, {
      matched: Boolean(room),
      room: room
        ? {
            roomId: room.roomId,
            name: room.name,
            maxPlayers: room.maxPlayers,
          }
        : null,
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/images/v2/named") {
    const names = readMultiQueryValues(url.searchParams, "name");
    json(res, 200, {
      images: names.map((name) => ({
        name,
        url: `https://img.${BASE_DOMAIN}/named/${encodeURIComponent(name)}.png`,
      })),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/images/v5/cheered/bulk") {
    const imageIds = readMultiQueryValues(url.searchParams, "id");
    json(res, 200, {
      images: imageIds.map((id) => ({
        imageId: id,
        cheers: state.imageCheers.get(id) || 0,
      })),
    });
    return true;
  }

  if (method === "POST" && pathLower === "/api/images/v1/cheer") {
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }
    const imageId = String(body.imageId || "").trim();
    if (!imageId) {
      json(res, 400, { error: "imageId is required" });
      return true;
    }
    state.imageCheers.set(imageId, (state.imageCheers.get(imageId) || 0) + 1);
    json(res, 200, { ok: true, imageId, cheers: state.imageCheers.get(imageId) });
    return true;
  }

  if (method === "POST" && pathLower === "/api/playercheer/v1/create") {
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }
    const entry = {
      cheerId: newId("pcheer"),
      targetPlayerId: String(body.targetPlayerId || ""),
      reaction: String(body.reaction || "cheer"),
      createdAt: new Date().toISOString(),
    };
    state.playerCheers.push(entry);
    json(res, 200, { ok: true, cheerId: entry.cheerId });
    return true;
  }

  if (method === "GET" && pathLower === "/api/playerreporting/v1/votetokickreasons") {
    json(res, 200, {
      reasons: ["abusive-language", "griefing", "harassment", "cheating"],
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/playerreporting/v1/moderationblockdetails") {
    const playerId = String(url.searchParams.get("playerId") || "");
    json(res, 200, {
      playerId,
      blocked: false,
      reason: null,
    });
    return true;
  }

  if (method === "POST" && pathLower === "/api/playerreporting/v1/roommodkick") {
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }
    const action = {
      actionId: newId("kick"),
      roomId: String(body.roomId || ""),
      targetPlayerId: String(body.targetPlayerId || ""),
      reason: String(body.reason || "unspecified"),
      createdAt: new Date().toISOString(),
    };
    state.moderationActions.push(action);
    json(res, 200, { ok: true, actionId: action.actionId });
    return true;
  }

  if (method === "GET" && pathLower === "/api/customavataritems/v1/bulk") {
    const itemIds = readMultiQueryValues(url.searchParams, "id");
    json(res, 200, {
      items: itemIds.map((id) => ({
        itemId: id,
        enabled: true,
      })),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/customavataritems/v1/isrenderingenabled") {
    json(res, 200, { enabled: true });
    return true;
  }

  if (method === "GET" && pathLower === "/api/customavataritems/v1/iscreationenabled") {
    json(res, 200, { enabled: true });
    return true;
  }

  if (
    method === "GET" &&
    pathLower === "/api/customavataritems/v1/iscreationallowedforaccount"
  ) {
    json(res, 200, { allowed: true });
    return true;
  }

  if (method === "GET" && pathLower === "/outfits/me/saved") {
    const user = resolveCurrentUser(req, url);
    json(res, 200, {
      outfits: getSavedOutfits(user.userId),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/inventions/v2/mine") {
    const user = resolveCurrentUser(req, url);
    json(res, 200, {
      inventions: getInventions(user.userId),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/inventions/v1/room") {
    const roomId = String(url.searchParams.get("id") || "");
    json(res, 200, {
      roomId,
      inventions: [
        {
          inventionId: newId("inv"),
          name: "Storm Sensor Beacon",
          roomId: roomId || "storm-chase-hub",
        },
      ],
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/config/v2") {
    json(res, 200, {
      configVersion: 1,
      apiBaseUrl: `https://api.${BASE_DOMAIN}`,
      featureFlags: {
        fallbackMatchmaking: true,
        roomieAiEnabled: false,
      },
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/gameconfigs/v1/all") {
    json(res, 200, {
      gameplay: {
        maxPartySize: 6,
        defaultRegion: "us-central",
      },
      economy: {
        dailyBonusEnabled: true,
      },
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/versioncheck/islandedversions") {
    json(res, 200, {
      blockedVersions: [],
      minimumSupportedVersion: "1.0.0-ultra",
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/keepsakes/globalconfig") {
    json(res, 200, {
      enabled: true,
      maxSlots: 24,
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/keepsakes/categories") {
    json(res, 200, {
      categories: ["weather", "vehicles", "achievements"],
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/playerevents/v1/all") {
    json(res, 200, { events: [] });
    return true;
  }

  if (method === "GET" && pathLower === "/api/playerevents/v1/tagfilters") {
    json(res, 200, { tags: ["storm", "coop", "challenge"] });
    return true;
  }

  if (method === "GET" && pathLower === "/api/communityboard/v2/current") {
    json(res, 200, {
      title: "Project Ultra Preview",
      message: "Core backend endpoints are now live in compatibility mode.",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/statsiguserproperties") {
    const user = resolveCurrentUser(req, url);
    json(res, 200, {
      userId: user.userId,
      properties: {
        beta: true,
        region: "us",
      },
    });
    return true;
  }

  if (method === "POST" && pathLower === "/api/sanitize/v1") {
    const body = await readBody(req, res);
    if (!body) {
      return true;
    }
    const input = String(body.value || body.text || body.input || "");
    json(res, 200, {
      original: input,
      sanitized: sanitizeText(input),
      isPure: isPureText(input),
    });
    return true;
  }

  if (method === "GET" && pathLower === "/api/sanitize/v1/ispure") {
    const value = String(url.searchParams.get("value") || "");
    json(res, 200, {
      value,
      isPure: isPureText(value),
    });
    return true;
  }

  if (API_FALLBACK_200 && pathLower.startsWith("/api/")) {
    json(res, 200, {
      ok: true,
      placeholder: true,
      method,
      path: pathname,
      host: context.host,
      service: context.hostMeta.service,
    });
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const method = String(req.method || "GET").toUpperCase();
  const host = normalizeHost(req.headers.host);
  const hostMeta =
    hostRegistry.get(host) ||
    (host === "localhost" || host === "127.0.0.1"
      ? { host, label: "localhost", service: "api", environment: "dev" }
      : null);
  const url = new URL(req.url || "/", `http://${host || "localhost"}`);
  const pathname = url.pathname || "/";
  const pathLower = pathname.toLowerCase();

  if (!hostMeta) {
    json(res, 400, {
      error: "unknown_host",
      host,
      message:
        "host not mapped. add it to DNS/hosts and include it in recnet subdomain map.",
    });
    return;
  }

  if (method === "GET" && pathLower === "/health") {
    json(res, 200, {
      service: "recnet-gateway",
      ok: true,
      host,
      mappedService: hostMeta.service,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (method === "GET" && pathLower === "/bootstrap") {
    json(res, 200, bootstrapPayload(req));
    return;
  }

  const context = {
    req,
    res,
    method,
    host,
    hostMeta,
    url,
    pathname,
    pathLower,
  };

  if (maybeServeAssetPlaceholder(res, context)) {
    return;
  }

  try {
    const handled = await handleRoute(context);
    if (!handled) {
      routeNotImplemented(res, context);
    }
  } catch (error) {
    json(res, 500, {
      error: "server_error",
      message: error.message || "unexpected error",
    });
  }
});

server.listen(PORT, () => {
  console.log(
    `[recnet] listening on :${PORT} with ${hostRegistry.size} host mappings (base domain ${BASE_DOMAIN})`
  );
});
