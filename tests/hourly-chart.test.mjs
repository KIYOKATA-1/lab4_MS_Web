import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers/load-source.mjs";

const { prepareHourlyData, getHourlyDomain, formatHourlyTime, formatHourlyValue, HOUR_MS } = loadSource("src/lib/hourly-chart.ts");
const start = Date.UTC(2026, 10, 10, 10);
const at = (hours) => (start + hours * HOUR_MS) / 1000;

test("Hourly preparation joins sources by epoch seconds, sorts and preserves zero, negative temperatures and gaps", () => {
  const weather = { hourly: [{ timestamp: at(2), temperature: -5 }, { timestamp: at(0), temperature: 0 }] };
  const air = { hourly: [{ timestamp: at(1), usAqi: 0, pm25: 0 }, { timestamp: at(2), usAqi: 42, pm25: null }] };
  const original = structuredClone({ weather, air });
  const result = prepareHourlyData(weather, air, start + 12345);
  assert.equal(result.points[0].timestamp, start);
  assert.equal(result.points[0].temperature, 0);
  assert.equal(result.points[0].usAqi, null);
  assert.equal(result.points[1].temperature, null);
  assert.equal(result.points[1].pm25, 0);
  assert.equal(result.points[1].usAqi, 0);
  assert.equal(result.points[2].temperature, -5);
  assert.equal(result.points[2].pm25, null);
  assert.equal(result.points[3].temperature, null);
  assert.equal(result.points.length, 24);
  assert.deepEqual({ weather, air }, original);
});

test("Forecast uses the next 24 hours rather than the beginning of a historical response", () => {
  const weather = { hourly: Array.from({ length: 72 }, (_, index) => ({ timestamp: at(index - 24), temperature: index })) };
  const result = prepareHourlyData(weather, null, start + 59 * 60000);
  assert.equal(result.points.length, 24);
  assert.equal(result.points[0].temperature, 24);
  assert.equal(result.points.at(-1).temperature, 47);
  assert.equal(result.start, start);
  assert.equal(result.end, start + 24 * HOUR_MS);
});

test("Invalid values become gaps and invalid timestamps are excluded", () => {
  const weather = { hourly: [{ timestamp: NaN, temperature: 12 }, { timestamp: Infinity, temperature: 10 }, { timestamp: at(0), temperature: NaN }, { timestamp: at(1), temperature: Infinity }] };
  const air = { hourly: [{ timestamp: at(0), usAqi: Infinity, pm25: -1 }, { timestamp: at(1), usAqi: -1, pm25: NaN }] };
  const result = prepareHourlyData(weather, air, start);
  assert.equal(result.points.length, 24);
  assert.ok(result.points.every((point) => Number.isFinite(point.timestamp) && point.temperature === null && point.pm25 === null && point.usAqi === null));
});

test("Real intervals and missing whole hours are retained without compressing the time axis", () => {
  const weather = { hourly: [{ timestamp: at(0), temperature: 3 }, { timestamp: at(2.5), temperature: 6 }] };
  const result = prepareHourlyData(weather, null, start);
  assert.equal(result.points.find((point) => point.temperature === 6).timestamp - result.points[0].timestamp, 2.5 * HOUR_MS);
  assert.equal(result.points.find((point) => point.timestamp === start + HOUR_MS).temperature, null);
});

test("Y domains support empty, single, zero, constant and negative data", () => {
  assert.deepEqual([...getHourlyDomain([], "usAqi")], [0, 1]);
  for (const metric of ["usAqi", "pm25", "temperature"]) {
    for (const value of [0, 10, ...(metric === "temperature" ? [-10] : [])]) {
      const domain = getHourlyDomain([{ [metric]: value }], metric);
      assert.ok(domain[0] <= value && domain[1] >= value && domain[1] > domain[0]);
      if (metric !== "temperature") assert.equal(domain[0], 0);
    }
  }
  const forecast = prepareHourlyData(null, null, start);
  assert.ok(forecast.points.every((point) => point.temperature === null));
});

test("City timezone formatting handles midnight, fractional offsets and DST without double offsetting", () => {
  const midnight = Date.UTC(2026, 10, 10, 20);
  assert.match(formatHourlyTime(midnight, "Asia/Almaty"), /11 Nov 2026, 01:00 UTC\+5/);
  const kathmandu = prepareHourlyData(null, null, start, "Asia/Kathmandu");
  assert.equal(kathmandu.start, start - 45 * 60000);
  const first = Date.UTC(2026, 10, 1, 5, 30);
  const second = Date.UTC(2026, 10, 1, 6, 30);
  assert.match(formatHourlyTime(first, "America/New_York"), /01:30 UTC-4/);
  assert.match(formatHourlyTime(second, "America/New_York"), /01:30 UTC-5/);
  assert.equal(formatHourlyValue(null), "—");
  assert.equal(formatHourlyValue(0), "0");
  assert.equal(formatHourlyValue(-5), "-5");
});
