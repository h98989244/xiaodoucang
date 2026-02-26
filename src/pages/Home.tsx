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
        <Link to="/products" className="block">
          <img
            src="/img/test.png"
            alt="小豆倉點卡商城 - 全網最全！熱門遊戲點數大集合"
            className="w-full rounded-[2rem] object-cover shadow-lg hover:shadow-xl transition-shadow"
          />
        </Link>
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
