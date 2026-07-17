import { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Tag, Drawer, Form, Input, Select, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, SafetyCertificateOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '@/api/adminApi';
import type { AdminUser, CreateUserPayload, AdminTenant } from '@/api/adminApi';
import dayjs from 'dayjs';
import { useIsMobile } from '@/hooks/useResponsive';

const { Title, Text } = Typography;
const { Option } = Select;

export function AdminUsersPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [tenantDrawerVisible, setTenantDrawerVisible] = useState(false);
  const [form] = Form.useForm<CreateUserPayload>();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [selectedBusinessOwner, setSelectedBusinessOwner] = useState<AdminUser | null>(null);
  
  const isMobile = useIsMobile();
  const [tenantForm] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [userRes, tenantRes] = await Promise.all([
        adminApi.getUsers({ size: 100 }),
        adminApi.getTenants({ size: 100 })
      ]);
      setUsers(userRes.content);
      setTenants(tenantRes.content);
    } catch (_e) {
      console.error(_e);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateOrUpdate = async (values: CreateUserPayload) => {
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await adminApi.createUser(values);
        message.success('User created successfully');
      }
      setDrawerVisible(false);
      fetchUsers();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Operation failed');
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      name: user.name,
      userType: user.userType as 'TENANT_OWNER' | 'DATA_ENTRY' | 'DRIVER',
      tenantId: user.tenantId,
    });
    setDrawerVisible(true);
  };

  const handleAssignTenant = async (values: { tenantId: number }) => {
    if (!selectedBusinessOwner) return;
    try {
      await adminApi.assignTenant(selectedBusinessOwner.id, values.tenantId);
      message.success('Tenant assigned successfully');
      tenantForm.resetFields();
      fetchUsers();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleRemoveTenant = async (tenantId: number) => {
    if (!selectedBusinessOwner) return;
    try {
      await adminApi.removeTenant(selectedBusinessOwner.id, tenantId);
      message.success('Tenant removed');
      fetchUsers();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Removal failed');
    }
  };

  // Update selectedBusinessOwner when users list changes
  useEffect(() => {
    if (selectedBusinessOwner) {
      const updatedUser = users.find(u => u.id === selectedBusinessOwner.id);
      if (updatedUser) {
        setSelectedBusinessOwner(updatedUser);
      }
    }
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteUser(id);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('Failed to delete user');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: AdminUser) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'userType',
      key: 'userType',
      render: (type: string) => {
        let color = 'default';
        if (type === 'PLATFORM_ADMIN') color = 'purple';
        if (type === 'TENANT_OWNER') color = 'blue';
        if (type === 'DATA_ENTRY') color = 'cyan';
        if (type === 'DRIVER') color = 'orange';
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: 'Agencies / Access',
      key: 'access',
      render: (_: unknown, record: AdminUser) => {
        if (record.userType === 'PLATFORM_ADMIN') return <Text type="secondary">Global</Text>;
        if (record.userType === 'TENANT_OWNER') {
          return (
            <Space orientation="vertical" size={0}>
              {(record.assignedTenants || []).map((t) => (
                <Text key={t.id} style={{ fontSize: '12px' }}>• {t.businessName}</Text>
              ))}
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => {
                setSelectedBusinessOwner(record);
                setTenantDrawerVisible(true);
              }}>
                Manage Agencies
              </Button>
            </Space>
          );
        }
        // For Data Entry and Driver, they belong to a single tenant
        const tenant = tenants.find(t => t.id === record.tenantId);
        return <Text>{tenant?.businessName || 'Unknown Agency'}</Text>;
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
      render: (_: unknown, record: AdminUser) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete the user"
            description="Are you sure to delete this user?"
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
        <Title level={3}>Users Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Create User
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 20 }}
       />

      <Drawer
        title={editingUser ? 'Edit User' : 'Create New User'}
        placement={isMobile ? 'bottom' : 'right'} rootClassName={isMobile ? 'sf-full-height-drawer' : ''}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        size={isMobile ? 'default' : 'default'}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="john@example.com" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password placeholder="Secure password" />
            </Form.Item>
          )}
          <Form.Item name="userType" label="User Role" rules={[{ required: true }]}>
            <Select placeholder="Select role">
              <Option value="TENANT_OWNER">Business Owner</Option>
              <Option value="DATA_ENTRY">Data Entry Operator</Option>
              <Option value="DRIVER">Driver</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.userType !== currentValues.userType}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue('userType');
              if (role === 'DATA_ENTRY' || role === 'DRIVER') {
                return (
                  <Form.Item name="tenantId" label="Assign to Agency" rules={[{ required: true }]}>
                    <Select placeholder="Select an agency">
                      {tenants.map(t => (
                        <Option key={t.id} value={t.id}>{t.businessName}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            {editingUser ? 'Update User' : 'Create User'}
          </Button>
        </Form>
      </Drawer>

      <Drawer
        title={`Agencies for ${selectedBusinessOwner?.name}`}
        placement={isMobile ? 'bottom' : 'right'} rootClassName={isMobile ? 'sf-full-height-drawer' : ''}
        onClose={() => setTenantDrawerVisible(false)}
        open={tenantDrawerVisible}
        size={isMobile ? 'default' : 'default'}
      >
        <div style={{ marginBottom: 24 }}>
          <Text strong>Currently Assigned Agencies</Text>
          <div style={{ marginTop: 8 }}>
            {(selectedBusinessOwner?.assignedTenants || []).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Text>{t.businessName}</Text>
                <Button type="text" danger size="small" onClick={() => handleRemoveTenant(t.id)}>Remove</Button>
              </div>
            ))}
            {(selectedBusinessOwner?.assignedTenants?.length === 0) && (
              <Text type="secondary">No agencies assigned yet.</Text>
            )}
          </div>
        </div>

        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
          <Text strong>Assign New Agency</Text>
          <Form form={tenantForm} layout="vertical" onFinish={handleAssignTenant} style={{ marginTop: 12 }}>
            <Form.Item name="tenantId" rules={[{ required: true, message: 'Please select an agency' }]}>
              <Select placeholder="Select agency to assign">
                {tenants
                  .filter(t => !(selectedBusinessOwner?.assignedTenants || []).some(at => at.id === t.id))
                  .map(t => (
                    <Option key={t.id} value={t.id}>{t.businessName}</Option>
                  ))}
              </Select>
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SafetyCertificateOutlined />} block>
              Assign to Owner
            </Button>
          </Form>
        </div>
      </Drawer>
    </div>
  );
}
