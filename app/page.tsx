'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Subjects', href: '/subjects' },
  { label: 'Current Affairs', href: '/current-affairs', badge: 'New' },
  { label: 'PYQ Series', href: '/pyq' },
  { label: 'Our Vision', href: '/vision' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
];

export default function HomePage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Lock body scroll when menu is open
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

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    setMobileMenuOpen(false);
    router.push(`/practice?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-10">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-black text-slate-950">
                T
              </div>
              <span className="text-xl font-bold text-white">Testwale</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
                >
                  {link.label}
                  {link.badge && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Toggle */}
            <button
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

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 w-screen h-screen bg-[#030213] z-[9999] flex flex-col overflow-y-auto lg:hidden">
          <div className="pt-28 px-8 flex flex-col items-start gap-y-10">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-2xl font-semibold text-white transition hover:text-amber-300"
              >
                {link.label}
                {link.badge && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-5 py-20 lg:px-10 lg:py-32">
        {/* Radial Glow Background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-gradient-to-br from-purple-600/30 via-magenta-600/20 to-transparent blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl space-y-8 text-center">
          {/* Heading */}
          <div className="space-y-4">
            <p className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300">
              Master Your Competitive Exams
            </p>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Practice with thousands of MCQs
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-400 sm:text-xl">
              Analyze previous year questions, track your progress, and ace your competitive exams with Testwale.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-2 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl transition focus-within:border-blue-400/50 focus-within:bg-white/10 focus-within:shadow-[0_25px_80px_rgba(59,130,246,0.15)]">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search topics, subjects, exams..."
                  className="w-full border-0 bg-transparent px-5 py-4 text-white outline-none placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-blue-600 active:scale-95"
                >
                  <span>Search</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </form>

          {/* CTA */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/subjects"
              className="rounded-full bg-amber-400 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 active:scale-95"
            >
              Explore Subjects
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-t border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#050505] px-5 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Questions', value: '10K+' },
              { label: 'Subjects', value: '6+' },
              { label: 'Exams', value: '15+' },
              { label: 'Students', value: '50K+' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center">
                <p className="text-3xl font-bold text-amber-300">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
