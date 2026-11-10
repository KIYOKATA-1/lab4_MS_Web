import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../..");

export function loadSource(entry, fetchImpl = fetch) {
  const cache = new Map();
  const context = vm.createContext({
    URL, URLSearchParams, Request, Response, AbortSignal, AbortController, DOMException,
    Error, TypeError, Date, Intl, console: { error() {} }, fetch: fetchImpl,
  });
  function load(file) {
    const resolved = [file, `${file}.ts`, `${file}.tsx`, path.join(file, "index.ts")].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!resolved) throw new Error(`Module not found: ${file}`);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const unit = { exports: {} };
    cache.set(resolved, unit);
    const output = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (name) => {
      if (name === "server-only" || name.endsWith(".scss")) return {};
      if (name.startsWith("@/")) return load(path.join(root, "src", name.slice(2)));
      if (name.startsWith(".")) return load(path.resolve(path.dirname(resolved), name));
      return require(name);
    };
    const execute = new vm.Script(`(function(exports, require, module) { ${output}\n})`, { filename: resolved }).runInContext(context);
    execute(unit.exports, localRequire, unit);
    return unit.exports;
  }
  return load(path.join(root, entry));
}

export const city = { id: 1526273, name: "Astana", country: "Kazakhstan", latitude: 51.18, longitude: 71.45, timeZone: "Asia/Almaty" };
export const weather = {
  timezone: "Asia/Almaty",
  current: { time: 1000, temperature_2m: 0, apparent_temperature: null, relative_humidity_2m: 0, wind_speed_10m: 0, wind_direction_10m: 0, is_day: 0, weather_code: 0 },
  current_units: { temperature_2m: "°C", relative_humidity_2m: "%", wind_speed_10m: "km/h" },
  hourly: { time: [1000, 2000], temperature_2m: [0, null] },
};
export const air = {
  timezone: "Asia/Almaty",
  current: { time: 2000, us_aqi: 0, pm2_5: 0, pm10: null, nitrogen_dioxide: null, ozone: 20 },
  current_units: { pm2_5: "μg/m³", pm10: "μg/m³", nitrogen_dioxide: "μg/m³", ozone: "μg/m³" },
  hourly: { time: [2000, 3000], us_aqi: [0, 80], pm2_5: [0, null] },
};

export function fixtureFetch(overrides = {}) {
  const calls = [];
  const fetchImpl = async (input, options) => {
    const url = new URL(input);
    calls.push({ url, options });
    const source = url.hostname.startsWith("geocoding-") ? "geocoding" : url.hostname.startsWith("air-quality-") ? "air" : "weather";
    if (overrides[source]) return overrides[source](url, options);
    const body = source === "geocoding" ? { results: [{ ...city, timezone: city.timeZone }] } : source === "air" ? air : weather;
    return Response.json(body);
  };
  return { calls, fetchImpl };
}
