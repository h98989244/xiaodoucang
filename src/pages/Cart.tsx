import { Trash2, Minus, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

export default function Cart() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigate('/checkout');
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">購物車</h1>

        {items.length === 0 ? (
          <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400 mb-6">購物車是空的</p>
            <Link to="/products" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors">
              前往購物
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="bg-[#1e293b] rounded-2xl border border-gray-800 overflow-hidden divide-y divide-gray-800">
                {items.map(item => (
                  <div key={item.id} className="p-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image || 'https://picsum.photos/seed/placeholder/100/100'} alt={item.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{item.product_name}</h3>
                        <p className="text-gray-400 text-sm">面額：{item.variant_label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex items-center bg-[#0f172a] border border-gray-700 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-2 text-gray-400 hover:text-white transition-colors"><Minus size={16} /></button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-2 text-gray-400 hover:text-white transition-colors"><Plus size={16} /></button>
                      </div>
                      <div className="text-xl font-bold text-yellow-500 w-24 text-right">NT${item.price * item.quantity}</div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-80">
              <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">訂單摘要</h2>
                <div className="space-y-4 mb-6 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>小計</span>
                    <span>NT${total}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>手續費</span>
                    <span>NT$0</span>
                  </div>
                  <div className="border-t border-gray-700 pt-4 flex justify-between font-bold text-lg">
                    <span>總計</span>
                    <span className="text-yellow-500">NT${total}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                  前往結帳
                </button>
                <Link to="/products" className="block text-center mt-4 text-sm text-gray-400 hover:text-white transition-colors">
                  繼續購物
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
