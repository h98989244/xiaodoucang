import { useState, useEffect } from "react";
import { User, Package, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  order_no: string;
  total: number;
  status: string;
  created_at: string;
}

export default function Member() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'profile' | 'orders'>('profile');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', user.id)
        .single();
      if (data) {
        setName(data.name || '');
        setPhone(data.phone || '');
      }
    })();
  }, [user]);

  useEffect(() => {
    if (tab === 'orders' && user) {
      setLoadingOrders(true);
      supabase
        .from('orders')
        .select('id, order_no, total, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setOrders(data || []);
          setLoadingOrders(false);
        });
    }
  }, [tab, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, name, phone, email: user.email });
    setSaving(false);
    if (error) {
      showToast('儲存失敗', 'error');
    } else {
      showToast('已儲存');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const statusMap: Record<string, { label: string; className: string }> = {
    pending: { label: '待付款', className: 'bg-yellow-500/20 text-yellow-400' },
    completed: { label: '已完成', className: 'bg-emerald-500/20 text-emerald-400' },
    cancelled: { label: '已取消', className: 'bg-red-500/20 text-red-400' },
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white py-16">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#1e293b] rounded-2xl border border-gray-800 overflow-hidden h-fit">
          <div className="p-6 border-b border-gray-800 text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
              {name ? name[0].toUpperCase() : 'U'}
            </div>
            <h2 className="font-bold text-lg">{name || 'User'}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                tab === 'profile' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <User size={20} />
              個人資料
            </button>
            <button
              onClick={() => setTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                tab === 'orders' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Package size={20} />
              我的訂單
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-xl transition-colors mt-4"
            >
              <LogOut size={20} />
              登出
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-[#1e293b] rounded-2xl border border-gray-800 p-8">
          {tab === 'profile' ? (
            <>
              <h2 className="text-2xl font-bold mb-8">個人資料</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">姓名</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">電子郵件</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">手機號碼</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="請輸入手機號碼"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? '儲存中...' : '儲存變更'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-8">我的訂單</h2>
              {loadingOrders ? (
                <div className="text-center py-12 text-gray-500">載入中...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">目前沒有訂單</div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const s = statusMap[order.status] || statusMap.pending;
                    return (
                      <div key={order.id} className="bg-[#0f172a] rounded-xl p-6 border border-gray-800 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{order.order_no}</h3>
                          <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString('zh-TW')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-yellow-500">NT${order.total}</span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${s.className}`}>{s.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
