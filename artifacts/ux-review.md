# User-experience review

Desktop: Chrome 1440×900. Mobile: <<< FILL: "real device — iPhone/Android model" or "Chrome responsive mode, 390×844" — state which >>>

## What works

The pre-login agent answers immediately without an account, which is the right call: the product demonstrates itself before it asks for anything. Replies stream, and the send control becoming a stop control gives clear, honest feedback that generation is in progress — many chat products leave you guessing. Per-reply feedback controls are present from the first answer.

## What's rough

**Interruption leaves no path forward.** Stopping a reply surfaces "Response stopped!" — but <<< FILL: does the partial answer stay in the transcript or vanish? Is there a regenerate/continue option? >>>. A user who stopped a reply because it was going the wrong way has no obvious next move.

**Email verification is a dead end with no feedback loop.** Signup ends on "follow the link we just sent". Pressing *Resend Verification Email* changes the screen only by appending a line about checking spam — no confirmation that a second email actually went, no cooldown, no countdown. A user who does not receive the first email cannot tell whether pressing the button did anything, so they press it repeatedly. This is the last step before an activated account, so every drop here is a fully-acquired user lost.

**Pre-login work is orphaned by signup.** <<< FILL: after verifying and logging in, is the pre-login conversation still there? >>> If it is discarded, the strongest moment of intent — a user who just got a good answer and signed up because of it — restarts from an empty screen.

## Mobile

<<< FILL — 10 minutes on a phone. Check: does the on-screen keyboard cover the input or the latest reply? Does the transcript auto-scroll as text streams, or do you have to chase it? Do the suggested topics overflow sideways? Is the stop button reachable one-handed? Does the referral link truncate? >>>

## Prioritised improvements

**1. Confirm and rate-limit the verification resend.** Observation and impact above. Change: a toast confirming the send, the button disabled with a 30-second countdown, and the destination address shown so a typo is visible. Measure: verification completion rate, and resend presses per account.

**2. Carry the pre-login conversation into the new account.** Change: bind the anonymous session to the user record at signup and restore the transcript on first authenticated load. Measure: day-one return rate for users who chatted before signing up.

**3. Give a stopped reply somewhere to go.** Change: keep the partial text, mark it stopped, and offer regenerate. Measure: share of stopped replies followed by another message rather than abandonment.

**4.** <<< FILL: your strongest mobile finding, phrased the same way — observation, why it matters, what you'd change, what you'd measure. >>>
