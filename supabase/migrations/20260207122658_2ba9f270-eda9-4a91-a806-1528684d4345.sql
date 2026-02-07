
-- Settings table (stores PIN hash, business info)
CREATE TABLE public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  pin_hash TEXT,
  business_name TEXT NOT NULL DEFAULT 'Nigro Automobiles',
  business_address TEXT NOT NULL DEFAULT '56 Iwofe Road, Rumuopirikom, PHC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory table
CREATE TABLE public.inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  date_added TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  seller_name TEXT NOT NULL DEFAULT '',
  buyer_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Receipts table
CREATE TABLE public.receipts (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES public.sales(id),
  business_name TEXT NOT NULL DEFAULT 'Nigro Automobiles',
  business_address TEXT NOT NULL DEFAULT '56 Iwofe Road, Rumuopirikom, PHC',
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  seller_name TEXT NOT NULL DEFAULT '',
  buyer_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Since this is a single-user PIN-protected app (no Supabase auth),
-- allow access via anon key. The PIN protects the frontend.
CREATE POLICY "Allow all access to settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to inventory" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to inventory_table" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to receipts" ON public.receipts FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings with PIN hash for 159874
-- The SHA-256 hash will be set by the app on first load
INSERT INTO public.app_settings (id, business_name, business_address)
VALUES ('main', 'Nigro Automobiles', '56 Iwofe Road, Rumuopirikom, PHC');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
