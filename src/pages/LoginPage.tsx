import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, hasPasswordSet, setPassword: setContextPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!hasPasswordSet) {
            // Setup mode
            if (password.length < 4) {
                setError('A senha deve ter pelo menos 4 caracteres.');
                return;
            }
            setContextPassword(password);
            navigate('/');
        } else {
            // Login mode
            if (login(password)) {
                navigate('/');
            } else {
                setError('Senha incorreta.');
            }
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-background)',
            color: 'var(--color-text-primary)'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'var(--color-surface-active)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                }}>
                    <Lock size={32} />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        {hasPasswordSet ? 'Bem-vindo de volta' : 'Configurar Senha'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        {hasPasswordSet
                            ? 'Digite sua senha para acessar o dashboard.'
                            : 'Defina uma senha segura para proteger seus dados.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                            autoFocus
                        />
                        {error && (
                            <div style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {hasPasswordSet ? 'Entrar' : 'Criar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}
