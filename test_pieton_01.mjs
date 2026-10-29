import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PVS_PLAYWRIGHT_MODULE || 'playwright');
const source = await readFile(new URL('./SR_Module_PIETON_01.html', import.meta.url), 'utf8');
const player = 'TEST-PIETON-01';
const correct = [1, 0, 1, 1, 0];
let browser;
before(async () => { browser = await chromium.launch({ channel: 'msedge', headless: true }); });
after(async () => { if (browser) await browser.close(); });

async function exercise(t, options = {}) {
  const page = await browser.newPage({ viewport: { width: options.width || 1280, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(config => {
    if (config.storeRaw !== undefined) localStorage.setItem('pvs_sroute_progress_v1', config.storeRaw);
    if (config.bridge) localStorage.setItem('pvs_bridge_events', JSON.stringify(config.bridge));
  }, options);
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'module.example.invalid') return route.abort();
    const body = url.pathname.startsWith('/SR_Module_PIETON_01') ? source : '<!doctype html><title>Navigation test</title>';
    return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body });
  });
  await page.goto('https://module.example.invalid/SR_Module_PIETON_01?player=' + player);
  await page.locator('.q').last().waitFor();
  t.after(async () => { await page.close(); assert.deepEqual(errors, []); });
  return page;
}

async function answer(page, choices) {
  for (const [index, choice] of choices.entries()) {
    await page.locator(`input[name="q_${index}"][value="${choice}"]`).check();
  }
  await page.getByRole('button', { name: 'Valider mes réponses', exact: true }).click();
}

async function progress(page) {
  return page.evaluate(() => ({
    store: JSON.parse(localStorage.getItem('pvs_sroute_progress_v1') || '{}'),
    bridge: JSON.parse(localStorage.getItem('pvs_bridge_events') || '[]'),
    result: document.getElementById('result').innerText,
  }));
}

async function screenshot(page, name) {
  if (!process.env.PVS_QA_DIR) return;
  await mkdir(process.env.PVS_QA_DIR, { recursive: true });
  await page.screenshot({ path: path.join(process.env.PVS_QA_DIR, name), fullPage: true });
}

test('all questions and choices render with readable French text', async t => {
  const page = await exercise(t);
  assert.equal(await page.locator('.q').count(), 5);
  assert.equal(await page.locator('input[type=radio]').count(), 15);
  const text = await page.locator('body').innerText();
  assert.ok(text.includes('SÉCURITÉ ROUTIÈRE'));
  assert.ok(text.includes('Valider mes réponses'));
  assert.ok(!/[A-Za-zÀ-ÿ]\?[A-Za-zÀ-ÿ]|\uFFFD|Ã©/.test(text));
});

test('an empty attempt cannot validate or reveal the correction', async t => {
  const page = await exercise(t);
  await answer(page, []);
  const state = await progress(page);
  assert.ok(state.result.includes('Réponses manquantes : 1, 2, 3, 4, 5'));
  assert.ok(!state.result.includes('score'));
  assert.equal(await page.locator('.q.incomplete').count(), 5);
  assert.deepEqual(state.store, {});
  assert.deepEqual(state.bridge, []);
});

test('three correct responses with two blanks no longer pass', async t => {
  const page = await exercise(t);
  await answer(page, correct.slice(0, 3));
  const state = await progress(page);
  assert.ok(state.result.includes('Réponses manquantes : 4, 5'));
  assert.equal(await page.locator('.q.incomplete').count(), 2);
  assert.deepEqual(state.store, {});
  assert.deepEqual(state.bridge, []);
});

test('two correct responses out of five do not validate', async t => {
  const page = await exercise(t);
  await answer(page, [1, 0, 0, 0, 1]);
  const state = await progress(page);
  assert.ok(state.result.includes('2/5 (40%)'));
  assert.ok(state.result.includes('Module à reprendre'));
  assert.deepEqual(state.store, {});
  assert.deepEqual(state.bridge, []);
  assert.equal(await page.locator('#result li').count(), 5);
});

test('the existing sixty-percent pass threshold is retained', async t => {
  const page = await exercise(t);
  await answer(page, [1, 0, 1, 0, 1]);
  const state = await progress(page);
  assert.ok(state.result.includes('3/5 (60%)'));
  assert.deepEqual(state.store[player].done, ['SR_PIETON_01']);
  assert.deepEqual(state.store[player].bridged, ['SR_PIETON_01']);
  assert.equal(state.bridge.length, 1);
  assert.equal(state.bridge[0].player, player);
  assert.equal(state.bridge[0].type, 'ACAD_COMPLETE');
  assert.equal(state.bridge[0].moduleId, 'SR_PIETON_01');
  await screenshot(page, 'apres_desktop.png');
});

test('full marks produce readable feedback and no duplicate award', async t => {
  const page = await exercise(t);
  await answer(page, correct);
  await answer(page, correct);
  const state = await progress(page);
  assert.ok(state.result.includes('5/5 (100%)'));
  assert.ok(state.result.includes('Bonne réponse'));
  assert.equal(state.bridge.length, 1);
  assert.equal(state.store[player].done.length, 1);
  await page.reload();
  assert.ok((await page.locator('#result').innerText()).includes('Module déjà validé'));
  assert.equal((await progress(page)).bridge.length, 1);
});

test('an incomplete retry does not erase a previously validated module', async t => {
  const stored = { [player]: { done: ['SR_PIETON_01', 'SR_PIETON_02'], bridged: ['SR_PIETON_01'], updatedAt: 'unchanged' } };
  const page = await exercise(t, { storeRaw: JSON.stringify(stored) });
  await answer(page, correct.slice(0, 2));
  assert.deepEqual((await progress(page)).store, stored);
});

test('another pupil and unrelated modules and bridge events are preserved', async t => {
  const other = { done: ['SR_VELO_01'], bridged: ['SR_VELO_01'], updatedAt: 'unchanged' };
  const stored = { OTHER: other, [player]: { done: ['SR_PIETON_02'], bridged: ['SR_PIETON_02'], updatedAt: 'old' } };
  const oldEvent = { id: 'OTHER-EVENT', type: 'ACAD_COMPLETE', player: 'OTHER', moduleId: 'SR_VELO_01' };
  const page = await exercise(t, { storeRaw: JSON.stringify(stored), bridge: [oldEvent] });
  await answer(page, correct);
  const state = await progress(page);
  assert.deepEqual(state.store.OTHER, other);
  assert.deepEqual(state.store[player].done, ['SR_PIETON_02', 'SR_PIETON_01']);
  assert.deepEqual(state.bridge[0], oldEvent);
  assert.equal(state.bridge.length, 2);
});

test('invalid or non-object stored JSON cannot silently lose a new completion', async t => {
  for (const storeRaw of ['[]', '3', '"invalid"', 'null', '{broken']) {
    const page = await exercise(t, { storeRaw });
    await answer(page, correct);
    assert.deepEqual((await progress(page)).store[player].done, ['SR_PIETON_01']);
  }
});

test('mobile layout and keyboard radios remain usable', async t => {
  const page = await exercise(t, { width: 390 });
  await page.locator('input[name=q_0][value="0"]').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('input[name=q_0]:checked').inputValue(), '1');
  await answer(page, correct);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await page.locator('.q.incomplete').count(), 0);
  await screenshot(page, 'apres_mobile.png');
});

test('return navigation retains the selected pupil', async t => {
  const page = await exercise(t);
  await page.getByRole('button', { name: 'Retour au hub', exact: true }).click();
  await page.waitForURL('**/hub_securite_routiere.html?player=' + player);
  await page.goto('https://module.example.invalid/SR_Module_PIETON_01?player=' + player);
  await page.getByRole('button', { name: 'Portail Vie Scolaire', exact: true }).click();
  await page.waitForURL('**/index.html?player=' + player);
});
