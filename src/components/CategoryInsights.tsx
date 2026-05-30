import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { Milestone, HelpCircle, FileQuestion, ArrowRight } from 'lucide-react';
import { AnalyticsSummary, StatusCategory } from '../types';

interface CategoryInsightsProps {
  summary: AnalyticsSummary;
}

// Colors aligned to status categories
const CATEGORY_COLORS: { [key in StatusCategory]: string } = {
  Success: '#2563eb',     // Royal blue
  Unreachable: '#f43f5e', // Soft rose
  Refused: '#64748b',     // Slate
  FollowUp: '#eab308',    // Gold
  Other: '#94a3b8'        // Light slate
};

const CATEGORY_BG_BADGES: { [key in StatusCategory]: string } = {
  Success: 'text-blue-700 bg-blue-50 border-blue-100',
  Unreachable: 'text-rose-700 bg-rose-50 border-rose-100',
  Refused: 'text-slate-700 bg-slate-105 border-slate-150',
  FollowUp: 'text-amber-700 bg-amber-50 border-amber-100',
  Other: 'text-slate-500 bg-slate-50 border-slate-100'
};

export default function CategoryInsights({ summary }: CategoryInsightsProps) {
  // Format data for Recharts Pie Chart (Status Categories)
  const categorySummaryMap: { [key in StatusCategory]: number } = {
    Success: summary.successCount,
    Unreachable: summary.unreachableCount,
    Refused: summary.refusedCount,
    FollowUp: summary.followUpCount,
    Other: summary.otherCount
  };

  const pieData = Object.entries(categorySummaryMap)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name as StatusCategory]
    }));

  // Bar data for Campaigns (up to top 5)
  const barData = summary.campaigns.slice(0, 5).map(c => ({
    name: c.campaignName.length > 15 ? `${c.campaignName.substring(0, 15)}...` : c.campaignName,
    'Conversion %': c.conversionRate,
    'Total Leads': c.totalLeads
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="category-insights">
      
      {/* Campaign Efficiency & Object Registry */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Milestone className="w-5 h-5 text-slate-400" />
            Campaign Conversion Comparison
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Evaluate lead performance across different acquisition channels (on-job training, renewals, cold piles).
          </p>

          <div className="h-48 w-full mb-6">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value: any, name: string) => [name === 'Conversion %' ? `${value}%` : value, name]} 
                  />
                  <Bar dataKey="Conversion %" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry['Conversion %'] > 5 ? '#2563eb' : '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No campaign data was found.
              </div>
            )}
          </div>
        </div>

        {/* Campaign Metrics list */}
        <div className="space-y-2 border-t border-slate-100 pt-4 text-xs">
          <div className="grid grid-cols-3 text-3xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            <span>Campaign Channel</span>
            <span className="text-right">Dials</span>
            <span className="text-right">Success Rate</span>
          </div>
          {summary.campaigns.slice(0, 3).map((camp) => (
            <div key={camp.campaignName} className="grid grid-cols-3 py-1 items-center">
              <span className="font-semibold text-slate-800 truncate" title={camp.campaignName}>
                {camp.campaignName}
              </span>
              <span className="text-right text-slate-500 font-mono">{camp.totalLeads}</span>
              <span className={`text-right font-bold font-mono ${
                camp.conversionRate >= 10 ? 'text-blue-600' :
                camp.conversionRate < 2 ? 'text-red-500' : 'text-slate-700'
              }`}>
                {camp.conversionRate}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Objections Audit & Status Share */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            Lead Funnel Objection Audit
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Identify the primary call refusal remarks and status share to deploy corrective scripts.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            {/* Pie chart */}
            <div className="w-32 h-32 shrink-0">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  No data
                </div>
              )}
            </div>

            {/* Pie legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-full">
              {Object.entries(categorySummaryMap).map(([cat, val]) => {
                const percentage = parseFloat(((val / summary.totalLeads) * 105).toFixed(0)); // adjusted visually
                const hasCount = val > 0;
                if (!hasCount) return null;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: CATEGORY_COLORS[cat as StatusCategory] }}
                    ></span>
                    <span className="text-slate-500 font-medium truncate" title={cat}>
                      {cat}: <span className="font-semibold text-slate-850">{val}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Objection remarks table */}
        <div className="border-t border-slate-150 pt-4" id="objections-list">
          <div className="text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <FileQuestion className="w-3.5 h-3.5" />
            Common Refusal Remarks & Excuses (Objections)
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {summary.commonRemarks.length > 0 ? (
              summary.commonRemarks.map((rem, i) => (
                <div key={i} className="flex items-start justify-between bg-slate-50 p-2 rounded-lg text-xs leading-none">
                  <span className="text-slate-705 italic select-all truncate pr-3" title={rem.remarkText}>
                    &quot;{rem.remarkText}&quot;
                  </span>
                  <span className="text-3xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0">
                    {rem.count} logged
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-400 italic">
                No qualified objection comments found in the logs.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
