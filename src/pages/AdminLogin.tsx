import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // If already admin, redirect
  if (isAdmin) {
    navigate('/admin/products', { replace: true });
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      showToast(error, 'error');
      return;
    }

    // Need a small delay for profile fetch to determine admin
    setTimeout(() => {
      navigate('/admin/products');
    }, 500);
  };

  return (
    <div className="bg-[#0f172a] min-h-screen flex items-center justify-center p-6 text-gray-800">
      <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">管理員儀表板登入</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">管理員信箱</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="請輸入您的信箱"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="請輸入您的密碼"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {submitting ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="mt-12 text-center text-xs text-gray-500">
          <p>&copy; 2026 小豆倉點卡商城. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
