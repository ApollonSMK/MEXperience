"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface UsageChartProps {
    used: number
    total: number
}

export function UsageChart({ used, total }: UsageChartProps) {
    const data = [
        {
            name: "Uso de Minutos",
            used: used,
            total: total,
        },
    ]

    const remaining = total - used;
    const usagePercentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 20 }}>
                <XAxis type="number" hide domain={[0, total]} />
                <YAxis type="category" dataKey="name" hide />
                <Bar dataKey="total" fill="var(--color-slate-300)" radius={[4, 4, 4, 4]} background={{ fill: 'hsl(var(--muted))', radius: 4 }} />
                <Bar dataKey="used" fill="var(--color-sky-500)" radius={[4, 4, 4, 4]} />
            </BarChart>
        </ResponsiveContainer>
         <div className="flex justify-between text-sm mt-2 px-2 text-muted-foreground">
            <span>{used}min usados</span>
            <span>{remaining}min restantes</span>
        </div>
    </div>
  )
}
