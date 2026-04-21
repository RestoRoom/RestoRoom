"use strict";

const HOST_DEFINITIONS = [
  { label: "api", service: "api", environment: "prod" },
  { label: "api-test", service: "api", environment: "test" },
  { label: "apim", service: "api", environment: "prod" },
  { label: "apim-test", service: "api", environment: "test" },
  { label: "auth", service: "auth", environment: "prod" },
  { label: "auth-test", service: "auth", environment: "test" },
  { label: "accounts", service: "accounts", environment: "prod" },
  { label: "rooms", service: "rooms", environment: "prod" },
  { label: "match", service: "match", environment: "prod" },
  { label: "match-test", service: "match", environment: "test" },
  { label: "chat", service: "chat", environment: "prod" },
  { label: "lists", service: "lists", environment: "prod" },
  { label: "leaderboard", service: "leaderboard", environment: "prod" },
  { label: "clubs", service: "clubs", environment: "prod" },
  { label: "econ", service: "economy", environment: "prod" },
  { label: "commerce", service: "economy", environment: "prod" },
  { label: "cards", service: "cards", environment: "prod" },
  { label: "cards-test", service: "cards", environment: "test" },
  { label: "discovery", service: "discovery", environment: "prod" },
  { label: "playersettings", service: "playersettings", environment: "prod" },
  { label: "notify", service: "notifications", environment: "prod" },
  { label: "platformnotifications", service: "notifications", environment: "prod" },
  { label: "datacollection", service: "telemetry", environment: "prod" },
  { label: "ns", service: "routing", environment: "prod" },
  { label: "ns-fd", service: "routing", environment: "prod" },
  { label: "ai", service: "ai", environment: "prod" },
  { label: "img", service: "assets", environment: "prod" },
  { label: "cdn", service: "assets", environment: "prod" },
  { label: "strings-cdn", service: "assets", environment: "prod" },
  { label: "strings-cdn-test", service: "assets", environment: "test" },
  { label: "studiocdn", service: "assets", environment: "prod" },
  { label: "cms", service: "cms", environment: "prod" },
  { label: "cms-test", service: "cms", environment: "test" },
  { label: "email", service: "email", environment: "prod" },
  { label: "forum", service: "forum", environment: "prod" },
  { label: "www", service: "web", environment: "prod" },
  { label: "www-test", service: "web", environment: "test" },
  { label: "test", service: "web", environment: "test" },
  { label: "devportal", service: "devportal", environment: "prod" },
  { label: "webservice-go", service: "internal", environment: "prod" },
  { label: "webservice-sso-dev", service: "internal", environment: "test" },
];

function buildHostMap(baseDomain, includeTests) {
  const normalizedDomain = String(baseDomain || "").toLowerCase().trim();
  if (!normalizedDomain) {
    throw new Error("baseDomain is required");
  }

  const hostMap = new Map();
  for (const def of HOST_DEFINITIONS) {
    if (!includeTests && def.environment === "test") {
      continue;
    }

    const host = `${def.label}.${normalizedDomain}`;
    hostMap.set(host, {
      host,
      label: def.label,
      service: def.service,
      environment: def.environment,
    });
  }

  return hostMap;
}

module.exports = {
  HOST_DEFINITIONS,
  buildHostMap,
};
