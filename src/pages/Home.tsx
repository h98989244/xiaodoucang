import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";

interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string;
  description: string;
  status: string;
  min_price: number;
  min_face_value: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('status', 'active')
        .limit(8);

      if (data) {
        setProducts(data.map((p: any) => {
          const variants = p.product_variants || [];
          const minVariant = variants.length > 0
            ? variants.reduce((min: any, v: any) => v.price < min.price ? v : min, variants[0])
            : null;
          return {
            id: p.id,
            name: p.name,
            category: p.category,
            image_url: p.image_url,
            description: p.description,
            status: p.status,
            min_price: minVariant?.price ?? 0,
            min_face_value: minVariant?.label ?? '',
          };
        }));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="bg-[#0f172a] min-h-screen text-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-[2rem] p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[400px]">
          <div className="z-10 max-w-lg mb-8 md:mb-0">
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              輕鬆購點<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">就在小豆倉</span>
            </h1>
            <Link to="/products" className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 px-8 rounded-full text-lg transition-transform hover:scale-105 shadow-lg shadow-blue-500/30">
              立即選購
            </Link>
          </div>

          <div className="absolute top-0 right-0 w-1/2 h-full opacity-50 md:opacity-100 pointer-events-none">
            <div className="absolute top-10 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-40 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-center mb-12">
          <h2 className="text-3xl font-bold text-center relative inline-block">
            精選商品
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"></div>
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">載入中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        )}
      </section>
    </div>
  );
}
