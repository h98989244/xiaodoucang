-- ============================================
-- 小豆倉點卡商城 — Supabase Schema
-- ============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active products" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Product Variants (face values)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Cart Items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  product_name TEXT,
  variant_label TEXT,
  price NUMERIC,
  quantity INTEGER DEFAULT 1,
  image TEXT,
  UNIQUE(user_id, variant_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- 6. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  ecpay_trade_no TEXT,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (
  auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Guest order lookup" ON orders FOR SELECT USING (true);
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  variant_id UUID,
  product_name TEXT,
  variant_label TEXT,
  price NUMERIC,
  quantity INTEGER
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readable with order" ON order_items FOR SELECT USING (true);
CREATE POLICY "Insertable with order" ON order_items FOR INSERT WITH CHECK (true);

-- 7b. Payment Logs
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  order_no TEXT NOT NULL,
  action TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read payment logs" ON payment_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Service can insert payment logs" ON payment_logs FOR INSERT WITH CHECK (true);

-- 7c. Checkout Order Function (atomic stock validation + order creation)
CREATE OR REPLACE FUNCTION checkout_create_order(
  p_items JSONB,
  p_order_no TEXT,
  p_user_id UUID,
  p_email TEXT,
  p_total NUMERIC,
  p_payment_method TEXT
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_available INT;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock INTO v_available
    FROM product_variants
    WHERE id = (v_item->>'variant_id')::UUID
    FOR UPDATE;

    IF v_available < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for variant %', v_item->>'variant_id';
    END IF;

    UPDATE product_variants
    SET stock = stock - (v_item->>'quantity')::INT
    WHERE id = (v_item->>'variant_id')::UUID;
  END LOOP;

  INSERT INTO orders (order_no, user_id, email, total, status, payment_status, payment_method)
  VALUES (p_order_no, p_user_id, p_email, p_total, 'pending', 'unpaid', p_payment_method)
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_label, price, quantity)
  SELECT
    v_order_id,
    (item->>'product_id')::UUID,
    (item->>'variant_id')::UUID,
    item->>'product_name',
    item->>'variant_label',
    (item->>'price')::NUMERIC,
    (item->>'quantity')::INT
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Site Settings
CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default settings
INSERT INTO site_settings (site_name, phone, address, tax_id, email)
VALUES ('小豆倉點卡商城', '(02) 1234-5678', '台北市信義區信義路一段123號', '12345678', 'service@xiaodoucang.com');

-- 9. Contact Messages
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read contacts" ON contact_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 10. Seed categories
INSERT INTO categories (name) VALUES
  ('Google Play'),
  ('Apple'),
  ('Steam'),
  ('LINE'),
  ('PlayStation'),
  ('Nintendo'),
  ('Xbox'),
  ('Gash'),
  ('MyCard');

-- 11. Seed sample products
DO $$
DECLARE
  p1 UUID; p2 UUID; p3 UUID; p4 UUID;
  p5 UUID; p6 UUID; p7 UUID; p8 UUID;
BEGIN
  INSERT INTO products (name, category, image_url, description, status) VALUES
    ('Steam HKD $200', 'Steam', 'https://picsum.photos/seed/steam200/400/600', 'Steam 錢包儲值碼，購買遊戲、軟體等。', 'active') RETURNING id INTO p1;
  INSERT INTO products (name, category, image_url, description, status) VALUES
    ('Google Play $50', 'Google Play', 'https://picsum.photos/seed/googleplay50/400/600', 'Google Play 禮物卡，購買應用程式、遊戲等。', 'active') RETURNING id INTO p2;
  INSERT INTO products (name, category, image_url, description, status) VALUES
    ('Apple Store & iTunes', 'Apple', 'https://picsum.photos/seed/apple25/400/600', 'Apple Store & iTunes 禮品卡。', 'active') RETURNING id INTO p3;
  INSERT INTO products (name, category, image_url, description, status) VALUES
    ('Gash 1000點', 'Gash', 'https://picsum.photos/seed/gash1000/400/600', 'Gash 點數卡。', 'active') RETURNING id INTO p4;
  INSERT INTO products (name, category, image_url, description, status) VALUES
    ('MyCard 3000點', 'MyCard', 'https://picsum.photos/seed/mycard3000/400/600', 'MyCard 點數卡。', 'active') RETURNING id INTO p5;
  INSERT INTO products (name, category, image_url, description, status) VALUES
    ('PlayStation Store', 'PlayStation', 'https://picsum.photos/seed/ps500/400/600', 'PlayStation Store 預付卡。', 'active') RETURNING id INTO p6;
  INSERT INTO products (name, category, image_url, description, status) VALUES
    ('Nintendo eShop', 'Nintendo', 'https://picsum.photos/seed/nintendo10/400/600', 'Nintendo eShop 預付卡。', 'active') RETURNING id INTO p7;
  INSERT INTO products (name, category, image_url, description, status) VALUES
    ('Xbox Gift Card $20', 'Xbox', 'https://picsum.photos/seed/xbox20/400/600', 'Xbox Gift Card。', 'active') RETURNING id INTO p8;

  -- Variants
  INSERT INTO product_variants (product_id, label, price, stock) VALUES
    (p1, 'HK$200', 190, 100),
    (p2, 'HK$50', 190, 50),
    (p3, 'HK$25', 125, 200),
    (p3, 'HK$50', 245, 150),
    (p4, 'HK$1000', 190, 150),
    (p5, 'HK$3000', 300, 80),
    (p6, 'HK$500', 500, 120),
    (p7, 'HK$10', 10, 300),
    (p7, 'HK$50', 50, 200),
    (p8, 'HK$20', 20, 90);
END $$;

-- 12. Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
