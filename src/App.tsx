import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import { ToastProvider } from "./contexts/ToastContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import AdminProducts from "./pages/AdminProducts";
import AdminSiteSettings from "./pages/AdminSiteSettings";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Member from "./pages/Member";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import CheckoutResult from "./pages/CheckoutResult";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <SiteSettingsProvider>
            <ToastProvider>
              <Routes>
                {/* Auth Routes (no layout) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSiteSettings /></AdminRoute>} />

                {/* Public Routes */}
                <Route
                  path="*"
                  element={
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-grow">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/products" element={<ProductList />} />
                          <Route path="/products/:id" element={<ProductDetail />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/terms" element={<Terms />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/member" element={<ProtectedRoute><Member /></ProtectedRoute>} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/checkout/result" element={<CheckoutResult />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/about" element={<About />} />
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  }
                />
              </Routes>
            </ToastProvider>
          </SiteSettingsProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
