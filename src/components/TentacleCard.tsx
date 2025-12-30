import type { Tentacle } from '../types';

interface TentacleCardProps {
    tentacle: Tentacle;
}

export function TentacleCard({ tentacle }: TentacleCardProps) {
    return (
        <div
            className="glass-panel"
            style={{
                padding: '1.5rem',
                borderTop: `4px solid ${tentacle.color}`,
                height: '100%'
            }}
        >
            <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{tentacle.label}</h3>
                <span
                    style={{
                        backgroundColor: tentacle.color,
                        color: '#000',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                    }}
                >
                    {tentacle.targetPercentage}%
                </span>
            </div>

            <div style={{ marginTop: '1rem' }}>
                {tentacle.assets.length > 0 ? (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {tentacle.assets.map((asset) => (
                            <li key={asset.ticker} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                <span>{asset.ticker}</span>
                                <span>{asset.name}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        Nenhum ativo específico definido.
                    </p>
                )}
            </div>
        </div>
    );
}
