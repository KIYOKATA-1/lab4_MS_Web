import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { loadSource, fixtureFetch, city, weather, air } from "./helpers/load-source.mjs";

const request = (name = "Astana") => new Request(`http://localhost/api/cities?${new URLSearchParams({ name })}`);

test("Search geocodes first, loads both sources concurrently and joins hourly data by timestamp", async () => {
  let finishWeather;
  let finishAir;
  const mock = fixtureFetch({
    weather: () => new Promise((resolve) => { finishWeather = () => resolve(Response.json(weather)); }),
    air: () => new Promise((resolve) => { finishAir = () => resolve(Response.json(air)); }),
  });
  const { GET } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
  const loading = GET(request());
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(mock.calls.length, 3);
  assert.ok(finishWeather && finishAir, "Both sources start before either completes");
  finishAir(); finishWeather();
  const response = await loading;
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.weather.status, "success");
  assert.equal(data.airQuality.status, "success");
  assert.equal(data.weather.data.temperature, 0);
  assert.equal(data.weather.data.feelsLike, null);
  assert.equal(data.airQuality.data.usAqi, 0);
  assert.deepEqual(data.hourly, [
    { timestamp: 1000, temperature: 0, usAqi: null, pm25: null },
    { timestamp: 2000, temperature: null, usAqi: 0, pm25: 0 },
    { timestamp: 3000, temperature: null, usAqi: 80, pm25: null },
  ]);
  for (const { url, options } of mock.calls) {
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal);
    if (!url.hostname.startsWith("geocoding-")) {
      assert.equal(url.searchParams.get("latitude"), String(city.latitude));
      assert.equal(url.searchParams.get("longitude"), String(city.longitude));
      assert.equal(url.searchParams.get("timeformat"), "unixtime");
      assert.equal(url.searchParams.get("forecast_hours"), "24");
    }
  }
});

test("Empty geocoding returns City not found and makes no downstream calls", async () => {
  const mock = fixtureFetch({ geocoding: () => Response.json({ generationtime_ms: 0.1 }) });
  const { GET } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
  const response = await GET(request("Unknown city"));
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "City not found");
  assert.equal(mock.calls.length, 1);
});

for (const failed of ["weather", "air"]) {
  test(`A ${failed} HTTP failure preserves the other source`, async () => {
    const mock = fixtureFetch({ [failed]: () => new Response("", { status: 503 }) });
    const { GET } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
    const data = await (await GET(request())).json();
    assert.equal(data[failed === "weather" ? "weather" : "airQuality"].status, "error");
    assert.equal(data[failed === "weather" ? "airQuality" : "weather"].status, "success");
  });
}

for (const [label, failure, expected] of [
  ["timeout", () => { throw new DOMException("Timeout", "TimeoutError"); }, /timed out/],
  ["network error", () => { throw new TypeError("network failure"); }, /Could not connect/],
  ["invalid JSON", () => new Response("not JSON"), /invalid JSON/],
  ["invalid structure", () => Response.json({ current: [] }), /invalid response/],
]) {
  test(`${label} is reported only in its source`, async () => {
    const mock = fixtureFetch({ weather: failure });
    const { GET } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
    const data = await (await GET(request())).json();
    assert.equal(data.weather.status, "error");
    assert.match(data.weather.error, expected);
    assert.equal(data.airQuality.status, "success");
  });
}

test("Refresh and retry use selected coordinates without geocoding again", async () => {
  const mock = fixtureFetch({ geocoding: () => { throw new Error("Must not geocode a refresh"); } });
  const { POST } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
  const selected = { ...city, id: 1850147, name: "Tokyo", latitude: 35.68, longitude: 139.69, timeZone: "Asia/Tokyo" };
  const response = await POST(new Request("http://localhost/api/cities", { method: "POST", body: JSON.stringify(selected) }));
  assert.equal(response.status, 200);
  assert.equal(mock.calls.length, 2);
  assert.ok(mock.calls.every(({ url }) => url.searchParams.get("latitude") === "35.68" && url.searchParams.get("longitude") === "139.69"));
});

test("Invalid city coordinates and malformed geocoding are rejected at runtime", async () => {
  const mock = fixtureFetch({ geocoding: () => Response.json({ results: [{ ...city, latitude: "51" }] }) });
  const { GET, POST } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
  assert.equal((await GET(request())).status, 502);
  assert.equal(mock.calls.length, 1);
  for (const value of [null, { ...city, latitude: 91 }, { ...city, longitude: "71" }, { ...city, timeZone: "Not/AZone" }]) {
    assert.equal((await POST(new Request("http://localhost/api/cities", { method: "POST", body: JSON.stringify(value) }))).status, 400);
  }
});

test("Runtime parsers preserve zero, reject shifted arrays and distinguish empty/missing values", async () => {
  const { parseWeather, parseAirQuality } = loadSource("src/services/environment/environment.parsers.ts");
  assert.equal(parseWeather(weather).windSpeed, 0);
  assert.equal(parseAirQuality(air).pm25, 0);
  assert.equal(parseAirQuality({ ...air, current: { us_aqi: -1 } }).usAqi, null);
  assert.throws(() => parseWeather({ ...weather, hourly: { time: [1000], temperature_2m: [0, 1] } }));
  assert.throws(() => parseWeather({ ...weather, current: { temperature_2m: "0" } }));
  const mock = fixtureFetch({ weather: () => Response.json({ timezone: "Asia/Almaty", current: {}, hourly: { time: [] } }) });
  const { GET } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
  const data = await (await GET(request())).json();
  assert.equal(data.weather.status, "empty");
  assert.equal(data.weather.data, null);
  assert.equal(data.airQuality.status, "success");
});

test("US AQI categories use exact boundaries and reject absent/invalid values", () => {
  const { getUsAqiCategory } = loadSource("src/lib/environment.ts");
  for (const [value, label] of [[0, "Good"], [50, "Good"], [50.1, "Moderate"], [100, "Moderate"], [150, "Unhealthy for sensitive groups"], [200, "Unhealthy"], [300, "Very unhealthy"], [301, "Hazardous"]]) {
    assert.equal(getUsAqiCategory(value).label, label);
  }
  for (const value of [null, NaN, Infinity, -1]) assert.equal(getUsAqiCategory(value), null);
});

test("WMO descriptions and icons distinguish day/night, precipitation and missing data", () => {
  const { describeWeather } = loadSource("src/lib/weather.ts");
  assert.equal(describeWeather(0, true).icon, "sun");
  assert.equal(describeWeather(0, false).icon, "moon");
  assert.equal(describeWeather(2, false).icon, "partlyNight");
  assert.equal(describeWeather(45, true).icon, "fog");
  assert.equal(describeWeather(61, false).icon, "rain");
  assert.equal(describeWeather(75, true).icon, "snow");
  assert.equal(describeWeather(99, true).icon, "storm");
  assert.equal(describeWeather(null, null).icon, "unknown");
});

test("Unix seconds format in the city's timezone without applying the offset twice", () => {
  const { formatTimestamp } = loadSource("src/lib/environment.ts");
  const timestamp = Date.UTC(2026, 0, 1) / 1000;
  assert.match(formatTimestamp(timestamp, "Asia/Almaty"), /01 Jan 2026, 05:00 UTC\+5/);
  assert.match(formatTimestamp(timestamp, "Europe/Berlin"), /01 Jan 2026, 01:00 UTC\+1/);
  assert.equal(formatTimestamp(null, "Asia/Almaty"), "—");
});

test("Refresh retains only same-city failed readings and their original receipt timestamps", async () => {
  const mock = fixtureFetch();
  const { GET } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
  const previous = await (await GET(request())).json();
  const next = structuredClone(previous);
  next.weather = { status: "error", data: null, fetchedAt: null, error: "Timeout" };
  next.airQuality.fetchedAt += 60;
  const { mergeEnvironment } = loadSource("src/lib/environment.ts");
  const merged = mergeEnvironment(previous, next);
  assert.equal(merged.weather.status, "error");
  assert.deepEqual(merged.weather.data, previous.weather.data);
  assert.equal(merged.weather.fetchedAt, previous.weather.fetchedAt);
  assert.equal(merged.airQuality.fetchedAt, next.airQuality.fetchedAt);
  next.city.id += 1;
  assert.equal(mergeEnvironment(previous, next).weather.data, null);
});

test("Overview cards preserve zero and missing readings and show independent observation times", async () => {
  const mock = fixtureFetch();
  const { GET } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
  const data = await (await GET(request())).json();
  const { EnvironmentData } = loadSource("src/components/EnvironmentData/EnvironmentData.tsx");
  const html = renderToStaticMarkup(createElement(EnvironmentData, { data, busy: false, refresh() {} }));
  assert.ok(html.includes("Environmental overview"));
  assert.ok(html.includes("0°C"));
  assert.ok(html.includes("Feels like —"));
  assert.ok(html.includes("0%"));
  assert.ok(html.includes("0 km/h"));
  assert.ok(html.includes("Good"));
  assert.ok(html.includes("US AQI 0, Good"));
  assert.ok(html.includes('dateTime="1970-01-01T00:16:40.000Z"'));
  assert.ok(html.includes('dateTime="1970-01-01T00:33:20.000Z"'));
  assert.ok(!html.includes("<pre"));
});

test("AQI marker follows equal category bands and clamps readings beyond 500", () => {
  const { getUsAqiPosition } = loadSource("src/lib/environment.ts");
  for (const [value, expected] of [[0, 0], [25, 100 / 12], [50, 100 / 6], [100, 100 / 3], [150, 50], [200, 200 / 3], [300, 500 / 6], [400, 550 / 6], [500, 100], [600, 100]]) {
    assert.ok(Math.abs(getUsAqiPosition(value) - expected) < 0.00001, `AQI ${value}`);
  }
  for (const value of [null, -1, NaN, Infinity]) assert.equal(getUsAqiPosition(value), null);
});

test("Overview handles missing sources and stale readings without displaying a Good badge", async () => {
  const mock = fixtureFetch();
  const { GET } = loadSource("src/app/api/cities/route.ts", mock.fetchImpl);
  const data = await (await GET(request())).json();
  const { EnvironmentData } = loadSource("src/components/EnvironmentData/EnvironmentData.tsx");
  data.airQuality = { status: "empty", data: null, fetchedAt: null, error: "No air readings" };
  data.weather.status = "error";
  data.weather.error = "Weather refresh timed out";
  const html = renderToStaticMarkup(createElement(EnvironmentData, { data, busy: true, refresh() {} }));
  assert.ok(html.includes("Air quality reading unavailable"));
  assert.ok(html.includes("Time unavailable"));
  assert.ok(!html.includes(">Good<"));
  assert.ok(html.includes("0°C"));
  assert.ok(html.includes("Showing the last available data"));
  assert.ok(html.includes("Weather refresh timed out"));
  assert.ok(html.includes('disabled=""'));
});
