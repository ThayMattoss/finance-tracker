import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // If no password is set configured yet, we might want to force them to login page which acts as setup page
    // BUT, if isAuthenticated is false, we always redirect to login.
    // The Login page will handle the "Setup" vs "Login" UI based on hasPasswordSet.

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
