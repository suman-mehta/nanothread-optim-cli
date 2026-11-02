#!/usr/bin/env node
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { exec } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpus } from 'node:os';

if (isMainThread) {
  const args = process.argv.slice(2);
  const cmdIdx = args.indexOf('--cmd');
  const workersIdx = args.indexOf('--workers');

  if (cmdIdx === -1 || cmdIdx + 1 >= args.length) {
    console.error('Missing required --cmd argument');
    process.exit(1);
  }

  const command = args[cmdIdx + 1];
  const workerCount = workersIdx !== -1 && workersIdx + 1 < args.length
    ? parseInt(args[workersIdx + 1], 10)
    : cpus().length;

  const results = [];
  let completed = 0;

  for (let i = 0; i < workerCount; i++) {
    const worker = new Worker(resolve(fileURLToPath(import.meta.url)));
    worker.postMessage({ command });
    worker.on('message', (msg) => {
      results.push(msg);
      completed++;
      if (completed === workerCount) {
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
      }
    });
    worker.on('error', (err) => {
      console.error('Worker error:', err);
      process.exit(1);
    });
  }
} else {
  parentPort.on('message', ({ command }) => {
    exec(command, (error, stdout, stderr) => {
      const result = {
        pid: process.pid,
        command,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        error: error ? error.message : null,
        exitCode: error ? error.code : 0
      };
      parentPort.postMessage(result);
    });
  });
}
