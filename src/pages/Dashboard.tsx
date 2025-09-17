import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Minus, ShoppingCart, User, LogOut, ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: Product;
}

interface Profile {
  full_name: string;
  email: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCartItems();
      fetchProfile();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching cart",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingCart(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const addToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      const existingItem = cartItems.find(item => item.product_id === productId);
      
      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({ user_id: user?.id, product_id: productId, quantity: 1 });

        if (error) throw error;
      }

      await fetchCartItems();
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding to cart",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const updateCartQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      await fetchCartItems();
    } catch (error: any) {
      toast({
        title: "Error updating cart",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await fetchCartItems();
    } catch (error: any) {
      toast({
        title: "Error removing from cart",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.products.price * item.quantity), 0);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingBag className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">ShopEase</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <Badge variant="secondary">{cartItems.length}</Badge>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Our Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">${product.price}</span>
                      <Button
                        onClick={() => addToCart(product.id)}
                        disabled={addingToCart === product.id}
                        size="sm"
                      >
                        {addingToCart === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{profile?.full_name || 'Loading...'}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Cart Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Shopping Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCart ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : cartItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Your cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 border-b pb-3 last:border-b-0">
                        <img
                          src={item.products.image_url}
                          alt={item.products.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.products.name}</p>
                          <p className="text-sm text-muted-foreground">${item.products.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">Total: ${getCartTotal().toFixed(2)}</span>
                      </div>
                      <Button className="w-full">
                        Checkout
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;