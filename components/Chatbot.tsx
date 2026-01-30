'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, Loader2, Maximize2, Minimize2, History, MessageSquare, Plus, Trash2 } from 'lucide-react';
import ChatGraph from './ChatGraph';

interface GraphData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: Array<{ name: string; value: number }>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  graphs?: GraphData[];
}

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
  messages: Message[];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showHistoryPopover, setShowHistoryPopover] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>('current');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('mazwi_conversations');
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // Convert timestamp strings back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp)
        }));
        setConversations(conversationsWithDates);
        
        // Load the most recent conversation (first in array)
        if (conversationsWithDates.length > 0) {
          const mostRecentConv = conversationsWithDates[0];
          setCurrentConversationId(mostRecentConv.id);
          setMessages(mostRecentConv.messages || []);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        initializeConversations();
      }
    } else {
      initializeConversations();
    }
  }, []);
  
  // Initialize with a default conversation
  const initializeConversations = () => {
    const defaultConversation: Conversation = {
      id: 'current',
      title: 'New Conversation',
      timestamp: new Date(),
      preview: 'Start chatting...',
      messages: []
    };
    setConversations([defaultConversation]);
    saveConversationsToStorage([defaultConversation]);
  };
  
  // Save conversations to localStorage
  const saveConversationsToStorage = (convs: Conversation[]) => {
    try {
      localStorage.setItem('mazwi_conversations', JSON.stringify(convs));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };
  
  // Save current conversation whenever messages change
  useEffect(() => {
    if (conversations.length > 0) {
      const updatedConversations = conversations.map(conv => {
        if (conv.id === currentConversationId) {
          // Generate title from first user message if not set
          let title = conv.title;
          let preview = conv.preview;
          
          if (messages.length > 0 && (title === 'New Conversation' || title === 'Current Conversation')) {
            const firstUserMessage = messages.find(m => m.role === 'user');
            if (firstUserMessage) {
              title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
              preview = firstUserMessage.content.substring(0, 100);
            }
          }
          
          return {
            ...conv,
            title,
            preview,
            messages,
            timestamp: new Date()
          };
        }
        return conv;
      });
      
      setConversations(updatedConversations);
      saveConversationsToStorage(updatedConversations);
    }
  }, [messages]);
  
  // Create new conversation
  const createNewConversation = () => {
    // Don't create new conversation if current one is empty
    const currentConv = conversations.find(c => c.id === currentConversationId);
    if (currentConv && currentConv.messages.length === 0) {
      // Current conversation is empty, don't create a new one
      return;
    }
    
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      timestamp: new Date(),
      preview: 'Start chatting...',
      messages: []
    };
    
    const updatedConversations = [newConv, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversationId(newConv.id);
    setMessages([]);
    saveConversationsToStorage(updatedConversations);
  };
  
  // Switch conversation
  const switchConversation = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      setMessages(conv.messages || []);
    }
  };
  
  // Delete conversation
  const deleteConversation = (convId: string, e?: React.MouseEvent) => {
    // Prevent triggering parent click event
    e?.stopPropagation();
    
    // Don't allow deleting if it's the only conversation
    if (conversations.length <= 1) {
      return;
    }
    
    const updatedConversations = conversations.filter(c => c.id !== convId);
    setConversations(updatedConversations);
    saveConversationsToStorage(updatedConversations);
    
    // If deleting current conversation, switch to the first one
    if (convId === currentConversationId) {
      const firstConv = updatedConversations[0];
      setCurrentConversationId(firstConv.id);
      setMessages(firstConv.messages || []);
    }
  };

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

  // Parse graphs from AI response
  const parseGraphs = (content: string): { content: string; graphs: GraphData[] } => {
    const graphs: GraphData[] = [];
    let cleanContent = content;

    // Match [GRAPH:type:title]...data...[/GRAPH]
    const graphRegex = /\[GRAPH:(bar|pie|line):([^\]]+)\]\s*(\[[\s\S]*?\])\s*\[\/GRAPH\]/g;
    let match;

    while ((match = graphRegex.exec(content)) !== null) {
      try {
        const type = match[1] as 'bar' | 'pie' | 'line';
        const title = match[2].trim();
        const dataStr = match[3];
        const data = JSON.parse(dataStr);

        graphs.push({ type, title, data });
        
        // Remove graph marker from content
        cleanContent = cleanContent.replace(match[0], '');
      } catch (error) {
        console.error('Failed to parse graph:', error);
      }
    }

    return { content: cleanContent.trim(), graphs };
  };

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

      // Parse graphs from response
      const { content, graphs } = parseGraphs(data.message);

      // Add assistant response with graphs
      setMessages([
        ...newMessages,
        { role: 'assistant', content, graphs }
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
      <div className="fixed bottom-6 right-6 z-[60] w-16 h-16">
        {/* Pulsing ring effect */}
        {isPulsing && (
          <div className="absolute inset-0 w-16 h-16 rounded-full animate-pulse-ring" />
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={handleMouseEnter}
          className="relative w-16 h-16 bg-white rounded-full shadow-2xl transition-shadow duration-200 focus:outline-none focus:ring-4 focus:ring-[#036DAD]/50 hover:shadow-3xl"
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
        <div className={`fixed z-50 bg-white rounded-2xl shadow-2xl flex border border-gray-200 overflow-hidden transition-all duration-300 ${
          isMaximized 
            ? 'top-4 left-4 right-4 bottom-24' 
            : 'bottom-24 right-6 w-96 h-[600px]'
        }`}>
          {/* History Sidebar (visible when maximized) */}
          {isMaximized && (
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
              {/* History Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <History size={18} />
                    History
                  </h3>
                  <button
                    onClick={createNewConversation}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                    aria-label="New conversation"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              
              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`relative group border-b border-gray-200 ${
                      currentConversationId === conv.id ? 'bg-blue-50 border-l-4 border-l-[#036DAD]' : ''
                    }`}
                  >
                    <button
                      onClick={() => switchConversation(conv.id)}
                      className="w-full text-left p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare size={16} className="mt-1 flex-shrink-0 text-gray-500" />
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="font-medium text-sm text-gray-900 truncate">{conv.title}</p>
                          <p className="text-xs text-gray-500 truncate">{conv.preview}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {conv.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                    {conversations.length > 1 && (
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all text-red-600"
                        aria-label="Delete conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#036DAD] to-[#024d7a] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* History button (only in normal mode) */}
                {!isMaximized && (
                  <button
                    onClick={() => setShowHistoryPopover(!showHistoryPopover)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors relative"
                    aria-label="Show history"
                  >
                    <History size={20} />
                  </button>
                )}
                
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
              <div className="flex items-center gap-2">
                <button
                  onClick={createNewConversation}
                  className={`flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors ${
                    isMaximized ? 'px-3 py-1.5 text-sm font-medium' : 'p-1'
                  }`}
                  aria-label="New chat"
                >
                  <Plus size={isMaximized ? 16 : 20} />
                  {isMaximized && <span>New Chat</span>}
                </button>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMaximized ? "Minimize chatbot" : "Maximize chatbot"}
                >
                  {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close chatbot"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* History Popover (visible in normal mode when toggled) */}
            {!isMaximized && showHistoryPopover && (
              <div className="absolute top-16 left-4 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-10 max-h-96 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <History size={16} />
                    History
                  </h3>
                  <button
                    onClick={() => setShowHistoryPopover(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="overflow-y-auto">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`relative group border-b border-gray-100 ${
                        currentConversationId === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => {
                          switchConversation(conv.id);
                          setShowHistoryPopover(false);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="pr-8">
                          <p className="font-medium text-sm text-gray-900 truncate">{conv.title}</p>
                          <p className="text-xs text-gray-500 truncate">{conv.preview}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {conv.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                      {conversations.length > 1 && (
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all text-red-600"
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user' ? '' : 'w-full'
                  }`}
                >
                  {/* Graphs (only for assistant messages) */}
                  {message.role === 'assistant' && message.graphs && message.graphs.length > 0 && (
                    <div className="mb-2">
                      {message.graphs.map((graph, graphIndex) => (
                        <ChatGraph
                          key={graphIndex}
                          type={graph.type}
                          title={graph.title}
                          data={graph.data}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Message content */}
                  {message.content && (
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-[#036DAD] text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}
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
        </div>
      )}
    </>
  );
}
