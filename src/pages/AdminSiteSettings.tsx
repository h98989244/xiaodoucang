import { useState, useEffect, type FormEvent } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

export default function AdminSiteSettings() {
  const { showToast } = useToast();
  const { refetch } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    site_name: '',
    phone: '',
    address: '',
    tax_id: '',
    email: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) {
        setForm({
          site_name: data.site_name || '',
          phone: data.phone || '',
          address: data.address || '',
          tax_id: data.tax_id || '',
          email: data.email || '',
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: 1, ...form });
    setSaving(false);
    if (error) {
      showToast('儲存失敗', 'error');
    } else {
      showToast('設定已儲存');
      await refetch();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">網站設定</h1>

          {loading ? (
            <div className="text-center py-20 text-gray-500">載入中...</div>
          ) : (
            <form onSubmit={handleSave} className="bg-[#1e293b] rounded-2xl border border-gray-800 p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">網站名稱</label>
                <input
                  type="text"
                  value={form.site_name}
                  onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">電話</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">地址</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">統一編號</label>
                <input
                  type="text"
                  value={form.tax_id}
                  onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">客服信箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? '儲存中...' : '儲存設定'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
