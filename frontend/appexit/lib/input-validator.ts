// 🔒 SECURITY: フロントエンド入力バリデーションとサニタイゼーション
// XSS、インジェクション、DoS攻撃を防ぐ

export const INPUT_LIMITS = {
  // 最大長制限（DoS攻撃防止）
  USERNAME: 50,
  EMAIL: 255,
  PASSWORD: 128,
  TEXT_FIELD: 500,
  TEXTAREA: 5000,
  TITLE: 200,
  DESCRIPTION: 10000,
  URL: 2048,
  PHONE: 20,

  // ファイルサイズ制限（バイト）
  IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

// ReDoS攻撃を防ぐための最大入力長（10KB）
const MAX_INPUT_LENGTH = 10000;

// XSS攻撃パターン
// ReDoS攻撃を防ぐため、possessive quantifiers的なアプローチを使用
// タグの開始から終了まで最大1000文字に制限
const XSS_PATTERNS = [
  /<script(?:\s[^>]{0,1000})?>[\s\S]{0,1000}?<\/script>/gi,
  /<iframe(?:\s[^>]{0,1000})?>[\s\S]{0,1000}?<\/iframe>/gi,
  /<object(?:\s[^>]{0,1000})?>[\s\S]{0,1000}?<\/object>/gi,
  /<embed[^>]{0,1000}>/gi,
  /<applet(?:\s[^>]{0,1000})?>[\s\S]{0,1000}?<\/applet>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<link[^>]{0,1000}>/gi,
  /<meta[^>]{0,1000}>/gi,
  /<style(?:\s[^>]{0,1000})?>[\s\S]{0,1000}?<\/style>/gi,
  /expression\s*\(/gi, // CSS expression
  /@import/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

// SQL injection パターン
const SQL_INJECTION_PATTERNS = [
  /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+(from|into|table|database)/gi,
  /(--|;|\/\*|\*\/)/g,
  /(or|and)\s+\d+\s*=\s*\d+/gi,
  /(or|and)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?/gi,
];

// 許可する文字パターン
const VALID_USERNAME = /^[a-zA-Z0-9_\-.]+$/;
const VALID_EMAIL = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const VALID_URL = /^https?:\/\/[a-zA-Z0-9\-._~:\/?#\[\]@!$&'()*+,;=]+$/;
const VALID_PHONE = /^[+]?[0-9]+$/;

/**
 * テキスト入力をサニタイズ
 */
export function sanitizeText(
  value: string,
  maxLength: number,
  options: {
    allowHTML?: boolean;
    strictMode?: boolean;
  } = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    sanitized: value,
    errors: [],
  };

  // 1. NULL/undefined チェック
  if (!value) {
    result.sanitized = '';
    return result;
  }

  let sanitized = value;

  // 2. ReDoS攻撃防止: 最大入力長チェック
  if (sanitized.length > MAX_INPUT_LENGTH) {
    result.isValid = false;
    result.errors.push(`Input too long. Maximum ${MAX_INPUT_LENGTH} characters allowed for security reasons.`);
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
  }

  // 3. 長さチェック（DoS防止）
  if (sanitized.length > maxLength) {
    result.isValid = false;
    result.errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
  }

  // 3. XSS攻撃パターンチェック（高速化: 一度のループで処理）
  let hasXSS = false;
  for (const pattern of XSS_PATTERNS) {
    // 正規表現のlastIndexをリセット（グローバルフラグ対策）
    pattern.lastIndex = 0;
    if (pattern.test(sanitized)) {
      hasXSS = true;
      pattern.lastIndex = 0;
      sanitized = sanitized.replace(pattern, '');
    }
  }
  if (hasXSS) {
    result.isValid = false;
    result.errors.push('Potentially malicious content detected (XSS)');
  }

  // 4. SQL Injectionパターンチェック（strictModeの場合）
  if (options.strictMode) {
    let hasSQL = false;
    for (const pattern of SQL_INJECTION_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(sanitized)) {
        hasSQL = true;
        break; // 1つ見つかったら終了
      }
    }
    if (hasSQL) {
      result.isValid = false;
      result.errors.push('Potentially malicious content detected (SQL)');
    }
  }

  // 5. HTMLエスケープ（allowHTMLがfalseの場合）
  if (!options.allowHTML) {
    sanitized = escapeHTML(sanitized);
  }

  // 6. NULL文字削除
  sanitized = sanitized.replace(/\0/g, '');

  // 7. 制御文字の削除（印字可能な文字と改行・タブのみ許可）
  sanitized = removeControlCharacters(sanitized);

  result.sanitized = sanitized.trim();
  return result;
}

/**
 * ユーザー名をバリデート
 */
export function validateUsername(username: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    sanitized: username,
    errors: [],
  };

  // 長さチェック
  if (!username || username.length === 0) {
    result.isValid = false;
    result.errors.push('Username cannot be empty');
    return result;
  }

  if (username.length > INPUT_LIMITS.USERNAME) {
    result.isValid = false;
    result.errors.push(`Username exceeds maximum length of ${INPUT_LIMITS.USERNAME}`);
    result.sanitized = username.substring(0, INPUT_LIMITS.USERNAME);
  }

  // 許可された文字のみ
  if (!VALID_USERNAME.test(username)) {
    result.isValid = false;
    result.errors.push('Username contains invalid characters (allowed: a-z, A-Z, 0-9, _, -, .)');
  }

  // 予約語チェック
  const reservedWords = ['admin', 'root', 'system', 'api', 'null', 'undefined'];
  if (reservedWords.includes(username.toLowerCase())) {
    result.isValid = false;
    result.errors.push('Username is reserved');
  }

  return result;
}

/**
 * メールアドレスをバリデート
 */
export function validateEmail(email: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    sanitized: email.trim().toLowerCase(),
    errors: [],
  };

  // 長さチェック
  if (email.length > INPUT_LIMITS.EMAIL) {
    result.isValid = false;
    result.errors.push(`Email exceeds maximum length of ${INPUT_LIMITS.EMAIL}`);
    return result;
  }

  // フォーマットチェック
  if (!VALID_EMAIL.test(email)) {
    result.isValid = false;
    result.errors.push('Invalid email format');
  }

  return result;
}

/**
 * URLをバリデート
 */
export function validateURL(url: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    sanitized: url.trim(),
    errors: [],
  };

  // 長さチェック
  if (url.length > INPUT_LIMITS.URL) {
    result.isValid = false;
    result.errors.push(`URL exceeds maximum length of ${INPUT_LIMITS.URL}`);
    return result;
  }

  // 危険なスキームを拒否
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerURL = url.toLowerCase();
  for (const scheme of dangerousSchemes) {
    if (lowerURL.startsWith(scheme)) {
      result.isValid = false;
      result.errors.push('Dangerous URL scheme detected');
      return result;
    }
  }

  // HTTPまたはHTTPSのみ許可
  if (!lowerURL.startsWith('http://') && !lowerURL.startsWith('https://')) {
    result.isValid = false;
    result.errors.push('Only HTTP and HTTPS URLs are allowed');
    return result;
  }

  // URLフォーマットチェック
  if (!VALID_URL.test(url)) {
    result.isValid = false;
    result.errors.push('Invalid URL format');
  }

  return result;
}

/**
 * 電話番号をバリデート
 */
export function validatePhone(phone: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    sanitized: phone.replace(/[\s\-]/g, ''),
    errors: [],
  };

  // 長さチェック
  if (result.sanitized.length > INPUT_LIMITS.PHONE) {
    result.isValid = false;
    result.errors.push(`Phone number exceeds maximum length of ${INPUT_LIMITS.PHONE}`);
    return result;
  }

  // 数字と+のみ許可
  if (!VALID_PHONE.test(result.sanitized)) {
    result.isValid = false;
    result.errors.push('Phone number contains invalid characters');
  }

  return result;
}

/**
 * ファイルサイズをバリデート
 */
export function validateFileSize(size: number, maxSize: number): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    sanitized: '',
    errors: [],
  };

  if (size > maxSize) {
    result.isValid = false;
    result.errors.push(
      `File size (${formatBytes(size)}) exceeds maximum allowed size (${formatBytes(maxSize)})`
    );
  }

  if (size <= 0) {
    result.isValid = false;
    result.errors.push('File size must be greater than 0');
  }

  return result;
}

/**
 * ファイルタイプをバリデート
 */
export function validateFileType(filename: string, allowedExtensions: string[]): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    sanitized: filename,
    errors: [],
  };

  // 拡張子を取得
  const parts = filename.split('.');
  if (parts.length < 2) {
    result.isValid = false;
    result.errors.push('File has no extension');
    return result;
  }

  const ext = parts[parts.length - 1].toLowerCase();

  // 許可された拡張子かチェック
  const allowed = allowedExtensions.some((allowedExt) => ext === allowedExt.toLowerCase());

  if (!allowed) {
    result.isValid = false;
    result.errors.push(`File type .${ext} is not allowed`);
  }

  // 危険な拡張子を拒否
  const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'js', 'jar', 'app', 'deb', 'rpm'];
  if (dangerousExtensions.includes(ext)) {
    result.isValid = false;
    result.errors.push('Dangerous file type detected');
  }

  return result;
}

/**
 * パスワード強度をチェック
 */
export function validatePasswordStrength(password: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    sanitized: '', // パスワードはサニタイズしない
    errors: [],
  };

  if (password.length < 8) {
    result.isValid = false;
    result.errors.push('Password must be at least 8 characters long');
  }

  if (password.length > INPUT_LIMITS.PASSWORD) {
    result.isValid = false;
    result.errors.push(`Password exceeds maximum length of ${INPUT_LIMITS.PASSWORD}`);
  }

  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one special character');
  }

  return result;
}

/**
 * リッチテキスト（マークダウン）をバリデート
 */
export function validateRichText(text: string, maxLength: number): ValidationResult {
  const result = sanitizeText(text, maxLength, {
    allowHTML: false,
    strictMode: true,
  });

  // 画像の data: スキームを拒否
  const imageDataPattern = /!\[.*?\]\(data:/g;
  if (imageDataPattern.test(text)) {
    result.isValid = false;
    result.errors.push('Data URI in images is not allowed');
    result.sanitized = result.sanitized.replace(imageDataPattern, '![](');
  }

  return result;
}

/**
 * HTMLエスケープ（パフォーマンス最適化版）
 */
const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

function escapeHTML(str: string): string {
  return str.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * 制御文字を削除（改行・タブは保持）
 */
function removeControlCharacters(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * バイトサイズをフォーマット
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 一括バリデーション
 */
export function batchValidate(
  inputs: Record<string, { value: string; maxLength: number; options?: any }>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  for (const [key, input] of Object.entries(inputs)) {
    results[key] = sanitizeText(input.value, input.maxLength, input.options);
  }
  return results;
}

/**
 * 全てのバリデーション結果が有効かチェック
 */
export function isAllValid(results: Record<string, ValidationResult>): boolean {
  return Object.values(results).every((result) => result.isValid);
}

/**
 * 全てのエラーメッセージを取得
 */
export function getAllErrors(results: Record<string, ValidationResult>): string[] {
  const errors: string[] = [];
  for (const [key, result] of Object.entries(results)) {
    for (const error of result.errors) {
      errors.push(`${key}: ${error}`);
    }
  }
  return errors;
}
