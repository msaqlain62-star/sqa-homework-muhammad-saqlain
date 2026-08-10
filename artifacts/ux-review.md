# User-experience review

Desktop: Chrome 1440×900. Mobile: Android phone, Chrome (real device).

## What works

The pre-login agent answers without an account, so the product demonstrates itself before asking for anything. The send control becoming a stop control is honest feedback that generation is running.

Mobile gets right two things chat UIs usually break: the keyboard clips only the header, never the input or latest reply, and the transcript auto-scrolls as a reply lands.

## What's rough

**Stopping a reply throws the whole answer away.** Stop does not keep the partial text — the response disappears entirely, leaving only "Generation stopped!". Users usually stop because a reply is long, not wrong; here they lose everything generated and start over. The tokens are spent either way.

**Email verification is a dead end.** Signup ends on "follow the link we just sent". *Resend Verification Email* only appends a line about checking spam — no confirmation the mail went, no cooldown, no address shown. Users cannot tell the button did anything, so they press it repeatedly. This is the last step before an account is activated.

**Signup discards the pre-login conversation.** After verifying and logging in, the earlier chat is gone. The strongest moment of intent — someone who signed up because an answer landed — meets an empty screen.

**Suggested topics stack vertically on mobile.** No sideways overflow, but the stack consumes most of the first screen, pushing the input down and burying the fact that free-text input exists.

## Prioritised improvements

**1. Confirm and rate-limit the verification resend.** This gates activation, so every drop is a fully-acquired user lost. Change: a toast confirming the send, the button disabled with a 30-second countdown, the destination address shown so typos are visible. Measure: verification completion rate; resend presses per account.

**2. Keep the partial text when a reply is stopped.** Mark it stopped and offer to regenerate. Affects every user who stops, and discards work already paid for. Measure: share of stopped replies followed by another message rather than abandonment.

**3. Carry the pre-login conversation into the new account.** Bind the anonymous session to the user record at signup and restore the transcript on first authenticated load. Measure: day-one return rate for users who chatted before signing up.

**4. Collapse the mobile topic list.** Show two or three pills with a "more" affordance so the input sits above the fold. Measure: share of mobile sessions using free-text input rather than pills alone.
