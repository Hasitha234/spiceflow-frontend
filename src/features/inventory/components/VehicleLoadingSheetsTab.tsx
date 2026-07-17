import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Spin, Typography, Space, Empty } from 'antd';
import { CarOutlined, DollarOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { loadingSheetApi } from '../../../api/sales';
import type { LoadingSheet } from '../../../types/sales';
import type { Warehouse } from '../../../types/inventory';
import { UnloadToShopModal } from './UnloadToShopModal';
import { CancelOrderModal } from './CancelOrderModal';

const { Text } = Typography;

interface VehicleLoadingSheetsTabProps {
  warehouse: Warehouse;
}

export const VehicleLoadingSheetsTab: React.FC<VehicleLoadingSheetsTabProps> = ({ warehouse }) => {
  const [sheets, setSheets] = useState<LoadingSheet[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [unloadModalVisible, setUnloadModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<LoadingSheet | null>(null);

  const fetchLoadingSheets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadingSheetApi.list({ size: 200 });
      const list = res?.content || [];

      // Filter sheets belonging to this vehicle/driver name matching
      // e.g., warehouse name is "Vehicle - Hasitha" or driver assigned to it
      const filtered = list.filter((s) => {
        const dName = s.driverName || s.driver?.name || '';
        const whName = warehouse.name || '';
        return (
          whName.toLowerCase() === `vehicle - ${dName}`.toLowerCase() ||
          whName.toLowerCase().includes(dName.toLowerCase()) ||
          (warehouse.storeType === 'VEHICLE' && s.status === 'CONFIRMED')
        );
      });

      // Sort with newest first
      filtered.sort((a, b) => Number(b.id) - Number(a.id));
      setSheets(filtered);
    } catch (error) {
      console.error('Failed to load loading sheets for vehicle:', error);
    } finally {
      setLoading(false);
    }
  }, [warehouse]);

  useEffect(() => {
    fetchLoadingSheets();
  }, [fetchLoadingSheets]);

  const handleOpenUnload = (sheet: LoadingSheet) => {
    setSelectedSheet(sheet);
    setUnloadModalVisible(true);
  };

  const handleOpenCancel = (sheet: LoadingSheet) => {
    setSelectedSheet(sheet);
    setCancelModalVisible(true);
  };

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800 m-0 flex items-center gap-2">
            <CarOutlined className="text-emerald-600" />
            Loading Sheets Assigned to Vehicle: {warehouse.name}
          </h3>
          <span className="text-xs text-slate-500">
            Confirm stock delivery at shops and collect payments (Cash/Cheque/Loan), or cancel/unload order.
          </span>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchLoadingSheets} size="small">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spin />
        </div>
      ) : (
        <Table
          dataSource={sheets}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No active or past loading sheets found for this vehicle."  /> }}
          columns={[
            {
              title: 'Sheet #',
              dataIndex: 'id',
              key: 'id',
              width: 90,
              render: (id) => <Text strong>#{id}</Text>,
            },
            {
              title: 'Loading Date',
              dataIndex: 'loadingDate',
              key: 'loadingDate',
              width: 120,
              render: (date) => date || 'N/A',
            },
            {
              title: 'Driver Name',
              key: 'driverName',
              render: (_, r) => <Text>{r.driverName || r.driver?.name || 'N/A'}</Text>,
            },
            {
              title: 'Rep / Order #',
              key: 'repOrder',
              render: (_, r) => {
                const repName = r.repName || r.repOrder?.repName || 'N/A';
                const orderNo = r.repOrder?.orderNumber || `Order #${r.repOrderId || r.repOrder?.id || ''}`;
                return (
                  <div>
                    <Text strong className="block text-slate-800">{repName}</Text>
                    <span className="text-xs text-slate-500">{orderNo}</span>
                  </div>
                );
              },
            },
            {
              title: 'Loaded Items Count',
              key: 'itemsCount',
              width: 150,
              render: (_, r) => (
                <Tag color="cyan">{r.items?.length || 0} Products Loaded</Tag>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              width: 120,
              render: (status) => {
                if (status === 'CONFIRMED') return <Tag color="green">ON ROAD / LOADED</Tag>;
                if (status === 'CANCELLED') return <Tag color="error">CANCELLED & UNLOADED</Tag>;
                return <Tag color="orange">{status}</Tag>;
              },
            },
            {
              title: 'Actions',
              key: 'actions',
              align: 'right',
              render: (_, sheet) => (
                <Space>
                  {sheet.status === 'CONFIRMED' && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<DollarOutlined />}
                      onClick={() => handleOpenUnload(sheet)}
                      className="bg-emerald-600 hover:bg-emerald-700 font-medium"
                    >
                      Unload to Shop
                    </Button>
                  )}
                  {(sheet.status === 'CONFIRMED' || sheet.status === 'DRAFT') && (
                    <Button
                      danger
                      size="small"
                      icon={<StopOutlined />}
                      onClick={() => handleOpenCancel(sheet)}
                    >
                      Cancel Order
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      )}

      {/* Unload to Shop & Payment Modal */}
      <UnloadToShopModal
        visible={unloadModalVisible}
        loadingSheet={selectedSheet}
        onClose={() => setUnloadModalVisible(false)}

      />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        visible={cancelModalVisible}
        loadingSheet={selectedSheet}
        onClose={() => setCancelModalVisible(false)}
        onSuccess={fetchLoadingSheets}
      />
    </div>
  );
};
