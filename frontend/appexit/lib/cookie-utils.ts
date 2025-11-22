export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

// Registration step cookie helpers
const REGISTRATION_STEP_COOKIE = 'appexit_registration_step';

export function saveRegistrationStep(step: number): void {
  setCookie(REGISTRATION_STEP_COOKIE, step.toString(), 7); // 7日間有効
}

export function getRegistrationStep(): number | null {
  const step = getCookie(REGISTRATION_STEP_COOKIE);
  if (step) {
    const parsed = parseInt(step, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function clearRegistrationStep(): void {
  deleteCookie(REGISTRATION_STEP_COOKIE);
}

export function getAuthToken(): string | null {
  return null;
}

export function getAuthHeader(): { Authorization?: string } {
  return {};
}
