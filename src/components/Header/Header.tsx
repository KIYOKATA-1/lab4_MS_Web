import { LeafIcon } from "@/components/Icons";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.mark}>
          <LeafIcon aria-hidden="true" />
        </span>
        <div>
          <h1 className={styles.name}>Eco Monitor</h1>
          <p className={styles.tagline}>Weather &amp; Air Quality</p>
        </div>
      </div>
    </header>
  );
}
