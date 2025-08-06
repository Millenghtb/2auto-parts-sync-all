-- Add pricing fields to products table
ALTER TABLE public.products 
ADD COLUMN pricing_action text DEFAULT 'multiply'::text,
ADD COLUMN pricing_value numeric DEFAULT 1.0;