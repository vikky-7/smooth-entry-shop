-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for products (public read access)
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Create policies for cart_items
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" 
ON public.cart_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" 
ON public.cart_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  RETURN new;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample products
INSERT INTO public.products (name, description, price, image_url, category, stock_quantity) VALUES
('Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30-hour battery life.', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop', 'Electronics', 50),
('Organic Coffee Beans', 'Freshly roasted organic coffee beans from sustainable farms.', 24.99, 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&h=500&fit=crop', 'Food & Beverage', 100),
('Eco-Friendly Water Bottle', 'Stainless steel water bottle that keeps drinks cold for 24 hours.', 39.99, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop', 'Lifestyle', 75),
('Smart Fitness Tracker', 'Advanced fitness tracker with heart rate monitoring and GPS.', 149.99, 'https://images.unsplash.com/photo-1557935728-e6d1eaabe558?w=500&h=500&fit=crop', 'Electronics', 30),
('Organic Skincare Set', 'Complete skincare routine with natural and organic ingredients.', 89.99, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop', 'Beauty', 40),
('Minimalist Backpack', 'Sleek and functional backpack perfect for work and travel.', 79.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop', 'Fashion', 60);