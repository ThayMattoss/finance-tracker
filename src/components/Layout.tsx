import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Wallet, BookOpen, Settings } from 'lucide-react';

export function Layout() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside
                className="glass-panel"
                style={{
                    width: '280px',
                    margin: '1rem',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'sticky',
                    top: '1rem',
                    height: 'calc(100vh - 2rem)',
                    borderRadius: 'var(--radius-lg)'
                }}
            >
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Link to="/" style={{ display: 'block', maxWidth: '100%' }}>
                        <img src="/src/assets/logo.png" alt="Dividends for Freedom" style={{ maxWidth: '100%', height: 'auto', maxHeight: '120px' }} />
                    </Link>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavItem to="/kraken" icon={<BookOpen size={20} />} label="Análise de Carteiras" />
                    <NavItem to="/professor" icon={<GraduationCap size={20} />} label="Carteira Professor" />
                    <NavItem to="/wallet" icon={<Wallet size={20} />} label="Minha Carteira" />
                    <NavItem to="/settings" icon={<Settings size={20} />} label="Configurações" />
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '1rem' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-surface-active)' : 'transparent',
                transition: 'var(--transition-fast)',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none'
            })}
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
}
