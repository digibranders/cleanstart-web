import { startStubCms } from '../src/server/intake/stub-cms';

const hoursAgo = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString();

const stub = await startStubCms(
  [
    { id: 9001, createdAt: hoursAgo(30), firstName: 'Sameer', lastName: 'Al Harthy', email: 'sameer@falconridge.ae', phone: '+968 9123 4567', company: 'Falcon Ridge IT', website: 'https://www.falconridge.ae', partnerReason: 'Value-added distributor across Oman and the UAE.' },
    { id: 9002, createdAt: hoursAgo(5), firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@gmail.com', company: 'Nair Security Consulting', website: null, partnerReason: 'Independent consultant looking to resell.' },
    { id: 9003, createdAt: hoursAgo(1), firstName: 'Bot', lastName: 'Spam', email: 'bot@spam.example', company: 'Spam Inc', honeypot: 'filled' },
  ],
  { apiKey: 'stub-key', port: 3290 },
);
console.log(`Stub CMS listening at ${stub.url}`);
console.log('In apps/portal/.env set CMS_API_URL=http://127.0.0.1:3290 and CMS_INTAKE_API_KEY=stub-key, then run:');
console.log('  pnpm --filter @cleanstart/portal exec tsx --env-file=.env scripts/run-intake.ts');
