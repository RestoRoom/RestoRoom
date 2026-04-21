# rec.net Subdomains

Discovered via TLS SNI sniffing using Wireshark during a normal play session on April 3rd, 2026.
Captured by [@crasho-rr](https://github.com/crasho-rr) and [@PoimeYT](https://github.com/PoimeYT).

Additional subdomains contributed using a [subdomain finder](https://subdomainfinder.c99.nl/scans/2026-03-31/rec.net) by [@cicerorph](https://github.com/cicerorph).

> [!NOTE]
> All traffic is TLS encrypted. Subdomain names and server IPs are visible but request/response content is not. Confidence levels are based on subdomain names and connection timing, not actual request inspection.

---

I have no idea how i found this but
auth-staging.rec.net
foo.rec.net
auth-test-staging.rec.net
partner.rec.net
www-partner.rec.net
www-test-staging.rec.net
o3.coach.rec.net
o4.coach.rec.net
strings-test-cdn.rec.net
api-staging.rec.net
auth.test.rec.net
api.test.rec.net
api-test-staging.rec.net
accounts-stress.rec.net
auth-stress.rec.net
strings-cdn-partner.rec.net
o5.coach.rec.net
www-staging.rec.net
admin.test.rec.net

## Subdomains

| Subdomain | Likely Purpose | Confidence |
|---|---|---|
| `api.rec.net` | General / catch-all API | High |
| `api-test.rec.net` | Testing environment for general API | Medium |
| `apim.rec.net` | API management / gateway | Medium |
| `apim-test.rec.net` | Testing environment for API management | Low |
| `auth.rec.net` | Authentication, token issuing | High |
| `auth-test.rec.net` | Testing environment for authentication | Medium |
| `accounts.rec.net` | Account management, profile data | High |
| `rooms.rec.net` | Room listings and room data | High |
| `match.rec.net` | Matchmaking | High |
| `match-test.rec.net` | Testing environment for matchmaking | Medium |
| `chat.rec.net` | In-game chat | High |
| `lists.rec.net` | Friend lists, block lists | High |
| `leaderboard.rec.net` | Leaderboards for rooms | High |
| `clubs.rec.net` | Clubs / groups | High |
| `econ.rec.net` | Economy, currency (tokens) | High |
| `commerce.rec.net` | Shop, purchases, transactions | High |
| `cards.rec.net` | Player profile cards | High |
| `cards-test.rec.net` | Testing environment for profile cards | Low |
| `discovery.rec.net` | Room discovery / browse page | High |
| `playersettings.rec.net` | Player preferences and settings | High |
| `notify.rec.net` | In-app notifications | High |
| `platformnotifications.rec.net` | Platform-level push notifications | Medium |
| `datacollection.rec.net` | Analytics and telemetry | High |
| `ns.rec.net` | Namespace / internal routing | Low |
| `ns-fd.rec.net` | Namespace / failover or front-door routing | Low |
| `ai.rec.net` | Roomie AI companion | High |
| `img.rec.net` | Images, avatars, thumbnails | High |
| `cdn.rec.net` | Asset delivery / content CDN | High |
| `strings-cdn.rec.net` | Localization strings CDN | Medium |
| `strings-cdn-test.rec.net` | Testing environment for strings CDN | Low |
| `studiocdn.rec.net` | Studio / creation tool asset CDN | Medium |
| `cms.rec.net` | Content management system | Medium |
| `cms-test.rec.net` | Testing environment for CMS | Low |
| `email.rec.net` | Email delivery | Medium |
| `forum.rec.net` | Community forums | High |
| `www.rec.net` | Main website | High |
| `www-test.rec.net` | Testing environment for website | Low |
| `test.rec.net` | General testing environment | Low |
| `devportal.rec.net` | Developer portal | Medium |
| `webservice-go.rec.net` | Backend web service (Go) | Low |
| `webservice-sso-dev.rec.net` | SSO dev/testing web service | Low |

---

## Server IPs observed

| IP | Provider | Subdomains seen on |
|---|---|---|
| `104.18.8.90` | Cloudflare | api, api-test, auth, accounts, econ, commerce, ai, ns, discovery, playersettings, test, www, www-test |
| `104.18.9.90` | Cloudflare | apim, apim-test, auth-test, cards-test, cms, cms-test, email, match-test, rooms, match, lists, clubs, notify, chat, datacollection, commerce |
| `13.107.246.60` | Microsoft Azure | cdn, img, studiocdn |
| `13.107.213.60` | Microsoft Azure | strings-cdn, strings-cdn-test |
| `13.107.253.31` | Microsoft Azure | img |
| `150.171.109.x` | Microsoft Azure | cdn, img |
| `150.171.109.194` | Microsoft Azure | ns-fd |
| `52.226.197.164` | Microsoft Azure | devportal |
| `20.3.86.252` | Microsoft Azure | webservice-go, webservice-sso-dev |
| `184.105.99.75` | Other | forum |

---

## Notes

- All connections use TLS 1.2
- Most subdomains resolve to Cloudflare IPs, suggesting Cloudflare is used as a reverse proxy/CDN in front of the actual servers
- `img.rec.net`, `cdn.rec.net`, `studiocdn.rec.net`, and `strings-cdn.rec.net` resolve to Azure IPs, suggesting assets are hosted on Azure
- `datacollection.rec.net` is telemetry and is not needed for a reimplementation
- `ai.rec.net` powers Roomie and is likely low priority for a reimplementation
- `platformnotifications.rec.net` and `notify.rec.net` may overlap in function -- needs further investigation
- `-test` subdomains are likely staging/QA environments, not needed for reimplementation
- `webservice-go.rec.net` and `webservice-sso-dev.rec.net` may be internal services that are not directly accessible but are useful for understanding the backend architecture
- `devportal.rec.net` may expose API documentation or SDK info useful for RE

---

## Priority for reimplementation

These are the subdomains that need to be reimplemented for basic gameplay to work:

1. `auth.rec.net` -- nothing works without login
2. `accounts.rec.net` -- profile data
3. `rooms.rec.net` -- finding and joining rooms
4. `match.rec.net` -- matchmaking
5. `api.rec.net` -- general API calls
6. `apim.rec.net` -- API gateway (may proxy some of the above)
7. `econ.rec.net` / `commerce.rec.net` -- inventory, items
8. `chat.rec.net` -- in-game chat
9. `lists.rec.net` -- friends
10. `img.rec.net` / `cdn.rec.net` / `studiocdn.rec.net` / `strings-cdn.rec.net` -- assets (may be able to mirror these before shutdown)

Lower priority: `clubs`, `discovery`, `cards`, `playersettings`, `notify`, `platformnotifications`, `ai`, `datacollection`, `forum`, `www`, `cms`, `email`

Not needed: all `-test` / `-dev` subdomains, `webservice-go`, `webservice-sso-dev`, `ns`, `ns-fd`






