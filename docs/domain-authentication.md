# Domain Authentication (SPF / DKIM / DMARC)

Sender-domain authentication is the single biggest factor in email
deliverability. This platform does not and cannot bypass spam filtering —
the responsible path is proper domain authentication, and this page exists
to make sure whoever operates the platform sets it up correctly.

## SPF (Sender Policy Framework)

A DNS TXT record on your sending domain listing which mail servers are
allowed to send on its behalf. Resend publishes the exact SPF record to add
when you verify a domain in their dashboard — add it there, not by hand.

## DKIM (DomainKeys Identified Mail)

A DNS TXT record containing a public key; Resend signs outgoing messages
with the matching private key so receiving servers can verify the message
wasn't altered in transit and genuinely came from your domain. Resend
provides the exact CNAME/TXT records to add during domain verification.

## DMARC (Domain-based Message Authentication, Reporting & Conformance)

A DNS TXT record declaring what receiving servers should do with mail that
fails SPF/DKIM checks (quarantine, reject, or none) and where to send
aggregate reports. Start with `p=none` while monitoring, then tighten to
`p=quarantine` or `p=reject` once you've confirmed all legitimate senders
pass.

## Where this shows up in the app

The Settings → Resend Configuration page displays domain verification
status as reported by Resend's domain API, where Resend exposes it. This is
read-only, sourced from Resend — the platform does not claim to configure
or fix DNS on your behalf; you make the DNS changes with your registrar/DNS
provider.

## Why this matters more than any in-app "spam protection" feature

No application-level trick makes an unauthenticated domain deliverable.
Mailbox providers weight domain authentication heavily. Skipping this step
means high-quality template content and a clean recipient list will still
land in spam.
