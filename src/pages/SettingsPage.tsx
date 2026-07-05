import { Card, Col, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={3}>{t('settings.title')}</Typography.Title>
          <Typography.Paragraph>{t('settings.description') || 'Manage settings modules for products, suppliers, warehouses, reps, drivers, and shops.'}</Typography.Paragraph>
        </Col>
      </Row>

      <Space wrap size="large">
        <Card title={t('product.title')} size="small">
          <Link to="products">{t('product.create')}</Link>
        </Card>
        <Card title={t('category.title')} size="small">
          <Link to="categories">{t('category.create')}</Link>
        </Card>
        <Card title={t('supplier.title')} size="small">
          <Link to="suppliers">{t('supplier.create')}</Link>
        </Card>
        <Card title={t('warehouse.title')} size="small">
          <Link to="warehouses">{t('warehouse.create')}</Link>
        </Card>
        <Card title={t('rep.title')} size="small">
          <Link to="reps">{t('rep.create')}</Link>
        </Card>
        <Card title={t('driver.title')} size="small">
          <Link to="drivers">{t('driver.create')}</Link>
        </Card>
        <Card title={t('shop.title')} size="small">
          <Link to="shops">{t('shop.create')}</Link>
        </Card>
      </Space>
    </div>
  );
}
