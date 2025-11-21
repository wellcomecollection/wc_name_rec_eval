#!/usr/bin/env tsx
/**
 * Export NameReconciliation records from the Amplify Data backend.
 *
 * Supports JSON (default, lossless) and CSV (flattened) output.
 *
 * Examples:
 *   # Export all records to JSON (default path)
 *   npx tsx scripts/downloadNameRec.ts
 *
 *   # Explicit output and format
 *   npx tsx scripts/downloadNameRec.ts --out data/exports/name_rec_export.json --format json
 *   npx tsx scripts/downloadNameRec.ts --out data/exports/name_rec_export.csv --format csv
 *
 *   # Use deployment outputs file instead of local sandbox
 *   npx tsx scripts/downloadNameRec.ts --outputs amplify_outputs.deployment.main.json
 *
 *   # Limit number of records (for testing)
 *   npx tsx scripts/downloadNameRec.ts --limit 100
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import outputs from '../amplify_outputs.json';
import dotenv from 'dotenv';

// Load base env first, then local overrides (without clobbering existing shell env)
dotenv.config();
dotenv.config({ path: '.env.local' });

type OutputFormat = 'json' | 'csv';

interface Options {
  outputsPath?: string;
  apiKey?: string;
  format: OutputFormat;
  outPath?: string;
  limit?: number;
  verbose?: boolean;
}

interface NameRecRecord {
  id: string;
  label: string;
  idx: string;
  reconciled_labels?: unknown;
  candidates?: unknown;
  reconciled_labels_evaluations?: unknown;
  evaluator_id?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function parseArgs(argv: string[]): { options: Options } {
  const options: Options = {
    format: 'json',
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--outputs' || a === '-o') {
      options.outputsPath = argv[++i];
    } else if (a === '--apiKey') {
      options.apiKey = argv[++i];
    } else if (a === '--format' || a === '-f') {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'csv') {
        options.format = fmt;
      } else {
        console.warn(`Unknown format "${fmt}", falling back to json`);
        options.format = 'json';
      }
    } else if (a === '--out' || a === '-p') {
      options.outPath = argv[++i];
    } else if (a === '--limit' || a === '-l') {
      const val = parseInt(argv[++i] ?? '', 10);
      if (!Number.isNaN(val) && val > 0) {
        options.limit = val;
      }
    } else if (a === '--verbose' || a === '-v') {
      options.verbose = true;
    } else if (a === '--help' || a === '-h') {
      printHelpAndExit();
    } else if (a.startsWith('-')) {
      console.warn(`Unknown flag: ${a}`);
    }
  }

  return { options };
}

function printHelpAndExit(code = 0) {
  console.log(
    `Export NameReconciliation records\n\n` +
      `Flags:\n` +
      `  --outputs|-o <path>   Path to amplify_outputs.json for target deployment (defaults to local sandbox)\n` +
      `  --apiKey <key>        Override API key (use with --outputs or env vars)\n` +
      `  --format|-f <fmt>     Output format: json|csv (default: json)\n` +
      `  --out|-p <path>       Output file path (default: data/exports/name_rec_export.<fmt>)\n` +
      `  --limit|-l <number>   Limit number of records to export (useful for testing)\n` +
      `  --verbose|-v          Verbose logging (show chosen config)\n` +
      `  --help|-h             Show help\n\n` +
      `Examples:\n` +
      `  npx tsx scripts/downloadNameRec.ts\n` +
      `  npx tsx scripts/downloadNameRec.ts --format csv --out data/exports/name_rec_export.csv\n` +
      `  npx tsx scripts/downloadNameRec.ts --outputs amplify_outputs.deployment.main.json\n`
  );
  process.exit(code);
}

function resolveConfig(options: Options): { config: any; source: string } {
  let resolvedConfig: any = undefined;
  let configSource = '';

  if (options.outputsPath) {
    const op = path.resolve(options.outputsPath);
    resolvedConfig = JSON.parse(fs.readFileSync(op, 'utf8'));
    configSource = `outputsFile:${op}`;
  } else if (process.env.AMPLIFY_API_URL && process.env.AMPLIFY_API_KEY) {
    resolvedConfig = {
      data: {
        url: process.env.AMPLIFY_API_URL,
        api_key: process.env.AMPLIFY_API_KEY,
        aws_region: process.env.AMPLIFY_REGION || 'us-east-1',
        default_authorization_type: 'API_KEY',
        authorization_types: [],
      },
    };
    configSource = 'envVars';
  } else {
    resolvedConfig = outputs;
    configSource = 'amplify_outputs.json (local sandbox)';
  }

  // For CLI scripts we usually want to use the API key
  // rather than Cognito user pools. If an api_key is present,
  // prefer API_KEY as the default authorization type so the
  // Data client does not require a signed-in user.
  if (resolvedConfig?.data?.api_key) {
    resolvedConfig.data.default_authorization_type = 'API_KEY';
    if (!resolvedConfig.data.authorization_types) {
      resolvedConfig.data.authorization_types = ['API_KEY'];
    } else if (
      Array.isArray(resolvedConfig.data.authorization_types) &&
      !resolvedConfig.data.authorization_types.includes('API_KEY')
    ) {
      resolvedConfig.data.authorization_types.push('API_KEY');
    }
    configSource += '+forceApiKeyAuth';
  }

  // Inject model_introspection if missing
  if (!(resolvedConfig as any)?.data?.model_introspection) {
    try {
      const local = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../amplify_outputs.json'), 'utf8')
      );
      if (local?.data?.model_introspection) {
        (resolvedConfig as any).data.model_introspection = local.data.model_introspection;
        configSource += '+modelIntrospection';
      }
    } catch {
      // ignore
    }
  }

  if (options.apiKey) {
    if (!resolvedConfig.data) resolvedConfig.data = {};
    resolvedConfig.data.api_key = options.apiKey;
    configSource += '+apiKeyOverride';
  }

  return { config: resolvedConfig, source: configSource };
}

function postWithApiKey(urlString: string, apiKey: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlString);
      const payload = JSON.stringify(body);

      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'content-length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ statusCode: res.statusCode, body: parsed });
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on('error', (err) => reject(err));
      req.write(payload);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function verifyApiKeyAccess(config: any) {
  const url = config?.data?.url;
  const apiKey = config?.data?.api_key;
  if (!url || !apiKey) return;

  const query = `
    query ListNameReconciliations($limit: Int) {
      listNameReconciliations(limit: $limit) {
        items { id }
        nextToken
      }
    }
  `;

  const { statusCode, body } = await postWithApiKey(url, apiKey, {
    query,
    variables: { limit: 1 },
  });

  if (statusCode !== 200) {
    throw new Error(
      `AppSync responded with HTTP ${statusCode} when testing API key access. ` +
        `Check that the key in your amplify_outputs file is valid for this API.`
    );
  }

  if (body && Array.isArray(body.errors) && body.errors.length > 0) {
    const messages = body.errors.map((e: any) => e?.message || '').join(' | ');
    throw new Error(
      `API key is not authorized to query NameReconciliation (errors: ${messages}). ` +
        `This often means the key is expired, misconfigured, or for a different backend.`
    );
  }
}

async function fetchAllRecords(
  client: ReturnType<typeof generateClient<Schema>>,
  limitPerPage: number,
  maxTotal?: number
): Promise<NameRecRecord[]> {
  const all: NameRecRecord[] = [];
  let nextToken: string | undefined = undefined;

  do {
    const page: { data: NameRecRecord[]; nextToken?: string | null } =
      await client.models.NameReconciliation.list({
        limit: limitPerPage,
        nextToken,
      } as any);

    if (page.data && page.data.length > 0) {
      for (const item of page.data) {
        all.push(item);
        if (maxTotal && all.length >= maxTotal) {
          return all;
        }
      }
    }

    nextToken = (page.nextToken ?? undefined) as string | undefined;
  } while (nextToken);

  return all;
}

function ensureDirectoryForFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(outPath: string, records: NameRecRecord[]) {
  ensureDirectoryForFile(outPath);
  fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');
}

function toCsv(records: NameRecRecord[]): string {
  const headers = [
    'id',
    'label',
    'idx',
    'evaluator_id',
    'reconciled_labels',
    'reconciled_labels_evaluations',
    'candidates',
    'createdAt',
    'updatedAt',
  ];

  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines: string[] = [];
  lines.push(headers.join(','));

  for (const r of records) {
    const rowValues: string[] = [];
    for (const h of headers) {
      let v: unknown;
      switch (h) {
        case 'id':
          v = r.id;
          break;
        case 'label':
          v = r.label;
          break;
        case 'idx':
          v = r.idx;
          break;
        case 'evaluator_id':
          v = r.evaluator_id ?? '';
          break;
        case 'reconciled_labels':
          v =
            r.reconciled_labels !== undefined
              ? JSON.stringify(r.reconciled_labels)
              : '';
          break;
        case 'reconciled_labels_evaluations':
          v =
            r.reconciled_labels_evaluations !== undefined
              ? JSON.stringify(r.reconciled_labels_evaluations)
              : '';
          break;
        case 'candidates':
          v =
            r.candidates !== undefined ? JSON.stringify(r.candidates) : '';
          break;
        case 'createdAt':
          v = (r as any).createdAt ?? '';
          break;
        case 'updatedAt':
          v = (r as any).updatedAt ?? '';
          break;
        default:
          v = (r as any)[h];
      }
      rowValues.push(escape(v));
    }
    lines.push(rowValues.join(','));
  }

  return lines.join('\n');
}

function writeCsv(outPath: string, records: NameRecRecord[]) {
  ensureDirectoryForFile(outPath);
  const csv = toCsv(records);
  fs.writeFileSync(outPath, csv, 'utf8');
}

async function main() {
  const { options } = parseArgs(process.argv.slice(2));

  const defaultOut =
    options.format === 'csv'
      ? 'data/exports/name_rec_export.csv'
      : 'data/exports/name_rec_export.json';

  const outPath = options.outPath
    ? path.resolve(options.outPath)
    : path.resolve(defaultOut);

  const { config, source } = resolveConfig(options);
  Amplify.configure(config as any);

  if (options.verbose) {
    const url = (config as any)?.data?.url;
    console.log(`[export] Config source: ${source}`);
    if (url) console.log(`[export] Target GraphQL URL: ${url}`);
    console.log(`[export] Output: ${outPath}`);
    console.log(`[export] Format: ${options.format}`);
  }

  // Fail fast with a clear message if the API key
  // in the outputs file is not actually authorized.
  if ((config as any)?.data?.api_key) {
    await verifyApiKeyAccess(config);
  }

  const client = generateClient<Schema>();

  console.log('Fetching NameReconciliation records...');
  const records = await fetchAllRecords(client, 1000, options.limit);

  console.log(`Fetched ${records.length} record(s). Writing to ${outPath} as ${options.format.toUpperCase()}...`);

  if (options.format === 'csv') {
    writeCsv(outPath, records);
  } else {
    writeJson(outPath, records);
  }

  console.log('Export complete.');
}

main().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
