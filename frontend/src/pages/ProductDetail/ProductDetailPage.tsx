import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  async function fetchProduct(productId: string) {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!product) return;
    
    await addItem({
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      image: product.images[0],
    });
  }

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link to="/" className="btn-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="text-primary-500 hover:text-primary-600 mb-4 inline-block">
        ← Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
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
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image, idx) => (
                <div key={idx} className="aspect-square bg-gray-100 rounded overflow-hidden">
                  <img
                    src={image}
                    alt={`${product.name} ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          {product.category && (
            <p className="text-sm text-gray-500 mb-4">{product.category}</p>
          )}
          
          <div className="text-3xl font-bold text-primary-600 mb-6">
            {formatPrice(product.price)}
          </div>

          <p className="text-gray-700 mb-6">{product.description}</p>

          {/* Stock Status */}
          <div className={`mb-6 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
          </div>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`btn-primary w-full py-3 text-lg ${
              product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* Additional Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">SKU</dt>
                <dd className="font-medium text-gray-900">{product.sku || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Shipping</dt>
                <dd className="font-medium text-gray-900">Free via WhatsApp delivery</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
