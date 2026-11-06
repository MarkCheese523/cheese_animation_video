import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const script = new URL('./check-skill-update.mjs', import.meta.url).pathname;
const current = '9becc8c7e569c4fdee1a407b975fac8672891795';
const older = '0000000000000000000000000000000000000000';
const check = (local, remote) => {
  const result = spawnSync(process.execPath, [script, '--local', local, '--remote', remote], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
assert.equal(check(current, current).updateAvailable, false);
assert.equal(check(current, current).status, 'up-to-date');
assert.equal(check(older, current).updateAvailable, true);
assert.equal(check(older, current).status, 'update-available');
assert.equal(check(current, 'invalid-remote').status, 'unavailable');
assert.equal(check(current, 'invalid-remote').updateAvailable, null);

const nested = await mkdtemp(path.resolve('.tmp/nested-skill-'));
try {
  await mkdir(path.join(nested, 'scripts'), { recursive: true });
  await cp(script, path.join(nested, 'scripts/check-skill-update.mjs'));
  const version = JSON.parse(await readFile(new URL('../skill-version.json', import.meta.url), 'utf8'));
  version.commit = older;
  await writeFile(path.join(nested, 'skill-version.json'), JSON.stringify(version));
  const result = spawnSync(process.execPath, [path.join(nested, 'scripts/check-skill-update.mjs'), '--remote', current], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.localCommit, older, '外层 Git 项目的 HEAD 不得覆盖随包版本');
  assert.equal(output.updateAvailable, true);
} finally { await rm(nested, { recursive: true, force: true }); }
console.log('skill-update: 无更新不提醒、远端不同则提醒、检查失败不阻塞、外层 Git 隔离，测试通过');
