# AI summary release gate (Playwright + TypeScript)

A release gate for a support-dashboard feature: an agent clicks **Generate summary**, then approves a valid summary or retries a failed generation. Everything runs locally on synthetic data. No credentials, paid services or AI calls.

## Setup

```bash
npm install            # commit package-lock.json so CI can use `npm ci`
npx playwright install chromium
```

## Commands

| Goal | Command |
|---|---|
| Full passing run | `npm test` |
| UI tests only | `npm run test:ui` |
| Summary eval only (no browser) | `npm run test:eval` |
| Type check | `npm run typecheck` |
| Intentional regression (must FAIL) | `npm run test:regression` |
| Open last report | `npm run report` |

### Intentional regression
`npm run test:regression` starts the fixture with `BREAK_CITATION_CHECK=1`. The dashboard then skips the "every cited id must belong to this ticket" rule, so a cross-ticket summary becomes approvable.
Expected: the UI project fails on 3 tests (`cites a message from another ticket`, `cites an unknown message id`, `same ids are invalid on a different ticket`). Run `npm run report` to see the trace and screenshot, where Approve is enabled when it must be disabled. CI also runs this and requires the suite to fail (`gate-sensitivity` job), so a gate that stops detecting the bug blocks release.

## Layout

```
public/            fixture dashboard (index.html, app.js) + rules.js (citation rule) + tickets.js (synthetic data)
server/server.js   static server; unmocked /api calls return 404
src/               evaluate.ts (eligibility), grounding.ts (extra risk check)
tests/fixtures.ts  Dashboard page object + service mock fixture
tests/ui/          dashboard behaviour
tests/eval/        deterministic summary evaluation + labelled dataset
.github/workflows/ CI
```

## Where the line is drawn

**UI tests** (`tests/ui`) check what the agent sees and can do: states, button enablement, retry behaviour, and that an ineligible summary can never be approved. The service is mocked at the network boundary with `page.route`, so each test controls its own responses. Tests never judge summary wording; they only check the UI shows what the mock returned.

**Service/eval checks** (`tests/eval`) judge the *payload*, with no browser: citation validity (shared `rules.js`, the same code the UI uses) and one extra risk.

**Extra risk: unsupported specifics.** A summary can cite a real message and still invent a refund amount or order number. Every number or identifier in the summary must appear in the text of the messages it cites. The dataset includes a case where a true fact is attributed to the wrong message.

**Parallel safety:** one `Dashboard` fixture instance per test, per-test route handlers and call counters, no shared server state, `fullyParallel: true`, ticket data read-only.

**What these checks establish:** the dashboard enforces its approval rules for every response shape in the contract, and the deterministic rules classify a hand-labelled synthetic set correctly. They are regression protection for the gate.

**What they do not establish:** that a live model writes faithful, useful summaries. Test separately against a live model:
- faithfulness and omission on a larger labelled set of realistic tickets (human-reviewed sample plus a rubric or judge model, tracked as a rate with a threshold)
- citation precision: does the cited message actually support the claim?
- prompt injection inside ticket text, PII leakage, tone and escalation handling
- latency, timeouts and rate limits; behaviour on very long tickets
- drift when the model, prompt or retrieval changes (run on every such change plus nightly)

## Release-blocking criteria

Blocks release (required check: `release-gate`):
1. Any `ui` test fails, especially anything where Approve is enabled for a missing, empty or cross-ticket citation, or enabled while the service is down or has insufficient information.
2. Any `eval` case misclassified (an unacceptable summary judged eligible is the critical direction).
3. Type check fails.
4. The gate-sensitivity job sees the intentional regression pass (the gate has gone blind).
5. Flaky tests: no retries are configured, so a flake fails the build and is fixed or quarantined with an owner, not hidden.

Would not block (not built yet): visual polish, cross-browser smoke failures on non-critical paths, live-model quality trends above the agreed floor (these alert the owner but do not stop a release).

## Failure evidence

CI uploads `playwright-report/` (HTML) and `test-results/` (trace.zip, screenshots, videos on failure, `junit.xml`) for 14 days. Debug locally with `npx playwright show-trace test-results/<test>/trace.zip`.

## What I would add next

- Contract tests for the real service (schema validation of the 3 response shapes, including malformed 200s)
- Live-model eval job (nightly + on prompt/model change) with a thresholded faithfulness rate, not a binary gate
- Enforce grounding and citation checks server-side so the UI is not the only line of defence
- Accessibility checks (axe), keyboard-only approval path, double-click and in-flight request races
- Cross-browser matrix and a sharded run as the suite grows

## AI tool usage

*(Edit this to reflect what you actually did.)* I used Claude to scaffold the repo structure and draft the fixture app, tests and workflow. I verified the output by reading every file, running the suite locally, running `npm run test:regression` to confirm the gate fails for the right reason, reading the trace for one failing test, and fixing anything I did not understand before keeping it.
