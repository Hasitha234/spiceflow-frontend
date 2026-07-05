import { Button, Form, Input, message } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { jwtDecode } from 'jwt-decode';
import type { AuthUser } from '@/types/auth';
import { BrandLogo } from '@/components/common/BrandLogo';
import { 
  CheckCircleFilled,
  ArrowRightOutlined,
  LockOutlined,
  MailOutlined
} from '@ant-design/icons';

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
      const response = await authApi.login(values);
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
      
      setCredentials(response, user);
      message.success(t('auth.login') + ' successful');
      navigate('/');
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const err = error as {
        response?: { status?: number; data?: { detail?: string } };
        message?: string;
      };
      if (err?.response?.status === 401) {
        message.error(t('auth.loginFailed'));
      } else if (err?.response?.data?.detail) {
        message.error(err.response.data.detail);
      } else if (err?.message === 'Network Error') {
        message.error('Unable to connect to backend server. Please check if Spring Boot is running on port 8080.');
      } else {
        message.error(t('auth.loginFailed'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--surface-base)' }}>
      {/* 
        LEFT COLUMN — High-Taste Creative Editorial Workspace
        Styled with a luxurious Midnight Emerald Forest gradient, pure white typography,
        and clean architectural spacing without jargon badges or live ticker boxes.
      */}
      <div
        className="login-hero-panel"
        style={{
          flex: '1.2',
          background: 'linear-gradient(135deg, #06231c 0%, #043f2e 50%, #064e3b 100%)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Architectural Grid Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.15,
            pointerEvents: 'none',
          }}
        />

        {/* Top Header: Brand Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <BrandLogo size={48} textSize={26} badgeText="ENTERPRISE OS" lightText={true} />
        </div>

        {/* Center Editorial Statement */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 520, margin: 'auto 0' }}>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.04em',
              lineHeight: 1.15,
              marginBottom: 24,
              fontFamily: 'var(--font-sans)',
            }}
          >
            The intelligent operating system for distribution.
          </h1>
          <p
            style={{
              fontSize: 17,
              color: '#a7f3d0',
              lineHeight: 1.6,
              fontWeight: 400,
              margin: 0,
            }}
          >
            Engineered for precision. Real-time multi-tenant inventory, automated fleet dispatch, and immutable financial reconciliation across your entire enterprise network.
          </p>
        </div>

        {/* Bottom Footer Quote */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            fontSize: 13,
            color: '#6ee7b7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleFilled style={{ color: '#10b981' }} />
            <span style={{ color: '#d1fae5' }}>© 2026 BussManager Inc. • All Rights Reserved</span>
          </div>
          <span style={{ fontWeight: 500, color: '#a7f3d0' }}>Enterprise Edition</span>
        </div>
      </div>

      {/* 
        RIGHT COLUMN — Ultra-Premium Minimalist & Ergonomic Sign-In Card
        Clean Vercel/Linear aesthetic with generous touch targets,
        crisp typography, and zero clutter!
      */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          background: 'var(--surface-base)',
          position: 'relative',
        }}
      >
        {/* Subtle Ambient Illumination behind the card */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Sign-In Card Container */}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '44px 40px 40px',
            borderRadius: '24px',
            background: 'var(--surface-raised)',
            border: '1px solid var(--surface-border)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(16, 185, 129, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
          className="animate-scale-in"
        >
          {/* Top Security Accent Rim */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #059669 100%)',
            }}
          />

          {/* Mobile-only Logo Header */}
          <div className="mobile-only-logo" style={{ marginBottom: 32, display: 'none' }}>
            <BrandLogo size={36} textSize={20} badgeText="" />
          </div>

          {/* Clean Minimalist Header */}
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                margin: 0,
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.2,
              }}
            >
              Welcome back
            </h2>
          </div>

          {/* Ergonomic Form with Generous Touch Targets */}
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark={false}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MailOutlined style={{ color: 'var(--text-muted)', fontSize: 14 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t('auth.email')}
                      </span>
                    </div>
                  }
                  validateStatus={errors.email ? 'error' : ''}
                  help={errors.email?.message ? t(errors.email.message) : undefined}
                  style={{ marginBottom: 24 }}
                >
                  <Input 
                    {...field} 
                    size="large" 
                    placeholder="admin@bussmanager.com" 
                    autoComplete="email"
                    style={{
                      height: 48,
                      borderRadius: 10,
                      fontSize: 15,
                    }}
                  />
                </Form.Item>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <LockOutlined style={{ color: 'var(--text-muted)', fontSize: 14 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t('auth.password')}
                      </span>
                    </div>
                  }
                  validateStatus={errors.password ? 'error' : ''}
                  help={errors.password?.message ? t(errors.password.message) : undefined}
                  style={{ marginBottom: 32 }}
                >
                  <Input.Password 
                    {...field} 
                    size="large" 
                    placeholder="••••••••" 
                    autoComplete="current-password"
                    style={{
                      height: 48,
                      borderRadius: 10,
                      fontSize: 15,
                    }}
                  />
                </Form.Item>
              )}
            />

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={isSubmitting}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                style={{
                  height: 50,
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 16,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#10b981',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                }}
                className="hover-lift"
              >
                {t('auth.loginButton')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
