"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
  GeocodingErrorResponse,
  GeocodingResponse,
  LocationSearchResponse,
} from "@/services/geocoding/geocoding.types";

export function useCitySearch() {
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<GeocodingResponse | LocationSearchResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchController = useRef<AbortController | null>(null);

  useEffect(() => () => searchController.current?.abort(), []);

  function refreshSample() {
    setUpdatedAt(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit",
    }).format(new Date()));
  }

  function updateQuery(value: string) {
    searchController.current?.abort();
    searchController.current = null;
    setSearching(false);
    setLocating(false);
    setQuery(value);
    setResults(null);
    setError("");
  }

  function clearSearch() {
    updateQuery("");
    inputRef.current?.focus();
  }

  function beginRequest() {
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setSearching(false);
    setLocating(false);
    setError("");
    setResults(null);
    return controller;
  }

  function finishRequest(controller: AbortController) {
    if (searchController.current === controller) {
      searchController.current = null;
      setSearching(false);
      setLocating(false);
    }
  }

  async function loadResults(url: string, controller: AbortController) {
    setSearching(true);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      const data: GeocodingResponse | LocationSearchResponse | GeocodingErrorResponse = await response.json();

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Unable to search for cities. Please try again.");
      }

      if (controller.signal.aborted) return;

      setResults(data);
      const location = "location" in data ? data.location : null;
      const selectedCity = location ?? data.results?.[0];
      if (selectedCity) {
        const label = [selectedCity.name, selectedCity.country].filter(Boolean).join(", ");
        setCity(label);
        setQuery(label);
        refreshSample();
      }
    } catch (searchError) {
      if (!controller.signal.aborted) {
        setError(searchError instanceof Error
          ? searchError.message
          : "Unable to search for cities. Please try again.");
      }
    } finally {
      finishRequest(controller);
    }
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = query.trim();
    const controller = beginRequest();

    if (name.length < 2) {
      setError("Enter at least two characters to search for a city.");
      inputRef.current?.focus();
      finishRequest(controller);
      return;
    }

    await loadResults(`/api/cities?${new URLSearchParams({ name })}`, controller);
  }

  function requestLocation() {
    const controller = beginRequest();

    if (!window.isSecureContext) {
      setError("Location requires HTTPS or localhost. Please search by name instead.");
      finishRequest(controller);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      finishRequest(controller);
      return;
    }

    setLocating(true);

    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (controller.signal.aborted) return;
          const params = new URLSearchParams({
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
          });
          void loadResults(`/api/cities/location?${params}`, controller);
        },
        (locationError) => {
          if (controller.signal.aborted) return;
          const messages: Record<number, string> = {
            1: "Location access was denied. Allow it in your browser or search for a city.",
            2: "Your location is unavailable. Please try again or search for a city.",
            3: "Location request timed out. Please try again or search for a city.",
          };
          setError(messages[locationError.code] ?? "Unable to find your location. Please search by name.");
          finishRequest(controller);
        },
        { timeout: 10000, maximumAge: 60000 },
      );
    } catch {
      setError("Unable to access your location. Please search by name.");
      finishRequest(controller);
    }
  }

  return {
    city,
    query,
    updatedAt,
    locating,
    searching,
    error,
    results,
    inputRef,
    updateQuery,
    clearSearch,
    refreshSample,
    search,
    requestLocation,
  };
}
