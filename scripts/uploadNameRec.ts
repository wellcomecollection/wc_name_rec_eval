#!/usr/bin/env tsx
/**
 * Simple local Node.js (TS) script to upload NameReconciliation items using the Amplify Gen2 Data client.
 *
 * Usage:
 *   pnpm tsx scripts/uploadNameRec.ts --file data/name_rec/name_rec_637489.json
 *   pnpm tsx scripts/uploadNameRec.ts --directory data/name_rec
 *
 * Add --dryRun to preview without creating records.
 */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import fs from 'node:fs';
import path from 'node:path';
import outputs from '../amplify_outputs.json';

// Lightweight arg parsing
interface Options { 
  file?: string; 
  directory?: string;
  dryRun?: boolean; 
  outputsPath?: string; 
  apiKey?: string; 
  verbose?: boolean;
  limit?: number;
  clearData?: boolean;
}

interface NameRecData {
  label: string;
  idx: number;
  reconciled_labels: Array<{ label: string; idx: number }>;
  candidates: Array<{ label: string; idx: number; similarity: number }>;
}

function parseArgs(argv: string[]): { options: Options } {
  const options: Options = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file' || a === '-f') {
      options.file = argv[++i];
    } else if (a === '--directory' || a === '-d') {
      options.directory = argv[++i];
    } else if (a === '--outputs' || a === '-o') {
      options.outputsPath = argv[++i];
    } else if (a === '--apiKey') {
      options.apiKey = argv[++i];
    } else if (a === '--limit' || a === '-l') {
      options.limit = parseInt(argv[++i]);
    } else if (a === '--verbose' || a === '-v') {
      options.verbose = true;
    } else if (a === '--dryRun') {
      options.dryRun = true;
    } else if (a === '--clearData') {
      options.clearData = true;
    } else if (a === '--help' || a === '-h') {
      printHelpAndExit();
    } else if (a.startsWith('-')) {
      console.warn(`Unknown flag: ${a}`);
    }
  }
  return { options };
}

function printHelpAndExit(code = 0) {
  console.log(`Upload NameReconciliation seed data\n\n` +
`Flags:\n` +
`  --file|-f <path>       Single JSON file to upload\n` +
`  --directory|-d <path>  Directory containing JSON files to upload\n` +
`  --limit|-l <number>    Limit number of files to process (useful for testing)\n` +
`  --outputs|-o <path>    Path to amplify_outputs.json for target deployment (defaults to local)\n` +
`  --apiKey <key>         Override API key (use with --outputs or env vars)\n` +
`  --dryRun               Show what would be created without writing\n` +
`  --clearData            Delete all existing NameReconciliation records before upload\n` +
`  --verbose|-v           Verbose logging (show chosen config)\n` +
`  --help|-h              Show help\n\n` +
`Examples:\n` +
`  npx tsx scripts/uploadNameRec.ts --file data/name_rec/name_rec_637489.json\n` +
`  npx tsx scripts/uploadNameRec.ts --directory data/name_rec --limit 10\n` +
`  npx tsx scripts/uploadNameRec.ts --directory data/name_rec --dryRun\n` +
`  npx tsx scripts/uploadNameRec.ts --directory data/name_rec --clearData\n`);
  process.exit(code);
}

function loadNameRecFiles(options: Options): NameRecData[] {
  const items: NameRecData[] = [];

  if (options.file) {
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    items.push(validateNameRecData(parsed, filePath));
  } 
  
  if (options.directory) {
    const dirPath = path.resolve(options.directory);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.json'))
      .sort();

    const filesToProcess = options.limit ? files.slice(0, options.limit) : files;
    
    console.log(`Found ${files.length} JSON files in directory, processing ${filesToProcess.length}`);
    
    for (const file of filesToProcess) {
      const filePath = path.join(dirPath, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        items.push(validateNameRecData(parsed, filePath));
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
        throw error;
      }
    }
  }

  if (!options.file && !options.directory) {
    throw new Error('Must specify either --file or --directory');
  }

  return items;
}

function validateNameRecData(data: any, filePath: string): NameRecData {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid data structure in ${filePath}`);
  }
  
  if (typeof data.label !== 'string' || typeof data.idx !== 'number') {
    throw new Error(`Missing required fields (label, idx) in ${filePath}`);
  }

  return {
    label: data.label,
    idx: data.idx,
    reconciled_labels: Array.isArray(data.reconciled_labels) ? data.reconciled_labels : [],
    candidates: Array.isArray(data.candidates) ? data.candidates : []
  };
}

async function main() {
  const { options } = parseArgs(process.argv.slice(2));

  if (!options.file && !options.directory) {
    printHelpAndExit(1);
  }

  const items = loadNameRecFiles(options);

  if (!items.length) {
    console.log('No items to process');
    return;
  }

  // Choose configuration precedence (same as original script)
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
        authorization_types: []
      }
    };
    configSource = 'envVars';
  } else {
    resolvedConfig = outputs;
    configSource = 'amplify_outputs.json (local sandbox)';
  }

  // Inject model_introspection if missing
  if (!(resolvedConfig as any)?.data?.model_introspection) {
    try {
      const local = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../amplify_outputs.json'), 'utf8'));
      if (local?.data?.model_introspection) {
        (resolvedConfig as any).data.model_introspection = local.data.model_introspection;
        configSource += '+modelIntrospection';
      }
    } catch {/* ignore */}
  }

  if (options.apiKey) {
    if (!resolvedConfig.data) resolvedConfig.data = {};
    resolvedConfig.data.api_key = options.apiKey;
    configSource += '+apiKeyOverride';
  }

  Amplify.configure(resolvedConfig as any);
  
  if (options.verbose) {
    const url = (resolvedConfig as any)?.data?.url;
    console.log(`[seed] Config source: ${configSource}`);
    if (url) console.log(`[seed] Target GraphQL URL: ${url}`);
  }

  const client = generateClient<Schema>();

  // Clear existing data if requested
  if (options.clearData && !options.dryRun) {
    console.log('Clearing existing NameReconciliation records...');
    try {
      // Get all existing records
      const existingRecords = await client.models.NameReconciliation.list({
        limit: 10000 // Adjust if you expect more records
      });
      
      if (existingRecords.data && existingRecords.data.length > 0) {
        console.log(`Found ${existingRecords.data.length} existing records to delete`);
        
        // Delete each record
        let deleteCount = 0;
        for (const record of existingRecords.data) {
          try {
            await client.models.NameReconciliation.delete({ id: record.id });
            deleteCount++;
            if (options.verbose && deleteCount % 10 === 0) {
              console.log(`Deleted ${deleteCount}/${existingRecords.data.length} records...`);
            }
          } catch (err: any) {
            console.warn(`Failed to delete record ${record.id}: ${err.message}`);
          }
        }
        console.log(`Successfully deleted ${deleteCount} existing records`);
      } else {
        console.log('No existing records found to delete');
      }
    } catch (err: any) {
      console.error('Error clearing existing data:', err.message);
      process.exit(1);
    }
  }

  console.log(`Preparing to create ${items.length} NameReconciliation record(s)`);
  
  if (options.dryRun) {
    if (options.clearData) {
      console.log('Note: --clearData would delete all existing records before upload (not performed in dry run)');
    }
    console.log('Sample data:');
    console.table(items.slice(0, 3).map(item => ({
      label: item.label,
      idx: item.idx,
      reconciled_count: item.reconciled_labels.length,
      candidates_count: item.candidates.length
    })));
    console.log('Dry run complete (no writes performed).');
    return;
  }

  const results = [] as Array<{ index: number; id?: string; ok: boolean; error?: string; label?: string }>;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const createInput = {
        label: item.label,
        idx: item.idx,
        reconciled_labels: JSON.stringify(item.reconciled_labels),
        candidates: JSON.stringify(item.candidates),
        reconciled_labels_evaluations: JSON.stringify({}), // Initialize as empty object for individual evaluations
        evaluator_id: undefined // Initialize as undefined - will be set when user evaluates the record
      };

      const { data, errors } = await client.models.NameReconciliation.create(createInput);
      
      if (errors?.length) {
        results.push({ 
          index: i, 
          ok: false, 
          error: JSON.stringify(errors), 
          label: item.label 
        });
      } else {
        results.push({ 
          index: i, 
          ok: true, 
          id: data?.id, 
          label: item.label 
        });
        console.log(`Created NameReconciliation[${i}] id=${data?.id} label="${item.label}"`);
      }
    } catch (err: any) {
      results.push({ 
        index: i, 
        ok: false, 
        error: err.message, 
        label: item.label 
      });
    }
  }

  const failed = results.filter(r => !r.ok);
  const succeeded = results.filter(r => r.ok);
  
  console.log(`\nSummary: created ${succeeded.length}/${items.length} NameReconciliation records`);
  
  if (failed.length) {
    console.error('\nFailures:');
    failed.forEach(f => {
      console.error(`[${f.index}] ${f.label}: ${f.error}`);
    });
    process.exitCode = 1;
  }
  
  if (succeeded.length > 0) {
    console.log(`\nSuccessfully uploaded ${succeeded.length} name reconciliation records.`);
  }
}

main().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
