import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function TenantIndexRedirect() {
  const user = useAuthStore((s) => s.user);

  if (user?.userType === 'DATA_ENTRY') {
    return <Navigate to="inventory" replace />;
  }

  if (user?.userType === 'DRIVER') {
    return <Navigate to="qr-scan" replace />;
  }

  return <Navigate to="day-summary" replace />;
}
