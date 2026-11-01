import express, { Request, Response } from 'express';
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

app.use(express.json({ limit: '1mb' }));

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

// ==========================================
// In-Memory Efficiency Cache (15-Minute TTL)
// Avoids redundant LLM invocations and optimizes latency
// ==========================================
interface CacheEntry {
  data: unknown;
  timestamp: number;
}
const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCachedData<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCachedData<T>(key: string, data: T): void {
  // Simple LRU pruning if cache grows beyond 500 entries
  if (apiCache.size > 500) {
    const oldestKey = apiCache.keys().next().value;
    if (oldestKey) apiCache.delete(oldestKey);
  }
  apiCache.set(key, { data, timestamp: Date.now() });
}

// Input sanitizer utility
function sanitize(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.replace(/<[^>]*>?/gm, '').trim();
}

// Interfaces for strongly typed request payloads
interface EventSummaryDto {
  name?: string;
  type?: string;
  currency?: string;
  totalBudget?: number;
  estimatedTotal?: number;
  guestCount?: number;
  daysLeft?: number;
  healthStatus?: string;
}

interface ProposedAdjustmentDto {
  itemId: string;
  itemName: string;
  category: string;
  priority: string;
  amountSaved: number;
  proposedCost: number;
  reason: string;
}

interface SimulationResultDto {
  feasibilityScore: number;
  feasibilityStatus: string;
  budgetDiff?: {
    overspend: number;
  };
  timelineDiff?: {
    deadlineBreached: boolean;
    daysOverdue: number;
    conflicts: string[];
    newlyCriticalTaskIds: string[];
  };
}

// ==========================================
// API Endpoints
// ==========================================

// Health and efficiency statistics check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    cacheEntries: apiCache.size,
    timestamp: new Date().toISOString(),
  });
});

// 1. AI Event Planner Consultant / Chat Assistant
app.post('/api/ai/consultant', async (req: Request, res: Response) => {
  try {
    const eventSummary = (req.body.eventSummary || {}) as EventSummaryDto;
    const question = sanitize(req.body.question);
    const context = req.body.context as Record<string, unknown> | undefined;

    if (!question) {
      return res.status(400).json({ success: false, error: 'Question cannot be empty.' });
    }

    const cacheKey = `consultant:${eventSummary.name || 'default'}:${question.toLowerCase()}`;
    const cached = getCachedData<string>(cacheKey);
    if (cached) {
      return res.json({ success: true, answer: cached, fallback: false, cached: true });
    }

    if (!ai) {
      const fallback = generateRuleBasedAdvice(eventSummary, question);
      setCachedData(cacheKey, fallback);
      return res.json({
        success: true,
        fallback: true,
        answer: fallback,
        cached: false,
      });
    }

    const systemPrompt = `You are an expert event planning consultant, master negotiator, and logistics director for weddings, festivals, corporate events, and celebrations.
The user is planning an event with the following current state:
- Name: ${sanitize(eventSummary.name) || 'Celebration'}
- Type: ${sanitize(eventSummary.type) || 'Event'}
- Budget: ${eventSummary.currency || '₹'}${eventSummary.totalBudget?.toLocaleString() || '200000'}
- Estimated Expenditure: ${eventSummary.currency || '₹'}${eventSummary.estimatedTotal?.toLocaleString() || '200000'}
- Guests: ${eventSummary.guestCount || 200}
- Days to Event: ${eventSummary.daysLeft || 30}
- Status: ${sanitize(eventSummary.healthStatus) || 'Planning'}

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
    setCachedData(cacheKey, answer);
    res.json({ success: true, answer, fallback: false, cached: false });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown AI error';
    console.error('Error in AI consultant endpoint:', errorMsg);
    res.json({
      success: true,
      fallback: true,
      answer: generateRuleBasedAdvice(req.body.eventSummary, req.body.question),
      error: 'AI service temporarily unavailable, fallback rationale applied.',
    });
  }
});

// 2. AI Budget Optimization Rationale
app.post('/api/ai/optimize-rationale', async (req: Request, res: Response) => {
  try {
    const eventSummary = (req.body.eventSummary || {}) as EventSummaryDto;
    const overspendAmount = Number(req.body.overspendAmount) || 0;
    const adjustments = (req.body.adjustments || []) as ProposedAdjustmentDto[];
    const priorities = req.body.priorities as Record<string, string> | undefined;

    const cacheKey = `rationale:${eventSummary.name || 'default'}:${overspendAmount}:${adjustments.length}`;
    const cached = getCachedData<string>(cacheKey);
    if (cached) {
      return res.json({ success: true, rationale: cached, fallback: false, cached: true });
    }

    if (!ai) {
      const fallback = generateBudgetRationale(eventSummary, overspendAmount, adjustments);
      setCachedData(cacheKey, fallback);
      return res.json({
        success: true,
        fallback: true,
        rationale: fallback,
        cached: false,
      });
    }

    const prompt = `You are an elite financial strategist for celebration events.
Event: ${sanitize(eventSummary.name) || 'Celebration'} (${sanitize(eventSummary.type) || 'Event'})
Total Budget: ${eventSummary.currency || '₹'}${eventSummary.totalBudget?.toLocaleString() || '200,000'}
Overspend Detected: ${eventSummary.currency || '₹'}${overspendAmount.toLocaleString()}
User Priority Tiers: ${JSON.stringify(priorities || {})}
Algorithmic Adjustments Proposed:
${JSON.stringify(adjustments, null, 2)}

Provide a concise, professional explanation for why each adjustment was chosen, why high-priority items were shielded, vendor negotiation scripts to secure these reduced rates, and how to preserve maximum guest satisfaction without feeling cheap.
Format with clean bullet points and clear sections.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const rationale = response.text || generateBudgetRationale(eventSummary, overspendAmount, adjustments);
    setCachedData(cacheKey, rationale);

    res.json({
      success: true,
      rationale,
      fallback: false,
      cached: false,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown AI error';
    console.error('Error in budget rationale:', errorMsg);
    res.json({
      success: true,
      fallback: true,
      rationale: generateBudgetRationale(req.body.eventSummary, req.body.overspendAmount, req.body.adjustments),
    });
  }
});

// 3. AI Mid-Flight Stress Simulation Analysis
app.post('/api/ai/stress-analysis', async (req: Request, res: Response) => {
  try {
    const eventSummary = (req.body.eventSummary || {}) as EventSummaryDto;
    const scenario = req.body.scenario as { name?: string; description?: string } | undefined;
    const simulationResult = (req.body.simulationResult || {}) as SimulationResultDto;

    const cacheKey = `stress:${sanitize(scenario?.name)}:${simulationResult.feasibilityScore}`;
    const cached = getCachedData<string>(cacheKey);
    if (cached) {
      return res.json({ success: true, analysis: cached, fallback: false, cached: true });
    }

    if (!ai) {
      const fallback = generateStressAnalysisFallback(scenario, simulationResult);
      setCachedData(cacheKey, fallback);
      return res.json({
        success: true,
        fallback: true,
        analysis: fallback,
        cached: false,
      });
    }

    const prompt = `Analyze this mid-flight stress scenario for the event "${sanitize(eventSummary.name)}":
Scenario applied: ${sanitize(scenario?.name)} (${sanitize(scenario?.description)})
Feasibility Score: ${simulationResult.feasibilityScore}%
Status: ${simulationResult.feasibilityStatus}
Budget Overspend: ${eventSummary.currency || '₹'}${simulationResult.budgetDiff?.overspend?.toLocaleString() || 0}
Timeline Deadline Breached: ${simulationResult.timelineDiff?.deadlineBreached ? 'YES (' + simulationResult.timelineDiff?.daysOverdue + ' days overdue)' : 'NO'}
Conflicts Detected: ${JSON.stringify(simulationResult.timelineDiff?.conflicts || [])}
Newly Critical Tasks: ${JSON.stringify(simulationResult.timelineDiff?.newlyCriticalTaskIds || [])}

Provide:
1. Executive Risk Assessment (2-3 sentences on core vulnerabilities).
2. Operational Impact Analysis (guest experience, staff burnout, vendor friction).
3. 3 Strategic Recovery Recommendations that the planner can implement right away.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const analysis = response.text || generateStressAnalysisFallback(scenario, simulationResult);
    setCachedData(cacheKey, analysis);

    res.json({
      success: true,
      analysis,
      fallback: false,
      cached: false,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown AI error';
    console.error('Error in stress analysis:', errorMsg);
    res.json({
      success: true,
      fallback: true,
      analysis: generateStressAnalysisFallback(req.body.scenario, req.body.simulationResult),
    });
  }
});

// 4. AI Custom Event Plan Generator
app.post('/api/ai/generate-event-plan', async (req: Request, res: Response) => {
  try {
    const userPrompt = sanitize(req.body.userPrompt);
    const eventType = sanitize(req.body.eventType) || 'Celebration';
    const budget = Number(req.body.budget) || 200000;
    const guestCount = Number(req.body.guestCount) || 200;
    const daysUntilEvent = Number(req.body.daysUntilEvent) || 30;

    const cacheKey = `plan:${eventType}:${budget}:${guestCount}:${userPrompt.slice(0, 30)}`;
    const cached = getCachedData<string[]>(cacheKey);
    if (cached) {
      return res.json({ success: true, customRecommendations: cached, fallback: false, cached: true });
    }

    if (!ai) {
      const fallbackRecommendations = [
        'Allocate 35% to Venue and 30% to Catering as prime hospitality pillars.',
        'Secure venue contract minimum 25 days before celebration day.',
        'Establish a 10% unallocated contingency fund for last-minute vendor surge pricing.',
      ];
      setCachedData(cacheKey, fallbackRecommendations);
      return res.json({
        success: true,
        fallback: true,
        customRecommendations: fallbackRecommendations,
        cached: false,
      });
    }

    const prompt = `The user wants to plan a custom celebration:
User description: "${userPrompt}"
Event Type: ${eventType}
Total Budget: ₹${budget}
Expected Guests: ${guestCount}
Planning Horizon: ${daysUntilEvent} days.

Give 4 high-value strategic recommendations specific to this celebration theme, key supplier coordination tactics, and a recommended theme aesthetic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || 'Focus on early vendor lock-in and establish clear stage milestones.';
    setCachedData(cacheKey, [text]);

    res.json({
      success: true,
      recommendations: text,
      fallback: false,
      cached: false,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown AI error';
    console.error('Error generating event plan:', errorMsg);
    res.json({
      success: true,
      fallback: true,
      recommendations: 'Focus on early vendor lock-in and establish clear stage milestones.',
    });
  }
});

// Fallback rule-based engines with strict typing
function generateRuleBasedAdvice(event: EventSummaryDto, question: string): string {
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

function generateBudgetRationale(event: EventSummaryDto, overspend: number, adjustments: ProposedAdjustmentDto[]): string {
  return `### Optimization Strategy Rationale
- **Overrun Identification**: A ₹${(overspend || 30000).toLocaleString()} projected deficit was detected across current quotes.
- **Priority Protection**: High-priority categories (Venue and Catering) were shielded from cuts to maintain foundational event quality and guest hospitality.
- **Targeted Reductions**:
  ${(adjustments || [])
    .map(
      (a) =>
        `* **${a.category.toUpperCase()}**: Reduced by ₹${a.amountSaved.toLocaleString()} (${a.reason})`
    )
    .join('\n  ')}
- **Vendor Negotiation Leverage**: Ask vendors for off-peak setup window discounts or bundle AV and stagecraft with the same supplier to waive travel fees.`;
}

function generateStressAnalysisFallback(
  scenario: { name?: string; description?: string } | undefined,
  result: SimulationResultDto
): string {
  return `### Scenario Stress Assessment: ${scenario?.name || 'Simulation'}
- **Feasibility Score**: ${result.feasibilityScore || 65}% (${result.feasibilityStatus || 'at_risk'})
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
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AuraPlan AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
