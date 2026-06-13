/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ERRORS_DIR = path.join(__dirname, '../.claude/errors');
const LOGS_DIR = path.join(ERRORS_DIR, 'logs');

export function logError(errorData) {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    type: errorData.type || 'UNKNOWN',
    message: errorData.message,
    stack: errorData.stack,
    context: errorData.context || {},
    command: process.argv.slice(2).join(' '),
    cwd: process.cwd(),
    nodeVersion: process.version,
  };

  const filename = `error-${Date.now()}.json`;
  const filepath = path.join(LOGS_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(errorLog, null, 2));
  console.error(`[ERROR LOGGED] ${filepath}`);

  return errorLog;
}

export function getCachedErrors() {
  if (!fs.existsSync(LOGS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith('.json'));
  return files
    .map((file) => {
      const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf-8');
      return JSON.parse(content);
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function analyzeErrors() {
  const errors = getCachedErrors();
  const analysis = {
    totalErrors: errors.length,
    errorsByType: {},
    errorsByMessage: {},
    recentErrors: errors.slice(0, 10),
  };

  errors.forEach((error) => {
    analysis.errorsByType[error.type] = (analysis.errorsByType[error.type] || 0) + 1;
    const msg = error.message.substring(0, 100);
    analysis.errorsByMessage[msg] = (analysis.errorsByMessage[msg] || 0) + 1;
  });

  return analysis;
}
