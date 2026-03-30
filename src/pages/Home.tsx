import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/TripContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Plus, MapPin, Calendar, Compass, LogOut, ArrowRight, Sparkles, Trash2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { OtterMascot } from '../components/OtterMascot';
import { calculateTripEngagement } from '../lib/tripEngagement';
import { Badge } from '../components/ui/Badge';

// Helper to generate consistent gradients based on destination name
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

  const [tripToDelete, setTripToDelete] = React.useState<{id: string, destination: string} | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteClick = (e: React.MouseEvent, tripId: string, destination: string) => {
    e.stopPropagation();
    setTripToDelete({ id: tripId, destination });
  };

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteTrip(tripToDelete.id);
      setTripToDelete(null);
    }
  };

  const cancelDelete = () => {
    setTripToDelete(null);
  };

  // Find the most recent trip for the featured card
  const featuredTrip = trips.length > 0 ? trips[0] : null;
  const featuredEngagement = featuredTrip ? calculateTripEngagement(featuredTrip) : null;

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
        {/* Featured Engagement Card */}
        {featuredTrip && featuredEngagement ? (
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
              <div className="max-w-xl w-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium backdrop-blur-md">
                    <Activity className="w-4 h-4 text-brand-light" />
                    <span>Trip Momentum</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/10 text-white border-none backdrop-blur-md">
                    {featuredEngagement.statusLabel}
                  </Badge>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 leading-[1.1]">
                  Continue planning <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand">{featuredTrip.destination}</span>
                </h2>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-300">Plan Completeness</span>
                    <span className="text-sm font-bold text-white">{featuredEngagement.completionScore}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-brand to-brand-light h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${featuredEngagement.completionScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-zinc-400 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-brand-light" />
                    <span className="font-medium text-zinc-300 mr-1">Next step:</span> {featuredEngagement.nextBestAction}
                  </p>
                </div>

                <Button 
                  className="h-14 px-8 text-lg rounded-2xl shadow-lg shadow-brand/20 bg-brand hover:bg-brand-hover text-white w-full sm:w-auto group transition-all duration-300 active:scale-[0.98]"
                  onClick={() => navigate(`/trip/${featuredTrip.id}`)}
                >
                  Continue Planning
                  <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="hidden md:flex relative w-64 h-64 items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand/40 to-blue-500/40 rounded-full blur-3xl animate-pulse" />
                <div className="relative bg-white/10 p-8 rounded-full border border-white/20 backdrop-blur-xl shadow-2xl">
                  <Compass className="w-32 h-32 text-white/90 drop-shadow-2xl" />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 text-white mb-12 shadow-2xl"
          >
            {/* Decorative background elements */}
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
                  className="h-14 px-8 text-lg rounded-2xl shadow-lg shadow-brand/20 bg-brand hover:bg-brand-hover text-white w-full sm:w-auto group transition-all duration-300 active:scale-[0.98]"
                  onClick={() => navigate('/create')}
                >
                  <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                  Create Your First Journey
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
        )}

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
                className="h-12 px-6 rounded-xl border-zinc-300 hover:bg-zinc-50 transition-all duration-200 active:scale-95"
                onClick={() => navigate('/create')}
              >
                Create a Trip
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, i) => {
                const gradient = getDestinationGradient(trip.destination);
                const engagement = calculateTripEngagement(trip);
                
                return (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => navigate(`/trip/${trip.id}`)}
                    className="group cursor-pointer h-full"
                  >
                    <Card className="h-full flex flex-col overflow-hidden border-zinc-200/60 hover:border-zinc-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white rounded-3xl">
                      {/* Destination Gradient Header */}
                      <div className={`h-32 w-full bg-gradient-to-br ${gradient} relative p-6 flex items-end justify-between`}>
                        <div className="absolute inset-0 bg-black/10" />
                        <h3 className="relative z-10 text-2xl font-semibold text-white tracking-tight drop-shadow-md line-clamp-1">
                          {trip.destination}
                        </h3>
                        <Badge className="relative z-10 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md shadow-sm">
                          {engagement.statusLabel}
                        </Badge>
                      </div>
                      
                      <CardContent className="flex-1 p-6 flex flex-col">
                        <div className="flex items-center text-sm font-medium text-zinc-500 mb-4 bg-zinc-50 w-fit px-3 py-1.5 rounded-lg border border-zinc-100">
                          <Calendar className="w-4 h-4 mr-2 text-brand" />
                          {trip.startDate} <ArrowRight className="w-3 h-3 mx-1.5 text-zinc-300" /> {trip.endDate}
                        </div>
                        <p className="text-zinc-600 line-clamp-3 leading-relaxed flex-1">
                          {trip.summary.description}
                        </p>
                        
                        <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-sm font-medium">
                          <div className="flex items-center text-zinc-400 group-hover:text-brand transition-colors">
                            <span>View Itinerary</span>
                            <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full z-10"
                            onClick={(e) => handleDeleteClick(e, trip.id, trip.destination)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Delete Journey</h3>
            <p className="text-zinc-600 mb-6">
              Delete "{tripToDelete.destination}"? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
