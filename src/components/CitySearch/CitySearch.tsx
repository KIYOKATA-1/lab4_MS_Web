"use client";

import { CloseIcon, LocationIcon, RefreshIcon, SearchIcon, StarIcon } from "@/components/Icons";
import { useCitySearch } from "./useCitySearch";
import styles from "./CitySearch.module.scss";

export function CitySearch() {
  const {
    city, query, updatedAt, locating, searching, error, results, inputRef,
    updateQuery, clearSearch, refreshSample, search, requestLocation,
  } = useCitySearch();

  return (
    <section className={styles.container} aria-label="City search and favorites">
      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={search} aria-busy={searching}>
          <label className={styles.label} htmlFor="city-search">Search for a city</label>
          <div className={styles.inputWrapper}>
            <button className={styles.submit} type="submit" aria-label="Search cities" disabled={searching}>
              <SearchIcon aria-hidden="true" />
            </button>
            <input
              ref={inputRef}
              id="city-search"
              name="city"
              type="text"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Enter City Name"
              autoComplete="off"
              enterKeyHint="search"
            />
            {query && (
              <button
                className={styles.clear}
                type="button"
                aria-label="Clear city search"
                onClick={clearSearch}
              >
                <CloseIcon aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

        <div className={styles.summary} aria-live="polite">
          {city && updatedAt && (
            <>
              <p className={styles.city}>{city}</p>
              <p className={styles.updated}>Sample updated {updatedAt} · UTC+5</p>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.location} type="button" onClick={requestLocation} disabled={locating}>
            <LocationIcon aria-hidden="true" />
            {locating ? (searching ? "Searching…" : "Locating…") : "Use my location"}
          </button>
          <button
            className={styles.favoriteToggle}
            type="button"
            aria-label="Add to favorites (coming soon)"
            title="Favorites coming soon"
            disabled
          >
            <StarIcon width={24} height={24} aria-hidden="true" />
          </button>
          <button className={styles.refresh} type="button" onClick={refreshSample}>
            <RefreshIcon aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.favorites} role="group" aria-label="Favorite cities">
        <span className={styles.favoritesLabel}>Favorites</span>
      </div>

      {(locating || searching) && (
        <p className={styles.status} role="status">
          {searching ? "Searching cities…" : "Getting your location…"}
        </p>
      )}

      {results && (
        <section className={styles.results} aria-label="City search results">
          {!results.results?.length && (
            <p role="status">
              {"location" in results ? "City found, but no Open-Meteo matches are available." : "No cities found."}
            </p>
          )}
          <pre>{JSON.stringify(results, null, 2)}</pre>
          {"location" in results && (
            <p className={styles.source}>
              Location: <a href="https://photon.komoot.io/">Photon</a>
              {" · © "}<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>
            </p>
          )}
        </section>
      )}
    </section>
  );
}
