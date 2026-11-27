# Owner authentication and authorization

## Providers

The API supports Google and LinkedIn OpenID Connect using the authorization-code flow. Spring Security handles the state parameter and OIDC nonce; the authorization request resolver adds PKCE. Client IDs and secrets are environment-only values.

## Owner identity allowlist

An authenticated provider identity receives the admin role only when its exact immutable identity key is present in `ADMIN_ALLOWED_SUBJECTS`:

```text
<issuer>|<sub>,<issuer>|<sub>
```

Email address, display name and a hidden login URL are not authorization signals. Unlisted identities are rejected after provider authentication. Use the `issuer` and `sub` claims from the verified ID token to construct each entry.

## Session and browser protections

- Server-side HTTP session; no access token is returned to browser JavaScript.
- Session fixation protection migrates the session on authentication.
- HttpOnly session cookie, SameSite=Lax, Secure in production.
- For production set `SESSION_COOKIE_NAME=__Host-PORTFOLIO_SESSION` and `SESSION_COOKIE_SECURE=true`; do not set a cookie Domain attribute.
- CSRF protection remains enabled. The browser obtains a request token from `GET /api/v1/csrf` and sends it in `X-XSRF-TOKEN` for unsafe methods.
- CORS is an exact origin allowlist and permits credentials only for configured origins.
- Admin API paths require `ROLE_ADMIN`; public API routes are read-only.
- Logout invalidates the session and clears browser site data.

## OAuth redirect URIs

Register these exact callback paths with each provider, using the public API origin:

- `https://api.bchbenjamin.in/login/oauth2/code/google`
- `https://api.bchbenjamin.in/login/oauth2/code/linkedin`
- `https://api.bchbenjamin.in/login/oauth2/code/linkedin-publisher`

For local development use `http://localhost:3000/login/oauth2/code/google`, `http://localhost:3000/login/oauth2/code/linkedin` and `http://localhost:3000/login/oauth2/code/linkedin-publisher`.

LinkedIn OIDC product access and provider app approval are external prerequisites. The expected issuer claim is `https://www.linkedin.com`; the documented authorization, token, UserInfo and JWKS endpoints are configured explicitly. Do not treat the LinkedIn sign-in button as production-ready until the provider app has OIDC access and the callback has been verified end-to-end. LinkedIn's OIDC product provides account authentication and profile claims; LinkedIn explicitly cautions that it does not verify a member's real-world identity.

## Environment variables

See the root `.env.example`. Never commit provider credentials or real subject identifiers. The sample admin allowlist is intentionally empty, which denies all admin identities by default.
