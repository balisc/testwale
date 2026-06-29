'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Subjects', href: '/subjects' },
  { label: 'Current Affairs', href: '/current-affairs', badge: 'New' },
  { label: 'Practice Topics', href: '/subjects' },
  { label: 'Our Vision', href: '/about_us' },
  { label: 'About Us', href: '/about_us' },
  { label: 'Contact Us', href: '/contact' },
];

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
    };
  }, [mobileMenuOpen]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Placeholder for form submission logic
    console.log('Contact request:', formValues);
    setFormValues({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-black text-white">
              T
            </div>
            <span className="max-w-[9rem] truncate text-base font-bold text-white sm:text-xl">Questionwale</span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="relative flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {link.label}
                {link.badge && (
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-200">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-1">
              <div className={`h-0.5 w-6 bg-white transition ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <div className={`h-0.5 w-6 bg-white transition ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <div className={`h-0.5 w-6 bg-white transition ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-slate-950 p-8 lg:hidden">
            <div className="space-y-8 pt-10">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-2xl font-semibold text-white transition hover:text-sky-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-5 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.6)] backdrop-blur-xl lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="space-y-6">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Contact Us</p>
                <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
                  Letâ€™s build your exam success together.
                </h1>
                <p className="mt-4 text-slate-300 sm:text-lg">
                  Reach out to Questionwale for support, partnerships, or course recommendations. Weâ€™re here to help you prepare with confidence.
                </p>
              </div>

              <div className="grid gap-4 rounded-3xl border border-slate-700 bg-slate-950/80 p-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Email</p>
                  <p className="mt-2 text-lg font-semibold text-white">support@questionwale.com</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Location</p>
                  <p className="mt-2 text-lg font-semibold text-white">Kanpur, UP</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Quick Connect</p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <a
                    href="https://wa.me/918000000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-sky-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-400"
                  >
                    <span className="text-lg">ðŸ“²</span>
                    <span>Chat on WhatsApp</span>
                  </a>
                  <div className="rounded-2xl bg-slate-900 px-5 py-4 text-slate-300">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Response Time</p>
                    <p className="mt-2 text-base font-medium text-white">Within a few hours on weekdays</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-700 bg-slate-950/95 p-6 shadow-xl lg:p-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-200">Name</label>
                <input
                  name="name"
                  type="text"
                  value={formValues.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-200">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-200">Subject</label>
                <input
                  name="subject"
                  type="text"
                  value={formValues.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-200">Message</label>
                <textarea
                  name="message"
                  value={formValues.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tell us what you need help with..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  required
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-4 text-sm font-semibold text-white transition hover:from-indigo-600 hover:to-sky-600"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

