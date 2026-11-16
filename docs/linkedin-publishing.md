# LinkedIn publishing workflow

LinkedIn publishing is a separate OAuth connection from LinkedIn sign-in. The publisher registration requests `openid`, `profile`, `email` and `w_member_social`. The app must have the LinkedIn Sign In with OpenID Connect and member social publishing products/permissions approved by LinkedIn before this flow can succeed.

## Token storage

The publisher access token and optional refresh token are encrypted with AES-256-GCM before persistence. Each token has an independent random 96-bit IV and authentication tag. The encryption key is supplied only through `TOKEN_ENCRYPTION_KEY` as base64-encoded 32-byte material. Generate a key with:

```bash
openssl rand -base64 32
```

Do not rotate this key without a planned token re-encryption or reconnect operation; old ciphertext cannot be decrypted with a new key. Never commit the key or include it in frontend environment variables.

## Human approval workflow

1. Connect LinkedIn publishing from the private admin workspace.
2. Create a post draft; it enters `PENDING_REVIEW` and is not sent to LinkedIn.
3. Explicitly approve or reject the draft.
4. Only an `APPROVED` draft can be published, and the Publish action requires a separate confirmation.
5. A successful post is stored with its LinkedIn post URN. Failed API calls are marked `PUBLISH_FAILED` without storing provider error bodies or access tokens.

The API uses LinkedIn's current Posts API endpoint (`POST https://api.linkedin.com/rest/posts`) with the required `Linkedin-Version` and `X-Restli-Protocol-Version: 2.0.0` headers. Set `LINKEDIN_API_VERSION` to a currently supported six-digit YYYYMM version. Publishing is member-scoped and uses the authenticated LinkedIn subject to construct the person URN. There is no automatic or scheduled publishing in this phase.

## Endpoints

- `GET /api/v1/admin/linkedin/connection`
- `GET /api/v1/admin/linkedin/drafts`
- `POST /api/v1/admin/linkedin/drafts`
- `POST /api/v1/admin/linkedin/drafts/{id}/approve`
- `POST /api/v1/admin/linkedin/drafts/{id}/reject`
- `POST /api/v1/admin/linkedin/drafts/{id}/publish`

Every endpoint is owner-role protected and uses the same CSRF protection as the CMS. Draft creation, review and publishing are added to the admin audit trail.
