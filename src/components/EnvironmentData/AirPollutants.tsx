import type { AirQualityData } from "@/services/environment/environment.types";
import overviewStyles from "./EnvironmentData.module.scss";
import styles from "./AirPollutants.module.scss";

const pollutants = [
  {
    key: "pm25",
    title: "PM2.5",
    description: "Fine particles",
    info: "Concentration of airborne particles with a diameter of 2.5 micrometres or less.",
  },
  {
    key: "pm10",
    title: "PM10",
    description: "Coarse particles",
    info: "Concentration of airborne particles with a diameter of 10 micrometres or less, including fine particles.",
  },
  {
    key: "nitrogenDioxide",
    title: "Nitrogen dioxide · NO₂",
    description: "Combustion-related gas",
    info: "Concentration of nitrogen dioxide, a gas released by fuel combustion.",
  },
  {
    key: "ozone",
    title: "Ozone · O₃",
    description: "Ground-level ozone",
    info: "Concentration of ozone near the ground, a component of air pollution.",
  },
] as const;

const numberFormat = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function AirPollutants({ air }: { air: AirQualityData | null }) {
  return (
    <section className={styles.grid} aria-label="Air pollutant concentrations">
      {pollutants.map(({ key, title, description, info }) => {
        const value = air?.[key] ?? null;
        const unit = air?.units[key];
        return (
          <article
            className={styles.card}
            aria-labelledby={`pollutant-${key}`}
            key={key}
          >
            <header className={styles.header}>
              <h3 id={`pollutant-${key}`}>{title}</h3>
              <details className={`${overviewStyles.info} ${styles.info}`}>
                <summary aria-label={`About ${title}`} title={`About ${title}`}>
                  ⓘ
                </summary>
                <div className={overviewStyles.infoContent}>
                  <p>{info}</p>
                </div>
              </details>
            </header>
            <p className={styles.reading}>
              <span className={styles.value}>
                {value === null ? "—" : numberFormat.format(value)}
              </span>
              {value !== null && unit && (
                <span className={styles.unit}>{unit}</span>
              )}
            </p>
            <p className={styles.description}>{description}</p>
          </article>
        );
      })}
    </section>
  );
}
