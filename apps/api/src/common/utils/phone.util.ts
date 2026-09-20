import { BadRequestException } from '@nestjs/common';

/**
 * Normalizes Eastern Arabic digits (٠-٩) and Persian digits (۰-۹) to standard Western digits (0-9).
 */
export function convertArabicDigits(input: string): string {
  const easternArabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianArabic = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let result = input;
  for (let i = 0; i < 10; i++) {
    result = result.split(easternArabic[i]!).join(i.toString());
    result = result.split(persianArabic[i]!).join(i.toString());
  }
  return result;
}

/**
 * Normalizes an Egyptian phone number to canonical E.164 format (+201XXXXXXXXX).
 *
 * Accepted input formats:
 * - 01012345678 / ٠١٠١٢٣٤٥٦٧٨
 * - +201012345678
 * - 00201012345678
 * - 201012345678
 * - 1012345678
 *
 * Valid mobile prefixes in Egypt:
 * - 010 (Vodafone)
 * - 011 (Etisalat)
 * - 012 (Orange)
 * - 015 (WE)
 */
export function normalizeEgyptianPhone(rawInput: string): string {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new BadRequestException('رقم الهاتف مطلوب');
  }

  // 1. Convert any Arabic numerals to ASCII
  let cleaned = convertArabicDigits(rawInput.trim());

  // 2. Strip all whitespace, hyphens, dots, parentheses
  cleaned = cleaned.replace(/[\s\-\(\)\.]+/g, '');

  // 3. Remove leading plus or 00 international prefixes
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // 4. Clean prefix
  // If starts with Egypt country code '20'
  if (cleaned.startsWith('20')) {
    cleaned = cleaned.substring(2);
  }

  // If starts with local trunk prefix '0', strip it so we get 10 digits starting with 1
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // 5. At this point, valid Egyptian mobile numbers must have exactly 10 digits starting with 1[0125]
  const egMobileRegex = /^1[0125]\d{8}$/;
  if (!egMobileRegex.test(cleaned)) {
    throw new BadRequestException(
      'رقم الهاتف غير صالح. يرجى إدخال رقم محمول مصري صحيح (مثال: 01012345678 أو +201012345678)',
    );
  }

  // 6. Return canonical E.164 format: +20 followed by 10 digits
  return `+20${cleaned}`;
}

/**
 * Returns a privacy-safe masked phone number for logs and audit records.
 * Example: +201012345678 -> +2010****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return '****';
  const prefix = phone.substring(0, 5);
  const suffix = phone.substring(phone.length - 4);
  return `${prefix}****${suffix}`;
}
