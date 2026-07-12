import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';
import ProductCard from '../../components/UI/ProductCard';
import type { ProductListItem as Product } from '@twinkle-hearts/shared';

const CATEGORIES = [
  { key: 'all', label: 'All Cards', emoji: '✨' },
  { key: 'birthday', label: 'Birthday', emoji: '🎂' },
  { key: 'love', label: 'Love', emoji: '💕' },
  { key: 'anniversary', label: 'Anniversary', emoji: '🥂' },
  { key: 'friendship', label: 'Friendship', emoji: '🤝' },
  { key: 'festival', label: 'Festival', emoji: '🎊' },
  { key: 'sympathy', label: 'Sympathy', emoji: '🕊️' },
] as const;

const PRODUCTS_PER_PAGE = 12;

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categoryFromUrl !== activeCategory) {
      setActiveCategory(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts(true);
  }, [activeCategory, debouncedSearch]);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    }
  }, []);

  useEffect(() => {
    if (!gridRef.current || products.length === 0) return;
    const items = gridRef.current.querySelectorAll('.product-grid-item');
    gsap.fromTo(
      items,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.12, ease: 'power3.out' },
    );
  }, [products.length, activeCategory, debouncedSearch, priceMin, priceMax]);

  useEffect(() => {
    if (!filterRef.current) return;
    if (showFilters) {
      gsap.fromTo(filterRef.current, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.25, ease: 'power2.out' });
    } else {
      gsap.to(filterRef.current, { height: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
  }, [showFilters]);

  async function fetchProducts(reset = false) {
    setLoading(true);
    setError(null);
    try {
      const category = activeCategory === 'all' ? undefined : activeCategory;
      const data = await api.products.list({ limit: 100, category, search: debouncedSearch || undefined });
      const fetched = data.products || [];
      setAllProducts(fetched);

      let filtered = fetched;
      if (priceMin) {
        filtered = filtered.filter((p) => p.price >= Number(priceMin));
      }
      if (priceMax) {
        filtered = filtered.filter((p) => p.price <= Number(priceMax));
      }

      const sliced = filtered.slice(0, reset ? PRODUCTS_PER_PAGE : page * PRODUCTS_PER_PAGE);
      setProducts(sliced);
      setHasMore(filtered.length > sliced.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allProducts.length === 0) return;
    let filtered = allProducts;
    if (priceMin) filtered = filtered.filter((p) => p.price >= Number(priceMin));
    if (priceMax) filtered = filtered.filter((p) => p.price <= Number(priceMax));
    const sliced = filtered.slice(0, page * PRODUCTS_PER_PAGE);
    setProducts(sliced);
    setHasMore(filtered.length > sliced.length);
  }, [priceMin, priceMax, page, allProducts]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1);
    if (category === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  const handleAddToCart = useCallback(
    async (product: Product) => {
      await addItem({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        image: product.images[0],
      });
    },
    [addItem]
  );

  const loadMore = () => {
    setPage((p) => p + 1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setPriceMin('');
    setPriceMax('');
    setActiveCategory('all');
    setPage(1);
    setSearchParams({});
  };

  const activeFilterCount =
    (debouncedSearch ? 1 : 0) +
    (activeCategory !== 'all' ? 1 : 0) +
    (priceMin ? 1 : 0) +
    (priceMax ? 1 : 0);

  const getCategoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label || key;

  return (
    <div className="bg-twinkle-canvas min-h-screen">
      <section className="bg-gradient-to-br from-white via-twinkle-canvas to-twinkle-sage/20 border-b border-twinkle-mist/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div ref={headerRef} className="text-center mb-8">
            <h1 className="section-heading">Browse Our Collection</h1>
            <p className="section-subheading mt-2 mx-auto">Find the perfect card for your moment</p>
          </div>

          <div className="max-w-xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-twinkle-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards by name..."
              className="search-input"
              aria-label="Search cards"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-twinkle-mist/40 flex items-center justify-center hover:bg-twinkle-mist/60 transition-colors"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="mt-4 flex justify-center sm:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="category-pill gap-2"
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-twinkle-rose text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-twinkle-mist/50 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`category-pill whitespace-nowrap ${
                    activeCategory === cat.key ? 'category-pill-active' : ''
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="category-pill gap-2 flex-shrink-0"
            >
              <SlidersHorizontal size={14} />
              Price
              {(priceMin || priceMax) && (
                <span className="w-5 h-5 rounded-full bg-twinkle-rose text-white text-[10px] flex items-center justify-center">
                  {1}
                </span>
              )}
            </button>
          </div>

          <div className="sm:hidden flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`category-pill whitespace-nowrap ${
                  activeCategory === cat.key ? 'category-pill-active' : ''
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {showFilters && (
            <div ref={filterRef} className="mt-4 pt-4 border-t border-twinkle-mist/40 overflow-hidden" style={{ height: 0, opacity: 0 }}>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-twinkle-ink/70">Price range (LKR):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="Min"
                    className="w-24 px-3 py-2 border border-twinkle-mist rounded-lg text-sm focus:border-twinkle-rose focus:ring-1 focus:ring-twinkle-rose/15 outline-none"
                    min="0"
                  />
                  <span className="text-twinkle-ink/40">—</span>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="Max"
                    className="w-24 px-3 py-2 border border-twinkle-mist rounded-lg text-sm focus:border-twinkle-rose focus:ring-1 focus:ring-twinkle-rose/15 outline-none"
                    min="0"
                  />
                </div>
                {(priceMin || priceMax) && (
                  <button
                    onClick={() => { setPriceMin(''); setPriceMax(''); }}
                    className="text-xs text-twinkle-rose hover:underline"
                  >
                    Clear price
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {activeFilterCount > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-twinkle-ink/50 font-medium">Active filters:</span>
            {debouncedSearch && (
              <span className="filter-badge">
                Search: "{debouncedSearch}"
                <button onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }} className="filter-badge-remove" aria-label="Remove search filter">
                  <X size={10} />
                </button>
              </span>
            )}
            {activeCategory !== 'all' && (
              <span className="filter-badge">
                {getCategoryLabel(activeCategory)}
                <button onClick={() => handleCategoryChange('all')} className="filter-badge-remove" aria-label="Remove category filter">
                  <X size={10} />
                </button>
              </span>
            )}
            {priceMin && (
              <span className="filter-badge">
                Min: LKR {Number(priceMin).toLocaleString()}
                <button onClick={() => setPriceMin('')} className="filter-badge-remove" aria-label="Remove min price filter">
                  <X size={10} />
                </button>
              </span>
            )}
            {priceMax && (
              <span className="filter-badge">
                Max: LKR {Number(priceMax).toLocaleString()}
                <button onClick={() => setPriceMax('')} className="filter-badge-remove" aria-label="Remove max price filter">
                  <X size={10} />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-twinkle-rose hover:underline font-medium ml-1"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink">
                {activeCategory === 'all' ? 'All Greeting Cards' : `${getCategoryLabel(activeCategory)} Cards`}
              </h2>
              <p className="text-twinkle-ink/60 mt-1 text-sm">
                {products.length} card{products.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="skeleton-card-image" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton-card-line" />
                    <div className="skeleton-card-line-short" />
                    <div className="flex justify-between items-center">
                      <div className="skeleton-card-line w-16 h-6" />
                      <div className="skeleton-card-line w-20 h-8 rounded-pill" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="empty-state-icon mx-auto mb-4">
                <X size={24} />
              </div>
              <p className="text-twinkle-ink/60 mb-4">{error}</p>
              <button onClick={() => fetchProducts(true)} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={24} />
              </div>
              <h3 className="empty-state-title">No cards match your search</h3>
              <p className="empty-state-text">
                Try a different search term, browse by category, or clear your filters.
              </p>
              <button onClick={clearAllFilters} className="btn-primary mt-6">
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div
                ref={gridRef}
                key={`${activeCategory}-${debouncedSearch}-${priceMin}-${priceMax}`}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                {products.map((product) => (
                  <div key={product.id} className="product-grid-item">
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="load-more-btn"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                      </>
                    ) : (
                      'Load More Cards'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}