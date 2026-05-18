// Package host defines the integration interface every document
// source must satisfy. The gateway calls Fetch on room creation
// to seed the in-memory Y.Doc; calls Snapshot on room drain
// (last-client disconnect) to persist the latest state.
//
// Three implementations are planned (see docs/05-backend-design.md):
//
//  1. inline  — in-process map. The v0 share-link flow: a user
//     uploads `.docx` to the gateway, gets a docId + share URL,
//     others join, anyone downloads. No external host. This
//     package's `inline` subpackage.
//  2. wopi    — full WOPI HTTP client (Nextcloud, SharePoint, …).
//     Future v1.
//  3. jwtapi  — leaner "WOPI-like but simpler" REST client: GET
//     <fetchURL> + POST <callbackURL> with `Authorization: Bearer
//     <jwt>`. Future v1+.
//
// The room manager never cases on host type — it calls the
// interface. Concrete impl is selected once at startup via env
// var / config and stays put for the gateway's lifetime.
package host

import (
	"context"
	"errors"
)

// FileInfo carries the metadata the gateway needs about a doc
// beyond its raw bytes. Hosts that don't expose all fields can
// leave them zero — only the ones with explicit semantics
// downstream matter.
type FileInfo struct {
	// FileName is the user-visible filename. Used in the
	// downloaded-snapshot `Content-Disposition` header so the
	// browser suggests the right filename on save.
	FileName string

	// Version is an opaque host-supplied version token (WOPI
	// `Version`, etag, hash, etc.). Useful for optimistic-
	// concurrency checks on Snapshot but not gated on yet.
	Version string

	// UserCanWrite is the host's permission check result.
	// `false` → the WS join still succeeds but Update frames
	// from this client are dropped (view-only). M2 wires this
	// into the auth layer; M1 inline always returns true.
	UserCanWrite bool
}

// Integration is the contract every host backend satisfies.
// authToken semantics are per-impl: inline ignores it, wopi uses
// it as the WOPI access_token query param, jwtapi uses it as a
// bearer header. The gateway forwards whatever it received on
// the WS connect URL.
type Integration interface {
	// Fetch returns the current bytes for docID plus a FileInfo
	// describing how to display + gate access. Called once at
	// room creation. Surfaces ErrNotFound when the docId doesn't
	// exist; that's a clean close on the WS side (close code
	// 4404) rather than an error log.
	Fetch(ctx context.Context, docID, authToken string) ([]byte, *FileInfo, error)

	// Snapshot persists the latest .docx bytes. Called once on
	// room drain. The host's response carries a new Version that
	// the caller logs but does not retain (we're stateless).
	Snapshot(ctx context.Context, docID, authToken string, contents []byte) error
}

// Sentinel errors. Implementations either return these directly
// or wrap an HTTP-status-coded error that callers can match via
// errors.Is.
var (
	// ErrNotFound — the docId is unknown to the host. Gateway
	// closes the WS with code 4404 ("doc not found"); client
	// should not retry.
	ErrNotFound = errors.New("host: doc not found")

	// ErrForbidden — auth token rejected or permissions
	// revoked. WS close code 4401; client must re-auth and
	// reconnect.
	ErrForbidden = errors.New("host: forbidden")

	// ErrConflict — Snapshot rejected due to version mismatch
	// or external lock. The snapshot worker may retry after a
	// fresh CheckFileInfo / re-fetch.
	ErrConflict = errors.New("host: conflict")
)
