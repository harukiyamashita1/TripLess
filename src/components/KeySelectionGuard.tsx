import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

interface KeySelectionGuardProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function KeySelectionGuard({ children }: KeySelectionGuardProps) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } catch (error) {
          console.error('Error checking API key:', error);
          setHasKey(true); // Fallback to assume it's okay if check fails
        }
      } else {
        // Not in AI Studio environment, assume key is provided via .env
        setHasKey(true);
      }
    };

    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // After opening, we assume success as per instructions
        setHasKey(true);
      } catch (error) {
        console.error('Error opening key selection:', error);
      }
    }
  };

  if (hasKey === null) return null; // Loading state

  if (!hasKey) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto">
            <Key className="w-8 h-8 text-zinc-900" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">API Key Required</h2>
            <p className="text-zinc-500 text-sm">
              To generate high-quality travel itineraries with Gemini 3.1 Pro, you need to select a valid API key from your Google Cloud project.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleSelectKey}
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-medium hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
            >
              Select API Key
            </button>
            <p className="mt-4 text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
              Requires a paid Google Cloud project. <br />
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-zinc-600 transition-colors"
              >
                Learn more about billing
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
