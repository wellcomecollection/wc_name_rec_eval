# Seeding Name Reconciliation Data & Fetching Deployment Outputs

Helper documentation for the scripts in this folder.

## Scripts

- `uploadNameRec.ts` – Seed `NameReconciliation` items into local sandbox or a deployed backend.

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

## Seed Against a Deployed Backend

### Using amplify_outputs file (deployment bundle)

If you have a deployment outputs file:

```bash
npm run seed:name-rec -- --outputs path/to/amplify_outputs.deployment.main.json --directory data/name_rec --limit 10
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

Copy the `id` for use with `--appSyncId`.

## Data Format

The script expects JSON files with the following structure:

```json
{
  "label": "Raymond, François.",
  "idx": 637489,
  "reconciled_labels": [
    {"label": "Raymond, François.", "idx": 637489},
    {"label": "Raymond, F. (François), 1769-", "idx": 490115}
  ],
  "candidates": [
    {"label": "François, Raymond.", "idx": 230277, "similarity": 0.8485022187232971},
    {"label": "Raymond, François.", "idx": 637489, "similarity": 0.8408583402633667}
  ]
}
```
