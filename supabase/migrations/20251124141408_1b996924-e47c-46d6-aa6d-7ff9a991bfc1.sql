-- Create enum for family members
CREATE TYPE family_member AS ENUM ('parent1', 'parent2', 'kid1', 'kid2', 'housekeeper');

-- Create enum for transport methods
CREATE TYPE transport_method AS ENUM ('car', 'bus', 'walk', 'bike');

-- Create enum for activity categories
CREATE TYPE activity_category AS ENUM ('sports', 'education', 'social', 'chores', 'health', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function and trigger for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create family_settings table
CREATE TABLE public.family_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  parent1_name TEXT DEFAULT 'Parent 1',
  parent1_color TEXT DEFAULT '210, 40%, 50%',
  parent2_name TEXT DEFAULT 'Parent 2',
  parent2_color TEXT DEFAULT '280, 40%, 50%',
  kid1_name TEXT DEFAULT 'Kid 1',
  kid1_color TEXT DEFAULT '150, 40%, 50%',
  kid2_name TEXT DEFAULT 'Kid 2',
  kid2_color TEXT DEFAULT '30, 40%, 50%',
  housekeeper_name TEXT DEFAULT 'Housekeeper',
  housekeeper_color TEXT DEFAULT '180, 30%, 50%',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.family_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.family_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.family_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.family_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create family_events table
CREATE TABLE public.family_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category activity_category NOT NULL,
  participants family_member[] NOT NULL DEFAULT '{}',
  transportation JSONB,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  color TEXT,
  recurrence_slots JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.family_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON public.family_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON public.family_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON public.family_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON public.family_events FOR DELETE
  USING (auth.uid() = user_id);

-- Create event_instances table
CREATE TABLE public.event_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.family_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  transportation JSONB,
  participants family_member[],
  cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, date)
);

ALTER TABLE public.event_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instances"
  ON public.event_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instances"
  ON public.event_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instances"
  ON public.event_instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instances"
  ON public.event_instances FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_settings_updated_at
  BEFORE UPDATE ON public.family_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_events_updated_at
  BEFORE UPDATE ON public.family_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_instances_updated_at
  BEFORE UPDATE ON public.event_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();