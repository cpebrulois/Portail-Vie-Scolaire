import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import worker from './worker.js';

const origin = 'https://portail.example.invalid';
const env = { SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE: 'test-only' };
const accent = 'LYNX-INTRÉPIDE-8047';
const identite = (secret = accent, publicCode = 'TEST-0001') => ({
  code_public: publicCode, code_secret: secret, role: 'eleve',
});

async function connexion(t, input, rows, extra = {}) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const query = new URL(url);
    assert.equal(query.origin, env.SUPABASE_URL, 'No live service may be called');
    calls.push({ query, method: options.method, body: options.body && JSON.parse(options.body) });
    if (query.pathname.endsWith('/pvs_identites')) {
      assert.equal(options.method, 'GET', 'Never change pupil identities');
      const filter = query.searchParams.get('code_secret') || '';
      if (filter.startsWith('eq.')) return Response.json(rows.filter(r => r.code_secret === filter.slice(3)));
      if (filter.startsWith('like.*-')) {
        assert.equal(query.searchParams.get('limit'), '101');
        return Response.json(rows.filter(r => r.code_secret.endsWith(filter.slice(6))).slice(0, 101));
      }
      throw new Error('Unexpected identity query');
    }
    if (query.pathname.endsWith('/pvs_sessions') || query.pathname.endsWith('/pvs_messages')) return Response.json([]);
    throw new Error('Unexpected database access');
  });
  const response = await worker.fetch(new Request(origin + '/api/identite', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...extra.headers },
    body: JSON.stringify({ action: 'connecter', secret: input }),
  }), { ...env, ...extra.env }, {});
  return { response, body: await response.json(), calls };
}

test('original accented spelling still opens the exact identity', async t => {
  const { response, body, calls } = await connexion(t, 'Lynx-Intrépide-8047', [identite()]);
  assert.equal(response.status, 200);
  assert.equal(body.public, 'TEST-0001');
  assert.equal(body.secret, accent);
  assert.equal(calls.filter(c => c.query.pathname.endsWith('/pvs_identites')).length, 1);
});

test('unaccented spelling resolves to the same existing identity', async t => {
  const { response, body } = await connexion(t, 'lynx-intrepide-8047', [identite()]);
  assert.equal(response.status, 200);
  assert.equal(body.public, 'TEST-0001');
  assert.equal(body.secret, accent);
  assert.equal(typeof body.token, 'string');
});

test('accented input also accepts an existing unaccented identity', async t => {
  const { response, body } = await connexion(t, 'Lynx-Intrépide-8047', [identite('LYNX-INTREPIDE-8047')]);
  assert.equal(response.status, 200);
  assert.equal(body.public, 'TEST-0001');
});

test('decomposed Unicode accents, case and spacing resolve safely', async t => {
  const { response, body } = await connexion(t, '  lynx-intrépide-8047 '.normalize('NFD'), [identite()]);
  assert.equal(response.status, 200);
  assert.equal(body.public, 'TEST-0001');
});

test('two non-exact accent matches never choose an arbitrary account', async t => {
  const { response, body, calls } = await connexion(t, 'Lynx-Intrepide-8047', [
    identite(), identite('LYNX-ÎNTRÉPIDE-8047', 'TEST-0002'),
  ]);
  assert.equal(response.status, 409);
  assert.equal(body.public, undefined);
  assert.equal(body.token, undefined);
  assert.ok(!JSON.stringify(body).includes('TEST-000'));
  assert.ok(!calls.some(c => c.query.pathname.endsWith('/pvs_sessions')));
});

test('an exact existing spelling retains priority over accent variants', async t => {
  const { response, body } = await connexion(t, 'Lynx-Intrépide-8047', [
    identite(), identite('LYNX-ÎNTRÉPIDE-8047', 'TEST-0002'),
  ]);
  assert.equal(response.status, 200);
  assert.equal(body.public, 'TEST-0001');
});

test('same numeric suffix alone does not authenticate a different name', async t => {
  const { response, body } = await connexion(t, 'Loutre-Courageuse-8047', [identite()]);
  assert.equal(response.status, 404);
  assert.equal(body.public, undefined);
});

test('wrong numeric suffix is still rejected', async t => {
  const { response } = await connexion(t, 'Lynx-Intrepide-8048', [identite()]);
  assert.equal(response.status, 404);
});

test('wildcard input cannot broaden the fallback query', async t => {
  const { response, calls } = await connexion(t, '*-%-8047', [identite()]);
  assert.equal(response.status, 404);
  assert.equal(calls.filter(c => c.query.pathname.endsWith('/pvs_identites')).length, 1);
});

test('a saturated candidate page fails closed rather than missing a collision', async t => {
  const rows = [identite(), ...Array.from({ length: 100 }, (_, i) => identite(`AUTRE-NOM${i}-8047`, `TEST-${i + 2}`))];
  const { response, body } = await connexion(t, 'Lynx-Intrepide-8047', rows);
  assert.equal(response.status, 409);
  assert.equal(body.public, undefined);
});

test('CORS protection still precedes any database lookup', async t => {
  const { response, calls } = await connexion(t, 'Lynx-Intrepide-8047', [identite()], {
    headers: { Origin: 'https://untrusted.example.invalid' },
  });
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test('existing rate limiting still rejects excessive attempts', async t => {
  const { response, calls } = await connexion(t, 'Lynx-Intrepide-8047', [identite()], {
    env: { RL: { get: async () => '20', put: async () => {} } },
  });
  assert.equal(response.status, 429);
  assert.equal(calls.length, 0);
});

test('legacy exact identifiers without four digits still work', async t => {
  const { response, body } = await connexion(t, 'ANCIEN-CODE', [identite('ANCIEN-CODE')]);
  assert.equal(response.status, 200);
  assert.equal(body.public, 'TEST-0001');
});

test('the actual login page sends the original accents to the API', async () => {
  const source = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  const helpers = source.match(/function stripAcc\(v\)\{[^}]+\}function nCode\(v\)\{[^}]+\}/)?.[0];
  const start = source.indexOf('async function loginPlayer()');
  const end = source.indexOf('async function loginAdmin()', start);
  assert.ok(helpers && start >= 0 && end > start);
  for (const input of ['Lynx-Intrépide-8047', 'lynx-intrepide-8047', 'Lynx-Intrépide-8047'.normalize('NFD')]) {
    const seen = [];
    const context = vm.createContext({
      cm() {}, sm() {}, localStorage: { removeItem() {} }, sessionStorage: { removeItem() {} },
      document: { getElementById: id => id === 'authCode' ? { value: input } : { value: '' } },
      ADMIN_SESSION_KEY: 'test', isVisitorCode: () => false, hasRefCodes: () => true,
      IDENT_ERREUR: '',
      isKnownPlayerCode: () => false, sbPullGlobal: async () => {},
      identiteServeur: async code => { seen.push(code); return null; },
    });
    vm.runInContext(helpers + '\n' + source.slice(start, end), context);
    await context.loginPlayer();
    assert.deepEqual(seen, [input.normalize('NFC').toUpperCase()]);
  }
});

test('the login page retains useful server errors instead of claiming an unknown name', async () => {
  const source = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  const start = source.indexOf('async function identiteServeur(code)');
  const end = source.indexOf('async function loginAdmin()', start);
  const helpers = source.match(/function stripAcc\(v\)\{[^}]+\}function nCode\(v\)\{[^}]+\}/)[0];
  const shown = [];
  const expected = 'Plusieurs noms correspondent. Recopie ton nom avec ses accents exacts ou demande à ton CPE.';
  const context = vm.createContext({
    cm() {}, sm: (id, message) => shown.push({ id, message }), IDENT_ERREUR: '',
    localStorage: { removeItem() {} }, sessionStorage: { removeItem() {} },
    document: { getElementById: id => id === 'authCode' ? { value: 'Lynx-Intrepide-8047' } : { value: '' } },
    ADMIN_SESSION_KEY: 'test', isVisitorCode: () => false, hasRefCodes: () => true,
    isKnownPlayerCode: () => false, sbPullGlobal: async () => {},
    fetch: async () => Response.json({ error: expected }, { status: 409 }),
  });
  vm.runInContext(helpers + '\n' + source.slice(start, end), context);
  await context.loginPlayer();
  assert.equal(shown.at(-1).message, expected);
});
