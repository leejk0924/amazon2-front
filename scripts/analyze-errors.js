#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCachedErrors, analyzeErrors } from './error-logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ERRORS_DIR = path.join(__dirname, '../.claude/errors');
const PATTERNS_DIR = path.join(ERRORS_DIR, 'patterns');
const ANALYSIS_DIR = path.join(ERRORS_DIR, 'analysis');
const MEMORY_DIR = path.join(
  __dirname,
  '../.claude/projects/-Users-jk-Library-Mobile-Documents-com-apple-CloudDocs-amazon-amazon2-front/memory'
);

if (!fs.existsSync(PATTERNS_DIR)) {
  fs.mkdirSync(PATTERNS_DIR, { recursive: true });
}
if (!fs.existsSync(ANALYSIS_DIR)) {
  fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
}
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

/* eslint-disable no-unused-vars */
function categorizeError(error) {
  const msg = error.message.toLowerCase();

  if (msg.includes('module') || msg.includes('require') || msg.includes('import')) {
    return 'module-resolution';
  }
  if (msg.includes('eslint') || msg.includes('lint')) {
    return 'linting';
  }
  if (msg.includes('build') || msg.includes('vite')) {
    return 'build';
  }
  if (msg.includes('test') || msg.includes('vitest')) {
    return 'testing';
  }
  if (msg.includes('type') || msg.includes('typescript')) {
    return 'type-checking';
  }
  if (msg.includes('package.json') || msg.includes('dependency')) {
    return 'dependency';
  }
  if (msg.includes('permission') || msg.includes('eacces')) {
    return 'permission';
  }
  return 'other';
}

function createPattern(errors) {
  const grouped = {};

  errors.forEach((error) => {
    const category = categorizeError(error);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(error);
  });

  return grouped;
}

function generateMemory(patterns, analysis) {
  const timestamp = new Date().toISOString().split('T')[0];
  const criticalPatterns = Object.entries(patterns)
    .filter(([_, errors]) => errors.length >= 2)
    .map(([category, errors]) => ({
      category,
      count: errors.length,
      examples: errors.slice(0, 3),
    }));

  if (criticalPatterns.length === 0) {
    return null;
  }

  const memoryContent = `---
name: harness-error-patterns
description: 하네스 엔지니어링 중 반복되는 에러 패턴
metadata:
  type: feedback
  date: ${timestamp}
---

# 하네스 엔지니어링 에러 패턴

분석 기간: ${timestamp}
총 에러 수: ${analysis.totalErrors}

## 반복되는 에러 패턴

${criticalPatterns
  .map(
    (pattern) => `
### ${pattern.category.replace('-', ' ').toUpperCase()} (${pattern.count}건)

**주요 예시:**
${pattern.examples
  .map(
    (err) => `
- **메시지**: ${err.message.substring(0, 100)}
- **타입**: ${err.type}
- **발생 시간**: ${err.timestamp}
`
  )
  .join('')}

**해결 방법:**
- 해당 패턴의 근본 원인을 파악하고 설정을 검토하세요
- 동일한 에러 발생 시 .claude/errors 로그를 참고하세요
`
  )
  .join('')}

## 에러별 분포

${Object.entries(analysis.errorsByType)
  .map(([type, count]) => `- ${type}: ${count}건`)
  .join('\n')}

## 주의사항

**반복되지 말아야 할 실수:**
${criticalPatterns
  .map(
    (pattern) =>
      `- **${pattern.category}**: 같은 에러가 ${pattern.count}번 발생했으므로 근본 원인 해결 필요`
  )
  .join('\n')}

`;

  return memoryContent;
}

function saveMemory(content) {
  if (!content) return;

  const memoryFile = path.join(MEMORY_DIR, 'harness_error_patterns.md');
  fs.writeFileSync(memoryFile, content);
  console.log(`✓ 메모리 저장됨: ${memoryFile}`);
}

function generateReport() {
  const errors = getCachedErrors();
  const analysis = analyzeErrors();
  const patterns = createPattern(errors);

  // 분석 보고서 저장
  const reportFile = path.join(ANALYSIS_DIR, `report-${Date.now()}.json`);
  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        analysis,
        patterns: Object.fromEntries(
          Object.entries(patterns).map(([key, errors]) => [
            key,
            errors.map((e) => ({ type: e.type, message: e.message.substring(0, 100) })),
          ])
        ),
      },
      null,
      2
    )
  );

  console.log(`\n📊 에러 분석 보고서`);
  console.log(`총 에러: ${analysis.totalErrors}건`);
  console.log(`\n에러 유형별 분포:`);
  Object.entries(analysis.errorsByType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}건`);
  });

  console.log(`\n패턴 분석:`);
  Object.entries(patterns).forEach(([category, errors]) => {
    if (errors.length >= 2) {
      console.log(`  🔴 [반복] ${category}: ${errors.length}건`);
    }
  });

  // 메모리 생성
  const memory = generateMemory(patterns, analysis);
  if (memory) {
    saveMemory(memory);
  }

  console.log(`\n보고서 저장: ${reportFile}`);
}

generateReport();
