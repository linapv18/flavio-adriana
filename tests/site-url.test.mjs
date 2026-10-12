import test from 'node:test';
import assert from 'node:assert/strict';
import { siteUrl } from '../lib/site-url.mjs';
const local = 'http://localhost:3000/';
test('local development uses the config address', () => assert.equal(siteUrl(local, {}), 'http://localhost:3000'));
test('on Vercel the production domain is used', () => assert.equal(siteUrl(local, { VERCEL_PROJECT_PRODUCTION_URL: 'flavio-adriana.vercel.app' }), 'https://flavio-adriana.vercel.app'));
test('an explicit address wins over Vercel', () => assert.equal(siteUrl(local, { WEDDING_SITE_URL: 'https://flavioyadriana.com/', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' }), 'https://flavioyadriana.com'));
