import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { ChevronRight, Minus, Plus, CheckCircle2 } from "lucide-react";
import ProductCard from "../components/ProductCard";

interface Variant {
  id: string;
  label: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string;
  description: string;
  status: string;
  variants: Variant[];
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('id', id)
        .single();

      if (data) {
        const p: Product = {
          id: data.id,
          name: data.name,
          category: data.category,
          image_url: data.image_url,
          description: data.description,
          status: data.status,
          variants: (data.product_variants || []).map((v: any) => ({
            id: v.id,
            label: v.label,
            price: v.price,
            stock: v.stock,
          })),
        };
        setProduct(p);
        if (p.variants.length > 0) setSelectedVariant(p.variants[0]);

        // Fetch related products by same category
        const { data: related } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('category', data.category)
          .eq('status', 'active')
          .neq('id', id)
          .limit(4);

        if (related) {
          setRelatedProducts(related.map((r: any) => {
            const variants = r.product_variants || [];
            const minV = variants.length > 0
              ? variants.reduce((min: any, v: any) => v.price < min.price ? v : min, variants[0])
              : null;
            return {
              id: r.id,
              name: r.name,
              image_url: r.image_url,
              min_price: minV?.price ?? 0,
              min_face_value: minV?.label ?? '',
            };
          }));
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;
    await addItem({
      product_id: product.id,
      variant_id: selectedVariant.id,
      product_name: product.name,
      variant_label: selectedVariant.label,
      price: selectedVariant.price,
      quantity,
      image: product.image_url,
    });
    showToast('已加入購物車');
  };

  if (loading) {
    return (
      <div className="bg-[#0f172a] min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#0f172a] min-h-screen flex items-center justify-center text-white">
        <p>商品不存在</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] min-h-screen text-white pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-white transition-colors">首頁</Link>
          <ChevronRight size={16} />
          <Link to="/products" className="hover:text-white transition-colors">商品分類</Link>
          <ChevronRight size={16} />
          <span className="text-gray-200">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {/* Product Image */}
          <div className="bg-[#1e293b] rounded-3xl p-8 flex items-center justify-center border border-gray-800">
            <img
              src={product.image_url || 'https://picsum.photos/seed/placeholder/400/600'}
              alt={product.name}
              className="max-w-full h-auto rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">{product.description}</p>

            {product.variants.length > 0 && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">面額</label>
                <div className="relative">
                  <select
                    className="w-full bg-[#1e293b] border border-gray-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-blue-500 transition-colors"
                    value={selectedVariant?.id || ''}
                    onChange={(e) => {
                      const v = product.variants.find(v => v.id === e.target.value);
                      if (v) setSelectedVariant(v);
                    }}
                  >
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id}>{v.label} — NT${v.price}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            )}

            {selectedVariant && (
              <div className="mb-8">
                <div className="text-5xl font-bold text-pink-500 mb-2">
                  NT${selectedVariant.price}
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 size={16} />
                  {selectedVariant.stock > 0 ? '現貨供應' : '暫時缺貨'}
                </div>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">數量</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden">
                  <button
                    className="px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    className="w-16 bg-transparent text-center text-white font-medium focus:outline-none"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                  />
                  <button
                    className="px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock <= 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  加入購物車
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-8">相關商品</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  faceValue={p.min_face_value}
                  price={p.min_price}
                  image={p.image_url}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
