import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { BrandLogo } from '@/components/common/BrandLogo';

export function SelectAgencyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setTenantId = useTenantStore((s) => s.setTenantId);

  // If not logged in, or not a TENANT_OWNER, this page shouldn't be accessible
  if (!user || user.userType !== 'TENANT_OWNER') {
    return <Navigate to="/" replace />;
  }

  const assignedTenants = user.assignedTenants || [];

  if (assignedTenants.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', backgroundColor: '#F3F4F6' }}>
        <BrandLogo size={40} textSize={24} />
        <div style={{ marginTop: '32px', textAlign: 'center', maxWidth: '400px', backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ margin: '0 0 16px', color: '#111827', fontSize: '20px' }}>No Agencies Assigned</h2>
          <p style={{ color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
            Your account is not assigned to any agencies. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  const handleSelectAgency = (tenantId: number) => {
    setTenantId(tenantId);
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', backgroundColor: '#F3F4F6', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <BrandLogo size={40} textSize={24} />
      </div>
      
      <div style={{ 
        width: '100%', 
        maxWidth: '480px', 
        backgroundColor: 'white', 
        padding: '32px', 
        borderRadius: '16px', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <h1 style={{ margin: '0 0 8px', color: '#111827', fontSize: '24px', fontWeight: 700 }}>Select Your Agency</h1>
        <p style={{ color: '#6B7280', margin: '0 0 24px', fontSize: '15px' }}>
          Choose an agency to continue to the dashboard.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {assignedTenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelectAgency(tenant.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                width: '100%',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0F9D6C';
                e.currentTarget.style.backgroundColor = '#F0FDF4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#111827', fontSize: '16px' }}>{tenant.businessName}</span>
                  {tenant.status === 'SUSPENDED' && (
                    <span style={{ 
                      backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '12px', fontWeight: 600, 
                      padding: '2px 8px', borderRadius: '9999px' 
                    }}>
                      Suspended
                    </span>
                  )}
                </div>
                <span style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>Tenant ID: {tenant.id}</span>
              </div>
              <div style={{ color: '#0F9D6C' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
