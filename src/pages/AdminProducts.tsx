import { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import ImageUploader from "../components/ImageUploader";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";

interface Variant {
  id?: string;
  label: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  status: string;
  product_variants: Variant[];
}

const emptyProduct = {
  name: '',
  category: '',
  description: '',
  image_url: '',
  status: 'active',
};

export default function AdminProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [variants, setVariants] = useState<Variant[]>([{ label: '', price: 0, stock: 0 }]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    supabase.from('categories').select('name').then(({ data }) => {
      if (data) setCategories(data.map(c => c.name));
    });
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setVariants([{ label: '', price: 0, stock: 0 }]);
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description,
      image_url: p.image_url,
      status: p.status,
    });
    setVariants(p.product_variants.length > 0
      ? p.product_variants.map(v => ({ id: v.id, label: v.label, price: v.price, stock: v.stock }))
      : [{ label: '', price: 0, stock: 0 }]
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('請輸入商品名稱', 'error'); return; }
    setSaving(true);

    if (editingId) {
      // Update product
      await supabase.from('products').update({
        name: form.name,
        category: form.category,
        description: form.description,
        image_url: form.image_url,
        status: form.status,
      }).eq('id', editingId);

      // Delete old variants, re-insert
      await supabase.from('product_variants').delete().eq('product_id', editingId);
      const validVariants = variants.filter(v => v.label.trim());
      if (validVariants.length > 0) {
        await supabase.from('product_variants').insert(
          validVariants.map(v => ({ product_id: editingId, label: v.label, price: v.price, stock: v.stock }))
        );
      }
      showToast('商品已更新');
    } else {
      // Insert new product
      const { data: newProduct } = await supabase.from('products').insert({
        name: form.name,
        category: form.category,
        description: form.description,
        image_url: form.image_url,
        status: form.status,
      }).select().single();

      if (newProduct) {
        const validVariants = variants.filter(v => v.label.trim());
        if (validVariants.length > 0) {
          await supabase.from('product_variants').insert(
            validVariants.map(v => ({ product_id: newProduct.id, label: v.label, price: v.price, stock: v.stock }))
          );
        }
      }
      showToast('商品已新增');
    }

    setSaving(false);
    setIsModalOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此商品？')) return;
    await supabase.from('product_variants').delete().eq('product_id', id);
    await supabase.from('products').delete().eq('id', id);
    showToast('商品已刪除');
    fetchProducts();
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'inactive' : 'active';
    await supabase.from('products').update({ status: newStatus }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const addVariantRow = () => setVariants(prev => [...prev, { label: '', price: 0, stock: 0 }]);
  const removeVariantRow = (idx: number) => setVariants(prev => prev.filter((_, i) => i !== idx));
  const updateVariant = (idx: number, field: keyof Variant, value: string | number) => {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">商品管理</h1>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              新增商品
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">載入中...</div>
          ) : (
            <div className="bg-[#1e293b] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="p-4 font-medium">縮圖</th>
                      <th className="p-4 font-medium">商品名稱</th>
                      <th className="p-4 font-medium">分類</th>
                      <th className="p-4 font-medium">面額/售價</th>
                      <th className="p-4 font-medium">狀態</th>
                      <th className="p-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="p-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-900">
                            <img src={product.image_url || 'https://picsum.photos/seed/placeholder/100/100'} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        </td>
                        <td className="p-4 font-medium">{product.name}</td>
                        <td className="p-4 text-gray-400">{product.category}</td>
                        <td className="p-4 text-gray-400 text-sm">
                          {product.product_variants.map(v => (
                            <div key={v.id || v.label}>{v.label}: NT${v.price}</div>
                          ))}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleStatus(product.id, product.status)}
                            className="flex flex-col items-center gap-1"
                          >
                            <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${product.status === 'active' ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-200 ${product.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-xs text-gray-400">{product.status === 'active' ? '上架' : '下架'}</span>
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => openEdit(product)} className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-400/10 rounded-lg">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-400/10 rounded-lg">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <div className="p-12 text-center text-gray-500">目前沒有商品</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-gray-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold">{editingId ? '編輯商品' : '新增商品'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <ImageUploader onUpload={(url) => setForm(f => ({ ...f, image_url: url }))} currentUrl={form.image_url} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">商品名稱</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分類</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="">請選擇</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">上架狀態</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: f.status === 'active' ? 'inactive' : 'active' }))}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 relative ${form.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${form.status === 'active' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                    <span className="text-sm font-medium text-gray-700">{form.status === 'active' ? '已上架' : '已下架'}</span>
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">面額/售價/庫存</label>
                  <button type="button" onClick={addVariantRow} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    + 新增面額
                  </button>
                </div>
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="面額標籤"
                        value={v.label}
                        onChange={e => updateVariant(idx, 'label', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="售價"
                        value={v.price || ''}
                        onChange={e => updateVariant(idx, 'price', Number(e.target.value))}
                        className="w-24 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="庫存"
                        value={v.stock || ''}
                        onChange={e => updateVariant(idx, 'stock', Number(e.target.value))}
                        className="w-24 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {variants.length > 1 && (
                        <button type="button" onClick={() => removeVariantRow(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品描述</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-4 bg-gray-50">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                取消
              </button>
              <button onClick={handleSave} disabled={saving} className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50">
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
