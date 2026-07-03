import { Card, Col, Row, Statistic } from 'antd';
import { useTranslation } from 'react-i18next';

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title={t('dashboard.todaySales')} value={128450} precision={2} prefix="$" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title={t('dashboard.todayCollection')} value={95420} precision={2} prefix="$" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title={t('dashboard.pendingDeliveries')} value={8} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title={t('dashboard.lowStock')} value={12} />
          </Card>
        </Col>
      </Row>
      <Card title={t('dashboard.recentOrders')} style={{ marginBottom: 16 }}>
        <p>Recent orders and shipment status will appear here.</p>
      </Card>
      <Card title={t('dashboard.stockStatus')}>
        <p>Stock status cards and low-stock warnings appear here.</p>
      </Card>
    </>
  );
}
