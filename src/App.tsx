import React, { useState, useMemo } from 'react';
import { ShieldAlert, RefreshCw, FileSpreadsheet, EyeOff, CheckSquare, Search, Filter } from 'lucide-react';
import { parseTSV, calculateAnalytics, PRELOADED_SAMPLE_TSV } from './data';
import { LeadRow } from './types';
import UploadZone from './components/UploadZone';
import OverviewCards from './components/OverviewCards';
import AgentPerformance from './components/AgentPerformance';
import CategoryInsights from './components/CategoryInsights';
import AIActionPlan from './components/AIActionPlan';

export default function App() {
  const [rawText, setRawText] = useState<string>(PRELOADED_SAMPLE_TSV);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Parsed initial records list
  const allRows = useMemo(() => {
    return parseTSV(rawText);
  }, [rawText]);

  // Apply filters on dataset
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const matchAgent = selectedAgent ? row.agentName.trim().toLowerCase() === selectedAgent.trim().toLowerCase() : true;
      const matchCampaign = selectedCampaign ? row.campaignName.trim().toLowerCase() === selectedCampaign.trim().toLowerCase() : true;
      const matchSearch = searchTerm
        ? row.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.remark.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchAgent && matchCampaign && matchSearch;
    });
  }, [allRows, selectedAgent, selectedCampaign, searchTerm]);

  // Calculate stats based on filters
  const globalSummary = useMemo(() => {
    return calculateAnalytics(allRows);
  }, [allRows]);

  const filteredSummary = useMemo(() => {
    return calculateAnalytics(filteredRows);
  }, [filteredRows]);

  const handleDataParsed = (tsv: string) => {
    setRawText(tsv);
    setSelectedAgent(null);
    setSelectedCampaign(null);
  };

  const handleClear = () => {
    setRawText('');
    setSelectedAgent(null);
    setSelectedCampaign(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" id="main-app">
      
      {/* Upper Navigation bar segment */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-600 rounded text-white shadow-sm flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">InsightAudit</span>
              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              <div className="flex items-center text-slate-500 text-xs font-medium">
                <span>lead_audit_performance_v3.tsv</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-3xs font-semibold uppercase tracking-wider">Analyzed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDataParsed(PRELOADED_SAMPLE_TSV)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-md border border-slate-200 shadow-2xs transition-colors cursor-pointer select-none"
              title="Restores the comprehensive files of the demo call logs"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Reset Demo Log
            </button>
          </div>
        </div>
      </header>

      {/* Main body content grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Upload segment */}
        <UploadZone
          onDataParsed={handleDataParsed}
          onClear={handleClear}
          hasData={allRows.length > 0}
          totalParsedRows={allRows.length}
        />

        {allRows.length > 0 ? (
          <>
            {/* Dynamic filter banner */}
            {(selectedAgent || selectedCampaign) && (
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between shadow-3xs">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <span>Active Workload Filters:</span>
                  {selectedAgent && (
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-semibold font-mono text-slate-700">
                      Agent: {selectedAgent}
                    </span>
                  )}
                  {selectedCampaign && (
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-semibold font-mono text-slate-700">
                      Campaign: {selectedCampaign}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedAgent(null);
                    setSelectedCampaign(null);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Metrics cards grid */}
            <OverviewCards summary={filteredSummary} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* CategoryInsights and Sourcing breakdown panels */}
              <CategoryInsights summary={filteredSummary} />

              {/* AI action plan diagnostics */}
              <AIActionPlan summary={filteredSummary} sampleRows={filteredRows} />
            </div>

            {/* Agent performance scorecard table rows */}
            <AgentPerformance
              agents={globalSummary.agents}
              onSelectAgent={(name) => setSelectedAgent(name || null)}
              selectedAgent={selectedAgent}
            />

            {/* Recent underperforming logs details block */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm" id="underperforming-inspector">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    Caller Objections & Response Investigator
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Isolate calling remarks of specific agents first, review address fields, and identify script failures.
                  </p>
                </div>

                {/* Sifting tool */}
                <div className="relative max-w-xs w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Customers / Remarks / IDs..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Grid content mapping logs details */}
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-3xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-4 py-2.5">Lead Details ID</th>
                      <th className="px-4 py-2.5">Agent Details</th>
                      <th className="px-4 py-2.5">Customer Name</th>
                      <th className="px-4 py-2.5">Campaign</th>
                      <th className="px-4 py-2.5">Call Status</th>
                      <th className="px-4 py-2.5">Remarks / Objection</th>
                      <th className="px-4 py-2.5">Address Collection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRows.slice(0, 100).map((row, idx) => {
                      const lowerStatus = row.status.toLowerCase();
                      const isRefused = lowerStatus.includes('not interest') || lowerStatus.includes('reject');
                      const isUnreachable = lowerStatus.includes('switch off') || lowerStatus.includes('not connect') || lowerStatus.includes('ringing');
                      const isConverted = lowerStatus.includes('booked') || lowerStatus.includes('delivered') || lowerStatus.includes('in transit');

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-medium text-slate-900">
                            {row.leadId}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-700">{row.agentName}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 truncate max-w-[120px]" title={row.customerName}>
                            {row.customerName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-600 text-4xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                              {row.campaignName}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-4xs font-bold uppercase tracking-wider ${
                              isConverted ? 'bg-green-100 text-green-700' :
                              isRefused ? 'bg-red-55/20 text-red-700' :
                              isUnreachable ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {row.status || 'Blank'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate italic" title={row.remark}>
                            {row.remark ? `"${row.remark}"` : <span className="text-slate-350">No comment</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 truncate max-w-[120px]" title={row.address}>
                            {row.address && row.address.toLowerCase() !== 'address not available' ? (
                              <span className="text-slate-800 font-medium">{row.address}</span>
                            ) : (
                              <span className="text-slate-300">Unavailable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredRows.length > 100 && (
                <p className="text-center text-3xs text-slate-400 mt-4 italic font-medium">
                  * Showing the first 100 out of {filteredRows.length} matches. Use filters or search to view specific details.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 border-dashed" id="no-data-display">
            <EyeOff className="w-10 h-10 text-slate-350 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">Record Logs Database Empty</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Please load the preloaded call log dataset or draft / upload your own call files above to kickstart the diagnostics dashboards.
            </p>
            <button
              onClick={() => handleDataParsed(PRELOADED_SAMPLE_TSV)}
              className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-slate-200 bg-slate-50 px-4 py-2 rounded-md shadow-2xs transition-all cursor-pointer"
            >
              Load Interactive Demo Log
            </button>
          </div>
        )}
      </main>

      {/* Corporate footer details block */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-3xs text-slate-400 font-mono mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Intel Engine Live</span>
            <span>Scan Time: {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
            <span>Database Records Scan: Active</span>
          </div>
          <div className="flex gap-4 font-sans text-xs">
            <span className="hover:text-blue-600 cursor-pointer">Data Security Policy</span>
            <span>&#8226;</span>
            <span className="hover:text-blue-600 cursor-pointer">API Documentation</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
