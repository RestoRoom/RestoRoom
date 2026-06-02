<p align="center">
<img src="img/RestoRoomLogoTransparent.png" width="300" height="300">
</p>

# RestoRoom






> **Early WIP** — A community-driven reimplementation of the Rec Room servers, keeping Rec Room alive past June 1st, 2026.

---

> [!NOTE]
> This is my first time attempting a project of this scale, and reverse engineering stuff, so things may be rough around the edges. Bear with me!

**DISCORD**: https://discord.gg/BQMgupZhyR


## What is this?

Rec Room has shut down on **June 1st, 2026**. RestoRoom is an open-source effort to reverse engineer and reimplement the Rec Room server infrastructure so the community can keep playing after the lights go out.

This is a preservation project, built by fans, for fans.

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
# Self Hosting
This is not started

# Devlopment
1. Fork the repo
2. Check the [issues](../../issues) tab for tasks you can help with
3. Read [CONTRIBUTING.md](CONTRIBUTING.md)
4. Join the discussion in [Discussions](../../discussions)


## Legal

This is a **non-commercial fan preservation project**. We are not affiliated with Rec Room Inc. We do not redistribute any game assets or proprietary code. All reverse engineering is done for interoperability purposes.

Edit: Rec Room Inc. dead
---

## Community

> "Our costs always ended up overwhelming the revenue we brought in." — Rec Room Inc., March 2026

The official servers are going away. The community doesn't have to.

---

*RestoRoom is not affiliated with Rec Room Inc. or Roblox. Wait Rec Room Inc. is gone so it means we can do whatever we want*
