"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { isRecord } from "@/lib/validation";
import { mergeEnvironment } from "@/lib/environment";
import { isEnvironmentResponse } from "@/services/environment/environment.response";
import type {
  EnvironmentResponse,
  SelectedCity,
} from "@/services/environment/environment.types";

type Target =
  | { kind: "name"; name: string }
  | { kind: "coordinates"; city: SelectedCity }
  | { kind: "location"; latitude: number; longitude: number };
type Phase = "idle" | "searching" | "locating" | "refreshing";

async function fetchEnvironment(
  target: Target,
  signal: AbortSignal,
): Promise<EnvironmentResponse> {
  let url = "/api/cities";
  const options: RequestInit = { cache: "no-store", signal };
  if (target.kind === "coordinates") {
    options.method = "POST";
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(target.city);
  } else if (target.kind === "location") {
    url += `/location?${new URLSearchParams({ latitude: String(target.latitude), longitude: String(target.longitude) })}`;
  } else {
    url += `?${new URLSearchParams({ name: target.name })}`;
  }
  const response = await fetch(url, options);
  const data: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      isRecord(data) && typeof data.error === "string"
        ? data.error
        : "Unable to load this city. Please try again.",
    );
  if (!isEnvironmentResponse(data))
    throw new Error(
      "The server returned an invalid response. Please try again.",
    );
  return data;
}

export function useCitySearch() {
  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] = useState<EnvironmentResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("searching");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null);
  const lastAttempt = useRef<Target | "geolocation">({
    kind: "name",
    name: "Astana, Kazakhstan",
  });

  const loadTarget = useCallback(
    async (
      target: Target,
      controller: AbortController,
      preserveData = false,
    ) => {
      try {
        const next = await fetchEnvironment(target, controller.signal);
        if (controller.signal.aborted) return;
        setSnapshot((previous) =>
          preserveData ? mergeEnvironment(previous, next) : next,
        );
        setQuery(
          [next.city.name, next.city.country].filter(Boolean).join(", "),
        );
      } catch (requestError) {
        if (!controller.signal.aborted)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load city data. Please try again.",
          );
      } finally {
        if (active.current === controller) {
          active.current = null;
          setPhase("idle");
        }
      }
    },
    [],
  );

  const runRequest = useCallback(
    async (target: Target, preserveData = false) => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      lastAttempt.current = target;
      setPhase(preserveData ? "refreshing" : "searching");
      setError("");
      if (!preserveData) setSnapshot(null);
      await loadTarget(target, controller, preserveData);
    },
    [loadTarget],
  );

  useEffect(() => {
    const controller = new AbortController();
    active.current = controller;
    void fetchEnvironment(
      { kind: "name", name: "Astana, Kazakhstan" },
      controller.signal,
    )
      .then((next) => {
        if (controller.signal.aborted) return;
        setSnapshot(next);
        setQuery(
          [next.city.name, next.city.country].filter(Boolean).join(", "),
        );
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load city data. Please try again.",
          );
      })
      .finally(() => {
        if (active.current === controller) {
          active.current = null;
          setPhase("idle");
        }
      });
    return () => {
      controller.abort();
      active.current?.abort();
    };
  }, []);

  function updateQuery(value: string) {
    active.current?.abort();
    active.current = null;
    setPhase("idle");
    setQuery(value);
    setError("");
  }

  function clearSearch() {
    updateQuery("");
    inputRef.current?.focus();
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = query.trim();
    if (name.length < 2) {
      setError("Enter at least two characters to search for a city.");
      inputRef.current?.focus();
      return;
    }
    if (
      active.current &&
      lastAttempt.current !== "geolocation" &&
      lastAttempt.current.kind === "name" &&
      lastAttempt.current.name === name
    )
      return;
    void runRequest({ kind: "name", name });
  }

  function refresh() {
    if (!snapshot || active.current) return;
    void runRequest({ kind: "coordinates", city: snapshot.city }, true);
  }

  function selectCity(city: SelectedCity) {
    void runRequest({ kind: "coordinates", city });
  }

  function requestLocation() {
    if (phase === "locating") return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    lastAttempt.current = "geolocation";
    setError("");
    setSnapshot(null);
    setPhase("locating");
    function fail(message: string) {
      if (controller.signal.aborted) return;
      active.current = null;
      setPhase("idle");
      setError(message);
    }
    if (!window.isSecureContext)
      return fail(
        "Location requires HTTPS or localhost. Please search by name instead.",
      );
    if (!navigator.geolocation)
      return fail("Geolocation is not supported by your browser.");
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (!controller.signal.aborted)
            void runRequest({
              kind: "location",
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
        },
        (locationError) => {
          const messages: Record<number, string> = {
            1: "Location access was denied. Allow it in your browser or search for a city.",
            2: "Your location is unavailable. Please try again or search for a city.",
            3: "Location request timed out. Please try again or search for a city.",
          };
          fail(
            messages[locationError.code] ??
              "Unable to find your location. Please search by name.",
          );
        },
        { timeout: 10000, maximumAge: 60000 },
      );
    } catch {
      fail("Unable to access your location. Please search by name.");
    }
  }

  function retry() {
    if (active.current) return;
    const target = lastAttempt.current;
    if (target === "geolocation") requestLocation();
    else void runRequest(target, target.kind === "coordinates");
  }

  return {
    query,
    snapshot,
    error,
    inputRef,
    busy: phase !== "idle",
    searching: phase === "searching",
    locating: phase === "locating",
    refreshing: phase === "refreshing",
    canRefresh: snapshot !== null,
    updateQuery,
    clearSearch,
    refresh,
    search,
    requestLocation,
    retry,
    selectCity,
  };
}
