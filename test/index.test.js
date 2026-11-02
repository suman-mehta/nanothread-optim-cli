import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliPath = resolve(fileURLToPath(import.meta.url), '..', '..', 'src', 'index.js');

test('executes command concurrently and aggregates output', async (t) => {
  const command = 'node -e "console.log(\'concurrency-test\')"';
  const args = [cliPath, '--cmd', command, '--workers', '2'];

  const { stdout, stderr } = await new Promise((resolvePromise, reject) => {
    execFile('node', args, (err, out, errOut) => {
      if (err) reject(err);
      else resolvePromise({ stdout: out, stderr: errOut });
    });
  });

  assert.equal(stderr, '');
  const results = JSON.parse(stdout);
  assert.equal(results.length, 2);
  results.forEach((r) => {
    assert.equal(r.stdout, 'concurrency-test');
    assert.equal(r.error, null);
    assert.equal(r.exitCode, 0);
  });
});
