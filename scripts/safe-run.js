#!/usr/bin/env node
/* eslint-disable no-undef */

import { spawn } from 'child_process';
import { logError } from './error-logger.js';

const [, , ...args] = process.argv;
const command = args[0];
const cmdArgs = args.slice(1);

const proc = spawn(command, cmdArgs, {
  stdio: 'inherit',
  shell: true,
});

proc.on('error', (error) => {
  logError({
    type: 'SPAWN_ERROR',
    message: error.message,
    stack: error.stack,
    context: { command, args: cmdArgs },
  });
  process.exit(1);
});

proc.on('exit', (code) => {
  if (code !== 0) {
    logError({
      type: 'COMMAND_FAILURE',
      message: `Command failed with exit code ${code}: ${command} ${cmdArgs.join(' ')}`,
      context: { command, args: cmdArgs, exitCode: code },
    });
    process.exit(code);
  }
});
