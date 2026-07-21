# AI Architecture and Safety

Recruiting AI is advisory. `lib/ai/recruitingOpenAi.ts` bounds payload size and timeout, requests structured JSON, sanitizes output, and falls back to deterministic logic. Recruiters remain responsible for hiring decisions.

`ai_observability_events` records task, model, latency, success, fallback use, confidence, prompt version, token counts, cache state, override state, error code, and correlation ID. It stores no prompt body, resume text, email, phone, token, or generated private content.

Controls:

- Treat candidate/job content as untrusted data, never as system instructions.
- Do not infer protected traits or use them for ranking.
- Show evidence and confidence; avoid unsupported claims.
- Version prompts and deterministic fallbacks together.
- Sample low-confidence and human-overridden outputs for quality review.
- Alert on latency, provider errors, fallback spikes, token anomalies, and confidence drift.
