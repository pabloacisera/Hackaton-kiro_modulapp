import { Navigate } from 'react-router-dom';

interface RouteGuardProps {
  accessToken: string | null;
  children: React.ReactNode;
}

export function RouteGuard({ accessToken, children }: RouteGuardProps) {
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
