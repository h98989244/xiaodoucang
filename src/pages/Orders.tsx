import { useState } from "react";
import { Search, Package } from "lucide-react";
import { supabase } from "../lib/supabase";

interface OrderItem {
  id: string;
  product_name: string;
  variant_label: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_no: string;
  email: string;
  total: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待付款', className: 'bg-yellow-500/20 text-yellow-400' },
  completed: { label: '已完成', className: 'bg-emerald-500/20 text-emerald-400' },
  cancelled: { label: '已取消', className: 'bg-red-500/20 text-red-400' },
};

export default function Orders() {
  const [orderNo, setOrderNo] = useState('');
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!orderNo.trim() && !email.trim()) return;
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from('orders')
      .select('*, order_items(*)');

    if (orderNo.trim()) query = query.eq('order_no', orderNo.trim());
    if (email.trim()) query = query.eq('email', email.trim());

    const { data } = await query.order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white py-16">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">訂單查詢</h1>

        <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-8 mb-8">
          <p className="text-gray-400 mb-6">請輸入您的訂單編號及電子郵件以查詢訂單狀態。</p>
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">訂單編號</label>
              <input
                type="text"
                value={orderNo}
                onChange={e => setOrderNo(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="例如：ORD-12345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">電子郵件</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="請輸入購買時使用的電子郵件"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search size={20} />
              {loading ? '查詢中...' : '查詢訂單'}
            </button>
          </form>
        </div>

        {searched && orders.length === 0 && !loading && (
          <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-8 text-center text-gray-400">
            未找到符合條件的訂單
          </div>
        )}

        {orders.map(order => {
          const s = statusMap[order.status] || statusMap.pending;
          return (
            <div key={order.id} className="bg-[#1e293b] rounded-2xl border border-gray-800 p-8 mb-4">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-800">
                <div>
                  <h3 className="text-lg font-bold">訂單編號：{order.order_no}</h3>
                  <p className="text-sm text-gray-400 mt-1">訂購日期：{new Date(order.created_at).toLocaleString('zh-TW')}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${s.className}`}>
                  {s.label}
                </div>
              </div>
              <div className="space-y-4">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
                      <Package size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{item.product_name}</h4>
                      <p className="text-sm text-gray-400">面額：{item.variant_label} / 數量：{item.quantity}</p>
                    </div>
                    <div className="font-bold text-yellow-500">NT${item.price * item.quantity}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                <div className="text-lg font-bold">總計：<span className="text-yellow-500">NT${order.total}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
