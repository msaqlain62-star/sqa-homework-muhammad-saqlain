# Data-layer reasoning

Inferred only from what the product exposes: pre-login chat works without an account, replies stream, each reply carries its own **feedback** control, signup is email + password with a **verification email** gate, and the logged-in surface shows a **referral link** and **ASK token** earning.

## (a) Sending a message to the agent

Anonymous users get replies, so a conversation must exist before any user does. That implies a session identity separate from user identity, and a later backfill when someone signs up.

- `conversations` — `id`, `session_id`, `user_id` (nullable until signup), `created_at`
- `messages` — `id`, `conversation_id`, `role` (`user`/`agent`), `content`, `created_at`, `completed_at`, `stop_reason` (`complete`/`stopped`/`error`)
- `message_feedback` — `id`, `message_id`, `rating`, `created_at`

`stop_reason` is not a guess: the app has a **stop button** and renders "Response stopped!", so an interrupted generation is a distinct persisted state and analytics must not count it as a delivered answer.

## (b) Creating an account

- `users` — `id`, `email`, `password_hash`, `email_verified_at` (nullable), `created_at`
- `referrals` — `id`, `referrer_user_id`, `referred_user_id`, `code`, `created_at`
- `token_balances` / `token_events` — `user_id`, `amount`, `event_type`, `created_at`

## Verification queries

```sql
-- 1. Every user turn got an agent reply, and none are stuck mid-stream.
SELECT m.conversation_id, m.id, m.created_at
FROM messages m
WHERE m.role = 'user'
  AND m.created_at > now() - interval '1 hour'
  AND NOT EXISTS (
    SELECT 1 FROM messages r
    WHERE r.conversation_id = m.conversation_id
      AND r.role = 'agent'
      AND r.created_at >= m.created_at
      AND r.completed_at IS NOT NULL
  );

-- 2. No orphans, and timestamps are sane (completed never precedes created).
SELECT 'orphan_message' AS issue, m.id::text FROM messages m
LEFT JOIN conversations c ON c.id = m.conversation_id
WHERE c.id IS NULL
UNION ALL
SELECT 'reversed_timestamps', m.id::text FROM messages m
WHERE m.completed_at IS NOT NULL AND m.completed_at < m.created_at
UNION ALL
SELECT 'feedback_without_message', f.id::text FROM message_feedback f
LEFT JOIN messages m ON m.id = f.message_id
WHERE m.id IS NULL;

-- 3. Signup wrote a complete row and did not grant tokens before verification.
SELECT u.id, u.email, u.email_verified_at, COALESCE(SUM(t.amount), 0) AS granted
FROM users u
LEFT JOIN token_events t ON t.user_id = u.id
WHERE u.created_at > now() - interval '1 day'
GROUP BY u.id, u.email, u.email_verified_at
HAVING u.email IS NULL
    OR u.password_hash IS NULL
    OR (u.email_verified_at IS NULL AND COALESCE(SUM(t.amount), 0) > 0);
```

## Downstream pipeline check

Assert that **no `token_events` row exists for a user whose `email_verified_at` is null** at load time, and fail the load rather than warn. Unverified accounts earning ASK is the shape of a real abuse path — a referral loop on throwaway emails — and it corrupts both the token ledger and every acquisition metric built on it. It is exactly the kind of error that looks like growth on a dashboard until someone reconciles the ledger.
