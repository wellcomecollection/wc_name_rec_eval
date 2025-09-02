#!/usr/bin/env tsx
/**
 * Tail AWS Amplify Hosting deployment logs for the current/most recent job.
 *
 * Dependencies: AWS CLI v2 installed and configured (profile/region).
 * This script shells out to `aws amplify` and `aws logs tail`, so no extra npm deps.
 *
 * Usage examples:
 *   pnpm tsx scripts/tailAmplifyLogs.ts --appId d2abc123456789 --branch main --region eu-west-2
 *   pnpm tsx scripts/tailAmplifyLogs.ts --branch main  # uses env AWS_APP_ID/AMPLIFY_APP_ID
 *   pnpm tsx scripts/tailAmplifyLogs.ts --appId d2... --branch main --profile myprof --open
 *
 * Flags:
 *   --appId <id>           Amplify App ID (falls back to env AWS_APP_ID/AMPLIFY_APP_ID)
 *   --branch <name>        Branch name to inspect (falls back to env AWS_BRANCH/AMPLIFY_BRANCH)
 *   --region <region>      AWS region (falls back to env AWS_REGION)
 *   --profile <name>       AWS CLI profile
 *   --jobId <id>           Specific job id to tail (otherwise picks running/latest)
 *   --step <name>          Prefer step by name (e.g. Build, Deploy). Defaults to running step or last step
 *   --since <duration>     How far back to show logs (default: 10m). Accepts values like 5m, 1h
 *   --no-follow            Do not follow; just print available logs and exit
 *   --open                 Open the CloudWatch log URL in the browser as well
 */

import { spawnSync, spawn } from 'node:child_process';
import { platform } from 'node:os';
import dotenv from 'dotenv';
// Load base env first, then local overrides (without clobbering existing shell env)
dotenv.config();
dotenv.config({ path: '.env.local' });

type Opts = {
  appId?: string;
  branch?: string;
  region?: string;
  profile?: string;
  jobId?: string;
  step?: string;
  since?: string;
  follow?: boolean;
  open?: boolean;
  verbose?: boolean;
  list?: boolean;
  interactive?: boolean;
};

function parseArgs(argv: string[]): Opts {
  const o: Opts = { follow: true } as Opts;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--appId': o.appId = argv[++i]; break;
      case '--branch': o.branch = argv[++i]; break;
      case '--region': o.region = argv[++i]; break;
      case '--profile': o.profile = argv[++i]; break;
      case '--jobId': o.jobId = argv[++i]; break;
      case '--step': o.step = argv[++i]; break;
      case '--since': o.since = argv[++i]; break;
      case '--no-follow': o.follow = false; break;
      case '--open': o.open = true; break;
      case '--list': o.list = true; break;
      case '--interactive':
      case '--choose': o.interactive = true; break;
      case '--verbose':
      case '-v': o.verbose = true; break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (a.startsWith('-')) console.warn(`Unknown flag: ${a}`);
    }
  }
  return o;
}

function printHelp() {
  console.log(`Tail Amplify Hosting job logs\n\n` +
    `Flags:\n` +
    `  --appId <id>           Amplify App ID (or env AWS_APP_ID/AMPLIFY_APP_ID)\n` +
    `  --branch <name>        Branch to inspect (or env AWS_BRANCH/AMPLIFY_BRANCH)\n` +
    `  --region <region>      AWS region (or env AWS_REGION)\n` +
    `  --profile <name>       AWS CLI profile\n` +
    `  --jobId <id>           Specific job id to tail\n` +
    `  --step <name>          Prefer step name (e.g. Build, Deploy)\n` +
    `  --since <duration>     How far back to show logs (default: 10m)\n` +
    `  --no-follow            Do not follow; just print and exit\n` +
    `  --open                 Open CloudWatch log URL in browser\n` +
    `  --list                 List recent jobs and steps, then exit\n` +
    `  --interactive|--choose Prompt to pick job/step interactively\n` +
    `  --help|-h              Show help\n\n` +
    `Examples:\n` +
    `  pnpm tsx scripts/tailAmplifyLogs.ts --appId d2abc... --branch main --region eu-west-2\n` +
    `  pnpm tsx scripts/tailAmplifyLogs.ts --branch main  # uses env AWS_APP_ID\n`);
}

function resolveEnvFallbacks(o: Opts): Required<Pick<Opts, 'appId'|'branch'|'region'>> & Pick<Opts, 'profile'> {
  const appId = o.appId || process.env.AWS_APP_ID || process.env.AMPLIFY_APP_ID;
  const branch = o.branch || process.env.AWS_BRANCH || process.env.AMPLIFY_BRANCH;
  const region = o.region || process.env.AWS_REGION || process.env.AMPLIFY_REGION;
  const profile = o.profile || process.env.AWS_PROFILE;
  if (!appId) throw new Error('Missing --appId (or env AWS_APP_ID/AMPLIFY_APP_ID)');
  if (!branch) throw new Error('Missing --branch (or env AWS_BRANCH/AMPLIFY_BRANCH)');
  if (!region) throw new Error('Missing --region (or env AWS_REGION/AMPLIFY_REGION)');
  return { appId, branch, region, profile };
}

function runAws(args: string[], profile?: string, verbose?: boolean): any {
  const fullArgs = [...args];
  if (profile) fullArgs.push('--profile', profile);
  if (verbose) console.log(`[aws] aws ${fullArgs.join(' ')}`);
  const res = spawnSync('aws', fullArgs, { encoding: 'utf8' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(res.stderr || `aws exited with ${res.status}`);
  try {
    return JSON.parse(res.stdout || '{}');
  } catch {
    return res.stdout;
  }
}

type JobSummary = { jobId: string; status?: string; commitId?: string; startTime?: string; };
type Job = { jobId: string; status?: string; steps?: Array<{ stepName?: string; status?: string; logUrl?: string }>; };

function pickJob(jobs: JobSummary[], preferredId?: string): JobSummary | undefined {
  if (!jobs || jobs.length === 0) return undefined;
  if (preferredId) return jobs.find(j => j.jobId === preferredId) || jobs[0];
  const running = jobs.find(j => j.status === 'RUNNING' || j.status === 'PENDING');
  if (running) return running;
  // Prefer most recent successful job
  const successes = jobs.filter(j => j.status === 'SUCCEED' || j.status === 'SUCCEEDED');
  if (successes.length) {
    successes.sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
    return successes[0];
  }
  // Otherwise, pick most recent by startTime or first item
  const sorted = [...jobs].sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
  return sorted[0];
}

function pickStep(steps: NonNullable<Job['steps']>, preferName?: string): { name: string; url: string } | undefined {
  if (!steps || steps.length === 0) return undefined;
  if (preferName) {
    const s = steps.find(s => s.stepName?.toLowerCase() === preferName.toLowerCase());
    if (s?.logUrl) return { name: s.stepName || preferName, url: s.logUrl };
  }
  const running = steps.find(s => s.status === 'RUNNING' || s.status === 'PENDING');
  if (running?.logUrl) return { name: running.stepName || 'running', url: running.logUrl };
  // fallback to last step with logUrl
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    if (s.logUrl) return { name: s.stepName || `step-${i}`, url: s.logUrl };
  }
  return undefined;
}

function decodeCloudWatchFromUrl(url: string): { group?: string; stream?: string } {
  // Two styles to support:
  // 1) Old: ...#logEventViewer:group=/aws/amplify/...;stream=...;
  // 2) New: ...#logsV2:log-groups/log-group/<encGroup>/log-events/<encStream>
  try {
    const hashIdx = url.indexOf('#');
    const fragment = hashIdx >= 0 ? url.slice(hashIdx + 1) : url;
    if (fragment.includes('logEventViewer:')) {
      const part = fragment.split('logEventViewer:')[1];
      const segs = part.split(/[;?]/);
      let group: string | undefined;
      let stream: string | undefined;
      for (const s of segs) {
        if (s.startsWith('group=')) group = decodeURIComponent(s.slice(6));
        if (s.startsWith('stream=')) stream = decodeURIComponent(s.slice(7));
      }
      return { group, stream };
    }
    if (fragment.includes('logsV2:')) {
      const lgIdx = fragment.indexOf('log-group/');
      const leIdx = fragment.indexOf('/log-events/');
      if (lgIdx >= 0 && leIdx > lgIdx) {
        const encGroup = fragment.slice(lgIdx + 'log-group/'.length, leIdx);
        let rest = fragment.slice(leIdx + '/log-events/'.length);
        // terminate at ? or end
        const qIdx = rest.indexOf('?');
        if (qIdx >= 0) rest = rest.slice(0, qIdx);
        const encStream = rest;
        const decodeCW = (s: string) => decodeURIComponent(s.replace(/\$252F/g, '%2F')).replace(/\$252F/g, '/');
        const group = decodeCW(encGroup);
        const stream = decodeCW(encStream);
        return { group, stream };
      }
    }
  } catch {
    // noop
  }
  return {};
}

function formatWhen(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '';
  return d.toISOString().replace('T', ' ').replace('Z', 'Z');
}

async function prompt(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise(resolve => {
    const onData = (chunk: Buffer) => {
      const input = chunk.toString('utf8').trim();
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      resolve(input);
    };
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', onData);
  });
}

function openInBrowser(url: string) {
  const cmd = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { stdio: 'ignore', detached: true });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { appId, branch, region, profile } = resolveEnvFallbacks(opts);
  const since = opts.since || '10m';

  // 1) List jobs for branch
  const jobsOut = runAws(['amplify', 'list-jobs', '--app-id', appId, '--branch-name', branch, '--region', region, '--max-items', '25', '--output', 'json'], profile, opts.verbose);
  const jobs: JobSummary[] = jobsOut?.jobSummaries || [];
  if (!jobs.length) {
    console.error(`No jobs found for app ${appId} branch ${branch} in ${region}`);
    process.exit(1);
  }
  if (opts.list) {
    console.log(`Jobs for app=${appId} branch=${branch} (newest first):`);
    const sorted = [...jobs].sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
    sorted.forEach((j, i) => {
      console.log(`${i}. jobId=${j.jobId} status=${j.status || ''} when=${formatWhen(j.startTime)} commit=${j.commitId || ''}`);
    });
    console.log('\nUse --interactive to pick a job to tail.');
    return;
  }

  let chosen = pickJob(jobs, opts.jobId);
  if (opts.interactive) {
    const sorted = [...jobs].sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
    console.log(`Pick a job to tail for app=${appId} branch=${branch}:`);
    sorted.forEach((j, i) => {
      console.log(`${i}. jobId=${j.jobId} status=${j.status || ''} when=${formatWhen(j.startTime)} commit=${j.commitId || ''}`);
    });
    const ans = await prompt('Enter number (default 0): ');
    const idx = ans ? parseInt(ans, 10) : 0;
    if (!Number.isFinite(idx) || idx < 0 || idx >= sorted.length) {
      console.error('Invalid selection');
      process.exit(1);
    }
    chosen = sorted[idx];
  }
  if (!chosen) {
    console.error('Unable to pick a job to tail');
    process.exit(1);
  }
  if (opts.verbose) console.log(`Selected job: ${chosen.jobId} (status=${chosen.status || 'UNKNOWN'})`);

  // 2) Get job details for log URLs
  const jobOut = runAws(['amplify', 'get-job', '--app-id', appId, '--branch-name', branch, '--job-id', chosen.jobId, '--region', region, '--output', 'json'], profile, opts.verbose);
  const job: Job = jobOut?.job || {};
  let step = pickStep(job.steps || [], opts.step);
  if (opts.interactive && job.steps?.length) {
    console.log('Available steps:');
    job.steps.forEach((s, i) => {
      console.log(`${i}. ${s.stepName || `step-${i}`} status=${s.status || ''} logUrl=${s.logUrl ? 'yes' : 'no'}`);
    });
    const ans = await prompt('Pick step number (Enter to keep selection): ');
    if (ans) {
      const idx = parseInt(ans, 10);
      if (Number.isFinite(idx) && idx >= 0 && idx < job.steps.length) {
        const chosenStep = job.steps[idx];
        if (chosenStep?.logUrl) step = { name: chosenStep.stepName || `step-${idx}`, url: chosenStep.logUrl };
      }
    }
  }
  if (!step?.url) {
    console.error('No step log URL found on the selected job.');
    if (opts.verbose) console.log(JSON.stringify(job, null, 2));
    process.exit(1);
  }

  const { group, stream } = decodeCloudWatchFromUrl(step.url);
  if (!group) {
    console.error('Could not parse CloudWatch log group from logUrl.');
    console.log('Open in browser:', step.url);
    if (opts.open) openInBrowser(step.url);
    process.exit(1);
  }

  console.log(`Tailing Amplify logs for app=${appId} branch=${branch} job=${chosen.jobId}`);
  console.log(`Step: ${step.name}`);
  console.log(`CloudWatch group: ${group}` + (stream ? `\nStream: ${stream}` : ''));
  console.log(`Since: ${since}  Follow: ${opts.follow !== false}`);
  if (opts.open) openInBrowser(step.url);

  // 3) Tail via AWS CLI (aws logs tail)
  const tailArgs = ['logs', 'tail', group, '--since', since, '--region', region];
  if (opts.follow !== false) tailArgs.push('--follow');
  if (stream) tailArgs.push('--log-stream-name', stream);
  if (profile) tailArgs.push('--profile', profile);

  const tail = spawn('aws', tailArgs, { stdio: 'inherit' });
  tail.on('exit', code => process.exit(code === null ? 1 : code));
}

main().catch(err => {
  console.error('Failed to tail Amplify logs:', err?.message || err);
  process.exit(1);
});
