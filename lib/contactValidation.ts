export const CONTACT_CATEGORIES = [
  'Technical Issue',
  'General Support',
  'Account Issue',
  'Topic Request',
  'Suggestion',
  'Other',
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];
export type ContactField = 'name' | 'email' | 'mobile' | 'subject' | 'message' | 'category' | 'form';

export type ContactInput = {
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  category?: string | null;
};

export type ValidatedContact = {
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  category: ContactCategory | null;
};

export type ContactValidationError = {
  ok: false;
  field: ContactField;
  code: ContactErrorCode;
};

export type ContactValidationSuccess = {
  ok: true;
  data: ValidatedContact;
};

export type ContactValidationResult = ContactValidationError | ContactValidationSuccess;

export type ContactErrorCode =
  | 'invalidName'
  | 'invalidEmail'
  | 'invalidMobile'
  | 'invalidSubject'
  | 'invalidMessage'
  | 'invalidCategory';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const NAME_REGEX = /^[\p{L}\p{M}'.\s-]{2,80}$/u;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

function countLetters(value: string) {
  const matches = value.match(/[\p{L}\p{M}]/gu);
  return matches?.length ?? 0;
}

function hasRepeatedCharacterSpam(value: string) {
  return /(.)\1{6,}/.test(value);
}

export function normalizeIndianMobile(mobile: string): string | null {
  const cleaned = mobile.replace(/[\s\-().]/g, '');
  let digits = cleaned;

  if (digits.startsWith('+91')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (!INDIAN_MOBILE_REGEX.test(digits)) {
    return null;
  }

  return digits;
}

export function validateContactForm(input: ContactInput): ContactValidationResult {
  const name = input.name.trim().replace(/\s+/g, ' ');
  const email = input.email.trim().toLowerCase();
  const subject = input.subject.trim().replace(/\s+/g, ' ');
  const message = input.message.trim().replace(/\s+/g, ' ');
  const categoryRaw = input.category?.trim() ?? '';

  if (!NAME_REGEX.test(name)) {
    return { ok: false, field: 'name', code: 'invalidName' };
  }

  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return { ok: false, field: 'email', code: 'invalidEmail' };
  }

  const mobile = normalizeIndianMobile(input.mobile);
  if (!mobile) {
    return { ok: false, field: 'mobile', code: 'invalidMobile' };
  }

  if (subject.length < 3 || subject.length > 150 || countLetters(subject) < 3) {
    return { ok: false, field: 'subject', code: 'invalidSubject' };
  }

  if (
    message.length < 10 ||
    message.length > 2000 ||
    countLetters(message) < 8 ||
    hasRepeatedCharacterSpam(message)
  ) {
    return { ok: false, field: 'message', code: 'invalidMessage' };
  }

  let category: ContactCategory | null = null;
  if (categoryRaw) {
    if (!CONTACT_CATEGORIES.includes(categoryRaw as ContactCategory)) {
      return { ok: false, field: 'category', code: 'invalidCategory' };
    }
    category = categoryRaw as ContactCategory;
  }

  return {
    ok: true,
    data: { name, email, mobile, subject, message, category },
  };
}

export const CONTACT_ERROR_MESSAGES = {
  en: {
    invalidName: 'Please enter a valid full name (2–80 characters, letters only).',
    invalidEmail: 'Please enter a valid email address.',
    invalidMobile: 'Please enter a valid 10-digit Indian mobile number (starts with 6–9).',
    invalidSubject: 'Subject must be at least 3 characters and describe your query.',
    invalidMessage: 'Message must be at least 10 characters with meaningful text.',
    invalidCategory: 'Please choose a valid issue category.',
    submitError: 'Something went wrong. Please try again in a moment.',
    saveError: 'Could not save your message right now. Please try again later.',
  },
  hi: {
    invalidName: 'कृपया सही पूरा नाम दर्ज करें (2–80 अक्षर, केवल अक्षर)।',
    invalidEmail: 'कृपया सही ईमेल पता दर्ज करें।',
    invalidMobile: 'कृपया सही 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें (6–9 से शुरू)।',
    invalidSubject: 'विषय कम से कम 3 अक्षर का हो और आपकी समस्या बताए।',
    invalidMessage: 'संदेश कम से कम 10 अक्षर का हो और स्पष्ट विवरण हो।',
    invalidCategory: 'कृपया सही समस्या श्रेणी चुनें।',
    submitError: 'कुछ गलत हो गया। कृपया थोड़ी देर बाद फिर कोशिश करें।',
    saveError: 'अभी संदेश सेव नहीं हो सका। कृपया बाद में फिर कोशिश करें।',
  },
} as const;

export function getContactErrorMessage(lang: 'en' | 'hi', code: ContactErrorCode | 'submitError' | 'saveError') {
  return CONTACT_ERROR_MESSAGES[lang][code];
}
