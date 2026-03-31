import React, { useState } from 'react';
import { useParams, useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTripStore } from '../store/TripContext';
import { ArrowLeft, Map, Bed, CalendarDays, Sparkles, Navigation, Activity, Share2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OtterMascot } from '../components/OtterMascot';
import { calculateTripEngagement } from '../lib/tripEngagement';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { shareTrip, downloadTripAsText } from '../lib/shareTrip';

import OverviewTab from './tabs/OverviewTab';
import StayTab from './tabs/StayTab';
import ItineraryTab from './tabs/ItineraryTab';
import RefineTab from './tabs/RefineTab';
import TodayTab from './tabs/TodayTab';

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { trips } = useTripStore();
  const [shareFeedback, setShareFeedback] = useState<string>('');

  const trip = trips.find(t => t.id === id);

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-50">
        <p className="text-zinc-500 mb-4">Trip not found.</p>
        <button onClick={() => navigate('/')} className="text-zinc-900 underline">Go Home</button>
      </div>
    );
  }

  const engagement = calculateTripEngagement(trip);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Map, path: '' },
    { id: 'stay', label: 'Stay', icon: Bed, path: 'stay' },
    { id: 'itinerary', label: 'Itinerary', icon: CalendarDays, path: 'itinerary' },
    { id: 'refine', label: 'Refine', icon: Sparkles, path: 'refine' },
    { id: 'today', label: 'Today', icon: Navigation, path: 'today' },
  ];

  const currentTab = location.pathname.split('/').pop() || 'overview';

  const handleShare = async () => {
    try {
      const result = await shareTrip(trip);
      if (result === 'copied') {
        setShareFeedback('Itinerary copied to clipboard');
      } else if (result === 'shared') {
        setShareFeedback('Journey shared');
      } else {
        setShareFeedback('Sharing is not supported on this device');
      }
    } catch (error) {
      console.error('Share failed:', error);
      setShareFeedback('Could not share this journey');
    }

    window.setTimeout(() => setShareFeedback(''), 2500);
  };

  const handleDownload = () => {
    downloadTripAsText(trip);
    setShareFeedback('Itinerary downloaded');
    window.setTimeout(() => setShareFeedback(''), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full min-h-screen bg-zinc-50"
    >
      <header className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 mr-2 rounded-full hover:bg-zinc-100 transition-all duration-200 active:scale-90 cursor-pointer">
            <ArrowLeft className="h-5 w-5 text-zinc-900" />
          </button>
          <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20 shrink-0 hidden sm:flex">
            <OtterMascot className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate flex items-center gap-3">
              {trip.destination}
              <Badge variant="secondary" className="hidden md:inline-flex bg-zinc-100 text-zinc-600 font-medium border-zinc-200">
                <Activity className="w-3 h-3 mr-1.5 text-brand" />
                {engagement.statusLabel}
              </Badge>
            </h1>
            <p className="text-sm text-zinc-500 truncate">{trip.startDate} - {trip.endDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl">
            <Share2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </header>

      {shareFeedback && (
        <div className="px-6 pt-4">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center rounded-full bg-zinc-900 text-white text-sm px-4 py-2 shadow-lg">
              {shareFeedback}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row">
        <nav className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 bg-white md:bg-transparent sticky top-[73px] md:h-[calc(100vh-73px)] overflow-x-auto md:overflow-y-auto z-10">
          <div className="flex md:flex-col p-2 md:p-6 gap-2 min-w-max md:min-w-0">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id || (currentTab === id && tab.id === 'overview');
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.id}
                  to={`/trip/${id}/${tab.path}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${
                    isActive
                      ? 'bg-brand/10 text-brand font-medium'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand fill-brand/10' : 'text-zinc-400'}`} />
                  <span className="text-sm">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-desktop"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand rounded-r-full hidden md:block"
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-mobile"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand rounded-t-full md:hidden"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-hidden relative">
          <div className="hidden lg:flex items-center gap-2 text-sm text-zinc-500 bg-zinc-50 px-4 py-2 rounded-full border border-zinc-100 mb-6 w-fit">
            <Sparkles className="w-4 h-4 text-brand-light" />
            <span>Next step: <span className="font-medium text-zinc-700">{engagement.nextBestAction}</span></span>
          </div>

          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<OverviewTab trip={trip} />} />
              <Route path="stay" element={<StayTab trip={trip} />} />
              <Route path="itinerary" element={<ItineraryTab trip={trip} />} />
              <Route path="refine" element={<RefineTab trip={trip} />} />
              <Route path="today" element={<TodayTab trip={trip} />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}
