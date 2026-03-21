import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch('/api/products?limit=20');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data: ProductsResponse = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart(product: Product) {
    await addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      image: product.images[0],
    });
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={fetchProducts} className="btn-primary mt-4">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Beautiful Jewelry for Every Occasion
        </h1>
        <p className="text-lg text-gray-600">
          Handcrafted with love, delivered with care via WhatsApp
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products available</p>
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="card group">
      {/* Product Image */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <Link to={`/product/${product.id}`}>
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
      </Link>
      
      {product.category && (
        <p className="text-sm text-gray-500 mb-2">{product.category}</p>
      )}
      
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary-600">
          {formatPrice(product.price)}
        </span>
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className={`btn-primary text-sm py-1.5 px-3 ${
            product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
