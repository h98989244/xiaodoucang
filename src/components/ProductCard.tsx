import type { Key } from "react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  key?: Key;
  id: string;
  name: string;
  faceValue: string;
  price: number;
  image: string;
}

export default function ProductCard({ id, name, faceValue, price, image }: ProductCardProps) {
  return (
    <div className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-colors group flex flex-col h-full">
      <Link to={`/products/${id}`} className="block p-4 flex-grow">
        <div className="aspect-[3/4] relative rounded-xl overflow-hidden mb-4 bg-gray-900">
          <img
            src={image || 'https://picsum.photos/seed/placeholder/400/600'}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>
        <h3 className="text-white font-bold text-lg mb-1 truncate">{name}</h3>
        {faceValue && <p className="text-gray-400 text-sm mb-3">面額：{faceValue}</p>}
        <div className="flex items-baseline gap-1">
          <span className="text-yellow-500 font-bold text-xl">NT${price}</span>
          <span className="text-gray-400 text-xs">起</span>
        </div>
      </Link>
      <div className="p-4 pt-0 mt-auto">
        <Link to={`/products/${id}`} className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors text-center">
          購買
        </Link>
      </div>
    </div>
  );
}
