# Delete Journey feature patch

This patch adds optional delete support for journeys in the **Your Journeys** section with:
- delete button on each trip card
- confirmation before delete
- local-state removal
- Supabase deletion when applicable
- rollback-safe async store pattern

---

## 1) Replace `src/lib/repositories/trips.ts`

```ts
import { supabase } from '../supabase/client';
import { Trip, DayPlan } from '../../types';

export const tripRepository = {
  async createTrip(trip: Trip, userId: string) {
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        id: trip.id,
        user_id: userId,
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        travelers: trip.travelers,
        budget_style: trip.budgetStyle,
        pace: trip.pace,
        summary: trip.summary,
        stay: trip.stay
      })
      .select()
      .single();

    if (tripError) throw tripError;

    for (const day of trip.itinerary) {
      const { data: dayData, error: dayError } = await supabase
        .from('trip_days')
        .insert({
          trip_id: trip.id,
          day_number: day.dayNumber,
          date: day.date,
          theme: day.theme
        })
        .select()
        .single();

      if (dayError) throw dayError;

      const items = day.modules.map((mod, index) => ({
        day_id: dayData.id,
        type: mod.type,
        time: mod.time,
        duration: mod.duration,
        title: mod.title,
        description: mod.description,
        cost_estimate: mod.costEstimate,
        tags: mod.tags,
        location: mod.location,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .from('trip_day_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return tripData;
  },

  async getTrip(tripId: string): Promise<Trip | null> {
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        trip_days (
          *,
          trip_day_items (*)
        )
      `)
      .eq('id', tripId)
      .single();

    if (tripError) {
      if (tripError.code === 'PGRST116') return null;
      throw tripError;
    }

    const itinerary: DayPlan[] = tripData.trip_days
      .sort((a: any, b: any) => a.day_number - b.day_number)
      .map((day: any) => ({
        dayNumber: day.day_number,
        date: day.date,
        theme: day.theme,
        modules: day.trip_day_items
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((item: any) => ({
            id: item.id,
            type: item.type,
            time: item.time,
            duration: item.duration,
            title: item.title,
            description: item.description,
            costEstimate: Number(item.cost_estimate),
            tags: item.tags,
            location: item.location
          }))
      }));

    return {
      id: tripData.id,
      destination: tripData.destination,
      startDate: tripData.start_date,
      endDate: tripData.end_date,
      travelers: tripData.travelers,
      budgetStyle: tripData.budget_style,
      pace: tripData.pace,
      summary: tripData.summary,
      stay: tripData.stay,
      itinerary
    };
  },

  async listUserTrips(userId: string): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((trip: any) => ({
      id: trip.id,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      travelers: trip.travelers,
      budgetStyle: trip.budget_style,
      pace: trip.pace,
      summary: trip.summary,
      stay: trip.stay,
      itinerary: []
    }));
  },

  async updateTrip(trip: Trip) {
    const { error: tripError } = await supabase
      .from('trips')
      .update({
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        travelers: trip.travelers,
        budget_style: trip.budgetStyle,
        pace: trip.pace,
        summary: trip.summary,
        stay: trip.stay,
        updated_at: new Date().toISOString()
      })
      .eq('id', trip.id);

    if (tripError) throw tripError;

    const { error: deleteError } = await supabase
      .from('trip_days')
      .delete()
      .eq('trip_id', trip.id);

    if (deleteError) throw deleteError;

    for (const day of trip.itinerary) {
      const { data: dayData, error: dayError } = await supabase
        .from('trip_days')
        .insert({
          trip_id: trip.id,
          day_number: day.dayNumber,
          date: day.date,
          theme: day.theme
        })
        .select()
        .single();

      if (dayError) throw dayError;

      const items = day.modules.map((mod, index) => ({
        day_id: dayData.id,
        type: mod.type,
        time: mod.time,
        duration: mod.duration,
        title: mod.title,
        description: mod.description,
        cost_estimate: mod.costEstimate,
        tags: mod.tags,
        location: mod.location,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .from('trip_day_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }
  },

  async deleteTrip(tripId: string) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;
  }
};
```

---

## 2) Replace `src/store/TripContext.tsx`

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, User } from '../types';
import { tripRepository } from '../lib/repositories/trips';

interface TripContextType {
  trips: Trip[];
  currentTrip: Trip | null;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (tripId: string) => Promise<void>;
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

  useEffect(() => {
    const localTrips = localStorage.getItem('guestTrips');
    if (localTrips) {
      try {
        setTrips(JSON.parse(localTrips));
      } catch (e) {
        console.error('Failed to parse local trips', e);
        setTrips([]);
      }
    }
  }, []);

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

  const deleteTrip = async (tripId: string) => {
    const previousTrips = trips;
    const previousCurrentTrip = currentTrip;

    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
    }

    try {
      if (user) {
        await tripRepository.deleteTrip(tripId);
      }
    } catch (error) {
      setTrips(previousTrips);
      setCurrentTrip(previousCurrentTrip);
      throw error;
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
```

---

## 3) Replace `src/pages/Home.tsx`

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/TripContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Plus, Calendar, Compass, LogOut, ArrowRight, Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { OtterMascot } from '../components/OtterMascot';

export const getDestinationGradient = (name: string) => {
  const gradients = [
    'from-orange-400 to-rose-400',
    'from-blue-400 to-emerald-400',
    'from-violet-400 to-fuchsia-400',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-pink-400 to-rose-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[index % gradients.length];
};

export default function Home() {
  const { trips, user, logout, deleteTrip } = useTripStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteTrip = async (tripId: string, destination: string) => {
    const confirmed = window.confirm(`Delete "${destination}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteTrip(tripId);
    } catch (error) {
      console.error('Failed to delete trip:', error);
      alert('Failed to delete journey. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full min-h-screen bg-zinc-50"
    >
      <header className="px-6 py-4 bg-white border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20">
            <OtterMascot className="w-6 h-6 drop-shadow-sm" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Trip<span className="text-brand">Less</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm font-medium text-zinc-600 hidden sm:block">
                Hello, {user.name.split(' ')[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-500 hover:text-zinc-900">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/login')} className="text-brand hover:bg-brand/10 font-medium">
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 text-white mb-12 shadow-2xl"
        >
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[140%] bg-brand/20 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[100%] bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-10 md:p-16 gap-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-brand-light" />
                <span>AI-Powered Travel</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
                Dream it. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand">We'll plan it.</span>
              </h2>
              <p className="text-zinc-400 text-lg md:text-xl mb-8 leading-relaxed max-w-md">
                {user ? `Welcome back, ${user.name.split(' ')[0]}. ` : ''}
                Your personal AI concierge is ready to craft the perfect itinerary for your next adventure.
              </p>
              <Button
                className="h-14 px-8 text-lg rounded-2xl shadow-lg shadow-brand/20 bg-brand hover:bg-brand-hover text-white w-full sm:w-auto group transition-all duration-300"
                onClick={() => navigate('/create')}
              >
                <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                Start Planning
              </Button>
            </div>

            <div className="hidden md:flex relative w-64 h-64 items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand/40 to-blue-500/40 rounded-full blur-3xl animate-pulse" />
              <div className="relative bg-white/10 p-8 rounded-full border border-white/20 backdrop-blur-xl shadow-2xl">
                <OtterMascot className="w-32 h-32 drop-shadow-2xl" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Your Journeys</h2>
            {trips.length > 0 && (
              <span className="text-sm font-medium text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
              </span>
            )}
          </div>

          {trips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center py-24 px-6 border-2 border-dashed border-zinc-200 rounded-[2rem] bg-white/50 backdrop-blur-sm"
            >
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Compass className="h-10 w-10 text-zinc-400" />
              </div>
              <h3 className="text-zinc-900 text-2xl font-semibold tracking-tight mb-2">No trips yet</h3>
              <p className="text-zinc-500 text-lg max-w-sm mx-auto mb-8">
                The world is waiting. Create your first itinerary to get started.
              </p>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-zinc-300 hover:bg-zinc-50"
                onClick={() => navigate('/create')}
              >
                Create a Trip
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, i) => {
                const gradient = getDestinationGradient(trip.destination);
                return (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => navigate(`/trip/${trip.id}`)}
                    className="group cursor-pointer h-full"
                  >
                    <Card className="relative h-full flex flex-col overflow-hidden border-zinc-200/60 hover:border-zinc-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white rounded-3xl">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(trip.id, trip.destination);
                        }}
                        className="absolute top-4 right-4 z-20 rounded-full bg-white/90 p-2 text-zinc-600 shadow-sm hover:bg-white hover:text-red-600 transition-colors"
                        aria-label={`Delete ${trip.destination}`}
                        title="Delete journey"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className={`h-32 w-full bg-gradient-to-br ${gradient} relative p-6 flex items-end`}>
                        <div className="absolute inset-0 bg-black/10" />
                        <h3 className="relative z-10 text-2xl font-semibold text-white tracking-tight drop-shadow-md line-clamp-1">
                          {trip.destination}
                        </h3>
                      </div>

                      <CardContent className="flex-1 p-6 flex flex-col">
                        <div className="flex items-center text-sm font-medium text-zinc-500 mb-4 bg-zinc-50 w-fit px-3 py-1.5 rounded-lg border border-zinc-100">
                          <Calendar className="w-4 h-4 mr-2 text-brand" />
                          {trip.startDate} <ArrowRight className="w-3 h-3 mx-1.5 text-zinc-300" /> {trip.endDate}
                        </div>
                        <p className="text-zinc-600 line-clamp-3 leading-relaxed flex-1">
                          {trip.summary.description}
                        </p>

                        <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-sm font-medium text-zinc-400 group-hover:text-brand transition-colors">
                          <span>View Itinerary</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-zinc-200 bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <OtterMascot className="w-5 h-5 opacity-50" />
            <span className="text-sm font-medium">TripLess AI Travel</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
```

---

## Notes
- This assumes deleting from `trips` cascades correctly to `trip_days` and `trip_day_items` in Supabase.
- If cascade is not configured, add a database-side cascade or delete child rows first.
- The delete button uses `stopPropagation()` so it does not open the journey card.
