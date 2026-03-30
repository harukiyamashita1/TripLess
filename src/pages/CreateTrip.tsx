import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, Coffee, Mountain, Landmark, Utensils, Music, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTrip } from '../services/ai';
import { useTripStore } from '../store/TripContext';
import { OtterMascot } from '../components/OtterMascot';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY_CODE, inferCurrencyCodeFromDestination } from '../lib/currency';

const TRIP_TYPES = [
  { id: 'any', label: 'Any', icon: Map },
  { id: 'relaxation', label: 'Relax', icon: Coffee },
  { id: 'adventure', label: 'Adventure', icon: Mountain },
  { id: 'culture', label: 'Culture', icon: Landmark },
  { id: 'food & drink', label: 'Foodie', icon: Utensils },
  { id: 'party', label: 'Nightlife', icon: Music },
];

export default function CreateTrip() {
  const navigate = useNavigate();
  const { addTrip, user } = useTripStore();
  
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budgetMode, setBudgetMode] = useState<'style' | 'exact'>('style');
  const [budgetStyle, setBudgetStyle] = useState('balanced');
  const [exactBudget, setExactBudget] = useState('');
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY_CODE);
  const [pace, setPace] = useState('medium');
  const [tripType, setTripType] = useState('any');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!startDate || !endDate) return;
    
    setIsGenerating(true);
    navigate('/loading', { state: { destination } });
    
    try {
      const finalBudget = budgetMode === 'exact' && exactBudget ? `Exact amount: ${exactBudget} ${currencyCode}` : budgetStyle;
      const trip = await generateTrip(destination, startDate, endDate, travelers, finalBudget, pace, tripType, additionalNotes, user?.id);
      trip.id = uuidv4(); // Ensure unique ID
      addTrip(trip);
      navigate(`/trip/${trip.id}`);
    } catch (error) {
      console.error("Failed to generate trip:", error);
      alert("Failed to generate trip. Please try again.");
      navigate('/');
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
      <header className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20">
            <OtterMascot className="w-5 h-5 drop-shadow-sm" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            New Trip
          </h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 md:py-12">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden">
          <div className="p-8 sm:p-12 space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-6 bg-gradient-to-br from-brand/5 to-orange-500/5 p-6 rounded-3xl border border-brand/10"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-brand/10">
                <OtterMascot className="w-12 h-12 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-1 text-zinc-900">Let's plan your trip</h2>
                <p className="text-zinc-600 leading-relaxed">
                  Tell me when you're going, and I'll handle the rest! You can add more details below to customize your perfect itinerary.
                </p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="text-xl font-semibold tracking-tight mb-5 text-zinc-900">When are you going?</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 block">Start Date</label>
                  <Input 
                    type="date" 
                    value={startDate}
                    min={today}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="h-14 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 block">End Date</label>
                  <Input 
                    type="date" 
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-14 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-lg"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="pt-8 border-t border-zinc-100"
            >
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full py-3 px-4 -mx-4 rounded-xl hover:bg-zinc-50 transition-colors group active:bg-zinc-100"
              >
                <span className="text-lg font-semibold text-zinc-800 group-hover:text-brand transition-colors">Optional Details</span>
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                  {showAdvanced ? <ChevronUp className="h-5 w-5 text-zinc-500 group-hover:text-brand" /> : <ChevronDown className="h-5 w-5 text-zinc-500 group-hover:text-brand" />}
                </div>
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-10 pt-6 pb-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 block">
                          Destination <span className="text-zinc-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <Input 
                          placeholder="e.g. Tokyo, Paris, or leave blank for a surprise" 
                          value={destination}
                          onChange={(e) => {
                            setDestination(e.target.value);
                            if (e.target.value) {
                              setCurrencyCode(inferCurrencyCodeFromDestination(e.target.value));
                            }
                          }}
                          className="h-14 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-lg"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-zinc-700 block">Travelers</label>
                          <div className="flex items-center space-x-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-200 w-fit transition-colors hover:border-zinc-300">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm active:scale-95" onClick={() => setTravelers(Math.max(1, travelers - 1))}>-</Button>
                            <span className="text-xl font-semibold w-8 text-center text-zinc-900">{travelers}</span>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm active:scale-95" onClick={() => setTravelers(travelers + 1)}>+</Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-zinc-700">Budget</label>
                            <div className="flex bg-zinc-100 rounded-lg p-1">
                              <button
                                onClick={() => setBudgetMode('style')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${budgetMode === 'style' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                              >
                                Style
                              </button>
                              <button
                                onClick={() => setBudgetMode('exact')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${budgetMode === 'exact' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                              >
                                Exact
                              </button>
                            </div>
                          </div>
                          
                          {budgetMode === 'style' ? (
                            <div className="flex space-x-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200">
                              {['budget', 'balanced', 'premium'].map(style => (
                                <button
                                  key={style}
                                  onClick={() => setBudgetStyle(style)}
                                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200 active:scale-[0.98] ${
                                    budgetStyle === style 
                                      ? 'bg-white text-brand shadow-sm ring-1 ring-zinc-200/50' 
                                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
                                  }`}
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <select
                                  value={currencyCode}
                                  onChange={(e) => setCurrencyCode(e.target.value)}
                                  className="h-14 rounded-xl bg-zinc-50 border border-zinc-200 focus:bg-white transition-colors text-lg font-medium px-4 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                                >
                                  {SUPPORTED_CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.code}</option>
                                  ))}
                                </select>
                                <Input 
                                  type="number" 
                                  placeholder="e.g. 2000" 
                                  value={exactBudget}
                                  onChange={(e) => setExactBudget(e.target.value)}
                                  className="flex-1 h-14 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-lg font-medium"
                                />
                              </div>
                              <p className="text-xs text-zinc-500">
                                Trip prices will be shown in the destination's local currency.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-zinc-700 block">Trip Focus</label>
                        <div className="flex flex-wrap gap-3">
                          {TRIP_TYPES.map(type => {
                            const Icon = type.icon;
                            const isSelected = tripType === type.id;
                            return (
                              <button
                                key={type.id}
                                onClick={() => setTripType(type.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                                  isSelected 
                                    ? 'bg-brand text-white shadow-md shadow-brand/20 ring-2 ring-brand ring-offset-2' 
                                    : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                                }`}
                              >
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-zinc-700 block">Pace</label>
                        <div className="flex space-x-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                          {['relaxed', 'medium', 'fast'].map(p => (
                            <button
                              key={p}
                              onClick={() => setPace(p)}
                              className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all duration-200 active:scale-[0.98] ${
                                pace === p 
                                  ? 'bg-white text-brand shadow-sm ring-1 ring-zinc-200/50' 
                                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 block">
                          Additional Notes <span className="text-zinc-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <Textarea 
                          placeholder="e.g. I have a peanut allergy, prefer boutique hotels, want to visit the Ghibli Museum..." 
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          className="min-h-[120px] rounded-2xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors text-base p-4 resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          <div className="p-8 sm:px-12 sm:py-8 bg-zinc-50/80 border-t border-zinc-100 backdrop-blur-sm">
            <Button 
              className="w-full h-16 text-xl font-semibold rounded-2xl shadow-xl shadow-brand/20 bg-brand hover:bg-brand-hover text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              disabled={!startDate || !endDate || isGenerating}
              onClick={handleCreate}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <Sparkles className="mr-3 h-6 w-6 animate-pulse" />
                  Building Your Journey...
                </span>
              ) : (
                <span className="flex items-center">
                  <Sparkles className="mr-3 h-6 w-6" />
                  Generate Itinerary
                </span>
              )}
            </Button>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
