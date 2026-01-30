'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle between animated and static icon
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimated(true);
      
      // Show animated for 2 seconds, then static for 8 seconds
      setTimeout(() => {
        setIsAnimated(false);
      }, 2000);
    }, 8000); // Total cycle: 10 seconds (2s animated + 8s static)

    return () => clearInterval(interval);
  }, []);

  // Handle hover to play animation and pulse
  const handleMouseEnter = () => {
    // Clear any existing timeouts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
    
    // Show animated version and pulse
    setIsAnimated(true);
    setIsPulsing(true);
    
    // Set timeout to return to static after 2 seconds
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimated(false);
    }, 2000);
    
    // Stop pulsing after 2 seconds
    pulseTimeoutRef.current = setTimeout(() => {
      setIsPulsing(false);
    }, 2000);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message when chatbot opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm Mazwi, your ProSuite GRC assistant. I can help you with questions about your organization's risks, assets, incidents, audits, compliance, and governance. How can I assist you today?"
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add assistant response
      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.message }
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${error.message}. Please make sure your OpenAI API key is configured in .env.local file.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chatbot Icon Button */}
      <div className="fixed bottom-6 right-6 z-50 w-16 h-16">
        {/* Pulsing ring effect */}
        {isPulsing && (
          <div className="absolute inset-0 w-16 h-16 rounded-full animate-pulse-ring" />
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={handleMouseEnter}
          className="relative w-16 h-16 rounded-full shadow-2xl transition-shadow duration-200 focus:outline-none focus:ring-4 focus:ring-[#036DAD]/50 hover:shadow-3xl"
          aria-label="Open chatbot"
        >
          <Image
            src={isAnimated ? '/mazwi-animated.gif' : '/mazwi-static.png'}
            alt="Mazwi Chatbot"
            width={64}
            height={64}
            className="rounded-full"
            priority
          />
        </button>
      </div>
      
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(3, 109, 173, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(3, 109, 173, 0);
            transform: scale(1.3);
          }
          100% {
            box-shadow: 0 0 0 20px rgba(3, 109, 173, 0);
            transform: scale(1.3);
          }
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out;
        }
      `}</style>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#036DAD] to-[#024d7a] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/mazwi-static.png"
                alt="Mazwi"
                width={40}
                height={40}
                className="rounded-full border-2 bg-amber-50 border-white"
              />
              <div>
                <h3 className="font-bold text-lg">Mazwi</h3>
                <p className="text-xs text-blue-100">ProSuite GRC Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close chatbot"
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#036DAD] text-white rounded-br-sm'
                      : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2 text-gray-600">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your GRC data..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#036DAD] focus:border-transparent outline-none text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[#036DAD] text-white p-3 rounded-xl hover:bg-[#025a8f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by OpenAI • Tenant-aware responses
            </p>
          </div>
        </div>
      )}
    </>
  );
}
