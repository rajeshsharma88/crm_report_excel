import { LeadRow, AnalyticsSummary, StatusCategory, AgentSummary, CampaignSummary } from './types';

/**
 * Maps raw lead statuses into logical calling-funnel categories.
 */
export function getStatusCategory(status: string, remark: string = ''): StatusCategory {
  const normStatus = status.trim().toLowerCase();
  const normRemark = remark.trim().toLowerCase();

  // If status is empty, check remark for hints
  if (!normStatus) {
    if (normRemark.includes('order verified') || normRemark.includes('order done') || normRemark.includes('verified')) {
      return 'Success';
    }
    if (normRemark.includes('busy') || normRemark.includes('buzy') || normRemark.includes('ringing')) {
      return 'Unreachable';
    }
    if (normRemark.includes('call cut') || normRemark.includes('call cat') || normRemark.includes('not interest')) {
      return 'Refused';
    }
    return 'Other';
  }

  // Categories matching
  if (
    normStatus === 'booked' ||
    normStatus === 'delivered' ||
    normStatus === 'in transit' ||
    normStatus === 'verified' ||
    normStatus.includes('success')
  ) {
    return 'Success';
  }

  if (
    normStatus === 'not connect' ||
    normStatus === 'switch off' ||
    normStatus === 'ringing' ||
    normStatus === 'busy' ||
    normStatus === 'buzy' ||
    normStatus.includes('unreachable') ||
    normStatus.includes('out of service') ||
    normStatus.includes('not answer') ||
    normStatus === 'incoming not allowed'
  ) {
    return 'Unreachable';
  }

  if (
    normStatus === 'not interestd' ||
    normStatus === 'rejected' ||
    normStatus === 'call disconnected by customer' ||
    normStatus.includes('refuse') ||
    normStatus.includes('deny') ||
    normStatus.includes('no need') ||
    normStatus.includes('cancelled')
  ) {
    return 'Refused';
  }

  if (
    normStatus === 'call back' ||
    normStatus === 'future call back' ||
    normStatus === 'pending' ||
    normStatus === 'draft' ||
    normStatus.includes('cb')
  ) {
    return 'FollowUp';
  }

  if (normStatus.includes('prank') || normStatus.includes('fake')) {
    return 'Refused'; // Under refusal or other
  }

  return 'Other';
}

/**
 * Robust TSV / CSV parser for spreadsheet exports.
 * Supports splitting fields, sanitizing spreadsheet quotes, and matching headers regardless of capitalization/spacing.
 */
export function parseTSV(rawText: string): LeadRow[] {
  if (!rawText || !rawText.trim()) return [];

  // Split on newlines
  const lines = rawText.split(/\r?\n/);
  if (lines.length === 0) return [];

  const parsedRows: LeadRow[] = [];

  // Find header row or default columns
  let headerIndex = 0;
  let headers: string[] = [];

  // Find the first line that looks like a header (contains lead id, entry date etc)
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const cols = lines[i].split(/\t/);
    if (cols.some(c => c.toLowerCase().includes('lead id') || c.toLowerCase().includes('entry date'))) {
      headerIndex = i;
      headers = cols.map(c => c.trim().toLowerCase());
      break;
    }
  }

  // Fallback if no header matched
  if (headers.length === 0) {
    headers = [
      'lead id', 'entry date', 'entry time', 'assign date', 'agent name',
      'employee id', 'customer name', 'contact no', 'alternate no',
      'lead source', 'campaign name', 'remark', 'status', 'address'
    ];
  }

  const startLineIdx = headerIndex + 1;

  for (let i = startLineIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip blank lines

    // Parse columns (handling tabs as primary delimiter, falling back to commas if tab matches fewer than 3 cells)
    let cols = line.split('\t');
    if (cols.length < 3) {
      // Fallback CSV (handling CSV Quotes)
      cols = parseCsvLine(line);
    }

    if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) continue;

    // Helper to extract fields based on matched header index
    const getField = (headerName: string, fallbackIdx: number): string => {
      const idx = headers.indexOf(headerName);
      const activeIdx = idx !== -1 ? idx : fallbackIdx;
      let val = cols[activeIdx] || '';
      // Trim quotes if wrapped
      val = val.trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      return val.trim();
    };

    const row: LeadRow = {
      leadId: getField('lead id', 0),
      entryDate: getField('entry date', 1),
      entryTime: getField('entry time', 2),
      assignDate: getField('assign date', 3),
      agentName: getField('agent name', 4),
      employeeId: getField('employee id', 5),
      customerName: getField('customer name', 6),
      contactNo: getField('contact no', 7),
      alternateNo: getField('alternate no', 8),
      leadSource: getField('lead source', 9),
      campaignName: getField('campaign name', 10),
      remark: getField('remark', 11),
      status: getField('status', 12),
      address: getField('address', 13),
    };

    // Filter out corrupted header reprints or lines starting with LID but totally empty
    if (row.leadId && row.leadId.toUpperCase() !== 'LEAD ID') {
      parsedRows.push(row);
    }
  }

  return parsedRows;
}

// Simple helper to parse standard CSV quotes
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let currentWord = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentWord);
      currentWord = '';
    } else {
      currentWord += char;
    }
  }
  result.push(currentWord);
  return result;
}

/**
 * Aggregates logs and computes comprehensive operations metrics.
 */
export function calculateAnalytics(rows: LeadRow[]): AnalyticsSummary {
  const total = rows.length;
  if (total === 0) {
    return {
      totalLeads: 0,
      successCount: 0,
      unreachableCount: 0,
      refusedCount: 0,
      followUpCount: 0,
      otherCount: 0,
      conversionRate: 0,
      unreachableRate: 0,
      agents: [],
      campaigns: [],
      statusBreakdown: [],
      timeDistribution: [],
      addressAvailablePercentage: 0,
      commonRemarks: []
    };
  }

  // Counters
  let successCount = 0;
  let unreachableCount = 0;
  let refusedCount = 0;
  let followUpCount = 0;
  let otherCount = 0;
  let coordsWithAddress = 0;

  // Status mapping
  const statusCounts: { [key: string]: { value: number; category: StatusCategory } } = {};
  // Agent mappings
  const agentMaps: { [key: string]: { name: string; id: string; rows: LeadRow[] } } = {};
  // Campaign mappings
  const campaignMaps: { [key: string]: LeadRow[] } = {};
  // Time distribution (e.g. "9 AM", "2 PM")
  const hourMap: { [key: string]: number } = {};
  // Common remarks tracker
  const remarkMap: { [key: string]: number } = {};

  rows.forEach(row => {
    // Categorize
    const category = getStatusCategory(row.status, row.remark);
    if (category === 'Success') successCount++;
    else if (category === 'Unreachable') unreachableCount++;
    else if (category === 'Refused') refusedCount++;
    else if (category === 'FollowUp') followUpCount++;
    else otherCount++;

    // Address availability
    const addr = row.address.trim().toLowerCase();
    if (addr && addr !== 'address not available' && addr !== 'no' && addr !== 'address_not_available') {
      coordsWithAddress++;
    }

    // Status distributions
    const statusLabel = row.status.trim() || 'Unassigned / Blank';
    if (!statusCounts[statusLabel]) {
      statusCounts[statusLabel] = { value: 0, category };
    }
    statusCounts[statusLabel].value++;

    // Agent groupings
    const agentKey = (row.agentName || 'Unknown Agent').trim();
    if (!agentMaps[agentKey]) {
      agentMaps[agentKey] = { name: agentKey, id: row.employeeId || 'N/A', rows: [] };
    }
    agentMaps[agentKey].rows.push(row);

    // Campaign groupings
    const campaignKey = (row.campaignName || 'General / Unnamed').trim();
    if (!campaignMaps[campaignKey]) {
      campaignMaps[campaignKey] = [];
    }
    campaignMaps[campaignKey].push(row);

    // Hour groupings
    // parses e.g. "9:56 AM", "2:10 PM", "9:34 PM"
    const timeStr = row.entryTime.trim().toUpperCase();
    let hourLabel = 'Unknown';
    if (timeStr) {
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)/i) || timeStr.match(/^(\d+)\s*(AM|PM)/i);
      if (match) {
        const hourNum = match[1];
        const ampm = match[3] || match[2];
        hourLabel = `${hourNum} ${ampm}`;
      } else {
        // Fallback to simpler hour
        const split = timeStr.split(':');
        if (split.length > 0) {
          const ampm = timeStr.includes('PM') ? 'PM' : 'AM';
          hourLabel = `${split[0]} ${ampm}`;
        }
      }
    }
    hourMap[hourLabel] = (hourMap[hourLabel] || 0) + 1;

    // Remarks cleaning & tracking
    const cleanedRemark = (row.remark || '').trim().replace(/[.,;]/g, '');
    if (cleanedRemark && cleanedRemark.length > 2 && !cleanedRemark.toLowerCase().includes('verified') && !cleanedRemark.toLowerCase().includes('done')) {
      const remCase = cleanedRemark.substring(0, 40); // trim extremely long addresses
      remarkMap[remCase] = (remarkMap[remCase] || 0) + 1;
    }
  });

  // Calculate Agent Summaries
  const agents: AgentSummary[] = Object.values(agentMaps).map(agent => {
    let aSuccess = 0;
    let aUnreachable = 0;
    let aRefused = 0;
    let aFollowUp = 0;
    let aOther = 0;

    agent.rows.forEach(r => {
      const cat = getStatusCategory(r.status, r.remark);
      if (cat === 'Success') aSuccess++;
      else if (cat === 'Unreachable') aUnreachable++;
      else if (cat === 'Refused') aRefused++;
      else if (cat === 'FollowUp') aFollowUp++;
      else aOther++;
    });

    const aTotal = agent.rows.length;

    return {
      agentName: agent.name,
      employeeId: agent.id,
      totalLeads: aTotal,
      successCount: aSuccess,
      unreachableCount: aUnreachable,
      refusedCount: aRefused,
      followUpCount: aFollowUp,
      otherCount: aOther,
      conversionRate: parseFloat(((aSuccess / aTotal) * 100).toFixed(1)),
      unreachableRate: parseFloat(((aUnreachable / aTotal) * 100).toFixed(1))
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads); // sort by workload

  // Calculate Campaign Summaries
  const campaigns: CampaignSummary[] = Object.entries(campaignMaps).map(([name, campaignRows]) => {
    let cSuccess = 0;
    let cUnreachable = 0;
    let cRefused = 0;
    let cFollowUp = 0;

    campaignRows.forEach(r => {
      const cat = getStatusCategory(r.status, r.remark);
      if (cat === 'Success') cSuccess++;
      else if (cat === 'Unreachable') cUnreachable++;
      else if (cat === 'Refused') cRefused++;
      else if (cat === 'FollowUp') cFollowUp++;
    });

    return {
      campaignName: name,
      totalLeads: campaignRows.length,
      successCount: cSuccess,
      unreachableCount: cUnreachable,
      refusedCount: cRefused,
      followUpCount: cFollowUp,
      conversionRate: parseFloat(((cSuccess / campaignRows.length) * 100).toFixed(1))
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads);

  // Status breakdown array
  const statusBreakdown = Object.entries(statusCounts).map(([name, info]) => ({
    name,
    value: info.value,
    category: info.category
  })).sort((a, b) => b.value - a.value);

  // Sort time slots logically (morning to night if possible, or workload)
  const timeDistribution = Object.entries(hourMap).map(([hour, count]) => ({
    hour,
    count
  })).sort((a, b) => b.count - a.count);

  // Top remarks
  const commonRemarks = Object.entries(remarkMap)
    .map(([remarkText, count]) => ({ remarkText, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalLeads: total,
    successCount,
    unreachableCount,
    refusedCount,
    followUpCount,
    otherCount,
    conversionRate: parseFloat(((successCount / total) * 100).toFixed(1)),
    unreachableRate: parseFloat(((unreachableCount / total) * 100).toFixed(1)),
    agents,
    campaigns,
    statusBreakdown,
    timeDistribution,
    addressAvailablePercentage: parseFloat(((coordsWithAddress / total) * 100).toFixed(1)),
    commonRemarks
  };
}

/**
 * Preloaded TSV slice from user's attached call logs for instant loading.
 */
export const PRELOADED_SAMPLE_TSV = `LEAD ID	ENTRY DATE	ENTRY TIME	ASSIGN DATE	AGENT NAME	EMPLOYEE ID	CUSTOMER NAME	CONTACT NO	ALTERNATE NO	LEAD SOURCE	CAMPAIGN NAME	REMARK	STATUS	ADDRESS
LID496068	27-05-2026	2:13 PM	27-05-2026	Vikas Ujjwal	1359	neeta_rajgor	********63523		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496067	27-05-2026	2:13 PM	27-05-2026	Vikas Ujjwal	1359	Aman Verma	********60578		F Leads Piles	Renewal-Lead			Address Not Available
LID496066	27-05-2026	2:13 PM	27-05-2026	Vikas Ujjwal	1359	Pummy Agrahari (Nimmy)	********30475		F Leads Piles	Renewal-Lead		Call Disconnected By Customer	Address Not Available
LID496063	27-05-2026	2:13 PM	27-05-2026	Vikas Ujjwal	1359	Manish Kumar Raj	********67138		F Leads Piles	Renewal-Lead			Address Not Available
LID496062	27-05-2026	2:13 PM	27-05-2026	Vikas Ujjwal	1359	Anju Chugh	********79591		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496061	27-05-2026	2:13 PM	27-05-2026	Vikas Ujjwal	1359	Aftab khan	********30462		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496060	27-05-2026	2:13 PM	27-05-2026	Vikas Ujjwal	1359	Musarrat Parveen	********83800		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496048	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	???? ??????	********57007		F Leads Piles	Renewal-Lead		Switch Off	Address Not Available
LID496047	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	Bipin mishra	********12047		F Leads Piles	Renewal-Lead		Call Disconnected By Customer	Address Not Available
LID496046	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	Shambhu Lal Shirvastav	********65904		F Leads Piles	Renewal-Lead		Future Call Back	Address Not Available
LID496045	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	Dhal Singh	********89454		F Leads Piles	Renewal-Lead		Not Connect	Address Not Available
LID496044	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	Vishakha Thakur	********30862		F Leads Piles	Renewal-Lead		Not Connect	Address Not Available
LID496042	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	Amar Sikarwar	********82544		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496040	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	Ghanshyam Kushwaha	********86681		F Leads Piles	Renewal-Lead		Not Connect	Address Not Available
LID496039	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	its_faujdar_shab	********89435		F Leads Piles	Renewal-Lead		Switch Off	Address Not Available
LID496038	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	Shivlal Gadrishivlal	********67955		F Leads Piles	Renewal-Lead		Switch Off	Address Not Available
LID496036	27-05-2026	2:13 PM	27-05-2026	AASHU PANDEY	1478	Rajesh jaat	********47273		F Leads Piles	Renewal-Lead		Switch Off	Address Not Available
LID496028	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	khushbu__Rohit__	********15134		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496027	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Ravikant Ravi	********49431		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID496026	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Arvind Kumar Yadavansi	********25729		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496025	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Ganesh Ganesh	********41039		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID496024	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Manish Kumar	********59100		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496023	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Thakur Saini	********87751		F Leads Piles	Renewal-Lead	Verified	IN TRANSIT	S/O or C/O: i_am__thakur___saini, Govindgarh
LID496022	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	shiv	********29630		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496021	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Pankaj Saini	********86682		F Leads Piles	Renewal-Lead	Verified	IN TRANSIT	Tejaji Ka Bada, Landmark: L.B.S Public School
LID496020	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Rudra Patel	********68787		F Leads Piles	Renewal-Lead		Switch Off	Address Not Available
LID496019	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Rana?banjara	********20864		F Leads Piles	Renewal-Lead	Verified....	Delivered	Pratap nagar sector 29, Sanskrit School
LID496018	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Kishor Ghonge	********09071		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496017	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	BABLI	********51863		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID496016	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Ashutosh Lambardar Ashutosh	********80220		F Leads Piles	Renewal-Lead	rechger nhi hai	Not Interestd	Address Not Available
LID496015	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Manharan Shukla	********53935		F Leads Piles	Renewal-Lead		Switch Off	Address Not Available
LID496014	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	EeKku???.>	********60370		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID496013	27-05-2026	2:13 PM	27-05-2026	AJAY	1115	Aryan Kumar	********88853		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495105	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Ojhashiv Ojha	********50682		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495104	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Risky Jaat	********50287		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495103	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Raj Shakya	********54986		F Leads Piles	Renewal-Lead	Order Verified	Booked	S/O or C/O: Raj Shakya, Keshopur Vaishno Seva
LID495102	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	???????????? ????????????	********19421		F Leads Piles	Renewal-Lead	NI	Not Interestd	Address Not Available
LID495101	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Govind Govind Prajapati	********29541		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495100	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Nitish Kumar Yadav	********25986		F Leads Piles	Renewal-Lead	ORDER DONE	Draft	House/Flat: VASUNDHRA ENCLAVE
LID495099	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	aarti _kahar	********09674		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495098	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Sonali	********23851		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495097	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	ronak_prajapati	********27160		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495096	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Muskan Sah	********75761		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID495091	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Shivam	********86076		F Leads Piles	Renewal-Lead	Verified.	Delivered	Gagalheri Landmark
LID495090	27-05-2026	9:56 AM	27-05-2026	Chhaya Sharma	1271	Dipali	********40360		F Leads Piles	F-Lead		Not Interestd	Address Not Available
LID495089	27-05-2026	9:56 AM	27-05-2026	Chhaya Sharma	1271	Vikas	********23894		F Leads Piles	F-Lead		Ringing	Address Not Available
LID495088	27-05-2026	9:56 AM	27-05-2026	Chhaya Sharma	1271	Dolly Rathor	********18221		F Leads Piles	F-Lead	2 BJE	Call Back	Address Not Available
LID495087	27-05-2026	9:56 AM	27-05-2026	Chhaya Sharma	1271	Bapi Paswan	********57171		F Leads Piles	F-Lead		Not Connect	Address Not Available
LID495083	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	KISHOR	********10957		F Leads Piles	Renewal-Lead	Ringing No Answer	Rejected	Vikramgarh
LID495082	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	?itali Manjrekar	********32358		F Leads Piles	Renewal-Lead	BUZY	Call Back	Address Not Available
LID495081	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Sandeep Jaiswal	********24365		F Leads Piles	Renewal-Lead	wrong number	Not Interestd	Address Not Available
LID495079	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Nagendra Kumar	********53915		F Leads Piles	Renewal-Lead		Call Disconnected By Customer	Address Not Available
LID495078	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Er_Bablu_Baghel	********45150		F Leads Piles	Renewal-Lead	Ringing customer busy	Rejected	SAIVAT PUR Primary School
LID495076	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Amar	********82893		F Leads Piles	Renewal-Lead	Cx Said No Medicine Booked	Rejected	District Court Morena
LID495070	27-05-2026	9:56 AM	27-05-2026	Piyush Srivastav	1377	Patelvinod Dhurvey	********70441		F Leads Piles	Renewal-Lead			Address Not Available
LID495069	27-05-2026	9:56 AM	27-05-2026	Piyush Srivastav	1377	Poojaverma Poojaverma	********93746		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495064	27-05-2026	9:56 AM	27-05-2026	Piyush Srivastav	1377	Ajju	********31283		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID495050	27-05-2026	9:56 AM	27-05-2026	RANI THAKUR	1226	shubham bhagt	********61558		F Leads Piles	Renewal-Lead	Not raised any concern	Not Interestd	Address Not Available
LID495049	27-05-2026	9:56 AM	27-05-2026	RANI THAKUR	1226	P R I N C E	********94000		F Leads Piles	Renewal-Lead	already medicine mil gyi hai	Not Interestd	Address Not Available
LID495048	27-05-2026	9:56 AM	27-05-2026	RANI THAKUR	1226	Sonars	********17224		F Leads Piles	Renewal-Lead		Call Back	Address Not Available
LID495047	27-05-2026	9:56 AM	27-05-2026	RANI THAKUR	1226	Bhavishay	********12061		F Leads Piles	Renewal-Lead	Not raised any concern	Not Interestd	Address Not Available
LID495046	27-05-2026	9:56 AM	27-05-2026	RANI THAKUR	1226	Gulfam Khan	********08693		F Leads Piles	Renewal-Lead	already ordered another company	Not Interestd	Address Not Available
LID495045	27-05-2026	9:56 AM	27-05-2026	RANI THAKUR	1226	Ajeet Kumar	********78523		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID495043	27-05-2026	9:56 AM	27-05-2026	RANI THAKUR	1226	Zahid Mithai	********59332		F Leads Piles	Renewal-Lead	Not raised any concern	Not Interestd	Address Not Available
LID494936	27-05-2026	9:56 AM	27-05-2026	Muskan Kumari	1331	Ravi Jamre	********67151	********67151	F Leads Piles	Renewal-Lead	done	Booked	keeper Tola, Landmark: Sonu Bahe shop
LID494930	27-05-2026	9:56 AM	27-05-2026	Muskan Kumari	1331	Sachin Raj	********67792	********67792	F Leads Piles	Renewal-Lead	verified	Booked	Chander Vihar, Landmark: Sunday Market
LID494927	27-05-2026	9:56 AM	27-05-2026	Muskan Kumari	1331	Vicky Karanwar	********64611	********64611	F Leads Piles	Renewal-Lead	nhi lena h	Draft	Kamthi, Ward No: 05
LID494694	27-05-2026	9:56 AM	27-05-2026	Divyanshi	1497	Anad Ram GUrjar	********55188		F Leads Piles	OnBoarding	Verified	Booked	Kurachhon Ka Khera, Balaji mandir
LID494691	27-05-2026	9:56 AM	27-05-2026	Divyanshi	1497	Pankaj Kumar	********64927		F Leads Piles	OnBoarding	Verified.	IN TRANSIT	Padrauna Sidhua, Sidhua Baajar
LID494579	27-05-2026	9:56 AM	27-05-2026	GAURAV KUMAR	1106	MAMTA	********29973		F Leads Piles	OnBoarding	invalid number	Rejected	Indian Overseas Bank
LID494563	27-05-2026	9:56 AM	27-05-2026	GAURAV KUMAR	1106	Amer Khan	********07748		F Leads Piles	OnBoarding	Order Verified	Booked	Noida, Landmark: J. R. Chaudhary Hospital
LID494520	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	Advocaet Bhupendar Kumar	********65315		F Leads Piles	Renewal-Lead	verified	Booked	khanjipeer, Area: Malla Talai
LID494517	27-05-2026	9:56 AM	27-05-2026	AJAY	1115	DEEPAK	********96131		F Leads Piles	Renewal-Lead	verified	Booked	GOVIAN GARH station
LID494086	27-05-2026	9:56 AM	27-05-2026	GAURAV KUMAR	1106	D G     Gupta.   Up33	********15040		F Leads Piles	OnBoarding	Order Verified	IN TRANSIT	MATOSHRI NIWAAS VASANT JUNJIR
LID493935	27-05-2026	9:56 AM	27-05-2026	SAURABH KUMAR SINGH	1488	Ravi Kumar Gupta	********57408	********40547	F Leads Piles	F-Lead	verified	Booked	khanuja colony dindori
LID493063	26-05-2026	9:34 PM	27-05-2026	SAURABH KUMAR SINGH	1488	Deepak Singh	********72880		F Leads Piles	F-Lead	VERIFIED	Booked	JALPA DEVI RD, Bulanala
LID493054	26-05-2026	9:34 PM	27-05-2026	Atul dubey	1341	Dharmendra Bhashkr	********40470		F Leads Piles	F-Lead	verified	Booked	Girdhari Kapa, guru ghashidas mandir
LID492993	26-05-2026	9:34 PM	27-05-2026	SHIVANI GUPTA	1210	pramod Kumar Sahu	********27743		F Leads Piles	F-Lead	verified	Booked	Sandi Central Bank
LID492927	26-05-2026	9:34 PM	27-05-2026	KOMAL KUMARI	1036	Dinesh	********36363		F Leads Piles	OnBoarding	verified	Booked	MUNDIA KHERA
LID492882	26-05-2026	9:34 PM	27-05-2026	JYOTI KUMARI	1086	Lakshman Prasad	********59782		F Leads Piles	Renewal-Lead		Not Connect	Address Not Available
LID492880	26-05-2026	9:34 PM	27-05-2026	JYOTI KUMARI	1086	Jitendra Sinh Vaghela	********57143		F Leads Piles	Renewal-Lead		Call Disconnected By Customer	Address Not Available
LID492879	26-05-2026	9:34 PM	27-05-2026	JYOTI KUMARI	1086	Dhara Singh	********82862		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID492878	26-05-2026	9:34 PM	27-05-2026	JYOTI KUMARI	1086	Amit	********58082		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID492877	26-05-2026	9:34 PM	27-05-2026	JYOTI KUMARI	1086	????? ??????????	********76831		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID492876	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	"attitude king,"	********95140		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID492875	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Amit kumar	********15967		F Leads Piles	Renewal-Lead	CALL KAT	Call Back	Address Not Available
LID492874	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Rahul Singh	********21563		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID492871	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Krishna love rubi	********53717		F Leads Piles	Renewal-Lead	BUZY	Call Back	Address Not Available
LID492870	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Subhash Kumar Saini	********10505		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID492869	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Awanish	********16302		F Leads Piles	Renewal-Lead		Call Back	Address Not Available
LID492867	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Sachin Saini	********29219		F Leads Piles	Renewal-Lead	buzy	Call Back	Address Not Available
LID492866	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Nishant Jatt	********23981		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID492865	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	vishesh banu	********79408		F Leads Piles	Renewal-Lead	duplicatee	Rejected	village kanoda
LID492864	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Khilesvari Koshle	********54494		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID492863	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Md Sohil	********68096		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID492862	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Ajeet yadav	********49442		F Leads Piles	Renewal-Lead		Not Interestd	Address Not Available
LID492861	26-05-2026	9:34 PM	27-05-2026	AJAY	1115	Madan Madanahirwar	********71692		F Leads Piles	Renewal-Lead		Ringing	Address Not Available
LID491631	26-05-2026	1:47 PM	26-05-2026	PRASHANT KUMAR TIWARI	1155	Deepak Kumar	********53001	********53001	F Leads Piles	F-Lead	Verified.....	IN TRANSIT	rikabganj, Landmark: C.S. Convent School
LID491606	26-05-2026	1:47 PM	26-05-2026	Diksha	1484	Rahul Birla Gurjar	********81208		F Leads Piles	OnBoarding	VERIFIED	Booked	Chitra Bagh, Landmark: Shri Bilveshvar Mahadev
LID494086	27-05-2026	9:56 AM	27-05-2026	GAURAV KUMAR	1106	D G     Gupta.   Up33	********15040		F Leads Piles	OnBoarding	Order Verified	IN TRANSIT	KUNJIRWADI, Landmark: MATOSHRI NIWAAS
LID492476	26-05-2026	9:34 PM	29-05-2026	Nitika	1477	Ashok Kumar Jha	********19114		F Leads Piles	Renewal-Lead			Address Not Available
LID492475	26-05-2026	9:34 PM	29-05-2026	Nitika	1477	Chiku Sinha	********10031		F Leads Piles	Renewal-Lead			Address Not Available
LID492474	26-05-2026	9:34 PM	29-05-2026	Nitika	1477	!! ABHILASH !!	********13652		F Leads Piles	Renewal-Lead			Address Not Available
LID492473	26-05-2026	9:34 PM	29-05-2026	ARTI SINGH	1472	Uttam Kumar Roy	********20923		F Leads Piles	Renewal-Lead		Not Connect	Address Not Available
LID492472	26-05-2026	9:34 PM	29-05-2026	ARTI SINGH	1472	Sakshi Dixit	********04168		F Leads Piles	Renewal-Lead		Not Connect	Address Not Available
LID492471	26-05-2026	9:34 PM	29-05-2026	ARTI SINGH	1472	Raaz Kumar	********35834		F Leads Piles	Renewal-Lead		Not Connect	Address Not Available
LID492470	26-05-2026	9:34 PM	29-05-2026	ARTI SINGH	1472	Kanhaiya Singh	********99517		F Leads Piles	Renewal-Lead		Not Connect	Address Not Available
`;
