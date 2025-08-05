-- Add developer role to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'developer';

-- Create sandbox_settings table for API testing
CREATE TABLE public.sandbox_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_sandbox_mode BOOLEAN NOT NULL DEFAULT true,
  test_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  test_marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE SET NULL,
  max_test_requests INTEGER DEFAULT 100,
  test_requests_used INTEGER DEFAULT 0,
  last_test_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.sandbox_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for sandbox_settings
CREATE POLICY "Users can view their own sandbox settings"
ON public.sandbox_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sandbox settings"
ON public.sandbox_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sandbox settings"
ON public.sandbox_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Developers and admins can view all sandbox settings"
ON public.sandbox_settings
FOR SELECT
USING (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add sandbox mode fields to existing tables
ALTER TABLE public.suppliers ADD COLUMN sandbox_mode BOOLEAN DEFAULT false;
ALTER TABLE public.marketplaces ADD COLUMN sandbox_mode BOOLEAN DEFAULT false;

-- Create trigger for updated_at
CREATE TRIGGER update_sandbox_settings_updated_at
  BEFORE UPDATE ON public.sandbox_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();