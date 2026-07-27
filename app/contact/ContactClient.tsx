'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  AtSign,
  Clock,
  FileText,
  Flag,
  Headphones,
  Lightbulb,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Trophy,
  User,
  X,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  getContactErrorMessage,
  validateContactForm,
  type ContactErrorCode,
  type ContactField,
} from '@/lib/contactValidation';
import ContactHeroIllustration from './ContactHeroIllustration';

type Lang = 'en' | 'hi';

const CATEGORIES = [
  { en: 'Technical Issue', hi: 'तकनीकी समस्या' },
  { en: 'General Support', hi: 'सामान्य सहायता' },
  { en: 'Account Issue', hi: 'खाता समस्या' },
  { en: 'Topic Request', hi: 'विषय अनुरोध' },
  { en: 'Suggestion', hi: 'सुझाव' },
  { en: 'Other', hi: 'अन्य' },
] as const;

const CONTENT: Record<
  Lang,
  {
    badge: string;
    heroTitle1: string;
    heroTitle2: string;
    heroSub: string;
    getInTouchTitle: string;
    getInTouchSub: string;
    touchItems: { title: string; desc: string }[];
    formTitle: string;
    formSub: string;
    fullName: string;
    fullNamePh: string;
    email: string;
    emailPh: string;
    mobile: string;
    mobilePh: string;
    subject: string;
    subjectPh: string;
    categoryLabel: string;
    messageLabel: string;
    messagePh: string;
    sendButton: string;
    sendingButton: string;
    reportTitle: string;
    reportSub: string;
    sampleQuestion: string;
    sampleOptions: string[];
    sampleWrong: string;
    reportButton: string;
    reportSteps: string[];
    ctaLine1: string;
    ctaLine2: string;
    ctaButton: string;
    sentSuccess: string;
  }
> = {
  en: {
    badge: 'Contact Us',
    heroTitle1: "We're Here to",
    heroTitle2: 'Help You',
    heroSub:
      'Have a question, suggestion, or facing an issue? Our team is always ready to assist you and improve your learning experience.',
    getInTouchTitle: 'Get in Touch',
    getInTouchSub: "We're here to help. Reach out to us through any of the following.",
    touchItems: [
      {
        title: 'Direct Support',
        desc: 'Connect with our support team through the platform.',
      },
      {
        title: 'Response Time',
        desc: 'We typically respond within 24–48 hours',
      },
      {
        title: 'Question Report Feature',
        desc: 'Report wrong questions directly below the question during practice.',
      },
      {
        title: 'Suggest a Topic',
        desc: 'Help us create content you need',
      },
      {
        title: 'General Feedback',
        desc: 'We value your feedback and ideas',
      },
    ],
    formTitle: 'Send us a Message',
    formSub: "Fill out the form below and we'll get back to you.",
    fullName: 'Full Name',
    fullNamePh: 'Enter your full name',
    email: 'Email Address',
    emailPh: 'Enter your email address',
    mobile: 'Mobile Number',
    mobilePh: 'Enter your mobile number',
    subject: 'Subject',
    subjectPh: 'Briefly describe your query',
    categoryLabel: 'Issue Category (Optional)',
    messageLabel: 'Your Message',
    messagePh: 'Explain your query or issue in detail...',
    sendButton: 'Send Message',
    sendingButton: 'Sending...',
    reportTitle: 'Report Wrong Questions Easily',
    reportSub:
      'Found a wrong or confusing question while practicing? You can report it right from the practice screen.',
    sampleQuestion: 'Q. Which gas do plants absorb from the atmosphere?',
    sampleOptions: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
    sampleWrong:
      'Incorrect. Plants absorb carbon dioxide from the atmosphere for photosynthesis.',
    reportButton: 'Report This Question',
    reportSteps: [
      'Answer a question.',
      'If your answer is wrong, review the explanation.',
      'Tap "Report This Question" below the question.',
      'Choose the issue type.',
      'Submit feedback.',
    ],
    ctaLine1: 'Your feedback helps us build a better learning platform for every aspirant.',
    ctaLine2: 'We appreciate your time and support.',
    ctaButton: 'Contact Support',
    sentSuccess: 'Thank you! Your message has been received. We will get back to you soon.',
  },
  hi: {
    badge: 'हमसे संपर्क करें',
    heroTitle1: 'हम यहाँ हैं',
    heroTitle2: 'आपकी मदद के लिए',
    heroSub:
      'कोई प्रश्न, सुझाव है या कोई समस्या आ रही है? हमारी टीम हमेशा आपकी सहायता और आपके सीखने के अनुभव को बेहतर बनाने के लिए तैयार है।',
    getInTouchTitle: 'संपर्क करें',
    getInTouchSub: 'हम मदद के लिए यहाँ हैं। निम्नलिखित में से किसी भी माध्यम से हमसे संपर्क करें।',
    touchItems: [
      {
        title: 'प्रत्यक्ष सहायता',
        desc: 'प्लेटफ़ॉर्म के माध्यम से हमारी सहायता टीम से जुड़ें।',
      },
      {
        title: 'प्रतिक्रिया समय',
        desc: 'हम आमतौर पर 24–48 घंटों के भीतर जवाब देते हैं',
      },
      {
        title: 'प्रश्न रिपोर्ट सुविधा',
        desc: 'अभ्यास के दौरान प्रश्न के नीचे सीधे गलत प्रश्न रिपोर्ट करें।',
      },
      {
        title: 'विषय सुझाएँ',
        desc: 'आपको जिस सामग्री की ज़रूरत है, उसे बनाने में हमारी मदद करें',
      },
      {
        title: 'सामान्य प्रतिक्रिया',
        desc: 'हम आपकी प्रतिक्रिया और विचारों को महत्व देते हैं',
      },
    ],
    formTitle: 'हमें संदेश भेजें',
    formSub: 'नीचे दिया गया फ़ॉर्म भरें और हम आपसे संपर्क करेंगे।',
    fullName: 'पूरा नाम',
    fullNamePh: 'अपना पूरा नाम दर्ज करें',
    email: 'ईमेल पता',
    emailPh: 'अपना ईमेल पता दर्ज करें',
    mobile: 'मोबाइल नंबर',
    mobilePh: 'अपना मोबाइल नंबर दर्ज करें',
    subject: 'विषय',
    subjectPh: 'अपनी समस्या संक्षेप में बताएँ',
    categoryLabel: 'समस्या श्रेणी (वैकल्पिक)',
    messageLabel: 'आपका संदेश',
    messagePh: 'अपनी समस्या या प्रश्न विस्तार से समझाएँ...',
    sendButton: 'संदेश भेजें',
    sendingButton: 'भेजा जा रहा है...',
    reportTitle: 'गलत प्रश्न आसानी से रिपोर्ट करें',
    reportSub:
      'अभ्यास करते समय कोई गलत या भ्रामक प्रश्न मिला? आप इसे सीधे अभ्यास स्क्रीन से रिपोर्ट कर सकते हैं।',
    sampleQuestion: 'प्र. पौधे वायुमंडल से कौन सी गैस अवशोषित करते हैं?',
    sampleOptions: ['ऑक्सीजन', 'कार्बन डाइऑक्साइड', 'नाइट्रोजन', 'हाइड्रोजन'],
    sampleWrong:
      'गलत। पौधे प्रकाश संश्लेषण के लिए वायुमंडल से कार्बन डाइऑक्साइड अवशोषित करते हैं।',
    reportButton: 'इस प्रश्न की रिपोर्ट करें',
    reportSteps: [
      'एक प्रश्न का उत्तर दें।',
      'यदि आपका उत्तर गलत है, तो व्याख्या देखें।',
      'प्रश्न के नीचे "इस प्रश्न की रिपोर्ट करें" पर टैप करें।',
      'समस्या का प्रकार चुनें।',
      'प्रतिक्रिया जमा करें।',
    ],
    ctaLine1: 'आपकी प्रतिक्रिया हर अभ्यर्थी के लिए बेहतर सीखने का मंच बनाने में मदद करती है।',
    ctaLine2: 'हम आपके समय और समर्थन की सराहना करते हैं।',
    ctaButton: 'सहायता से संपर्क करें',
    sentSuccess: 'धन्यवाद! आपका संदेश प्राप्त हो गया है। हम जल्द ही आपसे संपर्क करेंगे।',
  },
};

const TOUCH_ICONS = [Headphones, Clock, Flag, Lightbulb, MessageSquare] as const;

function scrollToForm() {
  document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function ContactClient() {
  const { language } = useLanguage();
  const lang = language as Lang;
  const c = CONTENT[lang];

  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    mobile: '',
    subject: '',
    message: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactField, string>>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as ContactField]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as ContactField];
        return next;
      });
    }
    setFormError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setSubmitted(false);

    const category =
      selectedCategory != null ? CATEGORIES[selectedCategory].en : null;

    const validation = validateContactForm({
      ...formValues,
      category,
    });

    if (!validation.ok) {
      setFieldErrors({
        [validation.field]: getContactErrorMessage(lang, validation.code),
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const result = (await response.json()) as {
        success?: boolean;
        field?: ContactField;
        code?: ContactErrorCode | 'saveError';
      };

      if (!response.ok || !result.success) {
        if (result.field && result.code && result.code !== 'saveError') {
          setFieldErrors({
            [result.field]: getContactErrorMessage(lang, result.code),
          });
        } else {
          setFormError(getContactErrorMessage(lang, 'saveError'));
        }
        return;
      }

      setSubmitted(true);
      setFormValues({ name: '', email: '', mobile: '', subject: '', message: '' });
      setSelectedCategory(null);
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setFormError(getContactErrorMessage(lang, 'submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldErrorClass = (field: ContactField) =>
    fieldErrors[field] ? 'border-[#FCA5A5] focus:border-[#DC2626] focus:ring-[#DC2626]/15' : '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto max-w-[1180px] px-4 pb-16 pt-10 sm:px-6 lg:px-8"
      >
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <span className="inline-flex rounded-full bg-[#F3E8FF] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#7C3AED]">
              {c.badge}
            </span>

            <h1 className="mt-5 text-[2rem] font-bold leading-[1.15] tracking-tight text-[#111827] sm:text-[2.35rem] lg:text-[2.75rem]">
              {c.heroTitle1}{' '}
              <span className="text-[#7C3AED]">{c.heroTitle2}</span>
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#6B7280]">{c.heroSub}</p>
          </div>

          <ContactHeroIllustration />
        </section>

        {/* Three columns */}
        <section className="mt-12 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-3">
          {/* Get in Touch */}
          <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
                <MessageCircle className="h-5 w-5" strokeWidth={2.1} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#111827]">{c.getInTouchTitle}</h2>
                <p className="mt-1 text-[13px] leading-6 text-[#6B7280]">{c.getInTouchSub}</p>
              </div>
            </div>

            <ul className="mt-6 space-y-5">
              {c.touchItems.map((item, index) => {
                const Icon = TOUCH_ICONS[index] ?? MessageSquare;
                return (
                  <li key={item.title} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#7C3AED]">
                      <Icon className="h-4 w-4" strokeWidth={2.1} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#111827]">{item.title}</p>
                      <p className="mt-0.5 text-[12px] leading-5 text-[#6B7280]">{item.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Form */}
          <div
            id="contact-form"
            className="scroll-mt-24 rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:p-7"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
                <Mail className="h-5 w-5" strokeWidth={2.1} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#111827]">{c.formTitle}</h2>
                <p className="mt-1 text-[13px] leading-6 text-[#6B7280]">{c.formSub}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">{c.fullName}</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={formValues.name}
                    onChange={handleChange}
                    placeholder={c.fullNamePh}
                    required
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                    className={`w-full rounded-xl border border-slate-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15 ${fieldErrorClass('name')}`}
                  />
                </div>
                {fieldErrors.name && (
                  <p id="contact-name-error" className="mt-1.5 text-[12px] font-medium text-[#DC2626]" role="alert">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">{c.email}</label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={formValues.email}
                    onChange={handleChange}
                    placeholder={c.emailPh}
                    required
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                    className={`w-full rounded-xl border border-slate-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15 ${fieldErrorClass('email')}`}
                  />
                </div>
                {fieldErrors.email && (
                  <p id="contact-email-error" className="mt-1.5 text-[12px] font-medium text-[#DC2626]" role="alert">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-mobile" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">{c.mobile}</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="contact-mobile"
                    name="mobile"
                    type="tel"
                    value={formValues.mobile}
                    onChange={handleChange}
                    placeholder={c.mobilePh}
                    required
                    autoComplete="tel"
                    aria-invalid={Boolean(fieldErrors.mobile)}
                    aria-describedby={fieldErrors.mobile ? 'contact-mobile-error' : undefined}
                    className={`w-full rounded-xl border border-slate-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15 ${fieldErrorClass('mobile')}`}
                  />
                </div>
                {fieldErrors.mobile && (
                  <p id="contact-mobile-error" className="mt-1.5 text-[12px] font-medium text-[#DC2626]" role="alert">{fieldErrors.mobile}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">{c.subject}</label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    value={formValues.subject}
                    onChange={handleChange}
                    placeholder={c.subjectPh}
                    required
                    aria-invalid={Boolean(fieldErrors.subject)}
                    aria-describedby={fieldErrors.subject ? 'contact-subject-error' : undefined}
                    className={`w-full rounded-xl border border-slate-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15 ${fieldErrorClass('subject')}`}
                  />
                </div>
                {fieldErrors.subject && (
                  <p id="contact-subject-error" className="mt-1.5 text-[12px] font-medium text-[#DC2626]" role="alert">{fieldErrors.subject}</p>
                )}
              </div>

              <div role="group" aria-labelledby="contact-category-label">
                <p id="contact-category-label" className="mb-2 block text-[13px] font-semibold text-[#374151]">{c.categoryLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat, index) => {
                    const label = lang === 'hi' ? cat.hi : cat.en;
                    const active = selectedCategory === index;
                    return (
                      <button
                        key={cat.en}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(active ? null : index);
                          if (fieldErrors.category) {
                            setFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.category;
                              return next;
                            });
                          }
                        }}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                          active
                            ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                            : 'border-slate-200 bg-[#FAFAFA] text-[#6B7280] hover:border-[#C4B5FD] hover:text-[#7C3AED]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.category && (
                  <p id="contact-category-error" className="mt-1.5 text-[12px] font-medium text-[#DC2626]" role="alert">{fieldErrors.category}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">{c.messageLabel}</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formValues.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder={c.messagePh}
                  required
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                  className={`w-full resize-none rounded-xl border border-slate-200 bg-[#FAFAFA] px-4 py-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15 ${fieldErrorClass('message')}`}
                />
                {fieldErrors.message && (
                  <p id="contact-message-error" className="mt-1.5 text-[12px] font-medium text-[#DC2626]" role="alert">{fieldErrors.message}</p>
                )}
              </div>

              {formError && (
                <p className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[13px] font-medium text-[#DC2626]">
                  {formError}
                </p>
              )}

              {submitted && (
                <p className="rounded-xl bg-[#F0FDF4] px-4 py-3 text-[13px] font-medium text-[#15803D]">
                  {c.sentSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? c.sendingButton : c.sendButton}
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>

          {/* Report Wrong Questions */}
          <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
                <Flag className="h-5 w-5" strokeWidth={2.1} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#111827]">{c.reportTitle}</h2>
                <p className="mt-1 text-[13px] leading-6 text-[#6B7280]">{c.reportSub}</p>
              </div>
            </div>

            {/* MCQ mockup */}
            <div className="mt-5 rounded-2xl border border-slate-100 bg-[#FAFAFA] p-4">
              <p className="text-[13px] font-semibold leading-5 text-[#111827]">{c.sampleQuestion}</p>

              <div className="mt-3 space-y-2">
                {c.sampleOptions.map((option, index) => {
                  const labels = ['A', 'B', 'C', 'D'];
                  const isWrong = index === 1;
                  return (
                    <div
                      key={option}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[12px] ${
                        isWrong
                          ? 'border-[#FCA5A5] bg-[#FEF2F2]'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                          isWrong ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}
                      >
                        {labels[index]}
                      </span>
                      <span className={`flex-1 font-medium ${isWrong ? 'text-[#DC2626]' : 'text-[#374151]'}`}>
                        {option}
                      </span>
                      {isWrong && <X className="h-4 w-4 shrink-0 text-[#DC2626]" strokeWidth={2.5} />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" strokeWidth={2.5} />
                <p className="text-[11px] leading-5 text-[#DC2626]">{c.sampleWrong}</p>
              </div>

              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#7C3AED] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#7C3AED] transition hover:bg-[#F3E8FF]"
              >
                <Flag className="h-3.5 w-3.5" />
                {c.reportButton}
              </button>
            </div>

            <ol className="mt-5 space-y-3">
              {c.reportSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-[12px] leading-5 text-[#6B7280]">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA banner */}
        <section className="mt-12 rounded-[28px] border border-[#E9D5FF] bg-[#F3E8FF]/60 p-6 sm:p-8 lg:mt-14">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[#7C3AED] shadow-sm">
              <Trophy className="h-8 w-8" strokeWidth={2.1} />
            </div>

            <div className="flex-1">
              <p className="text-sm text-[#6B7280]">{c.ctaLine1}</p>
              <p className="mt-1 text-xl font-bold text-[#7C3AED] sm:text-2xl">{c.ctaLine2}</p>
            </div>

            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9]"
            >
              {c.ctaButton}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
