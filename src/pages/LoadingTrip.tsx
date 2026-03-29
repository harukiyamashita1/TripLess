import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { OtterMascot } from '../components/OtterMascot';

const loadingStates = [
  "Understanding your trip...",
  "Selecting the best stay areas...",
  "Building your itinerary...",
  "Finding places to eat...",
  "Estimating costs...",
  "Finalizing details..."
];

export default function LoadingTrip() {
  const location = useLocation();
  const destination = location.state?.destination;
  const displayTitle = destination ? `Crafting ${destination}` : "Finding your perfect getaway";
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState((prev) => (prev < loadingStates.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 overflow-hidden relative"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/30 rounded-full blur-3xl mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-brand/40 blur-2xl rounded-full animate-pulse" />
          <div className="relative bg-brand/10 p-6 rounded-full border border-brand/20 backdrop-blur-md flex items-center justify-center">
            <OtterMascot className="w-24 h-24 drop-shadow-xl" />
          </div>
        </motion.div>

        <h2 className="text-3xl font-medium tracking-tight mb-2">
          {displayTitle}
        </h2>
        
        <div className="h-8 mt-6 overflow-hidden relative w-full max-w-xs">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentState}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-zinc-400 text-sm font-medium absolute w-full text-center"
            >
              {loadingStates[currentState]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-64 h-1 bg-zinc-800 rounded-full mt-8 overflow-hidden">
          <motion.div 
            className="h-full bg-brand rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentState + 1) / loadingStates.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
