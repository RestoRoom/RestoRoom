# rec.net Subdomains

Discovered via TLS SNI sniffing using Wireshark during a normal play session on April 3rd, 2026.
Captured by [@PoimeYT](https://github.com/PoimeYT).

> [!NOTE]
> All traffic is TLS encrypted. Subdomain names and server IPs are visible but request/response content is not. Confidence levels are based on subdomain names and connection timing, not actual request inspection.

---

## Subdomains

| Subdomain | Likely Purpose | Confidence |
|---|---|---|
| `api.rec.net` | General / catch-all API | High |
| `auth.rec.net` | Authentication, token issuing | High |
| `accounts.rec.net` | Account management, profile data | High |
| `rooms.rec.net` | Room listings and room data | High |
| `match.rec.net` | Matchmaking | High |
| `chat.rec.net` | In-game chat | High |
| `lists.rec.net` | Friend lists, block lists | High |
| `leaderboard.rec.net` | Leaderboards for rooms | High |
| `clubs.rec.net` | Clubs / groups | High |
| `econ.rec.net` | Economy, currency (tokens) | High |
| `commerce.rec.net` | Shop, purchases, transactions | High |
| `cards.rec.net` | Player profile cards | High |
| `discovery.rec.net` | Room discovery / browse page | High |
| `playersettings.rec.net` | Player preferences and settings | High |
| `notify.rec.net` | In-app notifications | High |
| `platformnotifications.rec.net` | Platform-level push notifications | Medium |
| `datacollection.rec.net` | Analytics and telemetry | High |
| `ns.rec.net` | Namespace / internal routing | Low |
| `ai.rec.net` | Roomie AI companion | High |
| `img.rec.net` | Images, avatars, thumbnails | High |
| `cdn.rec.net` | Asset delivery / content CDN | High |

---

## Server IPs observed

| IP | Provider | Subdomains seen on |
|---|---|---|
| `104.18.8.90` | Cloudflare | api, auth, accounts, econ, commerce, ai, ns, discovery, playersettings |
| `104.18.9.90` | Cloudflare | rooms, match, lists, clubs, notify, chat, datacollection, commerce |
| `13.107.253.31` | Microsoft Azure | img |
| `150.171.109.x` | Microsoft Azure | cdn, img |

---

## Notes

- All connections use TLS 1.2
- Most subdomains resolve to Cloudflare IPs, suggesting Cloudflare is used as a reverse proxy/CDN in front of the actual servers
- `img.rec.net` and `cdn.rec.net` resolve to Azure IPs, suggesting assets are hosted on Azure
- `datacollection.rec.net` is telemetry and is not needed for a reimplementation
- `ai.rec.net` powers Roomie and is likely low priority for a reimplementation
- `platformnotifications.rec.net` and `notify.rec.net` may overlap in function -- needs further investigation

---

## Priority for reimplementation

These are the subdomains that need to be reimplemented for basic gameplay to work:

1. `auth.rec.net` -- nothing works without login
2. `accounts.rec.net` -- profile data
3. `rooms.rec.net` -- finding and joining rooms
4. `match.rec.net` -- matchmaking
5. `api.rec.net` -- general API calls
6. `econ.rec.net` / `commerce.rec.net` -- inventory, items
7. `chat.rec.net` -- in-game chat
8. `lists.rec.net` -- friends
9. `img.rec.net` / `cdn.rec.net` -- assets (may be able to mirror these before shutdown)

Lower priority: `clubs`, `discovery`, `cards`, `playersettings`, `notify`, `platformnotifications`, `ai`, `datacollection`
