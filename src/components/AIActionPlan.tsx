import React, { useState } from 'react';
import { Sparkles, Brain, Loader2, CheckSquare, ShieldAlert, Award, VolumeX, Shuffle, HelpCircle } from 'lucide-react';
import { AnalyticsSummary, AIAnalysisResponse, LeadRow } from '../types';

interface AIActionPlanProps {
  summary: AnalyticsSummary;
  sampleRows: LeadRow[];
}

export default function AIActionPlan({ summary, sampleRows }: AIActionPlanProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  // Status spinner steps
  const steps = [
    'Parsing call metrics and status counts...',
    'Profiling agent workloads and conversion rates...',
    'Checking database quality for fake indicators or placeholder names...',
    'Formulating tactical script counters for common objections...',
    'Compiling chronological corrective strategic plan...'
  ];

  const triggerAudit = async () => {
    setLoading(true);
    setErrorMsg('');
    setLoadingStep(0);

    // Set up step rotation timer
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % steps.length);
    }, 1200);

    try {
      // Send aggregations + a subset of actual rows to prevent halluncinations and guarantee exact metrics
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryData: {
            totalLeads: summary.totalLeads,
            successCount: summary.successCount,
            unreachableCount: summary.unreachableCount,
            refusedCount: summary.refusedCount,
            followUpCount: summary.followUpCount,
            conversionRate: summary.conversionRate,
            unreachableRate: summary.unreachableRate,
            agents: summary.agents.slice(0, 10).map(a => ({
              agentName: a.agentName,
              totalLeads: a.totalLeads,
              successCount: a.successCount,
              unreachableCount: a.unreachableCount,
              conversionRate: a.conversionRate,
              unreachableRate: a.unreachableRate
            })),
            campaigns: summary.campaigns.slice(0, 5),
            commonRemarks: summary.commonRemarks,
            addressAvailablePercentage: summary.addressAvailablePercentage
          },
          sampleRows: sampleRows.slice(0, 15).map(r => ({
            leadId: r.leadId,
            agentName: r.agentName,
            campaignName: r.campaignName,
            status: r.status,
            remark: r.remark,
            address: r.address ? 'Yes' : 'No'
          }))
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error || 'Server error occurred.');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to establish connection to AI operations engine. Please check secrets configuration.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl mb-8 text-slate-100" id="ai-action-plan">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/15 pb-5 mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            AI Operations Diagnostic & Corrective Playbook
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Produce structured, action-oriented training directives, database warnings, and object counters.
          </p>
        </div>

        {/* Audit Activation trigger */}
        <button
          onClick={triggerAudit}
          disabled={loading || summary.totalLeads === 0}
          className="bg-blue-650 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-md flex items-center gap-2 shadow-sm transition-colors cursor-pointer select-none active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {analysis ? 'Re-audit Logging Records' : 'Audit Sheet & Generate Corrective Actions'}
        </button>
      </div>

      {/* Loading state spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-black/10 rounded-xl border border-white/5">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
          <p className="text-sm font-semibold text-white animate-pulse">Running Diagnostic Operations</p>
          <p className="text-xs text-slate-400 mt-1 transition-all duration-300 max-w-sm">
            {steps[loadingStep]}
          </p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-xs text-red-200 leading-tight mb-4">
          <p className="font-semibold text-white">Operations Audit Exception</p>
          <p className="mt-1">{errorMsg}</p>
          <p className="mt-3 font-semibold text-slate-450">
            * Please verify your environment holds a valid `GEMINI_API_KEY` under the Settings pane on the left.
          </p>
        </div>
      )}

      {/* Compiled action report results */}
      {analysis && !loading && (
        <div className="space-y-6 animate-fadeIn" id="ai-active-plan-content">
          
          {/* Executive diagnostic segment */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-455 mb-2">
              Operations Diagnosis Summary
            </h4>
            <p className="text-xs text-slate-250 leading-relaxed select-all whitespace-pre-wrap">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Corrective actions list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Agent warning / training letters */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase text-slate-455 tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-rose-450" />
                Staff Warning & Training Requirements
              </h5>
              <div className="space-y-2">
                {analysis.correctiveActions.agentPerformance.length > 0 ? (
                  analysis.correctiveActions.agentPerformance.map((action, i) => (
                    <div key={i} className="border border-white/5 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white">{action.agentName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase ${
                          action.action.toLowerCase().includes('warn') || action.action.toLowerCase().includes('letter')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-55/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {action.action}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{action.reason}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No direct agent action needed based on the records.</p>
                )}
              </div>
            </div>

            {/* Sourcing & Objections handling */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase text-slate-455 tracking-wider flex items-center gap-1">
                  <Shuffle className="w-4 h-4 text-blue-400" />
                  Lead Sourcing & Hygiene Critique
                </h5>
                <p className="text-xs text-slate-300 bg-white/5 rounded-lg p-3 border border-white/10 whitespace-pre-line leading-relaxed">
                  {analysis.correctiveActions.leadQuality}
                </p>
              </div>

              {/* Call scripting scripts changes */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase text-slate-455 tracking-wider flex items-center gap-1">
                  <VolumeX className="w-4 h-4 text-amber-450" />
                  Tactical Script Countermeasures
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analysis.correctiveActions.scriptingSuggestions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* Operational timing and workflow lists */}
          {analysis.correctiveActions.operationalOptimizations && analysis.correctiveActions.operationalOptimizations.length > 0 && (
            <div className="space-y-2 mt-4">
              <h5 className="text-xs font-bold uppercase text-slate-455 tracking-wider">
                Operational Scheduler Adjustments
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {analysis.correctiveActions.operationalOptimizations.map((item, i) => (
                  <div key={i} className="bg-blue-500/10 border border-white/5 p-2.5 rounded-lg flex items-start gap-2">
                    <span className="p-1 font-bold font-mono text-blue-300 bg-blue-950 rounded-md text-3xs shrink-0 leading-none">
                      #{i + 1}
                    </span>
                    <span className="text-slate-200 leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final strategic Action Items workflow */}
          <div className="border-t border-white/10 pt-5 mt-5">
            <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1">
              <CheckSquare className="w-4 h-4 text-blue-450" />
              Chronological 5-Step Remedial Action Plan
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {analysis.remedialStrategicActionPlan.map((goal, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3 h-full flex flex-col justify-between hover:bg-white/10 transition-all duration-200">
                  <span className="font-extrabold text-xs text-white bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-mono shrink-0 mb-2">
                    {index + 1}
                  </span>
                  <p className="text-xs text-slate-200 font-medium leading-tight">
                    {goal}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Waiting screen if no analysis matches */}
      {!analysis && !loading && (
        <div className="flex flex-col items-center justify-center border border-white/10 border-dashed rounded-xl py-12 text-center text-slate-400">
          <Brain className="w-8 h-8 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-200">Audit Reports Engine Awaiting Activation</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Load call logging records in the segment above, and click the button to trigger detailed AI diagnostics, warnings and strategies.
          </p>
          <button
            onClick={triggerAudit}
            disabled={summary.totalLeads === 0}
            className="mt-4 text-xs font-semibold text-blue-400 hover:text-blue-300 border border-slate-800 hover:border-slate-700 bg-white/5 px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            Audit Demo Log
          </button>
        </div>
      )}

    </div>
  );
}
