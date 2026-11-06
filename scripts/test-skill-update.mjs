import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

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
console.log('skill-update: 无更新不提醒、远端不同则提醒、检查失败不阻塞，测试通过');
