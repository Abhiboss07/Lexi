import type {
  ConversationScenarioDefinition,
  TurnFeedback,
} from '../types/conversationCoach';
import type { PracticeDifficulty } from '../types/practicePreferences';
import { evaluateLearnerTurn } from './conversationFeedbackService';

export interface ConversationTurnContext {
  scenario: ConversationScenarioDefinition;
  turnIndex: number;
  userMessage: string;
  chatHistory: Array<{ sender: 'ai' | 'user'; text: string }>;
  learnerCefrLevel?: string;
  practiceDifficulty?: PracticeDifficulty;
}

export interface ConversationAIResult {
  partnerReply: string;
  feedback: TurnFeedback;
  providerType: 'cloud-ai' | 'local-engine';
  statusNote: string;
}

export interface IConversationAIProvider {
  processTurn(context: ConversationTurnContext): Promise<ConversationAIResult>;
  isLiveAIConfigured(): boolean;
}

/**
 * Deterministic local conversational partner engine.
 * Generates natural, context-aware partner dialogue following multi-turn scenario steps.
 * Explicitly transparent: Does not misrepresent deterministic rules as cloud LLM output.
 */
export function generateLocalPartnerReply(context: ConversationTurnContext): string {
  const { scenario, turnIndex, userMessage } = context;
  const lowerMsg = userMessage.toLowerCase().trim();

  // 1. Café Scenario
  if (scenario.id === 'cafe') {
    if (turnIndex === 0) {
      if (lowerMsg.includes('oat milk') || lowerMsg.includes('iced latte')) {
        return "Wonderful phrasing! One iced oat milk latte, wonderful choice! What size would you like: regular or large, and can I get you any fresh pastries today?";
      }
      if (lowerMsg.includes('cappuccino')) {
        return "Wonderful phrasing! A large cappuccino, perfect! Would you like that with whole milk or oat milk, and should I add any cinnamon on top?";
      }
      if (lowerMsg.includes('pastry') || lowerMsg.includes('pastries') || lowerMsg.includes('have fresh')) {
        return "Wonderful phrasing! We have fresh almond croissants, warm blueberry scones, and chocolate chip cookies today! What drink can I get started for you?";
      }
      return "Wonderful phrasing! Let me ask: Would you like that regular or large, and can I get you anything fresh to eat with that?";
    }
    if (turnIndex === 1) {
      if (lowerMsg.includes('pastry') || lowerMsg.includes('croissant') || lowerMsg.includes('scone')) {
        return "I will add that fresh pastry to your order! That comes to £4.50 in total. Will you be paying by card or cash today?";
      }
      if (lowerMsg.includes('large') || lowerMsg.includes('regular') || lowerMsg.includes('iced') || lowerMsg.includes('hot')) {
        return "Got it, regular and iced! We have warm almond croissants fresh out of the oven if you'd like a treat. That will be £3.80. Paying with contactless card?";
      }
      return "Great choice! That comes to £4.20. You can tap your card or phone right on the reader whenever you are ready.";
    }
    return "All set! Your receipt is in the bag and your drink is being handcrafted at the pickup counter. Have a wonderful morning!";
  }

  // 2. Workplace Introductions
  if (scenario.id === 'introductions') {
    if (turnIndex === 0) {
      if (lowerMsg.includes('marketing') || lowerMsg.includes('design') || lowerMsg.includes('engineering') || lowerMsg.includes('product')) {
        return "Welcome aboard! It's fantastic to have you here. What kind of projects will you be focusing on during your first few weeks?";
      }
      return "Welcome aboard! It's fantastic to have you here. What kind of projects are you most excited to work on with the team?";
    }
    if (turnIndex === 1) {
      return "That sounds like a high-impact initiative! Our design team collaborates closely with your group. Let's definitely grab a coffee or virtual lunch sometime this week.";
    }
    return "That would be wonderful! I'll ping you on Slack to set up a quick catch-up. Don't hesitate to reach out if you need anything while onboarding!";
  }

  // 3. Travel & Directions (London Tube)
  if (scenario.id === 'travel') {
    if (turnIndex === 0) {
      if (lowerMsg.includes('covent garden') || lowerMsg.includes('piccadilly') || lowerMsg.includes('underground') || lowerMsg.includes('tube')) {
        return "You're only a two-minute walk away! Just head straight past the red post office on your right, and take your first left at the traffic lights.";
      }
      return "You're only a two-minute walk away! Just head straight past the post office and take your first left.";
    }
    if (turnIndex === 1) {
      return "Exactly right! It's less than three minutes on foot. You can't miss the iconic red and blue roundel sign above the station steps.";
    }
    return "You are very welcome! Safe travels around London, and have a lovely rest of your day exploring the West End!";
  }

  // 4. Hotel Check-In
  if (scenario.id === 'hotel') {
    if (turnIndex === 0) {
      return "Welcome! Everything is confirmed for your stay. You're in room 412 on the fourth floor. Do you have any questions before I hand you the room keys?";
    }
    if (turnIndex === 1) {
      if (lowerMsg.includes('breakfast') || lowerMsg.includes('time') || lowerMsg.includes('wifi') || lowerMsg.includes('wi-fi')) {
        return "Breakfast is served from 7:00 to 10:30 AM on the mezzanine floor, and high-speed Wi-Fi is complimentary with the code on your key packet. Would you like any help with your luggage?";
      }
      return "The mezzanine restaurant serves breakfast starting at 7 AM, and the elevators are right around the corner. Can our bellhop assist with your bags?";
    }
    return "You're all set! Here is your keycard. Enjoy your stay at The Grand View, and please dial 0 from your room if you need anything at all.";
  }

  // 5. Workplace Standup
  if (scenario.id === 'standup') {
    if (turnIndex === 0) {
      return "Awesome update! Thanks for keeping the pull requests moving. Do you have any blockers on your tickets, or do you need another pair of eyes on the PR?";
    }
    if (turnIndex === 1) {
      return "I will review your PR right after standup! Are we still on track for staging deployment this afternoon?";
    }
    return "Great to hear! That wraps up your update smoothly. Let's pass the microphone over to the next teammate.";
  }

  // 6. Restaurant Dining
  if (scenario.id === 'restaurant') {
    if (turnIndex === 0) {
      return "Buonasera! Right this way to a cozy table by the window. Our handmade gnocchi with sage butter is vegetarian and exceptional! What catches your eye for main courses?";
    }
    if (turnIndex === 1) {
      return "No tree nuts at all, just organic butter, fresh sage, and aged parmesan! I will have the kitchen fire that up for you right away. Enjoy the sparkling water in the meantime!";
    }
    return "I am so delighted you enjoyed the gnocchi! Here is the bill at your convenience. You can pay by card or cash whenever you are ready. Grazie!";
  }

  // 7. Expressing Opinions
  if (scenario.id === 'opinions') {
    if (turnIndex === 0) {
      return "That is a well-reasoned distinction! Some folks feel isolated when they don't see teammates for weeks. How do you think teams can prevent that disconnect?";
    }
    if (turnIndex === 1) {
      return "Anchor days sound like a healthy compromise! It respects individual focus while ensuring team cohesion. What do you think should be our top takeaway for the survey report?";
    }
    return "I completely agree — autonomy and trust empower people much more than rigid rules. Thanks for sharing your insights, that will make our survey report much richer!";
  }

  // Fallback scenario response
  const currentStep = scenario.steps[turnIndex] || scenario.steps[scenario.steps.length - 1];
  if (currentStep) {
    return currentStep.partnerPrompt;
  }
  return "That makes complete sense! Thank you for sharing. What else would you like to discuss?";
}

export class ConversationCoachAIService implements IConversationAIProvider {
  private readonly proxyUrl?: string;
  private readonly apiKey?: string;

  constructor() {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      this.proxyUrl = (import.meta as any).env.VITE_AI_PROXY_URL;
      this.apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    }
  }

  isLiveAIConfigured(): boolean {
    return Boolean(this.proxyUrl || (this.apiKey && this.apiKey.length > 10));
  }

  async processTurn(context: ConversationTurnContext): Promise<ConversationAIResult> {
    // 1. Evaluate learner input using linguistic rule engine
    const localFeedback = evaluateLearnerTurn(
      context.userMessage,
      context.scenario.cefrLevel
    );

    // 2. If no cloud provider configured or running in offline mode, return local deterministic engine
    if (!this.isLiveAIConfigured() || typeof navigator !== 'undefined' && !navigator.onLine) {
      const localReply = generateLocalPartnerReply(context);
      return {
        partnerReply: localReply,
        feedback: localFeedback,
        providerType: 'local-engine',
        statusNote: 'Local Linguistic Engine (Offline-First)',
      };
    }

    // 3. Attempt cloud AI processing with timeout & safe fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const endpoint = this.proxyUrl || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      const url = this.apiKey ? `${endpoint}?key=${this.apiKey}` : endpoint;

      const promptPayload = {
        contents: [
          {
            parts: [
              {
                text: `You are an English conversation partner named ${context.scenario.partner} (${context.scenario.partnerRole}) in scenario "${context.scenario.title}".
CEFR Level: ${context.scenario.cefrLevel}.
Context: ${context.scenario.contextDescription}.
Learner says: "${context.userMessage}".
Turn: ${context.turnIndex + 1}.

Respond strictly in JSON with this schema:
{
  "partnerReply": "Your in-character reply (1-3 natural conversational sentences)",
  "praise": "Brief note on what the learner did well",
  "naturalAlternative": "A more natural native phrasing"
}`,
              },
            ],
          },
        ],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI Provider HTTP status: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty AI response payload');

      // Extract JSON from potential markdown fences
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Malformed AI JSON response');
      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.partnerReply || typeof parsed.partnerReply !== 'string') {
        throw new Error('Missing partnerReply in AI response');
      }

      // Merge cloud enrichment with local linguistic feedback
      const enrichedFeedback: TurnFeedback = {
        ...localFeedback,
        praise: parsed.praise || localFeedback.praise,
        naturalAlternative: parsed.naturalAlternative || localFeedback.naturalAlternative,
      };

      return {
        partnerReply: parsed.partnerReply.trim(),
        feedback: enrichedFeedback,
        providerType: 'cloud-ai',
        statusNote: 'Cloud AI Enhanced',
      };
    } catch (err) {
      console.warn('AI Provider unavailable or timed out; activating local linguistic fallback:', err);
      const fallbackReply = generateLocalPartnerReply(context);
      return {
        partnerReply: fallbackReply,
        feedback: localFeedback,
        providerType: 'local-engine',
        statusNote: 'Local Linguistic Engine (Offline Fallback)',
      };
    }
  }
}

export const conversationCoachAIService = new ConversationCoachAIService();
