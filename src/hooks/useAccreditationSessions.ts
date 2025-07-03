import { useState, useCallback } from 'react';
import { SessionAcreditacion } from '@/types';
import { usePriceCalculator } from './usePriceCalculator';

export const useAccreditationSessions = (initialSessions: SessionAcreditacion[] = []) => {
  const [sessions, setSessions] = useState<SessionAcreditacion[]>(initialSessions);
  const { calculatePrice } = usePriceCalculator();

  const addSession = useCallback((sessionData: Omit<SessionAcreditacion, 'id' | 'monto'>) => {
    const newSession: SessionAcreditacion = {
      ...sessionData,
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      monto: sessionData.precio
    };

    setSessions(prev => [...prev, newSession]);
    return newSession;
  }, []);

  const updateSession = useCallback((sessionId: string, updates: Partial<SessionAcreditacion>) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedSession = { ...session, ...updates };
        
        // Update monto if precio changed
        if ('precio' in updates) {
          updatedSession.monto = updates.precio!;
        }
        
        return updatedSession;
      }
      return session;
    }));
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  }, []);

  const getTotalAmount = useCallback(() => {
    return sessions.reduce((total, session) => total + session.monto, 0);
  }, [sessions]);

  const getTotalAccreditors = useCallback(() => {
    return sessions.reduce((total, session) => total + session.acreditadores, 0);
  }, [sessions]);

  const clearSessions = useCallback(() => {
    setSessions([]);
  }, []);

  return {
    sessions,
    addSession,
    updateSession,
    removeSession,
    getTotalAmount,
    getTotalAccreditors,
    clearSessions,
    setSessions
  };
};
