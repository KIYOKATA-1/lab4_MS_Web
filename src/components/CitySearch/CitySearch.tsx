"use client";

import { CloseIcon, LocationIcon, RefreshIcon, SearchIcon, StarIcon } from "@/components/Icons";
import { EnvironmentData } from "@/components/EnvironmentData";
import { useCitySearch } from "./useCitySearch";
import { useFavoriteCities } from "./useFavoriteCities";
import { cityKey } from "@/lib/favorites";
import styles from "./CitySearch.module.scss";

export function CitySearch() {
  const {
    query, snapshot, busy, locating, refreshing, canRefresh, error, inputRef,
    updateQuery, clearSearch, refresh, search, requestLocation, retry, selectCity,
  } = useCitySearch();
  const { favorites, error: favoritesError, ready, toggleFavorite, removeFavorite } = useFavoriteCities();
  const isFavorite = snapshot !== null && favorites.some((city) => cityKey(city) === cityKey(snapshot.city));
  const favoriteLabel = isFavorite ? "Remove from favorites" : "Add to favorites";

  return (
    <section className={styles.container} aria-label="City search and favorites">
      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={search} aria-busy={busy}>
          <label className={styles.label} htmlFor="city-search">Search for a city</label>
          <div className={styles.inputWrapper}>
            <button className={styles.submit} type="submit" aria-label="Search cities" disabled={busy}>
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
          {snapshot && (
            <>
              <p className={styles.city}>{[snapshot.city.name, snapshot.city.country].filter(Boolean).join(", ")}</p>
              <p className={styles.updated}>{snapshot.city.timeZone ?? "Timezone unavailable"}</p>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.location} type="button" onClick={requestLocation} disabled={busy}>
            <LocationIcon aria-hidden="true" />
            {locating ? "Locating…" : "Use my location"}
          </button>
          <button
            className={styles.favoriteToggle}
            type="button"
            aria-label={favoriteLabel}
            aria-pressed={isFavorite}
            title={favoriteLabel}
            onClick={() => snapshot && toggleFavorite(snapshot.city)}
            disabled={!snapshot || busy || !ready}
          >
            <StarIcon width={24} height={24} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          <button
            className={styles.refresh}
            type="button"
            onClick={refresh}
            disabled={!canRefresh || busy}
            aria-busy={refreshing}
          >
            <RefreshIcon className={refreshing ? styles.spinning : undefined} aria-hidden="true" />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={retry} disabled={busy}>Try again</button></div>}

      <div className={styles.favorites} role="group" aria-label="Favorite cities">
        <span className={styles.favoritesLabel}>Favorites</span>
        {favorites.map((city) => {
          const label = [city.name, city.country].filter(Boolean).join(", ");
          const selected = snapshot !== null && cityKey(city) === cityKey(snapshot.city);
          return (
            <div className={styles.favoriteCity} key={cityKey(city)}>
              <button
                className={styles.favoriteSelect}
                type="button"
                onClick={() => selectCity(city)}
                disabled={busy}
                aria-pressed={selected}
                title={`Show ${label}`}
              >
                <StarIcon fill="currentColor" aria-hidden="true" />
                <span>{label}</span>
              </button>
              <button
                className={styles.favoriteRemove}
                type="button"
                onClick={() => removeFavorite(city)}
                aria-label={`Remove ${label} from favorites`}
                title={`Remove ${label} from favorites`}
              >
                <CloseIcon aria-hidden="true" />
              </button>
            </div>
          );
        })}
        {ready && favorites.length === 0 && <span className={styles.favoritesHint}>Click the star to save a city.</span>}
      </div>
      {favoritesError && <p className={styles.error} role="alert">{favoritesError}</p>}

      {busy && (
        <p className={styles.status} role="status">
          {refreshing ? "Refreshing weather and air quality…" : locating ? "Getting your location…" : "Loading city, weather and air quality…"}
        </p>
      )}

      <EnvironmentData data={snapshot} busy={busy} refresh={refresh} />
    </section>
  );
}
