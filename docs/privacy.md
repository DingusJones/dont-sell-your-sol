# Privacy

The application asks only for a public address, never a signature or key. Default address selection is held in browser session memory. The opt-in remember checkbox stores only the public address in localStorage; Remove clears it and all wallet-scoped client query state and cancels pending client requests.

Live requests send that address to this application's same-origin server and any explicitly configured RPC endpoint. Providers can associate queries with the server's IP. Hosting infrastructure may have its own access logs; review retention before launch. Application code has no analytics or raw-address logging.

Successful server snapshots are held in bounded process memory for at most five minutes, lazily purged on reads/writes. No persistent wallet database. Removing a wallet clears the browser; it cannot revoke an already submitted provider query or immediately clear other server instances. No cache content is shared through HTTP caches (`no-store`). Rate controls also hold transient wallet/IP identifiers in memory.

Demo exploration makes no provider requests. Third-party images and unverified external links are not loaded. Dependencies are bundled locally; no remote fonts or scripts.
