import { formatTimestamp, getUsAqiCategory, windDirection } from "@/lib/environment";
import { describeWeather } from "@/lib/weather";
import type { EnvironmentResponse, SourceResult } from "@/services/environment/environment.types";
import styles from "./EnvironmentData.module.scss";

function SourceStatus<T>({ source, retry, busy }: { source: SourceResult<T>; retry: () => void; busy: boolean }) {
  return (
    <>
      <p>Status: {source.status}</p>
      {source.status !== "success" && (
        <div role={source.status === "error" ? "alert" : "status"}>
          <p>{source.error}</p>
          {source.data !== null && <p>Showing the last available data.</p>}
          <button type="button" onClick={retry} disabled={busy}>Try again</button>
        </div>
      )}
    </>
  );
}

export function EnvironmentData({ data, busy, refresh }: { data: EnvironmentResponse | null; busy: boolean; refresh: () => void }) {
  if (!data) return null;
  const weather = data.weather.data;
  const air = data.airQuality.data;
  return (
    <div className={styles.output}>
      <section aria-label="Weather">
        <h2>Weather</h2>
        <SourceStatus source={data.weather} retry={refresh} busy={busy} />
        <p>Weather data time: {formatTimestamp(weather?.observedAt ?? null, weather?.timeZone ?? data.city.timeZone)}</p>
        <p>Last received: {formatTimestamp(data.weather.fetchedAt, weather?.timeZone ?? data.city.timeZone)}</p>
        {weather ? <>
          <p>Conditions: {describeWeather(weather.weatherCode, weather.isDay).description}</p>
          <p>Wind direction: {windDirection(weather.windDirection)}</p>
          <pre>{JSON.stringify(weather, null, 2)}</pre>
        </> : <p>—</p>}
      </section>

      <section aria-label="Air quality">
        <h2>Air quality</h2>
        <SourceStatus source={data.airQuality} retry={refresh} busy={busy} />
        <p>Air quality data time: {formatTimestamp(air?.observedAt ?? null, air?.timeZone ?? data.city.timeZone)}</p>
        <p>Last received: {formatTimestamp(data.airQuality.fetchedAt, air?.timeZone ?? data.city.timeZone)}</p>
        {air ? <>
          <p>US AQI category: {getUsAqiCategory(air.usAqi)?.label ?? "—"}</p>
          <pre>{JSON.stringify(air, null, 2)}</pre>
        </> : <p>—</p>}
      </section>

      <section aria-label="Hourly data">
        <h2>Hourly data</h2>
        <pre>{JSON.stringify(data.hourly, null, 2)}</pre>
      </section>
    </div>
  );
}
