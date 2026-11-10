import { AirIcon, HumidityIcon, WeatherIcon } from "@/components/Icons";
import { windDirection } from "@/lib/environment";
import { describeWeather } from "@/lib/weather";
import type {
  SourceResult,
  WeatherData,
} from "@/services/environment/environment.types";
import { SampleTime, SourceStatus } from "./SourceStatus";
import styles from "./EnvironmentData.module.scss";

function reading(
  value: number | null | undefined,
  unit: string | null | undefined,
  space = false,
) {
  return value === null || value === undefined
    ? "—"
    : `${Math.round(value)}${unit ? `${space ? " " : ""}${unit}` : ""}`;
}

export function WeatherCard({
  source,
  timeZone,
  busy,
  refresh,
}: {
  source: SourceResult<WeatherData>;
  timeZone: string | null;
  busy: boolean;
  refresh: () => void;
}) {
  const weather = source.data;
  const zone = weather?.timeZone ?? timeZone;
  return (
    <section className={styles.card} aria-labelledby="weather-heading">
      <header className={styles.cardHeader}>
        <h3 id="weather-heading">Weather</h3>
        <WeatherIcon width={24} height={24} aria-hidden="true" />
      </header>
      <div className={styles.weatherReading}>
        <p className={styles.temperature}>
          {reading(weather?.temperature, weather?.units.temperature)}
        </p>
        <div className={styles.conditions}>
          <p>
            {
              describeWeather(
                weather?.weatherCode ?? null,
                weather?.isDay ?? null,
              ).description
            }
          </p>
          <p className={styles.feelsLike}>
            Feels like {reading(weather?.feelsLike, weather?.units.temperature)}
          </p>
        </div>
      </div>
      <dl className={styles.weatherDetails}>
        <div>
          <dt>
            <HumidityIcon aria-hidden="true" />
            Humidity
          </dt>
          <dd>{reading(weather?.humidity, weather?.units.humidity)}</dd>
        </div>
        <div>
          <dt>
            <AirIcon aria-hidden="true" />
            Wind · {windDirection(weather?.windDirection ?? null)}
          </dt>
          <dd>{reading(weather?.windSpeed, weather?.units.windSpeed, true)}</dd>
        </div>
      </dl>
      <SourceStatus
        source={source}
        retry={refresh}
        busy={busy}
        timeZone={zone}
      />
      <SampleTime
        label="Weather sample"
        timestamp={weather?.observedAt ?? null}
        timeZone={zone}
      />
    </section>
  );
}
