import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initializer for Google GenAI client
let aiClient: any = null;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured. Please supply a valid Gemini API key in Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// AI analysis and corrective action diagnostic route
app.post("/api/analyze", async (req, res) => {
  try {
    const { summaryData, sampleRows } = req.body;

    if (!summaryData) {
      return res.status(400).json({ error: "Missing call metric summary context." });
    }

    const ai = getAiClient();

    // Structuring the prompt using exact stats gathered from the call sheets to prevent hallucinations.
    const prompt = `
Analyze the following Call Center performance metrics and call log sample to diagnose operation issues and generate clear, blunt, highly actionable corrective actions.
The calling campaign is for a health product (specifically treatment/remedy for Piles, as noted by "F Leads Piles" and mentions of ordering "meds" or "piles complications"). 

### CONTEXT LOG METRICS SUMMARY:
- Total Leads Dialed: ${summaryData.totalLeads}
- Success/Confirmed Rate: ${summaryData.conversionRate}% (${summaryData.successCount} Booked/Transit/Delivered)
- Customer Reachability Unreachable Rate: ${summaryData.unreachableRate}% (${summaryData.unreachableCount} Rang/Disconnected/No-Answer/Switch-offs)
- Rejection/Refusal Count: ${summaryData.refusedCount} (Customers stating "Not Interested", "Rejected", or hanging up)
- Pending/FollowUp Count: ${summaryData.followUpCount}

### OBSERVED KEY REMARKS CATEGORIES:
${JSON.stringify(summaryData.commonRemarks || [])}

### ACTIVE CALL AGENTS PERFORMANCE SCORECARD:
${JSON.stringify(summaryData.agents || [])}

### CAMPAIGN SEGMENT REACH:
${JSON.stringify(summaryData.campaigns || [])}

### SAMPLE RECENT LEADS (First 15 Logs Segment):
${JSON.stringify(sampleRows || [])}

Provide detailed operational diagnosis.
Highlight specific agents who need coaching/retraining or warning letters:
- Identify who has high dials but almost zero conversions.
- Identify who has excessive "Switch Off" or "No Connection" classifications which could indicate lack of dialing attempts or calling cold hours.
- Identify top star agents to share best practices.

Critique lead quality, identifying duplicate ratios, fake names parsed (such as "???" placeholders), invalid contacts, and address completeness (${summaryData.addressAvailablePercentage}% valid addresses).
Identify operational changes (e.g. matching calling schedule to high-connection periods) and coaching scripting to counter common customer excuses (like already took medication, call cut, didn't request).
    `;

    // Strict schema representation to force accurate, structured response JSON
    const aiResponseSchema = {
      type: Type.OBJECT,
      properties: {
        executiveSummary: {
          type: Type.STRING,
          description: "Blunt executive diagnostic of root causes of the call center's performance and conversion bottlenecks."
        },
        correctiveActions: {
          type: Type.OBJECT,
          properties: {
            agentPerformance: {
              type: Type.ARRAY,
              description: "Array of raw names of calling agents needing specific intervention, detail what warn/train actions to apply, and reference specific stats proving the need.",
              items: {
                type: Type.OBJECT,
                properties: {
                  agentName: { type: Type.STRING },
                  action: { type: Type.STRING, description: "Direct corrective action e.g., 'Warning Letter for low performance', 'Mandatory retrial coaching', or 'Promote as team leader'" },
                  reason: { type: Type.STRING, description: "Concrete statistical reason based on metrics (e.g., '0% conversions out of 100 leads' or 'Excessive disconnection marked')" }
                },
                required: ["agentName", "action", "reason"]
              }
            },
            leadQuality: {
              type: Type.STRING,
              description: "Detailed critique and warning on incoming lead quality, addressing placeholder names, invalid numbers, and address collection issues."
            },
            operationalOptimizations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific adjustments to schedules, dialing intervals, or workload allocations."
            },
            scriptingSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific script responses to handle common patient/client objections like 'no need', 'already taken other pills', 'hanging up'."
            }
          },
          required: ["agentPerformance", "leadQuality", "operationalOptimizations", "scriptingSuggestions"]
        },
        remedialStrategicActionPlan: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Strict chronological, high-priority 5-step corrective action outline to boost overall success rates starting tomorrow."
        }
      },
      required: ["executiveSummary", "correctiveActions", "remedialStrategicActionPlan"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert sales operations consultant and call center turnaround manager. You speak objectively, with clean, direct, data-grounded insights, and prefer highly tactical corrective directives over general corporate jargon.",
        responseMimeType: "application/json",
        responseSchema: aiResponseSchema,
        temperature: 0.1
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json(parsedJson);

  } catch (error: any) {
    console.error("AI Diagnostic Error:", error);
    res.status(500).json({
      error: "Failed to compile AI insights",
      details: error.message || "Unknown error encountered."
    });
  }
});

// Configure Vite middleware in development vs standard asset host in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring development server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring production server serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
