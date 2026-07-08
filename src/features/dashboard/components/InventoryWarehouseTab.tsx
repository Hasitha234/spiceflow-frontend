import React, { useState } from 'react';
import { Row, Col, Card, Table, Tag, Modal, message, Button } from 'antd';
import { InboxOutlined, AlertOutlined, SyncOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { KpiStatCard as KpiCard } from '@/components/common';
import type { InventoryDashboardData, LowStockItem, RecentMovement, WarehouseStock } from '../types';
import { inventoryItemApi } from '../../../api/inventory';
import type { InventoryItem } from '../../../types/inventory';

interface InventoryWarehouseTabProps {
  data?: InventoryDashboardData;
}

export const InventoryWarehouseTab: React.FC<InventoryWarehouseTabProps> = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [warehouseItems, setWarehouseItems] = useState<InventoryItem[]>([]);
  const [selectedWarehouseName, setSelectedWarehouseName] = useState<string>('');

  const formatCurr = (val?: number) =>
    val != null ? new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val) : 'LKR 0.00';

  const handleWarehouseClick = async (ws: WarehouseStock) => {
    setSelectedWarehouseName(ws.warehouseName);
    setIsModalOpen(true);
    setLoadingItems(true);
    try {
      const res = await inventoryItemApi.list({ warehouseId: ws.warehouseId.toString(), size: 100 });
      setWarehouseItems(res.content || []);
    } catch {
      message.error('Failed to load warehouse inventory');
    } finally {
      setLoadingItems(false);
    }
  };

  const renderStockBreakdown = (record: InventoryItem) => {
    const qty = record.quantityAvailable || 0;
    const itemsPerBundle = record.itemsPerSoldUnit || 0;
    const bundlesPerBox = record.soldUnitsPerBox || 0;

    if (itemsPerBundle <= 0 && bundlesPerBox <= 0) {
      return <span style={{ color: '#64748b' }}>{qty} {record.unitOfMeasure || 'PCS'}</span>;
    }

    const effectiveBundleSize = itemsPerBundle > 0 ? itemsPerBundle : 1;
    const effectiveBoxSize = bundlesPerBox > 0 ? bundlesPerBox * effectiveBundleSize : 0;

    let boxes = 0;
    let bundles = 0;
    let pieces = qty;

    if (effectiveBoxSize > 0) {
      boxes = Math.floor(qty / effectiveBoxSize);
      pieces = qty % effectiveBoxSize;
    }

    if (effectiveBundleSize > 1) {
      bundles = Math.floor(pieces / effectiveBundleSize);
      pieces = pieces % effectiveBundleSize;
    }

    const parts = [];
    if (boxes > 0) parts.push(<span key="box" className="font-semibold text-blue-600">{boxes} Box{boxes > 1 ? 'es' : ''}</span>);
    if (bundles > 0) parts.push(<span key="bundle" className="font-semibold text-purple-600">{bundles} Bundle{bundles > 1 ? 's' : ''}</span>);
    if (pieces > 0 || parts.length === 0) parts.push(<span key="pcs" className="text-gray-600">{pieces} {record.unitOfMeasure || 'PCS'}</span>);

    return (
      <div className="flex items-center gap-2">
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-gray-300">|</span>}
            {p}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const lowStockColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (t: string) => <Tag color="red">{t}</Tag> },
    { title: 'Product Name', dataIndex: 'name', key: 'name', render: (t: string) => <strong>{t}</strong> },
    {
      title: 'Available Qty',
      dataIndex: 'quantityAvailable',
      key: 'quantityAvailable',
      align: 'right' as const,
      render: (q: number, r: LowStockItem) => (
        <span style={{ color: q <= 5 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
          {q} {r.unitOfMeasure}
        </span>
      ),
    },
    {
      title: 'Base Price',
      dataIndex: 'basePrice',
      key: 'basePrice',
      align: 'right' as const,
      render: (v: number) => formatCurr(v),
    },
  ];

  const movementColumns = [
    {
      title: 'Type',
      dataIndex: 'movementType',
      key: 'movementType',
      render: (t: string) => {
        const colors: Record<string, string> = {
          RECEIPT: 'green',
          DISPATCH: 'blue',
          TRANSFER: 'cyan',
          ADJUSTMENT: 'orange',
        };
        return <Tag color={colors[t] || 'default'}>{t}</Tag>;
      },
    },
    { title: 'Product', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (q: number, r: RecentMovement) => (
        <strong style={{ color: r.movementType === 'RECEIPT' ? '#34d399' : '#e6edf3' }}>
          {r.movementType === 'RECEIPT' ? `+${q}` : q}
        </strong>
      ),
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      align: 'right' as const,
      render: (v: number) => formatCurr(v),
    },
    { title: 'Ref #', dataIndex: 'referenceId', key: 'referenceId', render: (r: string) => <code>{r}</code> },
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
    { title: 'Operator', dataIndex: 'performedBy', key: 'performedBy' },
  ];

  return (
    <div className="inventory-warehouse-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Total Stock Value"
            value={formatCurr(data?.totalStockValue)}
            icon={<InboxOutlined />}
            iconColorClass="icon-emerald"
            badgeText="Valuation"
            badgeType="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Total SKUs"
            value={data?.totalItemsCount || 0}
            icon={<CheckCircleOutlined />}
            iconColorClass="icon-blue"
            badgeText="Active Catalog"
            badgeType="neutral"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Low Stock Alerts"
            value={data?.lowStockCount || 0}
            icon={<AlertOutlined />}
            iconColorClass="icon-rose"
            badgeText="Action Needed"
            badgeType={(data?.lowStockCount || 0) > 0 ? 'down' : 'up'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Pending Transfers"
            value={data?.pendingTransfersCount || 0}
            icon={<SyncOutlined />}
            iconColorClass="icon-amber"
            badgeText="In Transit"
            badgeType="neutral"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Warehouse Overview</span>
          </div>
          <Row gutter={[16, 16]}>
            {data?.warehouseStocks?.map(ws => (
              <Col xs={24} sm={12} md={8} xl={6} key={ws.warehouseId}>
                <Card 
                  className="dashboard-panel transition-all hover:scale-[1.02] cursor-pointer" 
                  style={{ marginBottom: 0, border: '1px solid #e2e8f0' }} 
                  size="small" 
                  bordered={false}
                  hoverable
                  onClick={() => handleWarehouseClick(ws)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{ws.warehouseName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{ws.location || 'Primary Location'}</div>
                    </div>
                    <Tag color="green">{ws.itemCount} SKUs</Tag>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Stock Value</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F9D6C', lineHeight: 1 }}>{formatCurr(ws.totalValue)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <EyeOutlined /> View Inventory
                    </span>
                  </div>
                </Card>
              </Col>
            ))}
            {(!data?.warehouseStocks || data.warehouseStocks.length === 0) && (
              <Col span={24}>
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                  No warehouse stock data available.
                </div>
              </Col>
            )}
          </Row>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card className="dashboard-panel dashboard-table" title="Low Stock Alerts (Restock Required)" bordered={false}>
            <Table<LowStockItem>
              dataSource={data?.lowStockItems || []}
              columns={lowStockColumns}
              rowKey="productId"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card className="dashboard-panel dashboard-table" title="Recent Stock Movements Ledger" variant="borderless">
            <Table<RecentMovement>
              dataSource={data?.recentMovements || []}
              columns={movementColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
            <InboxOutlined className="text-emerald-500" />
            <span>{selectedWarehouseName} Inventory</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        ]}
      >
        <Table<InventoryItem>
          dataSource={warehouseItems}
          loading={loadingItems}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'SKU',
              key: 'sku',
              render: (_: any, record: InventoryItem) => <span className="font-mono font-medium">{record.productSku || '—'}</span>
            },
            {
              title: 'Product Name',
              key: 'name',
              render: (_: any, record: InventoryItem) => <span className="font-semibold">{record.productName || '—'}</span>
            },
            {
              title: 'Category',
              key: 'category',
              render: (_: any, record: InventoryItem) => <Tag color="blue">{record.productCategoryName || 'N/A'}</Tag>
            },
            {
              title: 'Available Qty',
              dataIndex: 'quantityAvailable',
              key: 'quantityAvailable',
              align: 'right' as const,
              render: (val: number, record: InventoryItem) => (
                <span style={{ fontWeight: 600, color: val <= 5 ? '#ef4444' : '#10b981' }}>
                  {val} {record.unitOfMeasure || 'PCS'}
                </span>
              )
            },
            {
              title: 'Stock Breakdown',
              key: 'breakdown',
              render: (_: any, record: InventoryItem) => renderStockBreakdown(record)
            },
            {
              title: 'Unit Value',
              key: 'unitValue',
              align: 'right' as const,
              render: (_: any, record: InventoryItem) => formatCurr(record.productBasePrice)
            },
            {
              title: 'Total Value',
              key: 'totalValue',
              align: 'right' as const,
              render: (_: any, record: InventoryItem) => (
                <span className="font-mono text-emerald-600 font-semibold">
                  {formatCurr((record.productBasePrice || 0) * (record.quantityAvailable || 0))}
                </span>
              )
            }
          ]}
        />
      </Modal>
    </div>
  );
};
