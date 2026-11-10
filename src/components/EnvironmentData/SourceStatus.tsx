import { formatTimestamp } from "@/lib/environment";
import type { SourceResult } from "@/services/environment/environment.types";
import styles from "./EnvironmentData.module.scss";

export function SourceStatus<T>({
  source,
  retry,
  busy,
  timeZone,
}: {
  source: SourceResult<T>;
  retry: () => void;
  busy: boolean;
  timeZone: string | null;
}) {
  if (source.status === "success") return null;
  return (
    <div
      className={styles.sourceStatus}
      role={source.status === "error" ? "alert" : "status"}
    >
      <p>{source.error ?? "No readings are available for this city."}</p>
      {source.data !== null && (
        <p>
          Showing the last available data · Received{" "}
          {formatTimestamp(source.fetchedAt, timeZone)}
        </p>
      )}
      <button type="button" onClick={retry} disabled={busy}>
        Try again
      </button>
    </div>
  );
}

export function SampleTime({
  label,
  timestamp,
  timeZone,
}: {
  label: string;
  timestamp: number | null;
  timeZone: string | null;
}) {
  return (
    <p className={styles.sample}>
      {label} ·{" "}
      {timestamp === null ? (
        "Time unavailable"
      ) : (
        <time dateTime={new Date(timestamp * 1000).toISOString()}>
          {formatTimestamp(timestamp, timeZone)}
        </time>
      )}
    </p>
  );
}
