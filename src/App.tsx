/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TripProvider } from './store/TripContext';
import { AnimatePresence } from 'motion/react';
import KeySelectionGuard from './components/KeySelectionGuard';
import Home from './pages/Home';
import CreateTrip from './pages/CreateTrip';
import LoadingTrip from './pages/LoadingTrip';
import TripDetails from './pages/TripDetails';
import Login from './pages/Login';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.split('/')[1] || '/'}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateTrip />} />
        <Route path="/loading" element={<LoadingTrip />} />
        <Route path="/trip/:id/*" element={<TripDetails />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <TripProvider>
      <KeySelectionGuard>
        <BrowserRouter>
          <div className="min-h-screen bg-zinc-50 text-zinc-950 font-sans selection:bg-zinc-200 flex flex-col">
            <AnimatedRoutes />
          </div>
        </BrowserRouter>
      </KeySelectionGuard>
    </TripProvider>
  );
}
