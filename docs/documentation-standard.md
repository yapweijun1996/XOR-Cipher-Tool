# Documentation Standard

This project uses a small documentation set so the code, logic, and long-running work stay understandable.

## Required Files

### README.md

Audience: new visitor or developer.

Must include:

- Project purpose.
- What the tool does.
- Security warning.
- Required features.
- Basic repository structure.
- Development stack.

### docs/logic.md

Audience: developer implementing or reviewing the cipher.

Must include:

- Encryption flow.
- Decryption flow.
- Numeric ciphertext format.
- Validation rules.
- Known limitations.

### docs/pwa-standard.md

Audience: developer adding install/offline support.

Must include:

- Required PWA files.
- Manifest requirements.
- Service Worker caching strategy.
- iOS icon and safe-area notes.
- Testing checklist.

### task.md

Audience: current developer or AI agent.

Purpose:

- Human-readable project task board.
- Shows current milestone, active task, completed tasks, and next steps.

### task.jsonl

Audience: automation, AI agents, and long-running work tracking.

Purpose:

- Append-only machine-readable task log.
- One JSON object per line.
- Useful when the project grows beyond one session.

## task.jsonl Format

Each line must be valid JSON.

Recommended shape:

```json
{"id":"TASK-001","status":"planned","title":"Create project documentation standard","created_at":"2026-05-12","updated_at":"2026-05-12","notes":"Initial documentation structure."}
```

Allowed statuses:

- `planned`
- `in_progress`
- `blocked`
- `done`
- `cancelled`

Rules:

- Do not rewrite old history unless correcting invalid JSON.
- Prefer appending a new line for meaningful state changes.
- Keep `id` stable.
- Use ISO date format: `YYYY-MM-DD`.

## Writing Style

- Keep docs short and practical.
- Prefer examples over abstract explanation.
- Document decisions that affect future implementation.
- Do not claim XOR is secure encryption.
- When security matters, state the limitation directly.
