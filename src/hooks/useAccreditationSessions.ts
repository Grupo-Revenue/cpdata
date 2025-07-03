import { useState, useCallback } from 'react';
import { SessionAcreditacion } from '@/types';
import { usePriceCalculator } from './usePriceCalculator';

export const useAccreditationSessions = (initialSessions: SessionAcreditacion[] = []) => {
  const [sessions, setSessions] = useState<SessionAcreditacion[]>(initialSessions);
  const { calculatePrice } = usePriceCalculator();

  const addSession = useCallback((sessionData: Omit<SessionAcreditacion, 'id' | 'monto'>) => {
    try {
      // Calculate amount using the price calculator
      const calculationResult = calculatePrice();
      
      const newSession: SessionAcreditacion = {
        ...sessionData,
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        monto: calculationResult.totalPrice
      };

      setSessions(prev => [...prev, newSession]);
      return newSession;
    } catch (error) {
      console.error('Error calculating session price:', error);
      // Fallback to manual amount calculation
      const newSession: SessionAcreditacion = {
        ...sessionData,
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        monto: sessionData.cantidad * 50000 // Fallback calculation
      };

      setSessions(prev => [...prev, newSession]);
      return newSession;
    }
  }, [calculatePrice]);

  const updateSession = useCallback((sessionId: string, updates: Partial<SessionAcreditacion>) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedSession = { ...session, ...updates };
        
        // Recalculate amount if relevant fields changed
        if ('acreditadores' in updates || 'supervisor' in updates || 'cantidad' in updates) {
          try {
            const calculationResult = calculatePrice();
            updatedSession.monto = calculationResult.totalPrice;
          } catch (error) {
            console.error('Error recalculating session price:', error);
            // Keep the existing amount if calculation fails
          }
        }
        
        return updatedSession;
      }
      return session;
    }));
  }, [calculatePrice]);

  const removeSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  }, []);

  const getTotalAmount = useCallback(() => {
    return sessions.reduce((total, session) => total + session.monto, 0);
  }, [sessions]);

  const getTotalQuantity = useCallback(() => {
    return sessions.reduce((total, session) => total + session.cantidad, 0);
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
    getTotalQuantity,
    clearSessions,
    setSessions
  };
};
