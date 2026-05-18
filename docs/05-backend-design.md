# 05 — Backend design: y-websocket gateway in Go

> Resolves two of the open questions from `docs/00-overview.md`:
> the y-websocket implementation path, and the WOPI integration target.
> Captures the design before any Go code is written so future work
> isn't left re-deriving these decisions.

## TL;DR

- **Build our own y-websocket protocol implementation in Go** rather
  than bridge to a Hocuspocus-equivalent.
- **Start with a local mock WOPI host** for integration tests.
  Real-host integration (Nextcloud or similar) comes after the
  protocol gateway is round-trip-proven.
- **One Y.Doc per active room, in process memory.** When the last
  client disconnects, snapshot → WOPI → drop the doc. No DB, no
  on-disk update log. Process restart re-seeds from WOPI on
  reconnect.
- **JWT in the WS query string**, validated once at connect time
  against a JWKS endpoint. No per-message auth.
- **Single-node-per-doc routing** for the first cut; revisit Redis /
  cross-node fanout when (and only when) a single Go process can't
  hold the active-doc working set in RAM.

## Why our own protocol implementation, not Hocuspocus

[Hocuspocus](https://github.com/ueberdosis/hocuspocus) is the
canonical Node-based y-websocket server. There are Go bridges
(small middleware layers that proxy WS frames to a Hocuspocus
sidecar) but they introduce a hop we don't need.

Reasons to build our own:

1. **Surface area is small.** The y-websocket binary protocol is
   ~120 lines of spec — message types 0–3 (sync step 1, sync step 2,
   update, awareness). The reference Go implementation
   (`y-crdt/y-sync`) is a few hundred lines we can vendor or port.
2. **Single process. No JS in the hot path.** Bridging would put a
   Node sidecar between our Go gateway and the connected clients —
   that's an extra process to deploy, an extra GC to tune, and an
   extra protocol hop to debug when latency or backpressure goes
   wrong.
3. **Stateless invariant becomes easier.** Hocuspocus' default
   extensions assume persistent storage (LevelDB / Redis update
   logs). Disabling all of that is fighting the framework. Building
   our own means the lifecycle is exactly what `docs/00-overview.md`
   commits to: in-memory Y.Doc, snapshot to WOPI on last-disconnect.
4. **Auth model fits naturally.** We're validating JWTs against a
   tenant's JWKS — that's idiomatic Go, awkward to wire into
   Hocuspocus' Node-based extension API.
5. **No real performance penalty.** Yjs CRDT ops are pure binary
   diffs at the WS layer; the Go side never needs to interpret CRDT
   internals. It's bytes-in, bytes-out, with one in-memory `Y.Doc`
   buffer per room for new-client sync.

What we give up:

- Hocuspocus' rich extension ecosystem (auth providers, history,
  versioning). We don't need most of it (storage = WOPI; history =
  WOPI versions; auth = JWT).
- Reference test corpus battle-tested against real Yjs clients.
  Mitigated by: the eigenpal `examples/collaboration/` reference
  client lets us drive the same WS protocol from two browsers
  during dev.

## Why mock WOPI before real WOPI

A real WOPI host (Nextcloud, ownCloud, SharePoint, etc.) brings:

- A separate auth flow (tenant tokens, `access_token` query param).
- A separate set of bugs in its CheckFileInfo / GetFile / PutFile
  endpoints.
- Operational dependencies (installation, DB, file storage).

Starting with a real host means coupling our protocol bring-up to
debugging someone else's host. Bad ratio.

Instead, a **local mock WOPI** = a tiny Go HTTP server in the
same repo that:

- Serves `CheckFileInfo` from a JSON fixture per `docId`.
- Serves `GetFile` from a `.docx` on disk.
- Accepts `PutFile` and writes it back to disk.
- Mints / validates a synthetic JWT for the WOPI access_token.

That's ~200 LOC and lets us close the round-trip loop:

```
browser → backend → mock-WOPI.GetFile → seed Y.Doc → edit → snapshot
                  → mock-WOPI.PutFile → reload → re-seed → verify
```

Once that's stable, swapping the URL for Nextcloud is a config
change plus whatever real-host quirks surface.

## Wire-level lifecycle

```
1. CONNECT
   client → ws://gateway/doc/{docId}?token=JWT
   gateway:
     - validate JWT against tenant JWKS (RS256)
     - check permissions on docId (read / write)
     - join or create the room for docId
       - if creating: GET WOPI/files/{docId}/contents
                      → parse .docx via the eigenpal headless
                        deserializer (running embedded as a WASM
                        module or out-of-process Node)
                      → seed an empty Y.Doc with the parsed model
     - send sync-step-1 over the WS, expect sync-step-2 back
     - then stream client awareness + updates

2. STEADY STATE
   - All received update messages broadcast to other clients in
     the room
   - Awareness diffs broadcast separately
   - Server keeps an authoritative Y.Doc for new-joiner sync
     (apply each update locally as it comes through)

3. DISCONNECT (last client)
   - Mark room "draining"
   - Serialize Y.Doc → .docx via the headless serializer
   - PUT WOPI/files/{docId}/contents
   - Drop the in-memory Y.Doc (free room)

4. RECONNECT after process restart
   - Same as 1; room is rebuilt from WOPI
```

The .docx-aware steps (deserialize on seed, serialize on snapshot)
are the only non-CRDT-trivial pieces. Options for the headless
serializer:

- **Embed the eigenpal core via wazero (Go WASM runtime).** Compile
  `@eigenpal/docx-core` to WASM (it's already a TS package with
  no DOM dependencies in its parser/serializer modules), call it
  from Go. Same code path as the editor; no duplication.
- **Out-of-process Bun worker pool.** Run `bun run serialize` as
  a subprocess pool, pipe data over stdin/stdout. Higher latency
  per op, simpler to ship in v0.
- **Reimplement in Go.** Months of work; not v0.

v0 plan: out-of-process Bun pool. Reassess after first usable
build.

## Auth: JWT + JWKS

- **Token lives in the WS query string** at connect: `?token=…`.
  WebSockets can't carry custom Authorization headers from
  browsers cross-origin, so this is the standard placement.
- **JWKS endpoint is per-tenant**, configured at gateway startup
  via `WOPI_JWKS_URL` env var (or a static file for the mock).
- **Validation runs once at connect**; subsequent messages on
  the established WS inherit the connection's auth context.
- **Permissions claim** (`docId`, `permissions: 'r' | 'rw'`)
  on the JWT body, validated against the connect URL's `docId`.

If a JWT expires mid-session, the client must reconnect with a
fresh token — we don't refresh tokens on the WS. Frontend handles
this by listening for `4001` close codes and re-fetching from
its identity provider.

## Stateless cross-node story

Initial deployment: **single Go process per region**. Each room
lives in exactly one process' memory.

If client count grows past one box can handle:

- Option A — **sticky routing by docId.** Load balancer hashes
  `docId` → backend instance. Each room still lives in exactly
  one process. Simple; no Redis.
- Option B — **Redis pubsub fanout.** Multiple instances can
  serve the same room; updates broadcast through Redis. Higher
  ops cost (Redis), but allows hot rooms to spread.

v0 = Option A. Move to B only if we see hot-room load that one
process can't carry.

## What lives where

```
services/document/
├── docx-editor/           — the React + ProseMirror editor (existing)
├── docs/                  — this directory
└── backend/               — NEW (Go module, TBD)
    ├── cmd/gateway/       — main entry: WS + HTTP health
    ├── internal/yws/      — y-websocket protocol implementation
    ├── internal/room/     — in-memory Y.Doc room manager
    ├── internal/wopi/     — WOPI client (real + mock)
    ├── internal/auth/     — JWT + JWKS validation
    └── test/mock-wopi/    — local mock WOPI HTTP server
```

`backend/` doesn't exist yet — this doc establishes the layout
ahead of any code.

## First implementation milestone

**M1: two-browser local round-trip.**

1. Stand up `cmd/gateway` accepting WS connections at
   `/doc/{docId}`.
2. Implement `internal/yws` for the four y-websocket message
   types. Lift logic from the `y-crdt/y-sync` Go reference.
3. Stand up `test/mock-wopi` serving `examples/vite/public/
   docx-editor-demo.docx` as docId `demo`.
4. `internal/room` loads the doc via mock-WOPI on first
   connect, broadcasts updates, snapshots via mock-WOPI on last
   disconnect.
5. Local test: two browsers at
   `http://localhost:5173/?docId=demo&backend=ws://localhost:8080`
   should see each other's edits live.

No auth in M1 (or a hardcoded dev JWT). No real WOPI in M1. Focus
is the protocol layer + lifecycle.

After M1 lands, scope M2: JWT + JWKS validation against the mock
WOPI's signing key, plus presence (awareness diffs).

## What this design intentionally defers

- **OT-style edit history.** Yjs gives us causal merge, but
  doesn't natively store an edit log we can rewind. If we want
  "view this doc as of 3 days ago," that's an additional layer.
  Out of scope; can be added via WOPI versions when the host
  supports them.
- **Conflict resolution UI.** Yjs auto-resolves; we don't
  surface conflicts to users. If two peers edit the same word,
  they get the merged result. Word users are used to "last write
  wins" anyway.
- **Offline edits / resync after long disconnect.** Yjs handles
  this automatically (the server's Y.Doc accepts late-arriving
  updates as long as the doc is still in memory). Long enough
  disconnects = the room may have drained; client re-syncs from
  WOPI. Acceptable.

---

*Last updated 2026-05-18. Update when the first backend code
lands. Supersedes the relevant "Open questions" rows in
`docs/00-overview.md`.*
