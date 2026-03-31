import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, User } from '../types';
import { tripRepository } from '../lib/repositories/trips';
import { supabase } from '../lib/supabase/client';

interface TripContextType {
  trips: Trip[];
  currentTrip: Trip | null;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (tripId: string) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  user: User | null;
  login: (email: string, password?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mockUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Load from local storage on mount
  useEffect(() => {
    const localTrips = localStorage.getItem('guestTrips');
    if (localTrips) {
      try {
        setTrips(JSON.parse(localTrips));
      } catch (e) {
        console.error("Failed to parse local trips", e);
        setTrips([]);
      }
    }
  }, []);

  // Fetch trips from Supabase when user logs in
  useEffect(() => {
    if (user && supabase) {
      tripRepository.listUserTrips(user.id).then(data => {
        if (data && data.length > 0) {
          setTrips(prev => {
            const newTrips = [...prev];
            data.forEach(t => {
              const existingIndex = newTrips.findIndex(nt => nt.id === t.id);
              if (existingIndex >= 0) {
                newTrips[existingIndex] = t;
              } else {
                newTrips.push(t);
              }
            });
            return newTrips;
          });
        }
      }).catch(console.error);
    }
  }, [user]);

  // Save to local storage whenever trips change
  useEffect(() => {
    localStorage.setItem('guestTrips', JSON.stringify(trips));
  }, [trips]);

  const login = async (email: string, password?: string, name?: string) => {
    if (supabase && password) {
      if (name) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (error) throw error;
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || email.split('@')[0]
          });
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || email.split('@')[0]
          });
        }
      }
    } else {
      // Mock fallback
      const mockUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        email,
        name: name || email.split('@')[0],
      };
      setUser(mockUser);
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  const addTrip = (trip: Trip) => {
    setTrips((prev) => [...prev, trip]);
    setCurrentTrip(trip);
  };

  const updateTrip = (trip: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === trip.id ? trip : t)));
    if (currentTrip?.id === trip.id) {
      setCurrentTrip(trip);
    }
  };

  const deleteTrip = async (tripId: string) => {
    setTrips((prev) => prev.filter(t => t.id !== tripId));
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
    }
    if (user) {
      try {
        await tripRepository.deleteTrip(tripId);
      } catch (error) {
        console.error("Failed to delete trip from Supabase", error);
      }
    }
  };

  return (
    <TripContext.Provider value={{ trips, currentTrip, addTrip, updateTrip, deleteTrip, setCurrentTrip, user, login, logout }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripStore = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTripStore must be used within a TripProvider');
  }
  return context;
};
