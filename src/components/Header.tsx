import { useState } from "react";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

export default function Header() {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const { siteName } = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-[#0f172a] text-white py-4 px-6 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">e</span>
            </div>
            {siteName}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link to="/" className="hover:text-white transition-colors">首頁</Link>
            <Link to="/products" className="hover:text-white transition-colors">商品列表</Link>
            <Link to="/contact" className="hover:text-white transition-colors">聯絡我們</Link>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-400">
            <Link to="/orders" className="hover:text-white transition-colors">訂單查詢</Link>
            <Link to="/about" className="hover:text-white transition-colors">關於我們</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">{count}</span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/member" className="flex items-center gap-2 text-sm hover:text-gray-300 transition-colors">
                  <User size={20} />
                  <span className="hidden sm:inline">會員中心</span>
                </Link>
                <button onClick={handleSignOut} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 text-sm hover:text-gray-300 transition-colors">
                <User size={20} />
                <span className="hidden sm:inline">登入</span>
              </Link>
            )}

            <button
              className="md:hidden p-2 hover:bg-gray-800 rounded-full transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4 space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white py-2">首頁</Link>
          <Link to="/products" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white py-2">商品列表</Link>
          <Link to="/contact" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white py-2">聯絡我們</Link>
          <Link to="/orders" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white py-2">訂單查詢</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white py-2">關於我們</Link>
          {!user && (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-blue-400 hover:text-blue-300 py-2 font-medium">登入 / 註冊</Link>
          )}
        </div>
      )}
    </header>
  );
}
