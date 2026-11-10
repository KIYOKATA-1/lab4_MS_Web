import { numeric, optionalRecord, record, requiredNumber, series, text, timeZone, timestamps } from "@/lib/validation";
import type { AirQualityData, SelectedCity, WeatherData } from "./environment.types";

export function parseSelectedCity(value: unknown): SelectedCity {
  const city = record(value);
  const name = text(city.name);
  if (!name) throw new Error("A city name is required.");
  return {
    id: requiredNumber(city.id, 0), name,
    country: text(city.country),
    latitude: requiredNumber(city.latitude, -90, 90),
    longitude: requiredNumber(city.longitude, -180, 180),
    timeZone: timeZone(city.timeZone ?? city.timezone),
  };
}

export function parseWeather(value: unknown): WeatherData {
  const body = record(value);
  const current = optionalRecord(body.current);
  const units = optionalRecord(body.current_units);
  const hourly = optionalRecord(body.hourly);
  const times = timestamps(hourly.time);
  const temperatures = series(hourly.temperature_2m, times.length);
  const day = numeric(current.is_day, 0, 1);
  const code = numeric(current.weather_code, 0);
  return {
    timeZone: timeZone(body.timezone) ?? "UTC",
    observedAt: numeric(current.time, 0),
    temperature: numeric(current.temperature_2m),
    feelsLike: numeric(current.apparent_temperature),
    humidity: numeric(current.relative_humidity_2m, 0, 100),
    windSpeed: numeric(current.wind_speed_10m, 0),
    windDirection: numeric(current.wind_direction_10m, 0, 360),
    weatherCode: code !== null && Number.isInteger(code) ? code : null,
    isDay: day === 1 ? true : day === 0 ? false : null,
    units: { temperature: text(units.temperature_2m), humidity: text(units.relative_humidity_2m), windSpeed: text(units.wind_speed_10m) },
    hourly: times.map((timestamp, index) => ({ timestamp, temperature: temperatures[index] })),
  };
}

export function parseAirQuality(value: unknown): AirQualityData {
  const body = record(value);
  const current = optionalRecord(body.current);
  const units = optionalRecord(body.current_units);
  const hourly = optionalRecord(body.hourly);
  const times = timestamps(hourly.time);
  const aqi = series(hourly.us_aqi, times.length, 0);
  const pm25 = series(hourly.pm2_5, times.length, 0);
  return {
    timeZone: timeZone(body.timezone) ?? "UTC",
    observedAt: numeric(current.time, 0),
    usAqi: numeric(current.us_aqi, 0),
    pm25: numeric(current.pm2_5, 0),
    pm10: numeric(current.pm10, 0),
    nitrogenDioxide: numeric(current.nitrogen_dioxide, 0),
    ozone: numeric(current.ozone, 0),
    units: { pm25: text(units.pm2_5), pm10: text(units.pm10), nitrogenDioxide: text(units.nitrogen_dioxide), ozone: text(units.ozone) },
    hourly: times.map((timestamp, index) => ({ timestamp, usAqi: aqi[index], pm25: pm25[index] })),
  };
}
