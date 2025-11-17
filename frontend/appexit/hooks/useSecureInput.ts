import { useState, useCallback, useMemo } from 'react';
import {
  sanitizeText,
  validateUsername,
  validateEmail,
  validateURL,
  validatePhone,
  validatePasswordStrength,
  validateRichText,
  INPUT_LIMITS,
  type ValidationResult,
} from '@/lib/input-validator';

export type InputType =
  | 'text'
  | 'username'
  | 'email'
  | 'url'
  | 'phone'
  | 'password'
  | 'textarea'
  | 'richtext'
  | 'title'
  | 'description';

interface UseSecureInputOptions {
  type: InputType;
  maxLength?: number;
  allowHTML?: boolean;
  strictMode?: boolean;
  onValidate?: (result: ValidationResult) => void;
}

/**
 * セキュアな入力フィールド用のカスタムフック
 * XSS、インジェクション、DoS攻撃を自動的に防ぐ
 */
export function useSecureInput(options: UseSecureInputOptions) {
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  // デフォルトの最大長を設定
  const maxLength = useMemo(() => {
    if (options.maxLength) return options.maxLength;

    switch (options.type) {
      case 'username':
        return INPUT_LIMITS.USERNAME;
      case 'email':
        return INPUT_LIMITS.EMAIL;
      case 'password':
        return INPUT_LIMITS.PASSWORD;
      case 'url':
        return INPUT_LIMITS.URL;
      case 'phone':
        return INPUT_LIMITS.PHONE;
      case 'title':
        return INPUT_LIMITS.TITLE;
      case 'description':
        return INPUT_LIMITS.DESCRIPTION;
      case 'textarea':
        return INPUT_LIMITS.TEXTAREA;
      case 'richtext':
        return INPUT_LIMITS.DESCRIPTION;
      default:
        return INPUT_LIMITS.TEXT_FIELD;
    }
  }, [options.maxLength, options.type]);

  // バリデーション関数
  const validate = useCallback(
    (inputValue: string): ValidationResult => {
      let result: ValidationResult;

      switch (options.type) {
        case 'username':
          result = validateUsername(inputValue);
          break;
        case 'email':
          result = validateEmail(inputValue);
          break;
        case 'url':
          result = validateURL(inputValue);
          break;
        case 'phone':
          result = validatePhone(inputValue);
          break;
        case 'password':
          result = validatePasswordStrength(inputValue);
          break;
        case 'richtext':
          result = validateRichText(inputValue, maxLength);
          break;
        default:
          result = sanitizeText(inputValue, maxLength, {
            allowHTML: options.allowHTML,
            strictMode: options.strictMode,
          });
      }

      // カスタムバリデーションコールバック
      if (options.onValidate) {
        options.onValidate(result);
      }

      return result;
    },
    [options, maxLength]
  );

  // 入力値を変更
  const handleChange = useCallback(
    (newValue: string) => {
      const result = validate(newValue);
      setValue(result.sanitized);
      setErrors(result.errors);
      setIsValid(result.isValid);
    },
    [validate]
  );

  // 入力値をリセット
  const reset = useCallback(() => {
    setValue('');
    setErrors([]);
    setIsValid(true);
  }, []);

  // 現在の値をバリデート（フォーム送信時など）
  const validateCurrent = useCallback(() => {
    const result = validate(value);
    setErrors(result.errors);
    setIsValid(result.isValid);
    return result;
  }, [value, validate]);

  return {
    value,
    errors,
    isValid,
    maxLength,
    handleChange,
    reset,
    validate: validateCurrent,
    // React Hook Form用のregister互換インターフェース
    register: {
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleChange(e.target.value);
      },
      value,
      maxLength,
    },
  };
}

/**
 * React Hook Formと統合するためのバリデータ
 */
export function createSecureValidator(
  type: InputType,
  options?: Omit<UseSecureInputOptions, 'type'>
) {
  return (value: string) => {
    let result: ValidationResult;

    const maxLength = options?.maxLength || INPUT_LIMITS.TEXT_FIELD;

    switch (type) {
      case 'username':
        result = validateUsername(value);
        break;
      case 'email':
        result = validateEmail(value);
        break;
      case 'url':
        result = validateURL(value);
        break;
      case 'phone':
        result = validatePhone(value);
        break;
      case 'password':
        result = validatePasswordStrength(value);
        break;
      case 'richtext':
        result = validateRichText(value, maxLength);
        break;
      default:
        result = sanitizeText(value, maxLength, {
          allowHTML: options?.allowHTML,
          strictMode: options?.strictMode,
        });
    }

    return result.isValid ? true : result.errors.join(', ');
  };
}
