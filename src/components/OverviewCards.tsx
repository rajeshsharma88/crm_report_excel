import { Users, PhoneOff, CheckCircle, MapPin, Milestone } from 'lucide-react';
import { AnalyticsSummary } from '../types';

interface OverviewCardsProps {
  summary: AnalyticsSummary;
}

export default function OverviewCards({ summary }: OverviewCardsProps) {
  const kpis = [
    {
      id: 'kpi-total-leads',
      title: 'Total Allocated Leads',
      value: summary.totalLeads.toLocaleString(),
      subtitle: `${summary.agents.length} calling agents assigned`,
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      barColor: 'bg-blue-600',
      percent: 100,
    },
    {
      id: 'kpi-conversions',
      title: 'Sales Conversion Rate',
      value: `${summary.conversionRate}%`,
      subtitle: `${summary.successCount} Booked / Transit sales`,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-55/20 border-green-100',
      barColor: 'bg-green-500',
      percent: summary.conversionRate,
    },
    {
      id: 'kpi-unreachable',
      title: 'Unreachable Lead Rate',
      value: `${summary.unreachableRate}%`,
      subtitle: `${summary.unreachableCount} Rang / Switch-offs / Recut`,
      icon: PhoneOff,
      color: 'text-rose-600 bg-rose-55/20 border-rose-100',
      barColor: 'bg-rose-500',
      percent: summary.unreachableRate,
    },
    {
      id: 'kpi-address-complete',
      title: 'Address Collection Hygiene',
      value: `${summary.addressAvailablePercentage}%`,
      subtitle: `${parseFloat(((summary.successCount > 0 ? (summary.addressAvailablePercentage * summary.totalLeads / 100) / summary.successCount : 0) * 100).toFixed(0))}% of successful orders`,
      icon: MapPin,
      color: 'text-amber-600 bg-amber-55/20 border-amber-100',
      barColor: 'bg-amber-500',
      percent: summary.addressAvailablePercentage,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="overview-cards">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            id={kpi.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  {kpi.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 select-all font-mono">
                  {kpi.value}
                </h3>
              </div>
              <span className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 ${kpi.color}`}>
                <IconComponent className="w-5 h-5" />
              </span>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${kpi.barColor}`}
                style={{ width: `${Math.min(kpi.percent, 100)}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-500 truncate" title={kpi.subtitle}>
              {kpi.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
