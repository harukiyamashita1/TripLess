import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { OtterMascot } from '../components/OtterMascot';
import { Button } from '../components/ui/Button';
import { useTripStore } from '../store/TripContext';
import { Input } from '../components/ui/Input';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useTripStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate a network request for authentication
    setTimeout(() => {
      login(email, isSignUp ? name : undefined);
      navigate('/');
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center"
      >
        <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mb-6 border border-brand/20">
          <OtterMascot className="w-16 h-16 drop-shadow-md" />
        </div>
        
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-zinc-500 mb-6 text-sm">
          {isSignUp 
            ? "Join TripLess to save your itineraries." 
            : "Your AI travel concierge. Sign in to continue."}
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-3 mb-4">
          {isSignUp && (
            <Input
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:border-brand transition-all duration-200"
            />
          )}
          <Input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:border-brand transition-all duration-200"
          />
          <Input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:border-brand transition-all duration-200"
          />
          <Button 
            type="submit"
            className="w-full h-12 text-base rounded-xl shadow-lg shadow-zinc-200/50 mt-2 transition-all duration-200 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              "Please wait..."
            ) : (
              <>
                {isSignUp ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
                {isSignUp ? "Sign Up" : "Sign In"}
              </>
            )}
          </Button>
        </form>

        <Button 
          variant="ghost"
          className="w-full h-12 text-base rounded-xl text-zinc-500 hover:text-zinc-900"
          onClick={() => navigate('/')}
          disabled={isLoading}
          type="button"
        >
          Continue as Guest
        </Button>

        <div className="mt-6 text-sm text-zinc-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-brand font-medium hover:underline"
            disabled={isLoading}
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
