import React, { useState } from 'react';
import { Trip, DayPlan } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, Utensils, Navigation, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { formatTripCurrency, getTripCurrencyCode } from '../../lib/currency';

export default function ItineraryTab({ trip }: { trip: Trip }) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);

  const toggleDay = (dayNumber: number) => {
    setExpandedDays(prev => 
      prev.includes(dayNumber) 
        ? prev.filter(d => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };

  const expandAll = () => setExpandedDays(trip.itinerary.map(d => d.dayNumber));
  const collapseAll = () => setExpandedDays([]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'meal': return <Utensils className="h-5 w-5 text-orange-500" />;
      case 'transit': return <Navigation className="h-5 w-5 text-blue-500" />;
      default: return <MapPin className="h-5 w-5 text-emerald-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Your Itinerary</h2>
            <Badge className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-none">
              Prices in {getTripCurrencyCode(trip)}
            </Badge>
          </div>
          <p className="text-zinc-500 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {trip.itinerary.length} Days • {trip.pace} pace
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-sm font-medium text-brand hover:text-brand-hover px-3 py-1.5 rounded-lg hover:bg-brand/5 transition-colors">Expand All</button>
          <button onClick={collapseAll} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">Collapse All</button>
        </div>
      </div>

      <div className="space-y-6">
        {trip.itinerary.map((day, index) => (
          <motion.div
            key={day.dayNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden border-zinc-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <button 
                onClick={() => toggleDay(day.dayNumber)}
                className="w-full flex items-center justify-between p-5 md:p-6 bg-white hover:bg-zinc-50 transition-colors"
              >
                <div className="text-left flex items-center gap-4 md:gap-6">
                  <div className="bg-brand/10 text-brand font-bold text-xl md:text-2xl w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0">
                    D{day.dayNumber}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 mb-1">{day.theme}</h3>
                    <p className="text-sm font-medium text-zinc-500">{day.date}</p>
                  </div>
                </div>
                <div className="bg-zinc-100 p-2 rounded-full shrink-0">
                  {expandedDays.includes(day.dayNumber) ? (
                    <ChevronUp className="h-5 w-5 text-zinc-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-zinc-600" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedDays.includes(day.dayNumber) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-zinc-100"
                  >
                    <div className="p-5 md:p-8 space-y-8 bg-zinc-50/50">
                      {day.modules.map((mod, i) => (
                        <div key={mod.id} className="relative flex gap-6 md:gap-8 group">
                          {/* Timeline line */}
                          {i !== day.modules.length - 1 && (
                            <div className="absolute left-[19px] md:left-[23px] top-12 bottom-[-32px] w-0.5 bg-zinc-200 group-hover:bg-brand/30 transition-colors" />
                          )}
                          
                          <div className="flex flex-col items-center mt-1 shrink-0">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border-2 border-zinc-200 group-hover:border-brand/50 transition-colors flex items-center justify-center z-10 shadow-sm">
                              {getIcon(mod.type)}
                            </div>
                          </div>
                          
                          <div className="flex-1 pb-4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
                              <h4 className="text-lg font-bold text-zinc-900 leading-tight group-hover:text-brand transition-colors">{mod.title}</h4>
                              <span className="inline-flex items-center text-sm font-bold text-zinc-700 bg-white border border-zinc-200 shadow-sm px-3 py-1 rounded-full shrink-0 w-fit">
                                {mod.time}
                              </span>
                            </div>
                            
                            <p className="text-zinc-600 mb-4 leading-relaxed text-sm md:text-base">{mod.description}</p>
                            
                            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 bg-white p-3 rounded-xl border border-zinc-100 shadow-sm w-fit">
                              {mod.duration && (
                                <span className="flex items-center text-sm text-zinc-600 font-medium">
                                  <Clock className="w-4 h-4 mr-1.5 text-zinc-400" />
                                  {mod.duration}
                                </span>
                              )}
                              {mod.costEstimate > 0 && (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                  <span className="text-sm text-zinc-600 font-medium">
                                    Est. {formatTripCurrency(mod.costEstimate, trip)}
                                  </span>
                                </>
                              )}
                              {mod.location && (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                  <span className="text-sm text-zinc-600 font-medium truncate max-w-[200px] flex items-center">
                                    <MapPin className="w-4 h-4 mr-1.5 text-zinc-400" />
                                    {mod.location}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {mod.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {mod.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium rounded-lg transition-colors">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
