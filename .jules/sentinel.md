## 2026-10-24 - CORS Wildcard with Credentials Vulnerability
**Vulnerability:** The CORS origin resolver `corsOriginResolver` returned `*` when the `origin` header was missing or explicitly allowed. This is invalid and highly dangerous when used on routes configured with `credentials: true`.
**Learning:** The fallback was likely added for ease of use with curl or mobile requests without `origin` headers, but overlooked the fact that `auth-routes.ts` explicitly sets `credentials: true`. Security scanners will rightfully flag this configuration.
**Prevention:** For CORS middleware, if an endpoint uses `credentials: true`, never return a wildcard `*`. Always fallback to a specific allowed origin (e.g. `allowedOrigins[0]`) or throw an error.
