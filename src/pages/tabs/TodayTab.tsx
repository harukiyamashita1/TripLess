import React from 'react';
import { Trip } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'motion/react';
import { MapPin, Clock, Navigation, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TodayTab({ trip }: { trip: Trip }) {
  // Mock "today" by just taking the first day
  const todayPlan = trip.itinerary[0];

  if (!todayPlan) {
    return (
      <div className="p-12 text-center text-zinc-500 bg-white rounded-3xl border border-zinc-100 shadow-sm">
        No itinerary available for today.
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">Today</h2>
          <p className="text-zinc-500 font-medium mt-2 text-lg">{todayPlan.date} • {todayPlan.theme}</p>
        </div>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-2 rounded-xl text-sm w-fit">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          On Track
        </Badge>
      </div>

      <div className="space-y-6 relative">
        {/* Continuous timeline line */}
        <div className="absolute left-6 md:left-8 top-8 bottom-8 w-0.5 bg-zinc-200 hidden md:block" />

        {todayPlan.modules.map((mod, i) => {
          const isNext = i === 1; // Mock "next" state
          const isPast = i === 0; // Mock "past" state
          
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative md:pl-20"
            >
              {/* Timeline dot */}
              <div className={`absolute left-[27px] top-8 w-4 h-4 rounded-full border-4 border-white shadow-sm hidden md:block z-10 ${
                isNext ? 'bg-blue-500' : isPast ? 'bg-zinc-300' : 'bg-zinc-400'
              }`} />

              <Card className={`overflow-hidden transition-all duration-300 rounded-2xl ${
                isNext ? 'border-l-4 border-l-blue-500 shadow-lg bg-white scale-[1.02] md:scale-100' : 
                isPast ? 'border border-zinc-200 bg-zinc-50/80 opacity-70' : 
                'border border-zinc-200 bg-white hover:shadow-md'
              }`}>
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 gap-2">
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg font-bold ${isNext ? 'text-blue-600' : 'text-zinc-900'}`}>
                        {mod.time}
                      </span>
                      {isNext && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-md font-bold tracking-wide">
                          UP NEXT
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-zinc-500 font-medium flex items-center bg-zinc-100 px-3 py-1 rounded-full w-fit">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {mod.duration}
                    </span>
                  </div>
                  
                  <h3 className={`text-xl font-bold leading-tight mb-2 ${isPast ? 'line-through text-zinc-500' : 'text-zinc-900'}`}>
                    {mod.title}
                  </h3>
                  
                  {mod.location && (
                     <p className="text-zinc-600 flex items-start mt-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <MapPin className="w-5 h-5 mr-2 shrink-0 text-zinc-400" />
                      <span className="line-clamp-2">{mod.location}</span>
                    </p>
                  )}
                  
                  {isNext && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button className="flex-1 bg-brand text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-brand-hover transition-colors shadow-sm">
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Navigation
                      </button>
                      <button className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-zinc-50 hover:border-zinc-300 transition-colors">
                        Find Alternatives
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
