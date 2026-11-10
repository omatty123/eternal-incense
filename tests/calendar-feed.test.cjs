const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { buildCalendars, loadCalendarApp } = require('../scripts/build-calendar.cjs');
const stamp = '2026-11-10T12:34:56Z';
const unfold = text => text.replace(/\r\n /g, '');
const events = text => unfold(text).match(/BEGIN:VEVENT\r\n[\s\S]*?END:VEVENT/g) || [];

test('Dexi feed retains historical weekly rites and established inclusive dates', () => {
  const feed = loadCalendarApp().generate(stamp, 'p-dae-dexi');
  const items = events(feed);
  assert.equal(items.length, 11);
  assert.ok(items.find(e => e.includes('UID:p-dae-dexi-49day@')).includes('DTSTART;VALUE=DATE:20261105'));
  assert.ok(items.find(e => e.includes('UID:p-dae-dexi-100day@')).includes('DTSTART;VALUE=DATE:20261226'));
  assert.ok(feed.includes('DTSTART;VALUE=DATE:20260924'));
  assert.ok(feed.includes('DTSTART;VALUE=DATE:20270918'));
});

test('full public catalog has 14 dated feed records and 76 events', () => {
  const app = loadCalendarApp();
  assert.equal(app.ids.length, 14);
  assert.ok(['p-bebe', 'p-louis', 'p-lola'].every(id => !app.ids.includes(id)));
  const feed = app.generate(stamp);
  const items = events(feed);
  assert.equal(items.length, 76);
  const annual = items.filter(e => e.includes('RRULE:'));
  assert.equal(annual.length, 14);
  assert.ok(annual.every(e => e.includes('RRULE:FREQ=YEARLY\r\n') && !/UNTIL=|COUNT=/.test(e)));
  assert.ok(items.find(e => e.includes('UID:p-dad-annual@')).includes('DTSTART;VALUE=DATE:20230922'));
  for (const id of ['p-bebe', 'p-louis', 'p-lola']) assert.equal(events(app.generate(stamp, id)).length, 0);
  assert.ok(!feed.includes('NaN'));
  assert.ok(feed.includes('REFRESH-INTERVAL;VALUE=DURATION:PT1H'));
  assert.ok(feed.includes('X-PUBLISHED-TTL:PT1H'));
});

test('every event has three alerts and explicit source revision metadata', () => {
  for (const event of events(loadCalendarApp().generate(stamp))) {
    assert.equal((event.match(/BEGIN:VALARM/g) || []).length, 3);
    for (const trigger of ['-P7D', '-P1D', 'PT0S']) assert.ok(event.includes(`TRIGGER:${trigger}\r\n`));
    assert.ok(event.includes('DTSTAMP:20261110T123456Z'));
    assert.ok(event.includes('LAST-MODIFIED:20261110T123456Z'));
  }
  assert.throws(() => loadCalendarApp().generate(), /timestamp/);
});

test('UIDs and event dates stay stable across source years', () => {
  const app = loadCalendarApp();
  const identity = feed => unfold(feed).split('\r\n').filter(line => /^(UID:|DTSTART|DTEND|RRULE:)/.test(line));
  assert.deepEqual(identity(app.generate(stamp)), identity(app.generate('2031-01-01T00:00:00Z')));
  assert.equal(app.generate(stamp), app.generate(stamp));
});

test('public subscriptions exclude private additions, hidden state and prayer contents', () => {
  const context = vm.createContext({ TextEncoder, console, document: { addEventListener() {} }, localStorage: {
    getItem: () => null, setItem() {}, removeItem() {},
  } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), context);
  assert.equal(vm.runInContext('PERMANENT_MEMORIALS.length', context), 17);
  const before = vm.runInContext(`generateSubscriptionICS('${stamp}')`, context);
  vm.runInContext(`loadMemorials = () => [{id:'private-person',name:'Private person',deathDate:'2025-01-01'}]; getHidden = () => ['p-dad']; loadPrayers = () => [{detail:'Private prayer'}]`, context);
  const after = vm.runInContext(`generateSubscriptionICS('${stamp}')`, context);
  assert.equal(after, before);
  assert.ok(after.includes('UID:p-dad-annual@'));
  assert.ok(!after.includes('Private'));
});

test('source corrections preserve event identities and source-independent clocks preserve completeness', () => {
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const run = now => {
    class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
    const context = vm.createContext({ Date: Clock, TextEncoder, document: { addEventListener() {} } });
    vm.runInContext(source, context);
    return context;
  };
  const early = run('2020-01-01T00:00:00Z');
  const late = run('2040-01-01T00:00:00Z');
  const original = vm.runInContext(`generateSubscriptionICS('${stamp}')`, early);
  assert.equal(original, vm.runInContext(`generateSubscriptionICS('${stamp}')`, late));
  vm.runInContext(`PERMANENT_MEMORIALS[0].name = 'Corrected name'; PERMANENT_MEMORIALS[0].deathDate = '2024-03-02'`, early);
  const corrected = vm.runInContext(`generateSubscriptionICS('${stamp}')`, early);
  const ids = feed => unfold(feed).split('\r\n').filter(line => line.startsWith('UID:'));
  assert.deepEqual(ids(original), ids(corrected));
  assert.ok(corrected.includes('URL:https://omatty123.github.io/eternal-incense/#p-abdou'));
});

test('feeds fold Unicode within 75 UTF-8 bytes and preserve escaped text', () => {
  const context = vm.createContext({ TextEncoder, document: { addEventListener() {} } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), context);
  const feed = vm.runInContext(`PERMANENT_MEMORIALS[0].name = '기도표'.repeat(40) + ',;\\n'; generateSubscriptionICS('${stamp}')`, context);
  assert.ok(feed.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
  assert.ok(unfold(feed).includes('기도표'.repeat(40) + '\\,\\;\\n'));
  assert.ok(!feed.includes('\uFFFD'));
});

test('build writes combined and per-memorial artifacts with deterministic contents', () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'eternal-incense-calendar-'));
  const result = buildCalendars(output, stamp);
  assert.equal(result.memorialCount, 14);
  assert.equal(fs.readdirSync(path.join(output, 'calendars')).length, 14);
  assert.equal(fs.readFileSync(path.join(output, 'calendar.ics'), 'utf8'), loadCalendarApp().generate(stamp));
  assert.equal(events(fs.readFileSync(path.join(output, 'calendars/p-dae-dexi.ics'), 'utf8')).length, 11);
});
