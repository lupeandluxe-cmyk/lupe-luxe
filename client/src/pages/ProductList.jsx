import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

  if (loading) return <Loader />;

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <div className="container">
          <h1 className="shop-title">
            {category || keyword ? (
              <>
                {category && <span className="shop-filter-label">{category}</span>}
                {keyword && <span className="shop-filter-label">"{keyword}"</span>}
                <span className="shop-count">{total} items</span>
              </>
            ) : (
              'All Treasures'
            )}
          </h1>
        </div>
      </div>

      <div className="container shop-layout">
        <aside className="shop-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Categories</h3>
            <ul className="sidebar-list">
              <li>
                <button
                  className={`sidebar-btn ${!category ? 'active' : ''}`}
                  onClick={() => updateParams({ category: '' })}
                >
                  All Items
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    className={`sidebar-btn ${category === cat ? 'active' : ''}`}
                    onClick={() => updateParams({ category: cat })}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Search</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="Find your treasure..."
                className="search-input"
                defaultValue={keyword}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateParams({ keyword: e.target.value });
                }}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
        </aside>

        <main className="shop-main">
          {error && <Message variant="danger">{error}</Message>}

          {products.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏴‍☠️</span>
              <h3>No treasure found</h3>
              <p>Try a different search or category.</p>
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
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', p);
                        setSearchParams(params);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
