import { JetBrains_Mono, Manrope, Sora } from 'next/font/google';

// CleanStart brand fonts, self-hosted via next/font so they load under the admin
// CSP (`font-src 'self'`). Matches the marketing site (apps/web): Manrope =
// display/headings, Sora = body/UI, JetBrains Mono = code. Weights mirror
// apps/web's next/font config; the exposed CSS variables are consumed by the
// --font-* token stacks in styles/_tokens.scss.
//
// IMPORTANT: keep these next/font loader calls in this dedicated module — NOT in
// (payload)/layout.tsx. Co-locating them with the layout's body-level
// `'use server'` server action makes Turbopack dev mis-compile the action and
// throw "Functions cannot be passed directly to Client Components" at
// <RootLayout>. Isolating the loaders here keeps the layout's server-action
// module clean.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jbmono',
  display: 'swap',
});

export const fontVariables = `${manrope.variable} ${sora.variable} ${jetbrainsMono.variable}`;
