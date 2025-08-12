import React, { useMemo } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatearPrecio } from '@/utils/formatters';
import { obtenerEstadisticasDashboard, formatBusinessStateForDisplay } from '@/utils/businessCalculations';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

const businessColors: Record<string, string> = {
  oportunidad_creada: 'hsl(var(--business-oportunidad))',
  presupuesto_enviado: 'hsl(var(--business-presupuesto))',
  parcialmente_aceptado: 'hsl(var(--business-parcial))',
  negocio_aceptado: 'hsl(var(--business-aceptado))',
  negocio_cerrado: 'hsl(var(--business-cerrado))',
  negocio_perdido: 'hsl(var(--business-perdido))',
};

const budgetColors: Record<string, string> = {
  borrador: 'hsl(var(--muted))',
  publicado: 'hsl(var(--business-presupuesto))',
  aprobado: 'hsl(var(--business-aceptado))',
  rechazado: 'hsl(var(--business-perdido))',
  vencido: 'hsl(var(--destructive))',
  cancelado: 'hsl(var(--muted-foreground))',
};

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const AdminEstadisticas: React.FC = () => {
  const { negocios, loading } = useNegocio();

  const stats = useMemo(() => obtenerEstadisticasDashboard(negocios), [negocios]);

  const acceptanceRate = useMemo(() => {
    if (!stats.totalNegocios) return 0;
    const accepted = stats.estadisticasPorEstado.negocio_aceptado + stats.estadisticasPorEstado.parcialmente_aceptado;
    return Math.round((accepted / stats.totalNegocios) * 100);
  }, [stats]);

  const businessStateData = useMemo(() => {
    const entries = Object.entries(stats.estadisticasPorEstado)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({ key, name: formatBusinessStateForDisplay(key), value }));
    return entries.length ? entries : [
      { key: 'oportunidad_creada', name: formatBusinessStateForDisplay('oportunidad_creada'), value: 1 },
    ];
  }, [stats]);

  const budgetsStateData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of negocios) {
      for (const p of n.presupuestos || []) {
        counts[p.estado] = (counts[p.estado] || 0) + 1;
      }
    }
    const order = ['borrador', 'publicado', 'aprobado', 'rechazado', 'vencido', 'cancelado'];
    const data = order.filter((k) => counts[k] > 0).map((k) => ({ key: k, name: upperFirst(k.replace('_', ' ')), value: counts[k] }));
    return data.length ? data : [{ key: 'borrador', name: 'Borrador', value: 1 }];
  }, [negocios]);

  const monthlyBusinesses = useMemo(() => {
    // Últimos 6 meses incluyendo el actual
    const now = new Date();
    const months: { label: string; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = upperFirst(
        d.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
          .replace('.', '')
      );
      months.push({ key, label });
    }

    const counts: Record<string, number> = Object.fromEntries(months.map((m) => [m.key, 0]));
    for (const n of negocios) {
      const d = new Date(n.fechaCreacion);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (k in counts) counts[k] += 1;
    }

    return months.map((m) => ({ label: m.label, value: counts[m.key] }));
  }, [negocios]);

  // Chart configs para ChartContainer
  const businessChartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    for (const item of businessStateData) {
      cfg[item.key] = { label: item.name, color: businessColors[item.key] || 'hsl(var(--primary))' };
    }
    return cfg;
  }, [businessStateData]);

  const budgetsChartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    for (const item of budgetsStateData) {
      cfg[item.key] = { label: item.name, color: budgetColors[item.key] || 'hsl(var(--muted))' };
    }
    return cfg;
  }, [budgetsStateData]);

  const monthlyChartConfig = useMemo(() => ({
    value: { label: 'Negocios', color: 'hsl(var(--primary))' },
  }), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de Negocios</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-semibold">{stats.totalNegocios}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de Presupuestos</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-semibold">{stats.totalPresupuestos}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor Total de Cartera</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-semibold">{formatearPrecio(stats.valorTotalCartera)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tasa de Aceptación</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-semibold">{acceptanceRate}%</div></CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estados de Negocios</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ChartContainer config={businessChartConfig} className="h-full w-full">
              <PieChart>
                <Pie
                  data={businessStateData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {businessStateData.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="key" labelKey="name" />} />
                <ChartLegend content={<ChartLegendContent nameKey="key" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Negocios creados (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ChartContainer config={monthlyChartConfig} className="h-full w-full">
              <BarChart data={monthlyBusinesses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" name="Negocios" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <Card>
        <CardHeader>
          <CardTitle>Estados de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ChartContainer config={budgetsChartConfig} className="h-full w-full">
            <PieChart>
              <Pie
                data={budgetsStateData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {budgetsStateData.map((entry) => (
                  <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" labelKey="name" />} />
              <ChartLegend content={<ChartLegendContent nameKey="key" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEstadisticas;
