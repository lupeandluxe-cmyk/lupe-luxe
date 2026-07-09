import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading...</div>;

  const exportCSV = (type) => {
    if (!data) return;
    let csv = 'Type,Value\n';
    if (type === 'sales') csv += `Total Orders,${data.totalOrders}\nTotal Sales,${data.totalSales}\nTotal Customers,${data.totalCustomers}\nTotal Products,${data.totalProducts}\nLow Stock Items,${data.lowStock}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <h1 className="admin-page-title">Reports</h1>
        <div className="btn-group">
          <button className="btn" onClick={() => exportCSV('sales')}>📥 Export CSV</button>
          <button className="btn" onClick={printReport}>🖨️ Print</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Total Orders</span><span className="stat-value">{data?.totalOrders}</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Total Sales</span><span className="stat-value">₹{data?.totalSales?.toFixed(2)}</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Customers</span><span className="stat-value">{data?.totalCustomers}</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Products</span><span className="stat-value">{data?.totalProducts}</span></div></div>
        <div className="stat-card danger"><div className="stat-info"><span className="stat-label">Low Stock Items</span><span className="stat-value">{data?.lowStock}</span></div></div>
      </div>

      {data?.revenueByMonth?.length > 0 && (
        <div className="admin-card">
          <h3>Revenue by Month</h3>
          <table className="admin-table">
            <thead><tr><th>Month</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.revenueByMonth.map((r, i) => (
                <tr key={i}><td>{r._id}</td><td>₹{r.revenue?.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
