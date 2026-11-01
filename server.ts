import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// AI Event Planner Consultant / Chat Assistant
app.post('/api/ai/consultant', async (req, res) => {
  try {
    const { eventSummary, question, context } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        fallback: true,
        answer: generateRuleBasedAdvice(eventSummary, question),
      });
    }

    const systemPrompt = `You are an expert event planning consultant, master negotiator, and logistics director for weddings, festivals, corporate events, and celebrations.
The user is planning an event with the following current state:
- Name: ${eventSummary?.name || 'Celebration'}
- Type: ${eventSummary?.type || 'Event'}
- Budget: ${eventSummary?.currency || '₹'}${eventSummary?.totalBudget?.toLocaleString?.() || '200000'}
- Estimated Expenditure: ${eventSummary?.currency || '₹'}${eventSummary?.estimatedTotal?.toLocaleString?.() || '200000'}
- Guests: ${eventSummary?.guestCount || 200}
- Days to Event: ${eventSummary?.daysLeft || 30}
- Status: ${eventSummary?.healthStatus || 'Planning'}

Guidelines:
1. Provide actionable, concise, and structured advice.
2. For budget cuts, suggest specific vendor negotiations, off-peak timing, or material swaps.
3. For timeline delays, suggest fast-tracking techniques (parallelizing tasks, crash duration).
4. Keep the tone encouraging, calm, and highly professional.`;

    const userPrompt = `Context details: ${JSON.stringify(context || {})}\n\nUser Question/Request: ${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const answer = response.text || generateRuleBasedAdvice(eventSummary, question);
    res.json({ success: true, answer, fallback: false });
  } catch (error: any) {
    console.error('Error in AI consultant endpoint:', error);
    res.json({
      success: true,
      fallback: true,
      answer: generateRuleBasedAdvice(req.body.eventSummary, req.body.question),
      error: error.message,
    });
  }
});

// AI Budget Optimization Rationale
app.post('/api/ai/optimize-rationale', async (req, res) => {
  try {
    const { eventSummary, overspendAmount, adjustments, priorities } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        fallback: true,
        rationale: generateBudgetRationale(eventSummary, overspendAmount, adjustments),
      });
    }

    const prompt = `You are an elite financial strategist for celebration events.
Event: ${eventSummary?.name || 'Celebration'} (${eventSummary?.type || 'Event'})
Total Budget: ${eventSummary?.currency || '₹'}${eventSummary?.totalBudget?.toLocaleString?.() || '200,000'}
Overspend Detected: ${eventSummary?.currency || '₹'}${overspendAmount?.toLocaleString?.() || '30,000'}
User Priority Tiers: ${JSON.stringify(priorities || {})}
Algorithmic Adjustments Proposed:
${JSON.stringify(adjustments, null, 2)}

Provide a concise, professional explanation for why each adjustment was chosen, why high-priority items were shielded, vendor negotiation scripts to secure these reduced rates, and how to preserve maximum guest satisfaction without feeling cheap.
Format with clean bullet points and clear sections.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      rationale: response.text || generateBudgetRationale(eventSummary, overspendAmount, adjustments),
      fallback: false,
    });
  } catch (error: any) {
    console.error('Error in budget rationale:', error);
    res.json({
      success: true,
      fallback: true,
      rationale: generateBudgetRationale(req.body.eventSummary, req.body.overspendAmount, req.body.adjustments),
    });
  }
});

// AI Mid-Flight Stress Simulation Analysis
app.post('/api/ai/stress-analysis', async (req, res) => {
  try {
    const { eventSummary, scenario, simulationResult } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        fallback: true,
        analysis: generateStressAnalysisFallback(scenario, simulationResult),
      });
    }

    const prompt = `Analyze this mid-flight stress scenario for the event "${eventSummary?.name}":
Scenario applied: ${scenario?.name} (${scenario?.description})
Feasibility Score: ${simulationResult?.feasibilityScore}%
Status: ${simulationResult?.feasibilityStatus}
Budget Overspend: ${eventSummary?.currency || '₹'}${simulationResult?.budgetDiff?.overspend?.toLocaleString?.() || 0}
Timeline Deadline Breached: ${simulationResult?.timelineDiff?.deadlineBreached ? 'YES (' + simulationResult?.timelineDiff?.daysOverdue + ' days overdue)' : 'NO'}
Conflicts Detected: ${JSON.stringify(simulationResult?.timelineDiff?.conflicts || [])}
Newly Critical Tasks: ${JSON.stringify(simulationResult?.timelineDiff?.newlyCriticalTaskIds || [])}

Provide:
1. Executive Risk Assessment (2-3 sentences on the core vulnerabilities).
2. Operational Impact Analysis (what breaks on the ground: guest experience, staff burnout, vendor friction).
3. 3 Strategic Recovery Recommendations that the planner can implement right away.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      analysis: response.text || generateStressAnalysisFallback(scenario, simulationResult),
      fallback: false,
    });
  } catch (error: any) {
    console.error('Error in stress analysis:', error);
    res.json({
      success: true,
      fallback: true,
      analysis: generateStressAnalysisFallback(req.body.scenario, req.body.simulationResult),
    });
  }
});

// AI Custom Event Plan Generator
app.post('/api/ai/generate-event-plan', async (req, res) => {
  try {
    const { userPrompt, eventType, budget, guestCount, daysUntilEvent } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        fallback: true,
        customRecommendations: [
          'Allocate 35% to Venue and 30% to Catering as prime hospitality pillars.',
          'Secure venue contract minimum 25 days before celebration day.',
          'Establish a 10% unallocated contingency fund for last-minute vendor surge pricing.',
        ],
      });
    }

    const prompt = `The user wants to plan a custom celebration:
User description: "${userPrompt}"
Event Type: ${eventType || 'Celebration'}
Total Budget: ₹${budget || 200000}
Expected Guests: ${guestCount || 200}
Planning Horizon: ${daysUntilEvent || 30} days.

Give 4 high-value strategic recommendations specific to this celebration theme, key supplier coordination tactics, and a recommended theme aesthetic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      recommendations: response.text,
      fallback: false,
    });
  } catch (error: any) {
    res.json({
      success: true,
      fallback: true,
      recommendations: 'Focus on early vendor lock-in and establish clear stage milestones.',
    });
  }
});

// Fallback rule-based engines
function generateRuleBasedAdvice(event: any, question: string): string {
  const q = (question || '').toLowerCase();
  if (q.includes('budget') || q.includes('cost') || q.includes('money') || q.includes('expensive')) {
    return `### Strategic Budget Optimization Guide
1. **Protect Core Hospitality**: Food quality & venue ambiance account for 80% of guest memory. Keep these high-priority.
2. **Trim High-Markup Categories**: Floral installations and custom pyrotechnics often carry 40%+ margins. Switch to architectural uplighting and reusable fabric draping.
3. **Consolidate Vendor Deliveries**: Ask your AV and lighting vendor to share transit logistics to reduce cartage and setup overhead.
4. **Buffer Maintenance**: Always retain at least 5% of your total budget for on-the-day incidental gratuities and quick replacements.`;
  }
  if (q.includes('timeline') || q.includes('delay') || q.includes('schedule') || q.includes('deadline')) {
    return `### Schedule Recovery & Critical Path Tactics
1. **Parallelize Downstream Tasks**: If venue confirmation is delayed, finalize catering menu tastings and print draft stationery offsite concurrently.
2. **Crash Task Durations**: Engage an assistant decorator or secondary crew for 4 hours to compress setup from 2 days to 1 day.
3. **Freeze Changes 7 Days Prior**: Stop collecting RSVPs and lock headcount exactly 10 days out so catering vendors can order raw goods without rush surcharges.`;
  }
  return `### Event Planner Insights
- **Current Health**: Your budget and critical path are within operational parameters.
- **Immediate Priority**: Ensure high-priority category contracts are signed with unambiguous cancellation clauses.
- **Tip**: Conduct a stress simulation test to verify vendor resilience before locking in non-refundable deposits.`;
}

function generateBudgetRationale(event: any, overspend: number, adjustments: any[]): string {
  return `### Optimization Strategy Rationale
- **Overrun Identification**: A ₹${(overspend || 30000).toLocaleString()} projected deficit was detected across current quotes.
- **Priority Protection**: High-priority categories (Venue and Catering) were shielded from cuts to maintain foundational event quality and guest hospitality.
- **Targeted Reductions**:
  ${(adjustments || [])
    .map(
      (a: any) =>
        `* **${a.category.toUpperCase()}**: Reduced by ₹${a.amountSaved.toLocaleString()} (${a.reason})`
    )
    .join('\n  ')}
- **Vendor Negotiation Leverage**: Ask vendors for off-peak setup window discounts or bundle AV and stagecraft with the same supplier to waive travel fees.`;
}

function generateStressAnalysisFallback(scenario: any, result: any): string {
  return `### Scenario Stress Assessment: ${scenario?.name || 'Simulation'}
- **Feasibility Score**: ${result?.feasibilityScore || 65}% (${result?.feasibilityStatus || 'at_risk'})
- **Key Vulnerability**: The applied changes introduce stress on both capacity limits and critical path float.
- **Immediate Remediation**:
  1. Approve the algorithmic budget reallocations to prevent cash-flow crunch.
  2. Crash the decoration and setup timeline by 24 hours using expedited labor.
  3. Confirm alternate vendor availability immediately for high-risk dependencies.`;
}

// Vite integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AuraPlan AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
