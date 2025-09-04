# NAme REconcilation SErvice (NARESE) Evaluation App

Entity proliferation and inconsistent naming across Works metadata (e.g. "John Smith", "J. Smith", "Smith, John (1870‑1932)") reduce search relevance, fragment aggregation, and complicate downstream enrichment. Existing processes detect near‑duplicate records but do not reconcile variant surface forms of the same underlying Person / Agent entity at scale.

This project provides a lightweight UI for evaluation. It proposes clustered person name candidates with explainable provenance by combining embedding‑based retrieval, similarity heuristics, and (future) selective LLM reasoning, while keeping manual curator load low. Monitoring and a structured 3,000‑row sampling protocol guard precision and detect drift.

## Features

- **Sampling & QA Workflow**: Reproducible 3,000‑row eyeball sample gating material algorithm changes.
- **Auth & Access Control**: Amazon Cognito integration for protected expert review screens.
- **GraphQL API (AppSync)**: Serves reconciliation candidates and evaluation state.
- **DynamoDB Storage**: Persists clusters, metrics, and audit metadata.
- **Dual Modes (Standard / Expert)**: Standard mode auto-routes evaluators to random unevaluated useful records; Expert mode adds indexed navigation, status filters, and batch submission.
- **Useful Record Filtering**: Automatically skips trivial self-only clusters (no secondary labels) to focus curator attention.
- **Per-Label Judgement Capture**: Yes / No / Unsure decisions stored per reconciled label with completeness gating (submit only when all labels decided).
- **Evaluator Attribution**: Records tagged with evaluator ID on advance/submit; per-user decision counts surfaced for throughput visibility.
- **Random Unevaluated Selection**: Biases assignment to remaining unevaluated useful records for balanced coverage.
- **Interactive Candidate Viewer**: Expandable panel showing all candidate labels with similarity scores and visual score cueing.
- **Filtering & Status Chips**: Substring idx filter plus evaluated / unevaluated toggles (expert mode) with dynamic counts.
- **Wrap-Around Navigation**: Previous/Next traversal restricted to useful records, wrapping when endpoints reached.
- **Evaluation Clearing**: One-click reset of evaluator assignment and label decisions for a record.
- **Progress Indicators**: Unevaluated counts, user contribution count, and leading evaluator benchmark.

## Quality & Evaluation Strategy

High‑level approach for validating person / agent name reconciliation quality.

### Current Evaluation Signals

- Manual spot checks on a uniformly random, reproducible sample (precision emphasis).
- Cluster cohesion: mean intra‑cluster cosine similarity vs a random cluster baseline.
- Drift / false positive guard: monitor proportion of empty reconciliation outputs (too high => threshold too strict; too low => likely precision erosion).
- Planned: ground‑truth subset (e.g. VIAF / LC authority IDs) to compute sampled F1.

### 3,000‑Row Eyeball Sample Rationale

- Goal: estimate non‑trivial correct reconciliation proportion with ±3 pp margin at 95% confidence.
- Pilot (n=400) found ~36% of rows are non‑trivial reconciliation opportunities.
- Required effective n for the proportion metric is inflated by 1 / 0.36 → draw ≈3,000 total rows to yield enough non‑trivial cases (Wilson / finite‑population adjusted logic).
- Seeded sampling for reproducibility; only used for QA/tuning (production runs are unsampled).

### Operational Policy

- Any material algorithmic change (model swap, similarity cutoff, prompt tweak, heuristic filter) ⇒ new 3k manual review before acceptance.
- Approve change if non‑trivial precision is within prior baseline ± target margin; otherwise iterate.
- Re‑sample if monitoring flags drift (e.g. sharp shift in empty reconciliation rate or candidate distribution).
- Keep the sample capped (curator fatigue mitigation); future: partial automation + authoritative ground truth to shrink/remove manual passes.

### Future Enhancements

- Integrate authority file ground truth slice for partial automation.
- Automate drift alerts (empty output rate, cohesion drop) feeding into re‑evaluation trigger.
- Curator UI to streamline rapid adjudication & audit trail.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/#deploy-a-fullstack-app-to-aws) of the AWS documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
