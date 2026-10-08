# Ko-fi crystal dice access

The `vampire-3d-dice` flag in PostHog project 95399 grants crystal dice when the
signed-in Progeny account email matches a donor email. Historical donors were
imported into its release conditions from the supplied payment CSV. The CSV and
donor emails are not stored in this repository.

## Backend configuration

Deploy the backend with these server-only environment variables:

- `KO_FI_VERIFICATION_TOKEN`: copy the verification token from https://ko-fi.com/manage/webhooks.
- `POSTHOG_MANAGEMENT_API_KEY`: a personal API key restricted to Progeny project
  95399 with feature flag read/write permission. This is different from the public
  `phc_` ingestion key. Do not put it in frontend variables.
- `POSTHOG_MANAGEMENT_HOST=https://eu.posthog.com`
- `POSTHOG_MANAGEMENT_PROJECT_ID=95399`
- `KO_FI_CRYSTAL_FLAG_ID=306399`

Restart the backend after configuring its environment. `POST /webhooks/ko-fi`
returns 503 while either secret is missing; other app features remain available.

## Ko-fi setup

1. Open https://ko-fi.com/manage/webhooks.
2. After deployment, set the webhook URL to
   `https://api-progeny.odin-matthias.de/webhooks/ko-fi`.
3. Copy its verification token into the backend environment as described above.
4. Send a Ko-fi test payment and confirm HTTP 200. The test payment's email will
   be granted access as well; remove that release condition if it is a dummy address.
5. Confirm the email appears in flag 306399's release conditions. Sign into Progeny
   with that email and reload the sheet to refresh PostHog's feature flags.

All supported positive payment types (donations, memberships, shop orders and
commissions) grant lasting access. Membership cancellation or refunds do not
revoke it; Ko-fi's payment webhook does not supply those lifecycle notifications.
Supporters who pay with a different email need an explicit manual grant for their
Progeny account email. Donors can register later; email targeting already covers them.

## Implementation

`backend/src/routes/kofi.ts` parses Ko-fi's form-encoded `data` JSON, validates it
with Zod and checks the verification token in constant time. Only this matched
POST route is exempt from browser CSRF because Ko-fi cannot send a session cookie.
Other mutation routes keep their CSRF checks.

`backend/src/utils/kofiCrystalAccess.ts` reads the existing flag, verifies its key
and enabled state, and adds a case-insensitive, anchored email condition at 100%.
Repeated deliveries for an email are idempotent. Updates preserve all other
conditions and carry the flag version and original filters, retrying conflicts
against the newest definition. Upstream failures return 503 so Ko-fi can retry;
200 is returned only after access is stored. No donor account has to exist yet.

The native PostHog incoming webhook was tested and does not preserve Ko-fi's
form-encoded payload. The exploratory source was removed; use the backend URL.
