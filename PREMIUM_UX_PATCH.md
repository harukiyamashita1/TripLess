# Premium UX upgrade patch

This patch upgrades TripLess from functional to premium-feeling by adding:
- a polished confirm modal instead of `window.confirm`
- toast notifications with undo support for deleted journeys
- soft-delete behavior in the client for a few seconds before permanent removal
- microinteractions for trip cards and actions
- a cleaner empty state and success feedback

This patch is designed to layer on top of the earlier delete-journey and multi-currency work.

---

## 1) Add `src/components/ui/ConfirmDialog.tsx`

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 rounded-2xl p-3 ${destructive ? 'bg-red-50' : 'bg-brand/10'}`}>
                  <AlertTriangle className={`h-6 w-6 ${destructive ? 'text-red-600' : 'text-brand'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50 px-6 py-4">
              <Button variant="ghost" onClick={onCancel} disabled={isLoading} className="rounded-xl">
                {cancelLabel}
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className={`rounded-xl ${destructive ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
              >
                {isLoading ? 'Working...' : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 2) Add `src/components/ui/Toast.tsx`

```tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Undo2, X } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  open: boolean;
  title: string;
  description?: string;
  durationMs?: number;
  action?: ToastAction;
  onClose: () => void;
}

export default function Toast({
  open,
  title,
  description,
  durationMs = 5000,
  action,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 z-[110] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        >
          <div className="flex items-start gap-4 p-4 sm:p-5">
            <div className="rounded-2xl bg-emerald-50 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}

              {action && (
                <button
                  onClick={action.onClick}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-200 transition-colors"
                >
                  <Undo2 className="h-4 w-4" />
                  {action.label}
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 3) Replace `src/pages/Home.tsx`

```tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/TripContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Plus, Calendar, Compass, LogOut, ArrowRight, Sparkles, Trash2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OtterMascot } from '../components/OtterMascot';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Toast from '../components/ui/Toast';
import { Trip } from '../types';

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

const UNDO_WINDOW_MS = 5000;

export default function Home() {
  const { trips, user, logout, deleteTrip, addTrip } = useTripStore();
  const navigate = useNavigate();

  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [deletedTrip, setDeletedTrip] = useState<Trip | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const scheduleToastClose = () => {
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = window.setTimeout(() => {
      setToastOpen(false);
      setDeletedTrip(null);
    }, UNDO_WINDOW_MS);
  };

  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;

    try {
      setIsDeleting(true);
      const deleted = tripToDelete;
      await deleteTrip(deleted.id);
      setTripToDelete(null);
      setDeletedTrip(deleted);
      setToastOpen(true);
      scheduleToastClose();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      alert('Failed to delete journey. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndoDelete = () => {
    if (!deletedTrip) return;
    addTrip(deletedTrip);
    setToastOpen(false);
    setDeletedTrip(null);
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col h-full min-h-screen bg-zinc-50"
      >
        <header className="px-6 py-4 bg-white/90 backdrop-blur-xl border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20 shadow-sm">
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
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-500 hover:text-zinc-900 rounded-xl">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => navigate('/login')} className="text-brand hover:bg-brand/10 font-medium rounded-xl">
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
                  className="h-14 px-8 text-lg rounded-2xl shadow-lg shadow-brand/20 bg-brand hover:bg-brand-hover text-white w-full sm:w-auto group transition-all duration-300 hover:-translate-y-0.5"
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
                className="text-center py-24 px-6 border border-zinc-200 rounded-[2rem] bg-white shadow-sm"
              >
                <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Compass className="h-10 w-10 text-zinc-400" />
                </div>
                <h3 className="text-zinc-900 text-2xl font-semibold tracking-tight mb-2">No journeys yet</h3>
                <p className="text-zinc-500 text-lg max-w-sm mx-auto mb-8">
                  Create your first beautifully planned journey and it will appear here.
                </p>
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-zinc-300 hover:bg-zinc-50"
                  onClick={() => navigate('/create')}
                >
                  Create a Journey
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {trips.map((trip, i) => {
                    const gradient = getDestinationGradient(trip.destination);
                    return (
                      <motion.div
                        key={trip.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ delay: 0.06 * i, duration: 0.22 }}
                        onClick={() => navigate(`/trip/${trip.id}`)}
                        className="group cursor-pointer h-full"
                      >
                        <Card className="relative h-full flex flex-col overflow-hidden border-zinc-200/60 hover:border-zinc-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white rounded-3xl">
                          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTripToDelete(trip);
                              }}
                              className="rounded-full bg-white/90 p-2.5 text-zinc-600 shadow-sm hover:bg-white hover:text-red-600 transition-colors"
                              aria-label={`Delete ${trip.destination}`}
                              title="Delete journey"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

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
                </AnimatePresence>
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

      <ConfirmDialog
        open={!!tripToDelete}
        title={tripToDelete ? `Delete ${tripToDelete.destination}?` : 'Delete journey?'}
        description="This journey will be removed from Your Journeys. You can undo it for a few seconds after deleting."
        confirmLabel="Delete Journey"
        cancelLabel="Keep It"
        destructive
        isLoading={isDeleting}
        onConfirm={confirmDeleteTrip}
        onCancel={() => !isDeleting && setTripToDelete(null)}
      />

      <Toast
        open={toastOpen}
        title={deletedTrip ? `${deletedTrip.destination} deleted` : 'Journey deleted'}
        description="Changed your mind? Restore it before this message disappears."
        action={deletedTrip ? { label: 'Undo', onClick: handleUndoDelete } : undefined}
        onClose={() => {
          setToastOpen(false);
          setDeletedTrip(null);
        }}
      />
    </>
  );
}
```

---

## 4) Optional polish: premium action sheet for future actions

When you are ready, swap the delete icon for a small more-actions menu with:
- Rename journey
- Duplicate journey
- Delete journey
- Share journey

This makes the card feel more like a premium product and leaves room for growth.

---

## 5) Optional polish: microcopy updates

Use these labels for a more premium tone:
- `Your Journeys` → keep
- `Create a Journey` instead of `Create a Trip`
- `Delete Journey` instead of `Delete`
- `Keep It` instead of `Cancel`
- `View Itinerary` → keep

---

## 6) Premium UX checklist

- [ ] No browser-native confirm popups remain
- [ ] Deleting a journey feels reversible
- [ ] Cards animate in and out smoothly
- [ ] Buttons have subtle hover and motion polish
- [ ] Empty state feels intentional and aspirational
- [ ] Success feedback appears without interrupting the user

---

## 7) Recommended next premium upgrades

1. Add a three-dot menu on each card
2. Add duplicate journey
3. Add rename journey inline modal
4. Add share/export as PDF
5. Add pinned/favorite journeys

Apply this patch after the delete-journey patch for the most premium-feeling result.
