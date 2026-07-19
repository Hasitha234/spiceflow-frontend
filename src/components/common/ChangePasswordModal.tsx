import { useState } from 'react';
import { Form, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { ResponsiveModal } from './ResponsiveModal';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import type { ChangePasswordRequest } from '@/api/generated';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [form] = Form.useForm<ChangePasswordRequest>();
  const [loading, setLoading] = useState(false);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const navigate = useNavigate();

  const handleFinish = async (values: ChangePasswordRequest) => {
    setLoading(true);
    try {
      await authApi.changePassword(values);
      message.success('Password changed successfully. Please log in again.');
      form.resetFields();
      onClose();
      clearAuth();
      navigate('/login');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } };
      message.error(e?.response?.data?.detail || e?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LockOutlined style={{ color: '#0F9D6C' }} />
          <span>Change Password</span>
        </div>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      okText="Update Password"
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: '16px' }}
      >
        <Form.Item
          name="currentPassword"
          label="Current Password"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password placeholder="Enter current password" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: 'Please enter your new password' },
            { min: 8, message: 'Password must be at least 8 characters' }
          ]}
        >
          <Input.Password placeholder="Enter new password (min. 8 characters)" />
        </Form.Item>

        <Form.Item
          name="confirmNewPassword"
          label="Confirm New Password"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm new password" />
        </Form.Item>
      </Form>
    </ResponsiveModal>
  );
}
