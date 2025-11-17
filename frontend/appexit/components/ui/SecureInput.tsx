'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  sanitizeText,
  validateUsername,
  validateEmail,
  validateURL,
  validatePhone,
  INPUT_LIMITS,
  type ValidationResult,
} from '@/lib/input-validator';

export type SecureInputType =
  | 'text'
  | 'username'
  | 'email'
  | 'url'
  | 'phone'
  | 'password'
  | 'textarea'
  | 'title';

interface SecureInputProps {
  type?: SecureInputType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  allowHTML?: boolean;
  strictMode?: boolean;
  showErrors?: boolean;
  errorClassName?: string;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

/**
 * セキュアな入力コンポーネント
 * XSS、インジェクション、DoS攻撃を自動的に防ぐ
 */
export function SecureInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  maxLength: customMaxLength,
  allowHTML = false,
  strictMode = false,
  showErrors = true,
  errorClassName = 'text-xs text-red-600 mt-1',
  onValidationChange,
}: SecureInputProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  // デフォルトの最大長を設定
  const maxLength = useMemo(() => {
    if (customMaxLength) return customMaxLength;

    switch (type) {
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
      case 'textarea':
        return INPUT_LIMITS.TEXTAREA;
      default:
        return INPUT_LIMITS.TEXT_FIELD;
    }
  }, [customMaxLength, type]);

  // バリデーション関数
  const validate = useCallback(
    (inputValue: string): ValidationResult => {
      let result: ValidationResult;

      switch (type) {
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
        default:
          result = sanitizeText(inputValue, maxLength, {
            allowHTML,
            strictMode,
          });
      }

      return result;
    },
    [type, maxLength, allowHTML, strictMode]
  );

  // 入力値を変更
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const result = validate(newValue);

      setErrors(result.errors);
      setIsValid(result.isValid);

      if (onValidationChange) {
        onValidationChange(result.isValid, result.errors);
      }

      // サニタイズされた値を親に渡す
      onChange(result.sanitized);
    },
    [validate, onChange, onValidationChange]
  );

  const baseClassName = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
    !isValid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
  } ${className}`;

  const currentLength = value.length;
  const showLengthIndicator = currentLength > maxLength * 0.8;

  if (type === 'textarea') {
    return (
      <div className="w-full">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={baseClassName}
          disabled={disabled}
          maxLength={maxLength}
          rows={6}
        />
        {showLengthIndicator && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            {currentLength} / {maxLength}
          </div>
        )}
        {showErrors && errors.length > 0 && (
          <div className={errorClassName}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const inputType = type === 'password' ? 'password' : type === 'email' ? 'email' : 'text';

  return (
    <div className="w-full">
      <input
        type={inputType}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={baseClassName}
        disabled={disabled}
        maxLength={maxLength}
      />
      {showLengthIndicator && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {currentLength} / {maxLength}
        </div>
      )}
      {showErrors && errors.length > 0 && (
        <div className={errorClassName}>
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * セキュアなテキストエリア（使いやすいエイリアス）
 */
export function SecureTextarea(props: Omit<SecureInputProps, 'type'>) {
  return <SecureInput {...props} type="textarea" />;
}

/**
 * セキュアなタイトル入力（使いやすいエイリアス）
 */
export function SecureTitle(props: Omit<SecureInputProps, 'type'>) {
  return <SecureInput {...props} type="title" strictMode={true} />;
}
