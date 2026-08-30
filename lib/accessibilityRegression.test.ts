import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

test('homepage heading contains semantic whitespace and decorative icons stay silent', () => {
  const hero = source('app/home/components/HomeHero.tsx');
  assert.match(hero, /Master Every Topic\.\{' '\}/);
  assert.match(hero, /aria-hidden="true"/);
  assert.doesNotMatch(hero, /Master Every Topic\.<span/);
});

test('unavailable homepage content is non-interactive and has no fake notification action', () => {
  const subjects = source('app/home/components/HomeSubjects.tsx');
  const card = source('app/home/components/HomeSubjectCard.tsx');
  assert.doesNotMatch(subjects, /Notify Me|18 Topics|state="active"/);
  assert.match(card, /state === 'comingSoon'[\s\S]*<div/);
  assert.doesNotMatch(card, /onClick=\{onAction\}/);
});

test('mobile navigation and search dialogs support escape, focus containment and labels', () => {
  const header = source('app/home/components/HomeHeader.tsx');
  const search = source('app/home/components/HomeHeroSearch.tsx');
  assert.match(header, /role="dialog"/);
  assert.match(header, /event\.key === 'Escape'/);
  assert.match(header, /event\.key !== 'Tab'/);
  assert.match(search, /role="dialog"/);
  assert.match(search, /htmlFor="home-hero-search-overlay"/);
  assert.match(search, /event\.key !== 'Tab'/);
  assert.doesNotMatch(search, /setTimeout/);
});

test('marketing demos contain no no-op report or source controls', () => {
  const demo = source('app/home/components/HomeDemo.tsx');
  const contact = source('app/contact/ContactClient.tsx');
  assert.doesNotMatch(demo, /<button[^>]*>[\s\S]{0,120}Report an Issue/);
  assert.doesNotMatch(demo, /View official source/);
  assert.match(demo, /How sources are reviewed/);
  assert.match(contact, /aria-label="Example question-report control"/);
});

test('homepage supporting text avoids the known low-contrast gray token', () => {
  const homepageSources = [
    'HomeHero.tsx',
    'HomeHeroSearch.tsx',
    'HomeQuality.tsx',
    'HomeProgress.tsx',
    'HomeSubjectCard.tsx',
    'HomeSignIn.tsx',
    'HomeFooter.tsx',
  ].map((name) => source(`app/home/components/${name}`)).join('\n');
  assert.doesNotMatch(homepageSources, /#98A2B3/i);
});
