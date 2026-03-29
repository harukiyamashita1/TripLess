import React from 'react';
import { Trip } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'motion/react';
import { MapPin, Star, DollarSign, ExternalLink } from 'lucide-react';

export default function StayTab({ trip }: { trip: Trip }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="bg-zinc-50 rounded-3xl p-6 md:p-8 border border-zinc-100">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Where to Stay</h2>
        <p className="text-zinc-600 leading-relaxed mb-6 text-lg max-w-3xl">
          Based on your <span className="font-semibold text-zinc-900 capitalize">{trip.pace}</span> pace and <span className="font-semibold text-zinc-900 capitalize">{trip.budgetStyle}</span> budget, we recommend staying in <strong className="text-brand">{trip.stay.areaName}</strong>.
        </p>
        <div className="bg-white rounded-2xl p-5 flex items-start shadow-sm border border-zinc-100">
          <div className="bg-brand/10 p-2 rounded-full mr-4 shrink-0">
            <MapPin className="h-6 w-6 text-brand" />
          </div>
          <p className="text-zinc-700 leading-relaxed">{trip.stay.areaDescription}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight">Top Hotel Picks</h3>
          <span className="text-sm font-medium text-zinc-500">{trip.stay.hotels.length} options</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trip.stay.hotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group h-full"
            >
              <Card className="overflow-hidden border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col rounded-2xl">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${hotel.name.replace(/\s+/g, '')}/600/400`} 
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center font-bold text-zinc-900">
                    <DollarSign className="w-4 h-4 text-emerald-600 mr-0.5" />
                    {hotel.pricePerNight}
                    <span className="text-xs text-zinc-500 font-medium ml-1">/ night</span>
                  </div>
                </div>
                
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-brand transition-colors">{hotel.name}</CardTitle>
                  </div>
                  
                  <p className="text-sm text-zinc-600 mb-6 line-clamp-3 leading-relaxed flex-1">{hotel.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-zinc-100">
                    {hotel.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-2.5 py-1 bg-zinc-100 text-zinc-700 font-medium rounded-lg">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
