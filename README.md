<p align="center">
<img src="img/RestoRoomLogoTransparent.png" width="300" height="300">
</p>

# RestoRoom

RestoRoom is an open-source effort to reverse engineer and reimplement the Rec Room server infrastructure so the community can keep playing after the lights go out.

This is a preservation project, built by fans, for fans.

**DISCORD**: https://discord.gg/BQMgupZhyR

---

## ⚠️ Status

**This project is in very early development.** Nothing is playable yet. We're currently in the research and reverse engineering phase.

| Component | Status |
|---|---|
| Network protocol research | 🔄 In progress — [20 subdomains discovered](docs/api/subdomains.md) |
| Account / auth server | ❌ Not started |
| Room server | ❌ Not started |
| Photon relay | ❌ Not started |
| Client patching / redirect | ❌ Not started |

---

## How it works (planned)

Rec Room's backend consists of several systems we need to reimplement:

- **REST API** — account management, friends, inventory, room listings
- **Photon networking** — real-time multiplayer via Photon SDK
- **Client redirect** — patching the client to point at our servers instead of official ones

Our approach:
1. Sniff and document traffic between the Rec Room client and official servers
2. Reimplement each backend service
3. Patch or proxy the client to use our servers

---

## Contributing

We need all kinds of help — reverse engineers, backend devs, and people who can document findings.

### Getting started

1. Fork the repo
2. Check the [issues](../../issues) tab for tasks you can help with
3. Read [CONTRIBUTING.md](CONTRIBUTING.md)
4. Join the discussion in [Discussions](../../discussions)


## Legal

This is a **non-commercial fan preservation project**. We are not affiliated with Rec Room Inc. We do not redistribute any game assets or proprietary code. All reverse engineering is done for interoperability purposes.

---

## Community

> "Our costs always ended up overwhelming the revenue we brought in." — Rec Room Inc., March 2026

The official servers are going away. The community doesn't have to.

---

*RestoRoom is not affiliated with Rec Room Inc.*
