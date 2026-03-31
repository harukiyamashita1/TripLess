import React from 'react';
import { Trip } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'motion/react';
import { Users, Wallet, Activity, MapPin, Calendar, Compass } from 'lucide-react';
import { formatTripCurrency, getTripCurrencyCode } from '../../lib/currency';

export default function OverviewTab({ trip }: { trip: Trip }) {
  const heroImage = `https://picsum.photos/seed/${trip.destination.replace(/\s+/g, '')}/1200/400`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {/* Hero Image Section */}
      <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-lg group">
        <div className="absolute inset-0 bg-zinc-900/40 group-hover:bg-zinc-900/30 transition-colors z-10" />
        <img 
          src={heroImage} 
          alt={trip.destination}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20 text-white w-full bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md mb-3">
            {trip.summary.title}
          </Badge>
          <Badge className="bg-black/40 hover:bg-black/50 text-white border-none backdrop-blur-md mb-3 ml-2">
            Prices in {getTripCurrencyCode(trip)}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 drop-shadow-md">{trip.destination}</h2>
          <div className="flex items-center text-white/90 text-sm md:text-base font-medium drop-shadow-sm">
            <Calendar className="w-4 h-4 mr-2" />
            {trip.startDate} - {trip.endDate}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 flex items-center">
              <Compass className="w-5 h-5 mr-2 text-brand" />
              Trip Summary
            </h3>
            <p className="text-zinc-600 leading-relaxed text-lg">{trip.summary.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <Wallet className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Total Est.</p>
                <p className="text-2xl font-bold text-zinc-900">{formatTripCurrency(trip.summary.totalCostEstimate, trip)}</p>
                {trip.travelers > 1 && (
                  <p className="text-sm text-zinc-400 mt-1">~{formatTripCurrency(Math.round(trip.summary.totalCostEstimate / trip.travelers), trip)}/person</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Pace</p>
                <p className="text-2xl font-bold text-zinc-900 capitalize">{trip.pace}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-brand to-brand-hover text-white border-none shadow-md overflow-hidden relative">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 transform rotate-12">
              <MapPin className="h-32 w-32" />
            </div>
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-sm font-medium text-white/80 uppercase tracking-wider">Recommended Area</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-2xl font-bold mb-3">{trip.stay.areaName}</p>
              <p className="text-sm text-white/90 leading-relaxed">{trip.stay.areaDescription}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-100 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-5">
              <Compass className="w-40 h-40" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold text-zinc-900">
                  {trip.itinerary.reduce((acc, day) => acc + day.modules.length, 0)}
                </span>
                <span className="text-lg font-medium text-zinc-500 mb-1">planned</span>
              </div>
              <p className="text-sm text-zinc-600">Across {trip.itinerary.length} days of adventure.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100">
        <h3 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wider">Trip Profile</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-xl">
            <Users className="w-4 h-4 mr-2" />
            {trip.travelers} Travelers
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 capitalize rounded-xl">
            <Wallet className="w-4 h-4 mr-2" />
            {trip.budgetStyle} Budget
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}
