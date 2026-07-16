import { Typography, Card, Statistic, Row, Col } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { adminApi } from '@/api/adminApi';
import type { AdminTenant } from '@/api/adminApi';

const { Title } = Typography;

export function AdminDashboardPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminApi.getTenants({ size: 100 });
        setTenants(res.content);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;
  const suspendedTenants = tenants.filter(t => t.status === 'SUSPENDED').length;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Platform Dashboard</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic 
              title="Total Agencies (Tenants)" 
              value={tenants.length} 
              prefix={<ShopOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic 
              title="Active Agencies" 
              value={activeTenants} 
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic 
              title="Suspended Agencies" 
              value={suspendedTenants} 
              styles={{ content: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
