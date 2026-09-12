# Resend Webhook Configuration

This platform relies on Resend's webhook system to update delivery, bounce,
open, and click status after a message leaves the queue. This document
explains how to wire it up for local development and production.

## 1. Webhook endpoint

```
POST https://<your-api-domain>/webhooks/resend
```

In local development, expose your API port (default `4000`) with a tunnel
(e.g. `ngrok http 4000`) and register the tunnel URL + `/webhooks/resend` as
the endpoint in the Resend dashboard.

## 2. Events to subscribe to

Enable at least:

- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.bounced`
- `email.complained`
- `email.opened`
- `email.clicked`
- `email.failed`

Resend signs webhook payloads using **Svix**. The API verifies every
incoming request with the `svix` package against `RESEND_WEBHOOK_SECRET`
before trusting any payload — requests that fail verification are rejected
with `401` and never touched.

> The exact event names/payload shape should be reconciled against Resend's
> current webhook documentation before going live — the mapping lives in a
> single isolated function in the API's webhooks module specifically so this
> is a one-place fix if Resend's naming differs from what's assumed here.

## 3. Webhook secret

Copy the signing secret shown when you create the webhook in the Resend
dashboard into `RESEND_WEBHOOK_SECRET` in your `.env`. Never commit this
value.

## 4. Local development strategy

Options, in order of preference:

1. **ngrok / cloudflared tunnel** pointed at your local API — real webhook
   deliveries hit your local machine.
2. **Manual replay** — Resend's dashboard lets you resend a webhook event to
   test your endpoint without waiting for a real delivery event.
3. **Synthetic test** — POST a hand-crafted, correctly-signed payload to
   `/webhooks/resend` using the `svix` CLI or SDK to generate a valid
   signature with your test secret.

## 5. Production setup

- Use a stable HTTPS endpoint (not a tunnel).
- Restrict the route so only Resend's signed payloads are processed — the
  signature check is the only gate; do not add IP allowlisting as a
  substitute for signature verification since Resend does not publish a
  fixed sending IP range for webhooks.
- Monitor failed webhook deliveries in the Resend dashboard — if the
  endpoint is down, Resend retries deliveries for a limited window.
