# Exporting Name Reconciliation Evaluation Data

This project includes a small CLI script to export `NameReconciliation` records from the Amplify Data backend (both sandbox and deployed backends).

It uses the same `amplify_outputs` configuration files that the app uses, but runs entirely from Node on your machine.

## Scripts and formats

- Script entry point: `scripts/downloadNameRec.ts`
- NPM script: `"export:name-rec": "tsx scripts/downloadNameRec.ts"`
- Output formats:
  - JSON (default, lossless)
  - CSV (flattened, good for spreadsheets)

### Typical commands

Export **from local sandbox** using the default `amplify_outputs.json`:

```bash
npm run export:name-rec
```

This writes JSON to:

```text
data/exports/name_rec_export.json
```

Export **from deployed “main” backend** using `amplify_outputs.deployment.main.json`:

```bash
npm run export:name-rec -- --outputs amplify_outputs.deployment.main.json \
  --format csv \
  --out data/exports/name_rec_main.csv \
  --verbose
```

Flags (subset):

- `--outputs <path>` – which `amplify_outputs*.json` to use.
- `--format json|csv` – output format (`json` default).
- `--out <path>` – output file (defaults under `data/exports/`).
- `--limit <n>` – limit the number of records (useful for testing).
- `--verbose` – log which backend URL/config is used.

## amplify_outputs files

There are usually two relevant outputs files in the project root:

- `amplify_outputs.json` – typically points at the **local sandbox** backend.
- `amplify_outputs.deployment.main.json` – points at the **deployed “main”** backend.

To refresh the **deployment** outputs file:

1. Go to AWS Console → **Amplify** → **All apps** → `wc_name_rec_eval`.
2. Under **Branches**, click the **`main`** branch.
3. Open the **Deployed backend resources** tab.
4. Click **“Download amplify_outputs.json”**.
5. Save this file in the repo root as `amplify_outputs.deployment.main.json`.

The export script does **not** modify these files; it reads them and adjusts auth mode in memory only.

## Auth modes and why the app can work when scripts fail

The AppSync API for this project supports multiple auth modes:

- **Cognito User Pools** – what the web UI uses after you sign in.
- **API key** – used by scripts / ops.
- **IAM** – for other internal tooling.

Important behaviour:

- The **web UI** uses Cognito JWTs, so it continues to work even if an **API key expires**.
- The **export script** uses the **API key** configured in `amplify_outputs*.json` so that it can run non‑interactively from Node.

This means it’s possible for:

- The UI to show lots of `NameReconciliation` records (via Cognito).
- The export script to fail or return 0 records because the API key it uses is expired or unauthorized.

## Failure modes and error messages

The export script performs a small test query using the API key before doing a full export. Common cases:

- **Expired/unauthorized API key**

  You’ll see an error like:

  ```text
  Export failed: Error: AppSync responded with HTTP 401 when testing API key access. Check that the key in your amplify_outputs file is valid for this API.
  ```

  or:

  ```text
  API key is not authorized to query NameReconciliation (errors: You are not authorized to make this call.)
  ```

  Fix:

  1. Go to AWS Console → **AppSync** → select the API whose URL matches `data.url` in your `amplify_outputs*.json`.
  2. In **Settings → API Keys**:
     - Create a new API key, or
     - Copy an existing active key.
  3. Update the `data.api_key` value in the appropriate `amplify_outputs*.json` (e.g. `amplify_outputs.deployment.main.json`).
  4. Re‑run the export command (ideally with `--verbose` to confirm the URL/config).

- **Wrong backend / wrong outputs file**

  Symptoms:

  - Script reports: `Fetched 0 record(s)` but you can see records in the UI.

  Checks:

  - Compare the `data.url` host in the `amplify_outputs*.json` you’re using to the GraphQL endpoint used by the running app in the browser dev tools.
  - Make sure you’re pointing at the correct outputs file via `--outputs`.

## Summary

- Use `npm run export:name-rec` to export evaluation data as JSON or CSV.
- Choose backend via `--outputs` and keep `amplify_outputs.deployment.main.json` up‑to‑date from the Amplify Console.
- If the script fails with 401 or “not authorized” errors, the API key in the outputs file is likely expired or for a different backend—regenerate or update it in AppSync and rerun.
