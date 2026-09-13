import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import Message from '../components/Message';

export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/pages/${slug}`);
        setPage(data);
        document.title = `${data.metaTitle || data.title} — Lupe & Luxe`;
      } catch {
        setError('This page is unavailable right now.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) return <Loader text="Loading page..." />;
  if (error) {
    return (
      <div className="container section">
        <Message variant="danger">{error}</Message>
        <Link to="/" className="btn btn-outline" style={{ marginTop: '1rem' }}>
          Back home
        </Link>
      </div>
    );
  }
  if (!page) return null;

  return (
    <article className="cms-page">
      <p className="eyebrow">Lupe & Luxe</p>
      <h1 className="page-title">{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
      <div className="section-actions">
        <Link to="/products" className="btn btn-outline">
          Continue shopping
        </Link>
      </div>
    </article>
  );
}
