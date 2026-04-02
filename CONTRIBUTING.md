# Contributing to RestoRoom

Thanks for wanting to help! Every contribution matters — this project only works if the community pulls together before and after June 1st.

---

## Where to start

Check the [issues](../../issues) tab first. Issues are labelled so you can find something that fits your skills:

- `research` — traffic capture, protocol documentation
- `backend` — server implementation work
- `tooling` — scripts, utilities, dev tooling
- `docs` — documentation, wikis, guides
- `good first issue` — easy stuff to get started

If you have an idea not in the issues, open one and discuss it before building.

---

## Ways to contribute

### 📡 Traffic research (most needed right now)

This is the highest priority before June 1st 2026. Once the servers go dark, we lose our reference.

**What to do:**
1. Install [Wireshark](https://www.wireshark.org/)
2. Play Rec Room normally and capture your session
3. Filter by `rec.net` or Photon-related hosts
4. Save the `.pcapng` file and open an issue or discussion with your findings

**Bonus:** use a proxy like [mitmproxy](https://mitmproxy.org/) to intercept and log REST API calls (account login, room fetching, inventory, etc.)

Document any endpoints you find in the [`/docs/api`](./docs/api/) folder.

---

### 🔧 Reverse engineering

If you have experience with Unity games, dnSpy, or Ghidra:

- The Rec Room client is Unity/C# — dnSpy is the main tool for reading the client code
- Focus on networking code, API calls, and Photon SDK usage
- Document findings in [`/docs/reversing`](./docs/reversing/)

---

### 💻 Backend development

Once we have enough protocol documentation, we'll start implementing backend services. Stack is TBD but likely:

- REST API server (Node.js / Python / Go — open to discussion)
- Photon relay / replacement
- Auth / account system

Check the issues for whichever service is being actively worked on before starting.

---

### 📝 Documentation

Clear docs are just as important as code. If you:

- Understand something about the protocol and can write it up
- Want to improve the wiki
- Can write setup guides

...then open a PR against the `/docs` folder or contribute to the wiki.

---

## Pull request guidelines

- Keep PRs focused — one thing per PR
- Write a clear description of what you changed and why
- If it's a big change, open an issue to discuss it first
- Don't commit captured `.pcapng` files directly — summarise findings in docs instead

---

## Code style

*(To be defined as the codebase develops — check back soon.)*

---

## Questions?

Open a [Discussion](../../discussions) — don't be shy, this is a community project and all skill levels are welcome.
