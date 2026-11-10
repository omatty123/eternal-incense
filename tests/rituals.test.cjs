const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(new URL('../app.js', `file://${__filename}`), 'utf8');
function app(now = '2026-09-19T12:00:00') {
  const memory = new Map();
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return new Date(now).getTime(); } }
  const context = vm.createContext({ Date: Clock, TextEncoder, console, document: { addEventListener() {} }, localStorage: { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k) } });
  vm.runInContext(source, context);
  return { run: code => vm.runInContext(code, context), memory };
}

test('seven inclusive observances cross month and year boundaries', () => {
  const { run } = app();
  const expected = ['2026-09-24','2026-10-01','2026-10-08','2026-10-15','2026-10-22','2026-10-29','2026-11-05'];
  assert.deepEqual(JSON.parse(run(`JSON.stringify(getSevenDayObservances({deathDate:'2026-09-18'}).map(r => localDateString(getRitualDate('2026-09-18',r))))`)), expected);
  assert.equal(run(`localDateString(getRitualDate('2026-12-28', getSevenDayObservances({deathDate:'2026-12-28'})[0]))`), '2027-01-03');
  assert.equal(run(`getSevenDayObservances({deathDate:null}).length`), 0);
  assert.equal(run(`ordinal(21) + ' ' + ordinal(42)`), '21st 42nd');
});

test('established rites and weekly opt-in retain their scope', () => {
  const { run } = app();
  assert.equal(run(`getRitualsFor({weeklyRites:false}).length`), 4);
  assert.equal(run(`getRitualsFor({weeklyRites:true}).length`), 10);
  assert.equal(run(`localDateString(getRitualDate('2026-09-18', RITUALS[0]))`), '2026-11-05');
  assert.equal(run(`localDateString(getRitualDate('2026-09-18', RITUALS[1]))`), '2026-12-26');
  assert.equal(run(`daysBetween(new Date('2026-03-07T00:00:00'),new Date('2026-03-09T00:00:00'))`), 2);
});

test('annual memorial remains upcoming throughout its calendar day', () => {
  const { run } = app('2026-09-22T23:30:00');
  assert.equal(run(`localDateString(getNextAnnualMemorial('2022-09-22'))`), '2026-09-22');
  assert.equal(run(`getUpcomingObservances()[0].m.id`), 'p-dad');
});

test('upcoming strip uses all records and respects hidden records', () => {
  const { run } = app();
  assert.equal(run(`loadMemorials().length`), 17);
  assert.equal(run(`getUpcomingObservances()[0].m.id`), 'p-dad');
  assert.equal(run(`localDateString(getUpcomingObservances()[1].date)`), '2026-09-24');
  run(`setHidden(['p-dad'])`);
  assert.equal(run(`getUpcomingObservances()[0].m.id`), 'p-dae-dexi');
  assert.equal(run(`PERMANENT_MEMORIALS.length`), 17);
});

test('calendar export preserves alarms and omits unknown dates', () => {
  const { run } = app();
  const ics = run('generateICS()');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20260924'));
  assert.ok(ics.includes('TRIGGER:-P7D'));
  assert.ok(ics.includes('TRIGGER:-P1D'));
  assert.ok(ics.includes('TRIGGER:PT0S'));
  assert.ok(!ics.includes('NaN'));
  assert.ok(!ics.includes('p-bebe-'));
  assert.ok(!ics.includes('p-lola-'));
  assert.ok(ics.includes('DTSTAMP:'));
  const selected = run(`generateICS('p-dae-dexi',getSevenDayObservances({deathDate:'2026-09-18'})[0])`);
  assert.equal((selected.match(/BEGIN:VEVENT/g) || []).length, 1);
  assert.ok(selected.includes('DTEND;VALUE=DATE:20260925'));
  const historical = run(`generateICS('p-dad',getSevenDayObservances({deathDate:'2022-09-22'})[0])`);
  assert.ok(historical.includes('DTSTART;VALUE=DATE:20220928'));
});

test('calendar escapes user text and folds UTF-8 lines', () => {
  const { run } = app();
  assert.equal(run(`escapeICS('A, B; C\\nD')`), 'A\\, B\\; C\\nD');
  const lines = run(`foldICSLine('DESCRIPTION:' + '기도표'.repeat(40))`).split('\r\n');
  assert.ok(lines.every(line => Buffer.byteLength(line) <= 75));
  assert.ok(lines.slice(1).every(line => line.startsWith(' ')));
});

test('local memorial and prayer create/remove lifecycle stays separate from permanent data', () => {
  const { run } = app();
  run(`addMemorial({id:'test',name:'Test',deathDate:'2026-01-01'}); savePrayers([{id:'test-prayer',category:'Test',detail:'Detail'}])`);
  assert.equal(run(`loadMemorials().length`), 18);
  assert.equal(run(`loadPrayers()[0].detail`), 'Detail');
  run(`removeMemorial('test')`);
  assert.equal(run(`loadMemorials().length`), 17);
  assert.equal(run(`getPrayerStorage().length`), 1);
  run(`removeMemorial('p-dad')`);
  assert.equal(run(`getHidden()[0]`), 'p-dad');
  assert.equal(run(`PERMANENT_MEMORIALS.find(m=>m.id==='p-dad').name`), 'Dad');
});

test('flower limit persists per memorial and resets on a new day', () => {
  const { run, memory } = app();
  for (let i = 0; i < 3; i++) run(`recordFlowerOffered('p-dad')`);
  assert.equal(run(`canLeaveFlower('p-dad')`), false);
  assert.equal(run(`canLeaveFlower('p-dae-dexi')`), true);
  memory.set('flower-daily-p-dad', JSON.stringify({date:'Yesterday',count:3}));
  assert.equal(run(`canLeaveFlower('p-dad')`), true);
});

test('flower offering confirms a committed write before consuming daily allowance', async () => {
  const { run } = app();
  run(`flowersConnected = true; flowerDb = { ref: () => ({ transaction: async update => ({ committed: true, snapshot: { val: () => update(7) } }) }) };`);
  assert.equal(await run(`leaveFlower('p-dae-dexi')`), 8);
  assert.equal(run(`getDailyFlowerCount('p-dae-dexi')`), 1);
  assert.equal(run(`pendingFlowerOfferings.size`), 0);
});

test('disconnected and rejected flower writes do not consume offerings', async () => {
  const { run } = app();
  await assert.rejects(run(`leaveFlower('p-dad')`), /not connected/);
  run(`flowersConnected = true; flowerDb = { ref: () => ({ transaction: async () => ({ committed: false }) }) };`);
  await assert.rejects(run(`leaveFlower('p-dad')`), /not saved/);
  assert.equal(run(`getDailyFlowerCount('p-dad')`), 0);
  assert.equal(run(`pendingFlowerOfferings.size`), 0);
});

test('concurrent flower requests cannot bypass the daily limit', async () => {
  const { run } = app();
  run(`flowersConnected = true; let finishOffering; flowerDb = { ref: () => ({ transaction: () => new Promise(resolve => { finishOffering = resolve; }) }) };`);
  const first = run(`leaveFlower('p-dad')`);
  await assert.rejects(run(`leaveFlower('p-dad')`), /still being offered/);
  run(`finishOffering({committed:true,snapshot:{val:()=>1}})`);
  assert.equal(await first, 1);
  assert.equal(run(`getDailyFlowerCount('p-dad')`), 1);
});

test('Dexi visibly shows the 100-day ceremony after the seven early rites', () => {
  const { run } = app('2026-11-10T12:00:00');
  const html = run(`renderObservancesHTML(PERMANENT_MEMORIALS.find(m => m.id === 'p-dae-dexi'))`);
  assert.ok(html.includes('Next ceremony: 100 days'));
  assert.ok(html.includes('December 26, 2026'));
  assert.ok(html.includes('data-observance="100day"'));
  assert.equal((html.match(/class="observance /g) || []).length, 7);
});

test('next ceremony keeps today through midnight then advances to the next milestone', () => {
  const current = app('2026-12-26T23:59:59');
  assert.equal(current.run(`getMemorialUpcomingObservances(PERMANENT_MEMORIALS.find(m => m.id === 'p-dae-dexi'))[0].r.key`), '100day');
  assert.ok(current.run(`renderObservancesHTML(PERMANENT_MEMORIALS.find(m => m.id === 'p-dae-dexi'))`).includes('100 days · today'));
  const after = app('2026-12-27T00:00:00');
  assert.equal(after.run(`getMemorialUpcomingObservances(PERMANENT_MEMORIALS.find(m => m.id === 'p-dae-dexi'))[0].r.key`), '1year');
  assert.equal(after.run(`localDateString(getMemorialUpcomingObservances(PERMANENT_MEMORIALS.find(m => m.id === 'p-dae-dexi'))[0].date)`), '2027-09-18');
});

test('applicable weekly ceremonies and unknown dates keep their existing scope', () => {
  const { run } = app('2026-09-19T12:00:00');
  assert.equal(run(`getMemorialUpcomingObservances({deathDate:'2026-09-18',weeklyRites:true})[0].r.key`), 'weekly-1');
  assert.equal(run(`getMemorialUpcomingObservances({deathDate:'2026-09-18'})[0].r.key`), '49day');
  assert.equal(run(`getMemorialUpcomingObservances({deathDate:null}).length`), 0);
  assert.equal(run(`renderObservancesHTML({deathDate:null})`), '<p class="unknown-date">Date of passing not recorded</p>');
});

test('annual ceremonies roll over after today and milestone dates are not duplicated', () => {
  const { run } = app('2026-09-18T23:59:59');
  for (const deathDate of ['2025-09-18', '2023-09-18']) {
    assert.equal(run(`getMemorialUpcomingObservances({deathDate:'${deathDate}'}).filter(o => localDateString(o.date) === '2026-09-18').length`), 1);
  }
  assert.equal(run(`getMemorialUpcomingObservances({deathDate:'2020-09-18'})[0].r.key`), 'annual');
  assert.equal(run(`localDateString(getMemorialUpcomingObservances({deathDate:'2020-09-18'})[0].date)`), '2026-09-18');
  const after = app('2026-09-19T00:00:00');
  assert.equal(after.run(`localDateString(getMemorialUpcomingObservances({deathDate:'2020-09-18'})[0].date)`), '2027-09-18');
});
