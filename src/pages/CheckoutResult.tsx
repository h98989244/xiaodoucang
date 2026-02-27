import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrderDetail {
  id: string;
  order_no: string;
  email: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    variant_label: string;
    price: number;
    quantity: number;
  }[];
}

export default function CheckoutResult() {
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get('order_no');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNo) {
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_no', orderNo)
        .single();

      if (data) {
        setOrder(data as OrderDetail);
        // 如果還是 unpaid 且未超過嘗試次數，繼續輪詢
        if (data.payment_status === 'unpaid' && attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchOrder, 3000);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNo]);

  if (loading) {
    return (
      <div className="bg-[#0f172a] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-400 text-lg">正在確認付款狀態...</p>
        </div>
      </div>
    );
  }

  if (!orderNo || !order) {
    return (
      <div className="bg-[#0f172a] min-h-screen text-white py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <XCircle size={64} className="text-red-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">找不到訂單</h1>
          <p className="text-gray-400 mb-8">請確認您的訂單編號是否正確</p>
          <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors">
            回首頁
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.payment_status === 'paid';
  const isFailed = order.payment_status === 'failed';
  const isPending = order.payment_status === 'unpaid';

  return (
    <div className="bg-[#0f172a] min-h-screen text-white py-16">
      <div className="max-w-2xl mx-auto px-6">
        {/* 狀態圖示 */}
        <div className="text-center mb-10">
          {isPaid && (
            <>
              <CheckCircle2 size={72} className="text-emerald-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-2">付款成功</h1>
              <p className="text-gray-400">感謝您的購買！訂單已成立。</p>
            </>
          )}
          {isPending && (
            <>
              <Clock size={72} className="text-yellow-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-2">等待付款</h1>
              <p className="text-gray-400">
                {order.payment_method === 'ATM'
                  ? '請於期限內完成 ATM 轉帳付款'
                  : order.payment_method === 'CVS'
                    ? '請於期限內至超商繳費'
                    : '付款處理中，請稍候...'}
              </p>
            </>
          )}
          {isFailed && (
            <>
              <XCircle size={72} className="text-red-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-2">付款失敗</h1>
              <p className="text-gray-400">付款未成功，請重新嘗試或選擇其他付款方式。</p>
            </>
          )}
        </div>

        {/* 訂單資訊 */}
        <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-8 mb-6">
          <h2 className="text-xl font-bold mb-6">訂單資訊</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">訂單編號</span>
              <span className="font-mono font-bold">{order.order_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">訂購日期</span>
              <span>{new Date(order.created_at).toLocaleString('zh-TW')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">付款方式</span>
              <span>
                {order.payment_method === 'Credit' && '信用卡'}
                {order.payment_method === 'ATM' && 'ATM 轉帳'}
                {order.payment_method === 'CVS' && '超商代碼'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">電子郵件</span>
              <span>{order.email}</span>
            </div>
          </div>
        </div>

        {/* 訂單商品 */}
        <div className="bg-[#1e293b] rounded-2xl border border-gray-800 p-8 mb-6">
          <h2 className="text-xl font-bold mb-6">訂購商品</h2>
          <div className="space-y-4">
            {order.order_items.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
                  <Package size={20} />
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
            <div className="text-lg font-bold">
              總計：<span className="text-yellow-500">NT${order.total}</span>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-2 bg-[#1e293b] border border-gray-700 hover:border-gray-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            查詢訂單
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            繼續購物
          </Link>
        </div>
      </div>
    </div>
  );
}
