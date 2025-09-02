# Scripts Overview

Helper documentation for the scripts in this folder.

## Scripts

- `uploadNameRec.ts` – Seed `NameReconciliation` items into local sandbox or a deployed backend.
- `tailAmplifyLogs.ts` – Tail AWS Amplify Hosting deployment logs for a branch/job.

Both scripts load environment variables via `dotenv` at startup:

- Loads `.env` and then `.env.local` (if present)
- Existing shell env vars take precedence over file-based values

Recommended `.env.local` keys:

```sh
# AWS credentials/target (example values)
AWS_PROFILE=platform-admin-lon
AWS_REGION=eu-west-2

# Amplify Hosting
AWS_APP_ID=d2xxxxxxxxxxxx
AWS_BRANCH=main
```

## Seed Name Reconciliation Data (Local Sandbox)

```bash
npx ampx sandbox  # run in another terminal
npm run seed:name-rec -- --file data/name_rec/name_rec_637489.json
npm run seed:name-rec -- --directory data/name_rec --limit 10
```

Upload entire directory:

```bash
npm run seed:name-rec -- --directory data/name_rec
```

Dry run (no writes):

```bash
npm run seed:name-rec -- --directory data/name_rec --limit 5 --dryRun
```

Clear existing data before upload:

```bash
npm run seed:name-rec -- --directory data/name_rec --clearData
```

## Seed Against a Deployed Backend

### Using amplify_outputs file (deployment bundle)

If you have a deployment outputs file:

```bash
npm run seed:name-rec -- --outputs path/to/amplify_outputs.deployment.main.json --directory data/name_rec --limit 10
```

Clear existing data before upload to deployment:

```bash
npm run seed:name-rec -- --outputs path/to/amplify_outputs.deployment.main.json --directory data/name_rec --clearData
```

To get the deployment config file:

1. Go to **AWS Console** → **AWS Amplify** → **All apps** → **wc_name_rec_eval**
2. Under **Branches**, click on the branch **main**
3. Click on the tab: **Deployed backend resources**
4. Click **"Download amplify_outputs.json"** to get the deployment configuration file
5. Save it as `amplify_outputs.deployment.main.json` at your project root

### List Available AppSync APIs (Helper)

You can list all GraphQL APIs (name, id, endpoint) first:

```bash
# Using npm script (set AWS_PROFILE / AWS_REGION first)
AWS_PROFILE=platform-admin AWS_REGION=eu-west-2 npm run list:appsync

# Direct AWS CLI
aws appsync list-graphql-apis \
  --region eu-west-2 \
  --profile platform-admin \
  --query 'graphqlApis[].{name:name,id:apiId,url:uris.GRAPHQL}'
```

## Tail Amplify Deployment Logs

Use the log tailing script to stream CloudWatch logs from the latest or running Amplify job.

With `.env.local` (recommended):

```bash
# Ensure .env.local has AWS_APP_ID, AWS_BRANCH, AWS_REGION, AWS_PROFILE
# Defaults to the Build step
npm run tail:amplify -- --since 30m
```

List recent jobs for the branch:

```bash
npm run tail:amplify:list
```

Interactively choose job and step:

```bash
npm run tail:amplify:choose
```

Common steps you can target with `--step`:

- Provision: environment setup before build
- Build: application build logs (default in `tail:amplify`)
- Deploy: deployment of built artifacts
- Verify: post-deploy verification

Note: Actual step names can vary by app. Use `npm run tail:amplify:list` or `npm run tail:amplify:choose` to see the precise step names for a job.

Explicit flags (no env vars):

```bash
npm run tail:amplify -- --appId d2xxxxxxxxxxxx --branch main --region eu-west-2 --profile platform-admin-lon
```

Flags:

```txt
--appId <id>        Amplify App ID (or env AWS_APP_ID/AMPLIFY_APP_ID)
--branch <name>     Branch name (or env AWS_BRANCH/AMPLIFY_BRANCH)
--region <region>   AWS region (or env AWS_REGION/AMPLIFY_REGION)
--profile <name>    AWS CLI profile (or env AWS_PROFILE)
--jobId <id>        Specific job ID
--step <name>       Prefer step (e.g., Build, Deploy)
--list              List recent jobs and exit
--interactive       Choose job/step via prompt
--since <duration>  Lookback window (e.g., 10m, 1h)
--no-follow         Print and exit without following
--open              Open the CloudWatch log URL in browser
```
