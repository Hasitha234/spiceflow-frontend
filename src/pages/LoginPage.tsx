import { Button, Card, Form, Input, message } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { jwtDecode } from 'jwt-decode';
import type { AuthUser } from '@/types/auth';

const schema = z.object({
  email: z.string().email('common.invalidEmail').min(1, 'common.required'),
  password: z.string().min(1, 'common.required'),
});

type LoginFormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      // 1. Send login request (sets HttpOnly refresh cookie automatically)
      const response = await authApi.login(values);
      
      // 2. Decode the JWT access token to get the user context
      const decoded = jwtDecode<{
        sub: string;
        roles: string[];
        permissions: string[];
        tenantId?: number;
      }>(response.accessToken);
      
      const user: AuthUser = {
        email: decoded.sub,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        tenantId: decoded.tenantId,
      };
      
      // 3. Save to Zustand memory (NO localStorage for token!)
      setCredentials(response, user);
      
      message.success(t('auth.login') + ' successful');
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      message.error(t('auth.loginFailed'));
    }
  };

  return (
    <div className="auth-bg">
      <div className="animate-scale-in" style={{ width: '100%', maxWidth: 420 }}>
        {/* We use className="glass" from index.css for the premium glassmorphism effect */}
        <Card
          className="glass hover-glow"
          bordered={false}
          styles={{
            header: { borderBottom: '1px solid rgba(255,255,255,0.1)' },
            body: { padding: '32px 24px' }
          }}
          title={
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                SpiceFlow
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 400 }}>
                {t('auth.login')}
              </div>
            </div>
          }
        >
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark={false}>
            {/* 
              React Hook Form + Ant Design convention:
              ALWAYS wrap Form.Item with <Controller> so RHF controls the state natively.
            */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>{t('auth.email') || 'Email'}</span>}
                  validateStatus={errors.email ? 'error' : ''}
                  help={errors.email?.message ? t(errors.email.message) : undefined}
                >
                  <Input 
                    {...field} 
                    size="large" 
                    placeholder="admin@spiceflow.com" 
                    autoComplete="email" 
                  />
                </Form.Item>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>{t('auth.password')}</span>}
                  validateStatus={errors.password ? 'error' : ''}
                  help={errors.password?.message ? t(errors.password.message) : undefined}
                  style={{ marginTop: 20 }}
                >
                  <Input.Password 
                    {...field} 
                    size="large" 
                    placeholder="••••••••" 
                    autoComplete="current-password" 
                  />
                </Form.Item>
              )}
            />

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={isSubmitting}
                className="gradient-emerald hover-lift"
                style={{ height: 44, fontWeight: 600, border: 'none' }}
              >
                {t('auth.loginButton')}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
