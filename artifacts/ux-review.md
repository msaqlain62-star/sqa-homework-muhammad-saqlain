# User-experience review

Desktop: Chrome 1440×900. Mobile: Android phone, Chrome (real device).

## What works

The agent answers pre-login, so the product demonstrates itself before asking for anything. The send control becoming a stop control is honest feedback that generation is running, and referral sharing uses the native share sheet rather than reinventing it.

Mobile gets right two things chat UIs usually break: the keyboard clips only the header, never the input or latest reply, and the transcript auto-scrolls as replies land.

## What's rough

**The referral link is `http://`, not `https://`.** The share sheet emits `http://ask.permission.ai/register?rc=...`. For a product whose pitch is that users own their data, shipping the growth loop over plaintext is a credibility problem before a technical one.

**Stopping a reply throws the answer away.** Stop discards the partial text entirely, leaving only "Generation stopped!". Users usually stop because a reply is long, not wrong; they lose everything generated. Tokens are spent either way.

**Email verification is a dead end.** Signup ends on "follow the link we just sent". *Resend Verification Email* only appends a line about spam — no confirmation, no cooldown, no address shown. Users cannot tell it did anything, so they press it repeatedly.

**Signup discards the pre-login conversation** — someone who signed up because an answer landed meets an empty screen. On mobile, **suggested topics stack vertically,** consuming the first screen and burying the free-text input.

## Prioritised improvements

**1. Serve the referral link over HTTPS.** Cheapest fix here, highest downside if left: it sits in the acquisition path and contradicts the brand promise. Measure: zero `http://` links emitted; referral click-through.

**2. Confirm and rate-limit the verification resend.** This gates activation, so every drop is a fully-acquired user lost. Change: a confirmation toast, a 30-second countdown, and the destination address shown so typos are visible. Measure: verification completion rate; resends per account.

**3. Keep the partial text when a reply is stopped.** Mark it stopped, offer regenerate. Affects every user who stops, and discards work already paid for. Measure: stopped replies followed by another message rather than abandonment.

**4. Carry the pre-login conversation into the new account.** Bind the anonymous session to the user record at signup and restore it on first authenticated load. Measure: day-one return rate for pre-signup chatters.

**5. Collapse the mobile topic list** behind a "more" affordance so the input sits above the fold. Measure: mobile sessions using free-text input.
