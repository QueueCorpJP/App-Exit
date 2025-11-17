// パフォーマンステスト用ユーティリティ
// ブラウザのコンソールで実行可能

import { sanitizeText, INPUT_LIMITS } from './input-validator';

/**
 * サニタイゼーション処理のパフォーマンステスト
 */
export function testPerformance() {
  console.log('🔒 セキュリティ実装パフォーマンステスト\n');

  const testCases = [
    { name: '短いテキスト (100文字)', length: 100 },
    { name: '中程度のテキスト (1000文字)', length: 1000 },
    { name: '長いテキスト (5000文字)', length: 5000 },
    { name: '最大長テキスト (10000文字)', length: 10000 },
  ];

  for (const testCase of testCases) {
    const input = 'a'.repeat(testCase.length);

    // 通常モード
    console.time(`${testCase.name} (通常モード)`);
    for (let i = 0; i < 100; i++) {
      sanitizeText(input, INPUT_LIMITS.DESCRIPTION, {
        allowHTML: false,
        strictMode: false,
      });
    }
    console.timeEnd(`${testCase.name} (通常モード)`);

    // 厳格モード
    console.time(`${testCase.name} (厳格モード)`);
    for (let i = 0; i < 100; i++) {
      sanitizeText(input, INPUT_LIMITS.DESCRIPTION, {
        allowHTML: false,
        strictMode: true,
      });
    }
    console.timeEnd(`${testCase.name} (厳格モード)`);

    console.log('');
  }

  console.log('✅ テスト完了');
  console.log('※ 100回の平均実行時間を表示しています');
}

/**
 * 悪意のあるコンテンツの検出テスト
 */
export function testMaliciousContent() {
  console.log('🔒 悪意のあるコンテンツ検出テスト\n');

  const maliciousInputs = [
    '<script>alert("XSS")</script>',
    '<iframe src="evil.com"></iframe>',
    'javascript:void(0)',
    '<img src=x onerror="alert(1)">',
    'SELECT * FROM users WHERE id=1 OR 1=1',
    '<svg onload="alert(1)">',
  ];

  for (const input of maliciousInputs) {
    console.time(`検出: ${input.substring(0, 30)}...`);
    const result = sanitizeText(input, INPUT_LIMITS.TEXTAREA, {
      allowHTML: false,
      strictMode: true,
    });
    console.timeEnd(`検出: ${input.substring(0, 30)}...`);
    console.log(`  - 有効: ${result.isValid}`);
    console.log(`  - エラー: ${result.errors.join(', ')}`);
    console.log(`  - サニタイズ後: ${result.sanitized}`);
    console.log('');
  }

  console.log('✅ テスト完了');
}

/**
 * メモリ使用量テスト
 */
export function testMemoryUsage() {
  console.log('💾 メモリ使用量テスト\n');

  const iterations = 10000;
  const input = 'a'.repeat(1000);

  if ('memory' in performance) {
    const memBefore = (performance as any).memory.usedJSHeapSize;

    console.time(`${iterations}回のサニタイゼーション`);
    for (let i = 0; i < iterations; i++) {
      sanitizeText(input, INPUT_LIMITS.DESCRIPTION, {
        allowHTML: false,
        strictMode: false,
      });
    }
    console.timeEnd(`${iterations}回のサニタイゼーション`);

    const memAfter = (performance as any).memory.usedJSHeapSize;
    const memDiff = memAfter - memBefore;

    console.log(`メモリ使用量増加: ${(memDiff / 1024 / 1024).toFixed(2)} MB`);
    console.log(`1回あたり: ${(memDiff / iterations / 1024).toFixed(2)} KB`);
  } else {
    console.log('⚠️ このブラウザはメモリ測定をサポートしていません');
  }

  console.log('✅ テスト完了');
}

// ブラウザコンソールで実行可能なグローバル関数として公開
if (typeof window !== 'undefined') {
  (window as any).testSecurityPerformance = testPerformance;
  (window as any).testMaliciousContent = testMaliciousContent;
  (window as any).testMemoryUsage = testMemoryUsage;

  console.log('📊 パフォーマンステストが利用可能です:');
  console.log('  - window.testSecurityPerformance() : 処理速度テスト');
  console.log('  - window.testMaliciousContent()    : 検出能力テスト');
  console.log('  - window.testMemoryUsage()         : メモリ使用量テスト');
}
