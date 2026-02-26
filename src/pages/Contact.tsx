import { useState, type FormEvent } from "react";
import { MapPin, Phone, Building2, FileText, Mail } from "lucide-react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";

export default function Contact() {
  const { siteName, phone, address, taxId, email: storeEmail } = useSiteSettings();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, email, message });

    setSubmitting(false);
    if (error) {
      showToast('送出失敗，請稍後再試', 'error');
    } else {
      showToast('訊息已送出，我們會盡快回覆您！');
      setName('');
      setEmail('');
      setMessage('');
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-16 relative inline-block left-1/2 -translate-x-1/2">
          聯絡我們
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"></div>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          {/* Store Info */}
          <div className="bg-[#1e293b] p-8 rounded-3xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-8 text-blue-400">商店資訊</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">商店名稱</p>
                  <p className="font-medium text-lg">{siteName}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">電話</p>
                  <p className="font-medium text-lg">{phone}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">信箱</p>
                  <p className="font-medium text-lg">{storeEmail}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">地址</p>
                  <p className="font-medium text-lg">{address}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">統一編號</p>
                  <p className="font-medium text-lg">{taxId}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Form */}
          <div className="bg-[#1e293b] p-8 rounded-3xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-8 text-yellow-500">聯絡表單</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">姓名</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="請輸入您的姓名"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">電子郵件</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="請輸入您的電子郵件"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">訊息</label>
                <textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  placeholder="請輸入您的訊息"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-4 rounded-xl transition-colors shadow-lg shadow-yellow-500/20 disabled:opacity-50"
              >
                {submitting ? '送出中...' : '送出'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
