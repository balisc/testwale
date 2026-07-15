export type SignupField = 'fullName' | 'email' | 'password' | 'confirmPassword' | 'terms' | 'form';

export type SignupErrorCode =
  | 'invalidName'
  | 'invalidEmail'
  | 'weakPassword'
  | 'passwordMismatch'
  | 'termsRequired'
  | 'emailExists';

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
};

export type ValidatedSignup = {
  fullName: string;
  email: string;
  password: string;
};

export type SignupValidationResult =
  | { ok: true; data: ValidatedSignup }
  | { ok: false; field: SignupField; code: SignupErrorCode };

const NAME_REGEX = /^[\p{L}\p{M}'.\s-]{2,80}$/u;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateSignupForm(input: SignupInput): SignupValidationResult {
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!NAME_REGEX.test(fullName)) {
    return { ok: false, field: 'fullName', code: 'invalidName' };
  }

  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return { ok: false, field: 'email', code: 'invalidEmail' };
  }

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, field: 'password', code: 'weakPassword' };
  }

  if (password !== confirmPassword) {
    return { ok: false, field: 'confirmPassword', code: 'passwordMismatch' };
  }

  if (!input.agreedToTerms) {
    return { ok: false, field: 'terms', code: 'termsRequired' };
  }

  return { ok: true, data: { fullName, email, password } };
}

export const SIGNUP_ERROR_MESSAGES = {
  en: {
    invalidName: 'Please enter a valid full name (2–80 characters).',
    invalidEmail: 'Please enter a valid email address.',
    weakPassword: 'Password must be at least 8 characters with letters and numbers.',
    passwordMismatch: 'Passwords do not match.',
    termsRequired: 'Please agree to the Terms of Service and Privacy Policy.',
    emailExists: 'An account with this email already exists. Try logging in.',
    submitError: 'Could not create your account. Please try again.',
    saveError: 'Account could not be saved. Run scripts/create_users_table.sql in Supabase.',
    googleError: 'Google sign-in failed. Check Google Client ID settings.',
    googleConfig: 'Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID in Vercel Environment Variables and redeploy.',
    googlePopupBlocked:
      'Your browser blocked the Google sign-in popup. Allow popups for this site in your browser settings, then try again.',
    googlePopupCancelled: 'Google sign-in was cancelled. Please try again.',
    googleSuccess: 'Your Google account has been connected successfully!',
    success: 'Account created successfully! You can start practicing now.',
  },
  hi: {
    invalidName: 'कृपया सही पूरा नाम दर्ज करें (2–80 अक्षर)।',
    invalidEmail: 'कृपया सही ईमेल पता दर्ज करें।',
    weakPassword: 'पासवर्ड कम से कम 8 अक्षर का हो, अक्षर और अंक दोनों हों।',
    passwordMismatch: 'पासवर्ड मेल नहीं खाते।',
    termsRequired: 'कृपया Terms of Service और Privacy Policy से सहमत हों।',
    emailExists: 'इस ईमेल से पहले से खाता है। लॉग इन करें।',
    submitError: 'खाता नहीं बन सका। कृपया फिर कोशिश करें।',
    saveError: 'खाता सेव नहीं हो सका। Supabase में users table बनाएँ।',
    googleError: 'Google sign-in विफल। Google Client ID settings जाँचें।',
    googleConfig: 'Google sign-in configure नहीं है। Vercel में NEXT_PUBLIC_GOOGLE_CLIENT_ID जोड़कर redeploy करें।',
    googlePopupBlocked:
      'आपके ब्राउज़र ने Google sign-in पॉपअप ब्लॉक कर दिया है। इस साइट के लिए पॉपअप allow करें, फिर दोबारा कोशिश करें।',
    googlePopupCancelled: 'Google sign-in रद्द हो गया। कृपया फिर कोशिश करें।',
    googleSuccess: 'आपका Google account सफलतापूर्वक जुड़ गया!',
    success: 'खाता सफलतापूर्वक बन गया! अब अभ्यास शुरू करें।',
  },
} as const;

export function getSignupErrorMessage(lang: 'en' | 'hi', code: SignupErrorCode | keyof typeof SIGNUP_ERROR_MESSAGES.en) {
  return SIGNUP_ERROR_MESSAGES[lang][code as keyof typeof SIGNUP_ERROR_MESSAGES.en];
}
