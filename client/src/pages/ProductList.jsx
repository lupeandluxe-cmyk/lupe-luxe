import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import Message from '../components/Message';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(keyword);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = { page };
        if (keyword) params.keyword = keyword;
        if (category) params.category = category;
        const { data } = await api.get('/products', { params });
        setProducts(data.products);
        setPages(data.pages);
        setTotal(data.count);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [keyword, category, page]);

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data));
  }, []);

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.delete('page');
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ keyword: searchInput });
  };

  if (loading && products.length === 0) return <Loader />;

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="container">
          <div className="shop-header-content">
            <div>
              <h1 className="shop-title">
                {category ? category : keyword ? `"${keyword}"` : 'All Products'}
              </h1>
              <p className="shop-count">{total} {total === 1 ? 'product' : 'products'}</p>
            </div>
            <button className="btn btn-outline filter-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="container shop-layout">
        <aside className={`shop-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-section">
            <h3 className="sidebar-title">Search</h3>
            <form onSubmit={handleSearch} className="search-box">
              <input type="text" placeholder="Search..." className="search-input" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              <button type="submit" className="search-submit" aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
            </form>
          </div>
          <div className="sidebar-section">
            <h3 className="sidebar-title">Categories</h3>
            <ul className="sidebar-list">
              <li>
                <button className={`sidebar-btn ${!category ? 'active' : ''}`} onClick={() => { updateParams({ category: '' }); setSidebarOpen(false); }}>
                  All Products
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat}>
                  <button className={`sidebar-btn ${category === cat ? 'active' : ''}`} onClick={() => { updateParams({ category: cat }); setSidebarOpen(false); }}>
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        </aside>

        <main className="shop-main">
          {error && <Message variant="danger">{error}</Message>}

          {loading ? (
            <div className="products-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="product-card-skeleton">
                  <div className="skeleton-image" />
                  <div className="skeleton-line skeleton-line-short" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line skeleton-line-medium" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏴‍☠️</span>
              <h3>No products found</h3>
              <p>Try a different search or category.</p>
              <Link to="/products" className="btn btn-outline">Clear Filters</Link>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((p, i) => (
                  <ProductCard key={p._id} product={p} index={i} />
                ))}
              </div>

              {pages > 1 && (
                <div className="pagination">
                  <button className="page-btn" disabled={page <= 1} onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', page - 1); setSearchParams(p); }}>
                    ← Prev
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => { const params = new URLSearchParams(searchParams); params.set('page', p); setSearchParams(params); }}>
                      {p}
                    </button>
                  ))}
                  <button className="page-btn" disabled={page >= pages} onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', page + 1); setSearchParams(p); }}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
