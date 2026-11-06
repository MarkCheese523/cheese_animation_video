#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const repository = 'MarkCheese523/cheese_animation_video';
const branch = 'main';
const args = process.argv.slice(2);
const option = name => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const validCommit = value => typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);

function run(command, commandArgs, timeout = 6000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('远端检查超时')); }, timeout);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `${command} 退出码 ${code}`));
    });
  });
}

async function fetchRemoteCommit() {
  try {
    const value = await run('gh', ['api', `repos/${repository}/commits/${branch}`, '--jq', '.sha']);
    if (validCommit(value)) return value;
  } catch (error) {
    if (error?.code !== 'ENOENT' && !/ gh |gh 退出码/.test(error?.message || '')) throw error;
  }
  const value = await run('git', ['ls-remote', `https://github.com/${repository}.git`, `refs/heads/${branch}`]);
  const commit = value.split(/\s+/)[0];
  if (!validCommit(commit)) throw new Error('远端返回了无效提交号');
  return commit;
}

const root = new URL('../', import.meta.url).pathname;
const version = JSON.parse(await readFile(new URL('../skill-version.json', import.meta.url), 'utf8'));
let installedCommit = version.commit;
try { installedCommit = await run('git', ['-C', root, 'rev-parse', 'HEAD']); } catch { /* 非 Git 安装使用随包版本记录。 */ }
const localCommit = option('--local') || installedCommit;
const base = { repository: `https://github.com/${repository}`, branch, localCommit };
try {
  const remoteCommit = option('--remote') || await fetchRemoteCommit();
  if (!validCommit(remoteCommit)) throw new Error('远端提交号格式无效');
  const updateAvailable = localCommit !== remoteCommit;
  console.log(JSON.stringify({ ...base, remoteCommit, status: updateAvailable ? 'update-available' : 'up-to-date', updateAvailable }));
} catch (error) {
  console.log(JSON.stringify({ ...base, status: 'unavailable', updateAvailable: null, message: error.message }));
}
