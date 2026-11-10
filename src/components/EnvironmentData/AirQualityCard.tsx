import { AirIcon } from "@/components/Icons";
import {
  AQI_BANDS,
  getUsAqiCategory,
  getUsAqiPosition,
} from "@/lib/environment";
import type {
  AirQualityData,
  SourceResult,
} from "@/services/environment/environment.types";
import { SampleTime, SourceStatus } from "./SourceStatus";
import styles from "./EnvironmentData.module.scss";

export function AirQualityCard({
  source,
  timeZone,
  busy,
  refresh,
}: {
  source: SourceResult<AirQualityData>;
  timeZone: string | null;
  busy: boolean;
  refresh: () => void;
}) {
  const air = source.data;
  const value = air?.usAqi ?? null;
  const category = getUsAqiCategory(value);
  const position = getUsAqiPosition(value);
  const zone = air?.timeZone ?? timeZone;

  return (
    <section
      className={`${styles.card} ${styles.airCard}`}
      data-tone={category?.tone}
      aria-labelledby="air-quality-heading"
    >
      <header className={styles.cardHeader}>
        <h3 id="air-quality-heading">
          <AirIcon aria-hidden="true" />
          Air quality
        </h3>
        <details className={styles.info}>
          <summary aria-label="About US AQI" title="About US AQI">
            ⓘ
          </summary>
          <div className={styles.infoContent}>
            <p>
              The US Air Quality Index describes air pollution on a scale from 0
              to 500. Higher values mean greater health concern; values above
              500 remain hazardous.
            </p>
            <p>
              These are model-based estimates, not local sensor measurements.
            </p>
            <a
              href="https://www.airnow.gov/aqi/aqi-basics/"
              target="_blank"
              rel="noreferrer"
            >
              Read about US AQI
            </a>
          </div>
        </details>
      </header>

      <div className={styles.airReading}>
        <div>
          <p className={styles.eyebrow}>US AQI</p>
          <p className={styles.aqiValue}>{value ?? "—"}</p>
        </div>
        <div className={styles.airSummary}>
          {category ? (
            <>
              <span className={styles.badge}>
                {category.tone === "good" && <span aria-hidden="true">✓</span>}
                {category.label}
              </span>
              <p>{category.description}</p>
            </>
          ) : (
            <p>Air quality reading unavailable.</p>
          )}
        </div>
      </div>

      <div
        className={styles.scale}
        role="img"
        aria-label={
          category
            ? `US AQI ${value}, ${category.label}. Six categories from Good (0–50) to Hazardous (301–500).`
            : "US AQI scale: current reading unavailable."
        }
      >
        <div className={styles.markerTrack} aria-hidden="true">
          {position !== null && value !== null && (
            <span
              className={styles.marker}
              style={{ left: `clamp(22px, ${position}%, calc(100% - 22px))` }}
            >
              {value}
              <span className={styles.triangle} />
            </span>
          )}
        </div>
        <div className={styles.bands} aria-hidden="true">
          {AQI_BANDS.map((band) => (
            <div
              className={styles.band}
              data-tone={band.tone}
              key={band.tone}
              title={`${band.label}: ${band.range}`}
            >
              <span className={styles.bandColor} />
              <span className={styles.bandLabel}>{band.range}</span>
            </div>
          ))}
        </div>
      </div>
      <p className={styles.scaleNote}>
        US AQI categories · band widths are not a linear scale
      </p>
      <SourceStatus
        source={source}
        retry={refresh}
        busy={busy}
        timeZone={zone}
      />
      <SampleTime
        label="AQ sample"
        timestamp={air?.observedAt ?? null}
        timeZone={zone}
      />
    </section>
  );
}
