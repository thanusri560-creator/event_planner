import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, User, Lightbulb, MessageSquare } from 'lucide-react';
import { EventPlan } from '../types';
import { askAIConsultant } from '../logic/geminiService';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvent: EventPlan;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  activeEvent,
}) => {
  if (!isOpen) return null;

  const modalRef = useModalFocusTrap(isOpen, onClose);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: `Hello! I'm your AuraPlan AI Celebration Architect. I'm actively monitoring "${activeEvent.name}" (${activeEvent.guestCount} guests, budget ${activeEvent.currency}${activeEvent.totalBudget.toLocaleString()}). How can I help you optimize or de-risk your plan today?`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    'How do I negotiate my decoration quote down by 20%?',
    'What should I do if my venue booking is delayed 3 days?',
    'How to handle unexpected +50 guest RSVPs on the catering line?',
    'Which tasks are currently on my zero-slack Critical Path?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askAIConsultant(activeEvent, textToSend, {
        criticalTasks: activeEvent.tasks.filter((t) => t.isCriticalPath).map((t) => t.name),
        budgetDeficit: Math.max(
          0,
          activeEvent.items.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0) -
            activeEvent.totalBudget
        ),
      });

      const aiMsg: ChatMessage = {
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I encountered an issue connecting to the AI consultant server. Please check your connectivity or try again shortly.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl h-[650px] max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden focus:outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-stone-900 to-purple-950 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="copilot-title" className="text-base font-bold">
                  AuraPlan AI Copilot
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Context-aware strategic reasoning, vendor negotiations & logistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Copilot assistant"
            className="rounded-lg p-2 text-stone-300 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-stone-100 bg-stone-50 px-4 py-2 text-xs">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-semibold text-stone-500 shrink-0">Try:</span>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="rounded-full bg-white border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 whitespace-nowrap transition"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Chat message list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/40">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-purple-700 text-white rounded-br-none'
                    : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none whitespace-pre-line'
                }`}
              >
                {m.text}
                <div
                  className={`mt-1.5 text-[10px] text-right ${
                    m.sender === 'user' ? 'text-purple-200' : 'text-stone-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
              {m.sender === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-bl-none border border-stone-200 bg-white p-3 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-stone-500 font-medium ml-1">
                    Analyzing constraints & reasoning...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="border-t border-stone-200 bg-white p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about budget trade-offs, schedule float, or vendors..."
              className="flex-1 rounded-xl border border-stone-300 px-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 text-white hover:bg-purple-800 transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
