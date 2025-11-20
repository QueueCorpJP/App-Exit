import { sanitizeText, INPUT_LIMITS } from './input-validator';

export function testPerformance() {
  const testCases = [
    { name: '短いテキスト (100文字)', length: 100 },
    { name: '中程度のテキスト (1000文字)', length: 1000 },
    { name: '長いテキスト (5000文字)', length: 5000 },
    { name: '最大長テキスト (10000文字)', length: 10000 },
  ];

  for (const testCase of testCases) {
    const input = 'a'.repeat(testCase.length);

    for (let i = 0; i < 100; i++) {
      sanitizeText(input, INPUT_LIMITS.DESCRIPTION, {
        allowHTML: false,
        strictMode: false,
      });
    }

    for (let i = 0; i < 100; i++) {
      sanitizeText(input, INPUT_LIMITS.DESCRIPTION, {
        allowHTML: false,
        strictMode: true,
      });
    }
  }
}

export function testMaliciousContent() {
  const maliciousInputs = [
    '<script>alert("XSS")</script>',
    '<iframe src="evil.com"></iframe>',
    'javascript:void(0)',
    '<img src=x onerror="alert(1)">',
    'SELECT * FROM users WHERE id=1 OR 1=1',
    '<svg onload="alert(1)">',
  ];

  for (const input of maliciousInputs) {
    sanitizeText(input, INPUT_LIMITS.TEXTAREA, {
      allowHTML: false,
      strictMode: true,
    });
  }
}

export function testMemoryUsage() {
  const iterations = 10000;
  const input = 'a'.repeat(1000);

  if ('memory' in performance) {
    const memBefore = (performance as any).memory.usedJSHeapSize;

    for (let i = 0; i < iterations; i++) {
      sanitizeText(input, INPUT_LIMITS.DESCRIPTION, {
        allowHTML: false,
        strictMode: false,
      });
    }

    const memAfter = (performance as any).memory.usedJSHeapSize;
  }
}

if (typeof window !== 'undefined') {
  (window as any).testSecurityPerformance = testPerformance;
  (window as any).testMaliciousContent = testMaliciousContent;
  (window as any).testMemoryUsage = testMemoryUsage;
}
