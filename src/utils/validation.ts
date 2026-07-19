/**
 * Production-Grade Contact Form Validation Rules & Utilities
 */

// ── NAME REGEX ────────────────────────────────────────────────────────────────
// Allows letters (Latin, Cyrillic, Uzbek letters), spaces, apostrophe (', ’, ʻ), and hyphen (-).
// Reject numbers, emojis, and all other special characters. Length: 2 to 50 characters.
export const NAME_REGEX = /^[a-zA-Z\u0400-\u04FF\s'\u2019\u02BF\u02BB-]+$/;

// ── EMAIL REGEX ───────────────────────────────────────────────────────────────
// RFC-compliant practical email validation.
// Ensures valid username, domain, and top-level domain (TLD) of at least 2 characters.
// Rejects consecutive dots (..), missing TLDs (e.g. user@gmail), spaces, and double @ symbols.
export const EMAIL_REGEX = /^[a-zA-Z0-9]+(?:[._%-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

// ── TELEGRAM USERNAME REGEX ───────────────────────────────────────────────────
// Official Telegram username rules (after stripping leading @):
// Length: 5 to 32 characters. Allowed characters: a-z, A-Z, 0-9, and underscore (_).
export const TELEGRAM_USERNAME_REGEX = /^[a-zA-Z0-9_]{5,32}$/;

// ── PHONE REGEX ───────────────────────────────────────────────────────────────
// Accepts valid Uzbekistan phone numbers in formats:
// +998901234567, 998901234567, or 901234567.
// Spaces and non-digit characters (other than optional leading +) are strictly rejected.
export const PHONE_REGEX = /^(\+998\d{9}|998\d{9}|\d{9})$/;

// ── ERROR MESSAGES ────────────────────────────────────────────────────────────
export const VALIDATION_ERRORS = {
  NAME: "Iltimos, ismingizni to'g'ri kiriting.",
  EMAIL: "Iltimos, to'g'ri email manzil kiriting.",
  TELEGRAM: "Iltimos, Telegram username ni to'g'ri kiriting.",
  PHONE: "Iltimos, telefon raqamini to'g'ri kiriting.",
  MESSAGE: "Iltimos, kamida 5 ta belgidan iborat xabar yozing.",
} as const;

export interface ContactFormData {
  name: string;
  email?: string;
  telegramUsername?: string;
  phone?: string;
  message: string;
}

export interface FieldErrors {
  name?: string;
  email?: string;
  telegramUsername?: string;
  phone?: string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fieldErrors: FieldErrors;
  normalizedData?: ContactFormData;
}

export function validateName(name: string): string | null {
  if (typeof name !== 'string') return VALIDATION_ERRORS.NAME;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return VALIDATION_ERRORS.NAME;
  if (!NAME_REGEX.test(trimmed)) return VALIDATION_ERRORS.NAME;
  return null;
}

export function validateEmail(email?: string): string | null {
  if (email === undefined || email === null) return null;
  const str = String(email);
  if (str.trim().length === 0) return null; // Optional empty
  if (!EMAIL_REGEX.test(str)) return VALIDATION_ERRORS.EMAIL;
  return null;
}

export function normalizeTelegramUsername(telegramUsername?: string): string {
  if (!telegramUsername) return '';
  const str = String(telegramUsername).trim();
  // Strip all leading @ characters
  return str.replace(/^@+/, '');
}

export function validateTelegramUsername(telegramUsername?: string): string | null {
  if (telegramUsername === undefined || telegramUsername === null) return null;
  const str = String(telegramUsername).trim();
  if (str.length === 0) return null; // Optional empty
  const cleaned = normalizeTelegramUsername(str);
  if (!TELEGRAM_USERNAME_REGEX.test(cleaned)) return VALIDATION_ERRORS.TELEGRAM;
  return null;
}

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const cleaned = String(phone).trim();
  if (!cleaned) return '';

  if (cleaned.length === 9 && /^\d{9}$/.test(cleaned)) {
    return `+998${cleaned}`;
  }
  if (cleaned.length === 12 && /^998\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

export function validatePhone(phone?: string): string | null {
  if (phone === undefined || phone === null) return null;
  const str = String(phone);
  if (str.trim().length === 0) return null; // Optional empty
  // Reject if contains spaces
  if (/\s/.test(str)) return VALIDATION_ERRORS.PHONE;
  if (!PHONE_REGEX.test(str)) return VALIDATION_ERRORS.PHONE;
  return null;
}

export function validateMessage(message: string): string | null {
  if (typeof message !== 'string') return VALIDATION_ERRORS.MESSAGE;
  const trimmed = message.trim();
  if (trimmed.length < 5 || message.length > 1500) return VALIDATION_ERRORS.MESSAGE;
  return null;
}

export function validateContactForm(payload: Record<string, any>): ValidationResult {
  const name = typeof payload.name === 'string' ? payload.name : '';
  const email = typeof payload.email === 'string' ? payload.email : undefined;
  const telegramUsername = typeof payload.telegramUsername === 'string' ? payload.telegramUsername : undefined;
  const phone = typeof payload.phone === 'string' ? payload.phone : undefined;
  const message = typeof payload.message === 'string' ? payload.message : '';

  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const telegramError = validateTelegramUsername(telegramUsername);
  const phoneError = validatePhone(phone);
  const messageError = validateMessage(message);

  const fieldErrors: FieldErrors = {};
  if (nameError) fieldErrors.name = nameError;
  if (emailError) fieldErrors.email = emailError;
  if (telegramError) fieldErrors.telegramUsername = telegramError;
  if (phoneError) fieldErrors.phone = phoneError;
  if (messageError) fieldErrors.message = messageError;

  const firstError = nameError || emailError || telegramError || phoneError || messageError;

  if (firstError) {
    return {
      isValid: false,
      error: firstError,
      fieldErrors,
    };
  }

  const cleanedEmail = email && String(email).trim() ? String(email).trim() : undefined;
  const cleanedTelegram = telegramUsername && String(telegramUsername).trim() ? normalizeTelegramUsername(telegramUsername) : undefined;
  const cleanedPhone = phone && String(phone).trim() ? normalizePhone(phone) : undefined;

  return {
    isValid: true,
    fieldErrors: {},
    normalizedData: {
      name: name.trim(),
      email: cleanedEmail,
      telegramUsername: cleanedTelegram,
      phone: cleanedPhone,
      message: message.trim(),
    },
  };
}
