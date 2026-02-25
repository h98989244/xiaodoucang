import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signUp(email, password, name);
    setSubmitting(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('註冊成功！請查收驗證郵件。');
      navigate('/login');
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl text-gray-800">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-lg font-bold">e</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">會員註冊</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入電子郵件"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入密碼（至少6位）"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? '註冊中...' : '註冊'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            已有帳號？{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              前往登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
