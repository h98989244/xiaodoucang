import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";
import { ChevronDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string;
  min_price: number;
  min_face_value: string;
}

const PAGE_SIZE = 12;

export default function ProductList() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch categories that have active products
  useEffect(() => {
    (async () => {
      // Get distinct categories from active products
      const { data: activeProducts } = await supabase
        .from('products')
        .select('category')
        .eq('status', 'active');

      const activeCategories = new Set(activeProducts?.map(p => p.category).filter(Boolean));

      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) {
        setCategories(data.filter(c => activeCategories.has(c.name)));
      }
    })();
  }, []);

  // Fetch products
  useEffect(() => {
    setPage(0);
    setProducts([]);
    setHasMore(true);
    fetchProducts(0, true);
  }, [activeCategory, sortOrder]);

  const fetchProducts = async (pageNum: number, reset = false) => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('status', 'active');

    if (activeCategory) {
      query = query.eq('category', activeCategory);
    }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data } = await query;

    if (data) {
      const mapped = data.map((p: any) => {
        const variants = p.product_variants || [];
        const minVariant = variants.length > 0
          ? variants.reduce((min: any, v: any) => v.price < min.price ? v : min, variants[0])
          : null;
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          image_url: p.image_url,
          min_price: minVariant?.price ?? 0,
          min_face_value: minVariant?.label ?? '',
        };
      });

      // Sort client-side
      mapped.sort((a: Product, b: Product) =>
        sortOrder === 'asc' ? a.min_price - b.min_price : b.min_price - a.min_price
      );

      if (reset) {
        setProducts(mapped);
      } else {
        setProducts(prev => [...prev, ...mapped]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next);
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1e293b] p-6 border-r border-gray-800 md:min-h-screen sticky top-16 md:top-20 z-40">
        <h2 className="text-xl font-bold mb-6 text-gray-200">商品分類</h2>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                activeCategory === null
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              全部商品
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => setActiveCategory(category.name)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                  activeCategory === category.name
                    ? "bg-blue-600 text-white font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <div className="w-6 h-6 bg-gray-700 rounded-md flex-shrink-0"></div>
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">{activeCategory || "全部商品"}</h1>

            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 bg-[#1e293b] border border-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                排序方式: {sortOrder === "asc" ? "價格從低到高" : "價格從高到低"}
                <ChevronDown size={16} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1e293b] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setSortOrder("asc"); setIsSortOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${sortOrder === "asc" ? "bg-blue-600/20 text-blue-400" : "text-gray-300"}`}
                  >
                    價格從低到高
                  </button>
                  <button
                    onClick={() => { setSortOrder("desc"); setIsSortOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${sortOrder === "desc" ? "bg-blue-600/20 text-blue-400" : "text-gray-300"}`}
                  >
                    價格從高到低
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading && products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">載入中...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    faceValue={product.min_face_value}
                    price={product.min_price}
                    image={product.image_url}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  沒有找到相關商品
                </div>
              )}

              {hasMore && products.length > 0 && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 px-8 py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? '載入中...' : '載入更多'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
