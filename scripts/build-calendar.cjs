#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
// Use one civil calendar zone for builds regardless of the runner's local zone.
process.env.TZ = 'America/Chicago';
function loadCalendarApp() {
  const storage = new Map();
  const context = vm.createContext({ TextEncoder, console,
    document: { addEventListener() {} },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    },
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  return {
    ids: vm.runInContext('PERMANENT_MEMORIALS.filter(m => m.deathDate).map(m => m.id)', context),
    generate: (timestamp, id = null) => {
      context.calendarBuildArguments = { timestamp, id };
      return vm.runInContext('generateSubscriptionICS(calendarBuildArguments.timestamp, calendarBuildArguments.id)', context);
    },
  };
}

function buildCalendars(outputDirectory = root, sourceTimestamp) {
  const timestamp = sourceTimestamp || execFileSync('git', ['log', '-1', '--format=%cI', '--', 'app.js'], { cwd: root, encoding: 'utf8' }).trim();
  const app = loadCalendarApp();
  const combined = app.generate(timestamp);
  fs.mkdirSync(path.join(outputDirectory, 'calendars'), { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'calendar.ics'), combined);
  for (const id of app.ids) fs.writeFileSync(path.join(outputDirectory, 'calendars', `${id}.ics`), app.generate(timestamp, id));
  return { memorialCount: app.ids.length, timestamp };
}

if (require.main === module) {
  const result = buildCalendars(process.argv[2] || root, process.env.CALENDAR_SOURCE_TIMESTAMP);
  console.log(`Built combined calendar and ${result.memorialCount} memorial feeds (source ${result.timestamp}).`);
}
module.exports = { buildCalendars, loadCalendarApp };
