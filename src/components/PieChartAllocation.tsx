import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import type { Tentacle } from '../types';

interface PieChartAllocationProps {
    data: {
        name: string;
        value: number;
        color: string;
        letter: string;
    }[];
    title: string;
    totalValue: number;
}

export function PieChartAllocation({ data, title, totalValue }: PieChartAllocationProps) {
    // Filter out zero values to avoid ugly empty segments
    const activeData = data.filter(d => d.value > 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const percentage = (item.value / totalValue) * 100;
            return (
                <div className="glass-panel" style={{ padding: '0.75rem', border: `1px solid ${item.color}` }}>
                    <div style={{ fontWeight: 600, color: item.color, marginBottom: '0.25rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.9rem' }}>{formatCurrency(item.value)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {formatPercentage(percentage)}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
                {title}
            </h3>

            <div style={{ flex: 1, minHeight: '300px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={activeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {activeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ fontSize: '0.8rem', paddingTop: '1rem' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Total</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {formatCurrency(totalValue)}
                </div>
            </div>
        </div>
    );
}
