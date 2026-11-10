"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { EnvironmentResponse } from "@/services/environment/environment.types";
import {
  formatHourlyTime,
  formatHourlyValue,
  getHourlyDomain,
  HOURLY_METRICS,
  HOUR_MS,
  prepareHourlyData,
  type HourlyMetric,
} from "@/lib/hourly-chart";
import { SourceStatus } from "@/components/EnvironmentData/SourceStatus";
import styles from "./HourlyChart.module.scss";

type Props = {
  data: EnvironmentResponse | null;
  busy: boolean;
  error: string;
  retry: () => void;
};

function ForecastTooltip({
  active,
  payload,
  label,
  metric,
  timeZone,
}: TooltipContentProps & {
  metric: (typeof HOURLY_METRICS)[number];
  timeZone: string;
}) {
  if (!active || typeof label !== "number") return null;
  const value = payload[0]?.value;
  return (
    <div className={styles.tooltip}>
      <p>{formatHourlyTime(label, timeZone)}</p>
      <strong>
        {metric.label}:{" "}
        {formatHourlyValue(typeof value === "number" ? value : null)}
        {metric.unit !== "index" && ` ${metric.unit}`}
      </strong>
    </div>
  );
}

export function HourlyChart({ data, busy, error, retry }: Props) {
  const [requestedMetric, setRequestedMetric] = useState<HourlyMetric>("usAqi");
  const [tableOpen, setTableOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const tableId = useId();
  const headingId = useId();
  const tableButton = useRef<HTMLButtonElement>(null);
  const timeZone =
    data?.city.timeZone ??
    data?.weather.data?.timeZone ??
    data?.airQuality.data?.timeZone ??
    "UTC";
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const forecast = useMemo(
    () =>
      prepareHourlyData(
        data?.weather.data ?? null,
        data?.airQuality.data ?? null,
        now,
        timeZone,
      ),
    [data, now, timeZone],
  );
  const available = HOURLY_METRICS.filter((metric) =>
    forecast.points.some((point) => point[metric.key] !== null),
  );
  const metric =
    available.find((entry) => entry.key === requestedMetric) ??
    available[0] ??
    HOURLY_METRICS[0];
  const values = forecast.points
    .map((point) => point[metric.key])
    .filter((value): value is number => value !== null);
  const hasData = values.length > 0;
  const unavailable = HOURLY_METRICS.filter(
    (entry) => !available.includes(entry),
  );
  const cityLabel = data
    ? [data.city.name, data.city.country].filter(Boolean).join(", ")
    : "";
  const summary = hasData
    ? `${metric.label} ranges from ${formatHourlyValue(Math.min(...values))} to ${formatHourlyValue(Math.max(...values))}${metric.unit === "index" ? "" : ` ${metric.unit}`} across ${values.length} available hourly readings.`
    : "No hourly data available";

  return (
    <section
      className={styles.card}
      aria-labelledby={headingId}
      aria-busy={busy}
    >
      <header className={styles.header}>
        <div>
          <h2 id={headingId}>Next 24 hours</h2>
          {data && (
            <p className={styles.subtitle}>
              {cityLabel} · {timeZone}
            </p>
          )}
        </div>
        <div
          className={styles.switcher}
          role="group"
          aria-label="Hourly forecast metric"
        >
          {HOURLY_METRICS.map((entry) => {
            const disabled = !available.includes(entry);
            return (
              <button
                key={entry.key}
                type="button"
                disabled={disabled}
                aria-pressed={entry.key === metric.key && hasData}
                title={
                  disabled
                    ? `${entry.label}: no hourly readings available`
                    : entry.label
                }
                onClick={() => setRequestedMetric(entry.key)}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      </header>

      {!data && busy ? (
        <div
          className={`${styles.plot} ${styles.skeleton}`}
          role="status"
          aria-label="Loading hourly forecast"
        >
          <span>Loading hourly forecast…</span>
        </div>
      ) : (
        <>
          {busy && (
            <p className={styles.notice} role="status">
              Updating hourly forecast…
            </p>
          )}
          <p className={styles.axisLabel}>
            {metric.label} ·{" "}
            {metric.unit === "index" ? "Index (dimensionless)" : metric.unit} ·
            Hourly forecast
          </p>
          {hasData ? (
            <div className={styles.plot}>
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={{ width: 300, height: 260 }}
              >
                <LineChart
                  key={metric.key}
                  data={forecast.points}
                  margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
                  accessibilityLayer
                  title={`${metric.label} forecast for ${cityLabel}`}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={[forecast.start, forecast.end]}
                    ticks={[0, 6, 12, 18, 24].map(
                      (hour) => forecast.start + hour * HOUR_MS,
                    )}
                    tickFormatter={(timestamp: number) =>
                      formatHourlyTime(timestamp, timeZone, true)
                    }
                    interval="preserveStartEnd"
                    minTickGap={36}
                    tick={{ fontSize: 11, fill: "var(--color-secondary)" }}
                    tickLine={false}
                    axisLine={false}
                    height={40}
                  />
                  <YAxis
                    domain={getHourlyDomain(forecast.points, metric.key)}
                    allowDataOverflow
                    allowDecimals={metric.key !== "usAqi"}
                    width={40}
                    tickCount={5}
                    tickFormatter={formatHourlyValue}
                    tick={{ fontSize: 11, fill: "var(--color-secondary)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    filterNull={false}
                    isAnimationActive={false}
                    content={(props) => (
                      <ForecastTooltip
                        {...props}
                        metric={metric}
                        timeZone={timeZone}
                      />
                    )}
                    cursor={{ stroke: "var(--color-border)" }}
                  />
                  <Line
                    type="linear"
                    dataKey={metric.key}
                    name={metric.label}
                    stroke="#7c3aff"
                    strokeWidth={2}
                    connectNulls={false}
                    isAnimationActive={false}
                    dot={{ r: 2, strokeWidth: 0, fill: "#7c3aff" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`${styles.plot} ${styles.empty}`} role="status">
              No hourly data available
            </p>
          )}
          {data && unavailable.length > 0 && (
            <p className={styles.notice}>
              {unavailable.map((entry) => entry.label).join(", ")}: no hourly
              readings available.
            </p>
          )}
          {data && (
            <div className={styles.sources}>
              <SourceStatus
                source={data.weather}
                retry={retry}
                busy={busy}
                timeZone={timeZone}
              />
              <SourceStatus
                source={data.airQuality}
                retry={retry}
                busy={busy}
                timeZone={timeZone}
              />
            </div>
          )}
          {error && (
            <div className={styles.error} role="alert">
              <p>{error}</p>
              <button type="button" onClick={retry} disabled={busy}>
                Try again
              </button>
            </div>
          )}
        </>
      )}

      <footer className={styles.footer}>
        <p>{!data && busy ? "Preparing hourly forecast…" : summary}</p>
        <button
          ref={tableButton}
          type="button"
          className={styles.tableToggle}
          disabled={!hasData}
          aria-expanded={tableOpen && hasData}
          aria-controls={tableId}
          onClick={() => setTableOpen(!tableOpen)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="1"
              y="1"
              width="14"
              height="14"
              rx="2"
              stroke="currentColor"
            />
            <path d="M1 6h14M6 1v14" stroke="currentColor" />
          </svg>
          {tableOpen ? "Hide data table" : "View data table"}
        </button>
      </footer>
      {tableOpen && hasData && (
        <div className={styles.tablePanel} id={tableId}>
          <div className={styles.tableHeader}>
            <h3>Forecast data · {data?.city.name}</h3>
            <button
              type="button"
              onClick={() => {
                setTableOpen(false);
                tableButton.current?.focus();
              }}
            >
              Close
            </button>
          </div>
          <table>
            <caption>
              {metric.label} · {timeZone} · Hourly forecast
            </caption>
            <thead>
              <tr>
                <th scope="col">Local time</th>
                <th scope="col">{metric.label}</th>
                <th scope="col">Unit</th>
              </tr>
            </thead>
            <tbody>
              {forecast.points.map((point) => (
                <tr key={point.timestamp}>
                  <th scope="row">
                    <time dateTime={new Date(point.timestamp).toISOString()}>
                      {formatHourlyTime(point.timestamp, timeZone)}
                    </time>
                  </th>
                  <td>{formatHourlyValue(point[metric.key])}</td>
                  <td>{metric.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
