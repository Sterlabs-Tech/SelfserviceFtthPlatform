import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/apiClient';

interface AuthContextType {
    user: any | null;
    login: (email: string, pass: string) => Promise<any>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('@vtal-user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, pass: string) => {
        const res = await api.post('/api/login', { email, password: pass });
        setUser(res.data.user);
        localStorage.setItem('@vtal-user', JSON.stringify(res.data.user));
        return res.data.user;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('@vtal-user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
