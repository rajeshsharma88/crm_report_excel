/**
 * Type-safe interface definitions for the Lead Sales Analytics system.
 */

export interface LeadRow {
  leadId: string;
  entryDate: string;
  entryTime: string;
  assignDate: string;
  agentName: string;
  employeeId: string;
  customerName: string;
  contactNo: string;
  alternateNo: string;
  leadSource: string;
  campaignName: string;
  remark: string;
  status: string;
  address: string;
}

export type StatusCategory = 'Success' | 'Unreachable' | 'Refused' | 'FollowUp' | 'Other';

export interface AgentSummary {
  agentName: string;
  employeeId: string;
  totalLeads: number;
  successCount: number;
  unreachableCount: number;
  refusedCount: number;
  followUpCount: number;
  otherCount: number;
  conversionRate: number; // percentage of converted leads
  unreachableRate: number; // percentage of unreachable leads
}

export interface CampaignSummary {
  campaignName: string;
  totalLeads: number;
  successCount: number;
  unreachableCount: number;
  refusedCount: number;
  followUpCount: number;
  conversionRate: number;
}

export interface AnalyticsSummary {
  totalLeads: number;
  successCount: number;
  unreachableCount: number;
  refusedCount: number;
  followUpCount: number;
  otherCount: number;
  conversionRate: number;
  unreachableRate: number;
  agents: AgentSummary[];
  campaigns: CampaignSummary[];
  statusBreakdown: { name: string; value: number; category: StatusCategory }[];
  timeDistribution: { hour: string; count: number }[];
  addressAvailablePercentage: number;
  commonRemarks: { remarkText: string; count: number }[];
}

export interface AIAnalysisResponse {
  executiveSummary: string;
  correctiveActions: {
    agentPerformance: { agentName: string; action: string; reason: string }[];
    leadQuality: string;
    operationalOptimizations: string[];
    scriptingSuggestions: string[];
  };
  remedialStrategicActionPlan: string[];
}
