import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api.js';
import toastService from '../../utils/toast';
import ImageUpload from '../../components/ImageUpload';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
  category: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Track new files to upload and existing images separately
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    isActive: true,
  });

  // Track if we're editing to preserve existing images
  const isEditingRef = useRef(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const result = await api.admin.products.list({ search: searchTerm || undefined });
      setProducts((result as any).data?.products || []);
    } catch (error) {
      toastService.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loadingToast = toastService.loading(
      newFiles.length > 0
        ? 'Uploading images...'
        : (editingProduct ? 'Updating product...' : 'Creating product...')
    );

    try {
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        setIsUploadingImages(true);
        toastService.dismiss(loadingToast);
        toastService.loading('Uploading images...');

        const formData = new FormData();
        newFiles.forEach((file) => formData.append('images', file));
        const uploadResult = await api.admin.products.upload(formData);
        uploadedUrls = uploadResult.data.urls;
        setIsUploadingImages(false);
      }

      const allImages = [...existingImages, ...uploadedUrls];

      toastService.dismiss(loadingToast);
      const action = editingProduct ? 'Updating' : 'Creating';
      toastService.loading(`${action} product...`);

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        images: allImages,
        isActive: formData.isActive,
      };

      if (editingProduct) {
        await api.admin.products.update(editingProduct.id, payload);
      } else {
        await api.admin.products.create(payload);
      }

      toastService.dismiss(loadingToast);
      toastService.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      
      fetchProducts();
      setIsCreating(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const loadingToast = toastService.loading('Deleting product...');

    try {
      await api.admin.products.delete(id);
      toastService.dismiss(loadingToast);
      toastService.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toastService.dismiss(loadingToast);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete product';
      if (errorMsg.includes('restrict') || errorMsg.includes('orders')) {
        toastService.error('Cannot delete product that has orders');
      } else {
        toastService.error('Failed to delete product');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      isActive: product.isActive,
    });
    setExistingImages(product.images);
    setNewFiles([]);
    setEditingProduct(product);
    isEditingRef.current = true;
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      isActive: true,
    });
    setExistingImages([]);
    setNewFiles([]);
    isEditingRef.current = false;
  };

  const handleNewFilesChange = (files: File[]) => {
    setNewFiles(files);
  };

  const handleExistingImagesChange = (images: string[]) => {
    setExistingImages(images);
  };

  const formatCurrency = (amount: any) => {
    const num = Number(amount);
    return `₹${isNaN(num) ? '0.00' : num.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1">Create and manage products</p>
            </div>
            <div className="flex gap-4">
              <Link to="/admin" className="text-pink-600 hover:text-pink-700 font-medium">
                Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  if (isCreating) {
                    setIsCreating(false);
                    setEditingProduct(null);
                    resetForm();
                  } else {
                    setIsCreating(true);
                    resetForm();
                  }
                }}
                className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition"
              >
                {isCreating ? 'Cancel' : '+ Add Product'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isUploadingImages}
                  />
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={isUploadingImages}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isUploadingImages}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isUploadingImages}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isUploadingImages}
                  />
                </div>
              </div>

              {/* Image Upload Component */}
              <ImageUpload
                initialImages={existingImages}
                onFilesChange={handleNewFilesChange}
                onExistingImagesChange={handleExistingImagesChange}
                maxImages={5}
                multiple={true}
                isUploading={isUploadingImages}
                disabled={isUploadingImages}
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  disabled={isUploadingImages}
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (visible on store)
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isUploadingImages}
                  className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImages 
                    ? 'Uploading...' 
                    : (editingProduct ? 'Update' : 'Create') + ' Product'
                  }
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  disabled={isUploadingImages}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <button
              onClick={fetchProducts}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock} in stock
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-pink-600 hover:text-pink-700 font-medium mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminRoute>
      <AdminProducts />
    </AdminRoute>
  );
}
