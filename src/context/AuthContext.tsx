import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
    hasPasswordSet: boolean;
    setPassword: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasPasswordSet, setHasPasswordSet] = useState(false);

    useEffect(() => {
        // Check if password exists in localStorage
        const storedPassword = localStorage.getItem('app_password');
        setHasPasswordSet(!!storedPassword);

        // Check if session is active
        const sessionActive = sessionStorage.getItem('auth_session');
        if (sessionActive === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const login = (password: string) => {
        const storedPassword = localStorage.getItem('app_password');

        if (!storedPassword) {
            // First time setup scenario handling handled by UI, but logic here:
            return false;
        }

        if (password === storedPassword) {
            sessionStorage.setItem('auth_session', 'true');
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        sessionStorage.removeItem('auth_session');
        setIsAuthenticated(false);
    };

    const setPassword = (password: string) => {
        localStorage.setItem('app_password', password);
        setHasPasswordSet(true);
        // Auto login after setting password
        sessionStorage.setItem('auth_session', 'true');
        setIsAuthenticated(true);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, hasPasswordSet, setPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
