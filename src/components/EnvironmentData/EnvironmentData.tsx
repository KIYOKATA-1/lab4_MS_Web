import type { EnvironmentResponse } from "@/services/environment/environment.types";
import { AirQualityCard } from "./AirQualityCard";
import { AirPollutants } from "./AirPollutants";
import { WeatherCard } from "./WeatherCard";
import styles from "./EnvironmentData.module.scss";

export function EnvironmentData({
  data,
  busy,
  refresh,
}: {
  data: EnvironmentResponse | null;
  busy: boolean;
  refresh: () => void;
}) {
  if (!data) return null;
  return (
    <section
      className={styles.overview}
      aria-labelledby="environmental-overview"
    >
      <h2 className={styles.heading} id="environmental-overview">
        Environmental overview
      </h2>
      <div className={styles.cards}>
        <AirQualityCard
          source={data.airQuality}
          timeZone={data.city.timeZone}
          busy={busy}
          refresh={refresh}
        />
        <WeatherCard
          source={data.weather}
          timeZone={data.city.timeZone}
          busy={busy}
          refresh={refresh}
        />
      </div>
      <AirPollutants air={data.airQuality.data} />
    </section>
  );
}
