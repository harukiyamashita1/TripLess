-- Initial Schema for TripLess

-- Users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travelers INTEGER NOT NULL DEFAULT 1,
  budget_style TEXT NOT NULL, -- 'budget', 'balanced', 'premium'
  pace TEXT NOT NULL, -- 'relaxed', 'medium', 'fast'
  summary JSONB NOT NULL, -- { title, description, totalCostEstimate }
  stay JSONB NOT NULL, -- { areaName, areaDescription, hotels: [] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip Days (modular storage)
CREATE TABLE IF NOT EXISTS public.trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  theme TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- Trip Day Items (modular storage)
CREATE TABLE IF NOT EXISTS public.trip_day_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES public.trip_days(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'activity', 'meal', 'transit'
  time TEXT NOT NULL,
  duration TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cost_estimate NUMERIC NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  location TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edit History
CREATE TABLE IF NOT EXISTS public.trip_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  request TEXT NOT NULL,
  classification JSONB NOT NULL, -- { edit_type, target_module, affected_days, ... }
  patch JSONB NOT NULL, -- { changed_modules, ... }
  change_summary JSONB NOT NULL, -- { message, explanation, ... }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_day_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_edits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own trips" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own trip days" ON public.trip_days FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own trip days" ON public.trip_days FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid())
);
CREATE POLICY "Users can update their own trip days" ON public.trip_days FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own trip days" ON public.trip_days FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid())
);

CREATE POLICY "Users can view their own trip day items" ON public.trip_day_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.trip_days 
    JOIN public.trips ON trips.id = trip_days.trip_id 
    WHERE trip_days.id = trip_day_items.day_id AND trips.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own trip day items" ON public.trip_day_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_days 
    JOIN public.trips ON trips.id = trip_days.trip_id 
    WHERE trip_days.id = trip_day_items.day_id AND trips.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update their own trip day items" ON public.trip_day_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.trip_days 
    JOIN public.trips ON trips.id = trip_days.trip_id 
    WHERE trip_days.id = trip_day_items.day_id AND trips.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete their own trip day items" ON public.trip_day_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.trip_days 
    JOIN public.trips ON trips.id = trip_days.trip_id 
    WHERE trip_days.id = trip_day_items.day_id AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own trip edits" ON public.trip_edits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trip edits" ON public.trip_edits FOR INSERT WITH CHECK (auth.uid() = user_id);
