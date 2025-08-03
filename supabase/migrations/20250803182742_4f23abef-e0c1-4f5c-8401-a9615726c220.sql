-- Создание таблицы маркетплейсов
CREATE TABLE public.marketplaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  api_key TEXT,
  api_endpoint TEXT,
  api_parameters JSONB DEFAULT '{}',
  login TEXT,
  password TEXT,
  pricing_action TEXT CHECK (pricing_action IN ('add', 'multiply')) DEFAULT 'multiply',
  pricing_value DECIMAL(10,2) DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы товаров
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  supplier_article TEXT NOT NULL,
  marketplace_article TEXT,
  marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE SET NULL,
  name_supplier TEXT NOT NULL,
  name_marketplace TEXT,
  current_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  price_status TEXT CHECK (price_status IN ('increased', 'decreased', 'unchanged', 'missing')) DEFAULT 'unchanged',
  name_comparison_enabled BOOLEAN DEFAULT false,
  auto_name_update BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы настроек автоматизации
CREATE TABLE public.automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_mode_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 60,
  sync_period TEXT DEFAULT 'business_hours',
  max_requests_per_day INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы кастомизации поставщиков
CREATE TABLE public.supplier_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, marketplace_id)
);

-- Создание таблицы настроек файлохранилища
CREATE TABLE public.storage_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_type TEXT NOT NULL DEFAULT 'local',
  storage_login TEXT,
  storage_password TEXT,
  file_format TEXT DEFAULT 'xlsx',
  storage_path TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Добавление новых полей в таблицу suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS api_parameters JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS website_login TEXT,
ADD COLUMN IF NOT EXISTS website_password TEXT,
ADD COLUMN IF NOT EXISTS name_comparison_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_name_update BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS one_by_one_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upload_to_all_marketplaces BOOLEAN DEFAULT true;

-- Включение RLS для новых таблиц
ALTER TABLE public.marketplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_settings ENABLE ROW LEVEL SECURITY;

-- Политики доступа для marketplaces
CREATE POLICY "Authenticated users can view marketplaces" 
ON public.marketplaces FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert marketplaces" 
ON public.marketplaces FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update marketplaces" 
ON public.marketplaces FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete marketplaces" 
ON public.marketplaces FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Политики доступа для products
CREATE POLICY "Authenticated users can view products" 
ON public.products FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage products" 
ON public.products FOR ALL 
USING (true)
WITH CHECK (true);

-- Политики доступа для automation_settings
CREATE POLICY "Admins can manage automation settings" 
ON public.automation_settings FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view automation settings" 
ON public.automation_settings FOR SELECT 
USING (true);

-- Политики доступа для supplier_customizations
CREATE POLICY "Authenticated users can manage customizations" 
ON public.supplier_customizations FOR ALL 
USING (true)
WITH CHECK (true);

-- Политики доступа для storage_settings
CREATE POLICY "Admins can manage storage settings" 
ON public.storage_settings FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view storage settings" 
ON public.storage_settings FOR SELECT 
USING (true);

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_marketplaces_updated_at
BEFORE UPDATE ON public.marketplaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_settings_updated_at
BEFORE UPDATE ON public.automation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_storage_settings_updated_at
BEFORE UPDATE ON public.storage_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Вставка начальных настроек автоматизации
INSERT INTO public.automation_settings (auto_mode_enabled, sync_interval_minutes, sync_period, max_requests_per_day)
VALUES (false, 60, 'business_hours', 1000);

-- Вставка начальных настроек файлохранилища  
INSERT INTO public.storage_settings (storage_type, file_format, is_active)
VALUES ('local', 'xlsx', true);