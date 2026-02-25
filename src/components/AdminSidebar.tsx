import { Link, useLocation } from "react-router-dom";
import { Package, Settings, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  return (
    <aside className="w-64 bg-[#1e293b] text-white min-h-screen flex flex-col border-r border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">e</span>
          </div>
          小豆倉
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/admin/products"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            location.pathname === "/admin/products"
              ? "bg-blue-600/20 text-blue-400 font-medium"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}
        >
          <Package size={20} />
          商品管理
        </Link>
        <Link
          to="/admin/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            location.pathname === "/admin/settings"
              ? "bg-blue-600/20 text-blue-400 font-medium"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}
        >
          <Settings size={20} />
          網站設定
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-gray-400 hover:bg-gray-800 hover:text-red-400"
        >
          <LogOut size={20} />
          登出
        </button>
      </div>
    </aside>
  );
}
