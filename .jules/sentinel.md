## 2026-03-15 - CORS Misconfiguration
**Vulnerability:** Overly permissive CORS with credentials
**Learning:** Using '*' for origin when credentials are true is insecure and opens the door to cross-origin attacks.
**Prevention:** Explicitly define allowed origins in an array.
