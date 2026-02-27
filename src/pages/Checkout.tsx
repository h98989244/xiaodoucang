import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Building2, Store, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

type PaymentMethod = 'Credit' | 'ATM' | 'CVS';

const paymentMethods: { value: PaymentMethod; label: string; desc: string; icon: typeof CreditCard }[] = [
  { value: 'Credit', label: '信用卡', desc: '支援 Visa / Mastercard / JCB', icon: CreditCard },
  { value: 'ATM', label: 'ATM 轉帳', desc: '取得虛擬帳號後轉帳付款', icon: Building2 },
  { value: 'CVS', label: '超商代碼', desc: '至超商繳費機付款', icon: Store },
];

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit');
  const [guestEmail, setGuestEmail] = useState('');
  const [processing, setProcessing] = useState(false);

  // 如果購物車為空，導回購物車
  if (items.length === 0) {
    return (
      <div className="bg-[#0f172a] min-h-screen text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400 mb-6">購物車是空的，無法結帳</p>
          <Link to="/cart" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors">
            返回購物車
          </Link>
        </div>
      </div>
    );
  }

  const email = user?.email || guestEmail;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast('請輸入電子郵件', 'error');
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-ecpay-order', {
        body: {
          items: items.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_label: item.variant_label,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          payment_method: paymentMethod,
          email,
          user_id: user?.id || null,
        },
      });

      if (error) {
        throw new Error(error.message || '結帳失敗');
      }

      if (data?.error) {
        showToast(data.error, 'error');
        setProcessing(false);
        return;
      }

      // 清空購物車
      await clearCart();

      // 使用回傳的 HTML 表單導向 ECPay
      if (data?.html) {
        const newWindow = window.open('', '_self');
        if (newWindow) {
          newWindow.document.write(data.html);
          newWindow.document.close();
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast('結帳失敗，請稍後再試', 'error');
      setProcessing(false);
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/cart" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} />
          返回購物車
        </Link>

        <h1 className="text-3xl font-bold mb-8">確認訂單</h1>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 左側：訂單內容 + 付款方式 */}
            <div className="flex-1 space-y-8">
              {/* 訂單明細 */}
              <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-6">訂單明細</h2>
                <div className="divide-y divide-gray-800">
                  {items.map(item => (
                    <div key={item.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image || 'https://picsum.photos/seed/placeholder/100/100'}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold">{item.product_name}</h3>
                          <p className="text-gray-400 text-sm">面額：{item.variant_label}</p>
                          <p className="text-gray-400 text-sm">數量：{item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-yellow-500">
                        NT${item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 付款方式 */}
              <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-6">付款方式</h2>
                <div className="space-y-3">
                  {paymentMethods.map(method => {
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.value}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          paymentMethod === method.value
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === method.value ? 'bg-blue-500' : 'bg-gray-800'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{method.label}</div>
                          <div className="text-sm text-gray-400">{method.desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method.value ? 'border-blue-500' : 'border-gray-600'
                        }`}>
                          {paymentMethod === method.value && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 訪客 Email */}
              {!user && (
                <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-6">
                  <h2 className="text-xl font-bold mb-6">聯絡資訊</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      電子郵件 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      required
                      placeholder="請輸入電子郵件（用於查詢訂單）"
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      此郵件將用於訂單查詢，請確認輸入正確
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 右側：訂單摘要 */}
            <div className="w-full lg:w-80">
              <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">訂單摘要</h2>
                <div className="space-y-4 mb-6 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>商品數量</span>
                    <span>{items.reduce((s, i) => s + i.quantity, 0)} 件</span>
                  </div>
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
                  type="submit"
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {processing ? '處理中...' : '確認付款'}
                </button>

                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                  <ShieldCheck size={14} />
                  <span>由綠界科技提供安全金流服務</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
