"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  cityKey,
  FAVORITES_STORAGE_KEY,
  parseFavorites,
} from "@/lib/favorites";
import type { SelectedCity } from "@/services/environment/environment.types";

const CHANGE_EVENT = "eco-monitor:favorites-change";

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === FAVORITES_STORAGE_KEY || event.key === null) onChange();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

const getServerSnapshot = () => "";

export function useFavoriteCities() {
  const stored = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const favorites = useMemo(() => parseFavorites(stored), [stored]);
  const [error, setError] = useState("");

  function update(city: SelectedCity, removeOnly: boolean) {
    try {
      const current = parseFavorites(
        window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]",
      );
      const key = cityKey(city);
      const exists = current.some((entry) => cityKey(entry) === key);
      const next =
        removeOnly || exists
          ? current.filter((entry) => cityKey(entry) !== key)
          : [...current, city];
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      setError("");
    } catch {
      setError(
        "Could not save favorites. Allow local storage in your browser and try again.",
      );
    }
  }

  return {
    favorites,
    error,
    ready: stored !== "",
    toggleFavorite: (city: SelectedCity) => update(city, false),
    removeFavorite: (city: SelectedCity) => update(city, true),
  };
}
