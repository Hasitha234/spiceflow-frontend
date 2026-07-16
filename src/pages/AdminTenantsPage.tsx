import { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Tag, Drawer, Form, Input, Select, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '@/api/adminApi';
import type { AdminTenant } from '@/api/adminApi';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export function AdminTenantsPage() {
  const { message, modal } = App.useApp();
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingTenant, setEditingTenant] = useState<AdminTenant | null>(null);
  
  const [form] = Form.useForm();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const [tenantsRes, typesRes] = await Promise.all([
        adminApi.getTenants({ size: 100 }),
        adminApi.getBusinessTypes()
      ]);
      setTenants(tenantsRes.content);
      setBusinessTypes(typesRes);
    } catch (e) {
      message.error('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const openCreate = () => {
    setEditingTenant(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEdit = (tenant: AdminTenant) => {
    setEditingTenant(tenant);
    // Note: GET /tenants does not return businessTypeId, but we might have it if we fetch /tenants/:id or map from the name.
    // The current response interface has businessName and status, but to update we need businessTypeId.
    // Let's just fetch the individual tenant details.
    adminApi.getTenant(tenant.id).then(details => {
      form.setFieldsValue({
        businessName: details.businessName,
        businessTypeId: (details as any).businessTypeId,
        status: details.status,
        plan: (details as any).plan || 'BASIC',
      });
      setDrawerVisible(true);
    }).catch(() => {
      message.error('Failed to load agency details');
    });
  };

  const handleCreateOrUpdate = async (values: any) => {
    try {
      if (editingTenant) {
        await adminApi.updateTenant(editingTenant.id, values);
        message.success('Agency updated successfully');
      } else {
        await adminApi.createTenant(values);
        message.success('Agency created successfully');
      }
      setDrawerVisible(false);
      fetchTenants();
    } catch (e: any) {
      message.error(e.response?.data?.detail || 'Operation failed');
    }
  };

  const toggleStatus = (tenant: AdminTenant) => {
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const action = newStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate';
    
    modal.confirm({
      title: `${action} Agency`,
      content: `Are you sure you want to ${action.toLowerCase()} ${tenant.businessName}?`,
      onOk: async () => {
        try {
          await adminApi.updateTenantStatus(tenant.id, { status: newStatus });
          message.success(`Agency ${action.toLowerCase()}d successfully`);
          fetchTenants();
        } catch (e) {
          message.error('Operation failed');
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteTenant(id);
      message.success('Agency deleted successfully');
      fetchTenants();
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('Failed to delete agency');
    }
  };

  const columns = [
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
    },
    {
      title: 'Contact Email',
      dataIndex: 'contactEmail',
      key: 'contactEmail',
      // In getTenants, the email is sometimes returned directly or as contactEmail. 
      // AdminTenant interface says contactEmail, but backend might return email.
      render: (text: string, record: any) => text || record.email,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'ACTIVE') color = 'green';
        if (status === 'SUSPENDED') color = 'red';
        if (status === 'TRIAL') color = 'gold';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: AdminTenant) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button 
            type="text" 
            danger={record.status === 'ACTIVE'}
            icon={record.status === 'ACTIVE' ? <StopOutlined /> : <CheckCircleOutlined />} 
            onClick={() => toggleStatus(record)} 
          />
          <Popconfirm
            title="Delete the agency"
            description="Are you sure to delete this agency?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={3}>Agencies Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Create Agency
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={tenants} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Drawer
        title={editingTenant ? 'Edit Agency' : 'Create New Agency'}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        size="default"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Form.Item name="businessName" label="Business Name" rules={[{ required: true }]}>
            <Input placeholder="Spice Flow Inc." />
          </Form.Item>

          <Form.Item name="businessTypeId" label="Business Type" rules={[{ required: true }]}>
            <Select placeholder="Select Business Type">
              {businessTypes.map(type => (
                <Option key={type.id} value={type.id}>{type.name}</Option>
              ))}
            </Select>
          </Form.Item>

          {!editingTenant && (
            <>
              <Form.Item name="ownerEmail" label="Owner Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="owner@spiceflow.com" />
              </Form.Item>
              <Form.Item name="ownerPassword" label="Owner Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password placeholder="Min 8 characters" />
              </Form.Item>
            </>
          )}

          {editingTenant && (
            <>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select>
                  <Option value="ACTIVE">Active</Option>
                  <Option value="SUSPENDED">Suspended</Option>
                  <Option value="TRIAL">Trial</Option>
                </Select>
              </Form.Item>
              <Form.Item name="plan" label="Plan" rules={[{ required: true }]}>
                <Select>
                  <Option value="BASIC">Basic</Option>
                  <Option value="PREMIUM">Premium</Option>
                  <Option value="ENTERPRISE">Enterprise</Option>
                </Select>
              </Form.Item>
            </>
          )}

          <Button type="primary" htmlType="submit" block>
            {editingTenant ? 'Update Agency' : 'Create Agency'}
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
