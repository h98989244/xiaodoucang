import { Link } from "react-router-dom";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

export default function Footer() {
  const { siteName, email, address, taxId } = useSiteSettings();

  return (
    <footer className="bg-[#0f172a] text-gray-400 py-12 px-6 border-t border-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-white font-bold mb-4">{siteName}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">首頁</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">關於我們</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">客服中心</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-white transition-colors">聯絡我們</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">服務條款</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">隱私權政策</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">購物專區</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-white transition-colors">商品專區</Link></li>
            <li><Link to="/cart" className="hover:text-white transition-colors">購物車</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">我的帳號</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/member" className="hover:text-white transition-colors">會員中心</Link></li>
            <li><Link to="/orders" className="hover:text-white transition-colors">訂單查詢</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto text-center text-xs border-t border-gray-800 pt-8">
        <p>&copy; 2026 {siteName} All rights reserved. 統一編號：{taxId}.</p>
        <p className="mt-1">客服信箱：{email}. 地址：{address}.</p>
      </div>
    </footer>
  );
}
