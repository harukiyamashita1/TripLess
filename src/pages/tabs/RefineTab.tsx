import React, { useState, useRef, useEffect } from 'react';
import { Trip, ChangeSummary } from '../../types';
import { useTripStore } from '../../store/TripContext';
import { refineTrip } from '../../services/ai';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Bot, User, CheckCircle2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isChangeSummary?: boolean;
  changeDetails?: ChangeSummary;
}

const SUGGESTIONS = [
  "Make hotel cheaper",
  "Add more nightlife",
  "Make day 2 less rushed",
  "Better dinner near hotel",
  "Change stay area"
];

export default function RefineTab({ trip }: { trip: Trip }) {
  const { updateTrip, user } = useTripStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: "I've built your trip! Want to change anything? I'll only update what you ask for."
    }
  ]);
  const [input, setInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isRefining) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsRefining(true);

    try {
      const { updatedTrip, changeSummary } = await refineTrip(trip, text, user?.id);
      updateTrip(updatedTrip);
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: changeSummary.message,
          isChangeSummary: true,
          changeDetails: changeSummary
        }
      ]);
    } catch (error) {
      console.error("Refinement failed:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: "Sorry, I had trouble updating the trip. Please try again."
        }
      ]);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative"
    >
      <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex items-center gap-3">
        <div className="bg-brand/10 p-2 rounded-full">
          <Sparkles className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="font-semibold text-zinc-900">AI Trip Assistant</h2>
          <p className="text-xs text-zinc-500">Refine your itinerary instantly</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${
                  msg.role === 'user' ? 'bg-brand ml-3' : 'bg-white border border-zinc-200 mr-3'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-brand" />
                  )}
                </div>
                
                <div className={`px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand text-white rounded-tr-sm' 
                    : msg.isChangeSummary 
                      ? 'bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-tl-sm w-full'
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm'
                }`}>
                  {msg.isChangeSummary ? (
                    <div className="space-y-3">
                      <div className="flex items-center font-semibold">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 shrink-0" />
                        {msg.content}
                      </div>
                      {msg.changeDetails && (
                        <div className="bg-white/60 rounded-xl p-4 space-y-3 text-sm border border-emerald-100/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-emerald-800 font-semibold block mb-1">Changed</span>
                              <ul className="list-disc list-inside text-emerald-700/80 space-y-0.5">
                                {msg.changeDetails.changedModules?.map((m, i) => <li key={i}>{m}</li>)}
                              </ul>
                            </div>
                            <div>
                              <span className="text-zinc-600 font-semibold block mb-1">Unchanged</span>
                              <ul className="list-disc list-inside text-zinc-500 space-y-0.5">
                                {msg.changeDetails.unchangedModules?.map((m, i) => <li key={i}>{m}</li>)}
                              </ul>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-emerald-100/50">
                            <span className="text-emerald-800 font-semibold block mb-1">
                              {msg.changeDetails.timingAdjusted ? "Timing Adjusted" : "Timing Preserved"}
                            </span>
                            <p className="text-emerald-700/80">{msg.changeDetails.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isRefining && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex max-w-[80%] flex-row">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white border border-zinc-200 mr-3 flex items-center justify-center shadow-sm">
                  <Sparkles className="h-5 w-5 text-zinc-400 animate-pulse" />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-white border border-zinc-200 text-zinc-500 rounded-tl-sm flex items-center space-x-1 shadow-sm">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-zinc-200 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex overflow-x-auto pb-3 mb-1 -mx-4 px-4 md:mx-0 md:px-0 space-x-2 no-scrollbar hide-scroll-bar">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="whitespace-nowrap px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-sm font-medium rounded-full transition-all duration-200 border border-zinc-200 active:scale-95 hover:border-zinc-300 hover:shadow-sm"
              >
                {sug}
              </button>
            ))}
          </div>
          
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex items-center space-x-3 relative"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., Make day 2 less rushed..."
              className="flex-1 bg-white border-2 border-zinc-200 focus-visible:ring-0 focus-visible:border-brand rounded-full h-14 px-6 text-base shadow-sm"
              disabled={isRefining}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isRefining}
              className="h-12 w-12 rounded-full shrink-0 shadow-md bg-brand hover:bg-brand-hover text-white absolute right-1"
            >
              <Send className="h-5 w-5 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
