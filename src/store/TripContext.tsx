import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, User } from '../types';

interface TripContextType {
  trips: Trip[];
  currentTrip: Trip | null;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (tripId: string) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  user: User | null;
  login: (email: string, name?: string) => void;
  logout: () => void;
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

  // Save to local storage whenever trips change
  useEffect(() => {
    localStorage.setItem('guestTrips', JSON.stringify(trips));
  }, [trips]);

  const login = (email: string, name?: string) => {
    const mockUser: User = {
      id: Math.random().toString(36).substring(2, 9),
      email,
      name: name || email.split('@')[0],
    };
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
  };

  const logout = () => {
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

  const deleteTrip = (tripId: string) => {
    setTrips((prev) => prev.filter(t => t.id !== tripId));
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
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
