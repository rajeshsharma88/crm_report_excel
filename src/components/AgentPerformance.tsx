import React, { useState } from 'react';
import { Search, ArrowUpDown, ShieldAlert, Award, Star, TrendingDown, Eye } from 'lucide-react';
import { AgentSummary } from '../types';

interface AgentPerformanceProps {
  agents: AgentSummary[];
  onSelectAgent?: (name: string) => void;
  selectedAgent?: string | null;
}

type SortField = 'agentName' | 'totalLeads' | 'successCount' | 'unreachableCount' | 'conversionRate' | 'unreachableRate';
type SortOrder = 'asc' | 'desc';

export default function AgentPerformance({ agents, onSelectAgent, selectedAgent }: AgentPerformanceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalLeads');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Multi-column sorter handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtration logic
  const filteredAgents = agents.filter(agent =>
    agent.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.employeeId.includes(searchTerm)
  );

  // Sorting process
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    // Number type fallback
    const numA = valA as number;
    const numB = valB as number;
    return sortOrder === 'asc' ? numA - numB : numB - numA;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden animate-fadeIn" id="agent-performance">
      {/* Header section with Search bar and filter tools */}
      <div className="p-5 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            Agent Calling Performance Scorecard
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Compare conversions, call workloads, and diagnose agent-level pickup leaks.
          </p>
        </div>

        {/* Searching tool */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Agent / ID..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto animate-fadeIn">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200/80">
              <th onClick={() => handleSort('agentName')} className="px-5 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-1">
                  Calling Agent Details <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('totalLeads')} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-end gap-1">
                  Workload (dials) <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('successCount')} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-end gap-1">
                  Conversions <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('conversionRate')} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors font-medium">
                <div className="flex items-center justify-end gap-1">
                  Success Rate <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('unreachableRate')} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-end gap-1">
                  Unreachable Ratio <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="px-5 py-3 text-center">Corrective Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {sortedAgents.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-550">
                  No calling agents found matching the filtration criteria.
                </td>
              </tr>
            ) : (
              sortedAgents.map((agent) => {
                // Highlighting conditions:
                // Red Warning: extremely low conversion rate < 2% with heavy dialing (total >= 10)
                const isUnderperforming = agent.conversionRate < 2.0 && agent.totalLeads >= 10;
                // High unreachable warning: unreachable rate over 50%
                const excessiveUnreachable = agent.unreachableRate >= 50.0 && agent.totalLeads >= 10;
                // Star achievement: conversion rate over 10%
                const isStar = agent.conversionRate >= 10.0 && agent.successCount >= 3;

                const isSelected = selectedAgent === agent.agentName;

                return (
                  <tr
                    key={agent.agentName}
                    id={`row-${agent.agentName.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/45 text-blue-900 border-l-2 border-l-blue-600 font-medium' : ''
                    }`}
                    onClick={() => onSelectAgent?.(agent.agentName)}
                  >
                    {/* Agent Identification */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isStar ? 'bg-amber-150 text-amber-900 border border-amber-200' :
                          isUnderperforming ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-slate-100 text-slate-700 border border-slate-205'
                        }`}>
                          {agent.agentName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">
                            {agent.agentName}
                          </p>
                          <p className="text-3xs text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
                            Emp ID: {agent.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Dials Count / Workload */}
                    <td className="px-4 py-4 text-right font-semibold text-gray-900 font-mono">
                      {agent.totalLeads}
                    </td>

                    {/* Successful Sales */}
                    <td className="px-4 py-4 text-right text-gray-700 font-mono">
                      {agent.successCount}
                    </td>

                    {/* Conversion Rate Percentage */}
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-block font-bold font-mono px-2 py-0.5 rounded-sm ${
                        isStar ? 'text-emerald-700 bg-emerald-50' :
                        isUnderperforming ? 'text-red-700 bg-red-50' :
                        'text-gray-900'
                      }`}>
                        {agent.conversionRate}%
                      </span>
                    </td>

                    {/* Unreachable Ratio */}
                    <td className="px-4 py-4 text-right">
                      <span className={`font-mono ${excessiveUnreachable ? 'text-amber-600 font-semibold' : 'text-gray-600'}`}>
                        {agent.unreachableRate}%
                      </span>
                    </td>

                    {/* Quick Diagnostic / Remedial Badges */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {isStar && (
                          <span className="flex items-center gap-1 px-2.5 py-1 text-4xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 rounded-full">
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            Elite Agent
                          </span>
                        )}
                        {isUnderperforming && (
                          <span className="flex items-center gap-1 px-2.5 py-1 text-4xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 rounded-full">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            Retraining Alert
                          </span>
                        )}
                        {excessiveUnreachable && !isUnderperforming && (
                          <span className="flex items-center gap-1 px-2.5 py-1 text-4xs font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                            Route Hygiene
                          </span>
                        )}
                        {!isStar && !isUnderperforming && !excessiveUnreachable && (
                          <span className="text-gray-400 font-medium italic">
                            On Track
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Select Filter Prompt Info footer */}
      <div className="bg-slate-50 p-3 text-3xs text-slate-500 border-t border-slate-150 flex items-center justify-between">
        <span>* Selecting an agent row filters call-logs, remarks, and campaigns to isolate their performance.</span>
        {selectedAgent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectAgent?.('');
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            Clear Selected Agent Filter
          </button>
        )}
      </div>
    </div>
  );
}
