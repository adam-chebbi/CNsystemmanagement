import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ISO_DATE } from '../../shared/model';
import { api, errorText, NetworkError } from '../api/client';
import { onOutboxFlushed } from '../api/outbox';
import type { DayResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { setParam, useRoute } from './router';

// The journée being worked on. Defaults to the current business day; any page can switch to a
// past day (catch-up entries, reading the history) via ?date=YYYY-MM-DD, which every page shares.

interface JourneeContextValue {
  date: string;
  isToday: boolean;
  setDate: (date: string | null) => void;
  day: DayResponse | null;
  loading: boolean;
  error: string | null;
  stale: boolean; // showing the last copy saved on this device because the server is unreachable
  refresh: () => Promise<void>;
  setDay: (d: DayResponse) => void;
}

const Ctx = createContext<JourneeContextValue | undefined>(undefined);
const cacheKey = (date: string) => `historique:day:${date}`;

export const JourneeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { businessDate } = useAuth();
  const { params } = useRoute();
  const paramDate = params.get('date');
  const date = paramDate && ISO_DATE.test(paramDate) ? paramDate : businessDate;
  const [day, setDayState] = useState<DayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const requested = useRef('');

  const setDay = useCallback((d: DayResponse) => {
    setDayState(d);
    setStale(false);
    try {
      localStorage.setItem(cacheKey(d.date), JSON.stringify(d));
    } catch {
      // ignore storage errors
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!date) return;
    requested.current = date;
    setLoading(true);
    setError(null);
    try {
      const d = await api.get<DayResponse>(`/journees/${date}`);
      if (requested.current === date) setDay(d);
    } catch (e) {
      if (requested.current !== date) return;
      if (e instanceof NetworkError) {
        const cached = localStorage.getItem(cacheKey(date));
        if (cached) {
          setDayState(JSON.parse(cached));
          setStale(true);
        } else setError(errorText(e));
      } else setError(errorText(e));
    } finally {
      if (requested.current === date) setLoading(false);
    }
  }, [date, setDay]);

  useEffect(() => {
    setDayState(null);
    void refresh();
  }, [refresh]);

  useEffect(() => onOutboxFlushed(() => void refresh()), [refresh]);

  const setDate = useCallback((d: string | null) => setParam('date', d && d !== businessDate ? d : null), [businessDate]);

  return (
    <Ctx.Provider value={{ date, isToday: date === businessDate, setDate, day: day && day.date === date ? day : null, loading, error, stale, refresh, setDay }}>
      {children}
    </Ctx.Provider>
  );
};

export const useJournee = (): JourneeContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useJournee must be used within JourneeProvider');
  return ctx;
};
