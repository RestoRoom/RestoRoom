# Project Ultra RecNet Compatibility Backend

This backend is a host-aware compatibility gateway that accepts your mapped
subdomains and serves the listed API routes from a single process.

## What It Does

- maps core subdomains (`api`, `apim`, `auth`, `accounts`, `rooms`, `match`,
  `chat`, `lists`, `econ`, `commerce`, `img`, `cdn`, `studiocdn`,
  `strings-cdn`, and more)
- implements the endpoint groups you listed
- provides in-memory account/session/room/message state to unblock client flow
- returns placeholder responses for unimplemented `/api/*` routes if
  `API_FALLBACK_200=true`

## Quick Start

1. Install Docker Desktop.
2. From this `backend` directory run:

```powershell
docker compose up -d
```

3. Check health with host headers:

```powershell
Invoke-RestMethod http://localhost:7000/health -Headers @{ Host = "api.rec.net" }
Invoke-RestMethod http://localhost:7000/health -Headers @{ Host = "auth.rec.net" }
Invoke-RestMethod http://localhost:7000/health -Headers @{ Host = "rooms.rec.net" }
```

4. Run the smoke test:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

## Implemented Endpoint Groups

- Social / relationships
- Players / progression
- Rooms
- Images / cheers
- Moderation / reporting
- Avatar / outfits
- Inventions
- Config / misc
- Content sanitize endpoints
- Auth starter endpoints (`/register`, `/login`, `/oauth/token`)

## Local Hostname Testing

If a client requires real hostnames, add dev host mappings:

```text
127.0.0.1 api.rec.net
127.0.0.1 auth.rec.net
127.0.0.1 accounts.rec.net
127.0.0.1 rooms.rec.net
127.0.0.1 match.rec.net
127.0.0.1 chat.rec.net
127.0.0.1 lists.rec.net
127.0.0.1 econ.rec.net
127.0.0.1 commerce.rec.net
127.0.0.1 img.rec.net
127.0.0.1 cdn.rec.net
127.0.0.1 studiocdn.rec.net
127.0.0.1 strings-cdn.rec.net
```

For internet routing, you must control your own DNS zone.

## Environment Variables

- `PORT` (default `7000`)
- `BASE_DOMAIN` (default `rec.net`)
- `ENABLE_TEST_SUBDOMAINS` (`true` or `false`)
- `ENABLE_REC_NET_COMPAT` (`true` or `false`)
- `API_FALLBACK_200` (`true` or `false`)

## Next Hardening Steps

1. Move state to Redis/Postgres
2. Replace starter tokens with signed JWT + refresh flow
3. Add per-service auth scopes
4. Replace placeholder asset behavior with mirrored asset storage
5. Add request/response schema validation and contract tests
