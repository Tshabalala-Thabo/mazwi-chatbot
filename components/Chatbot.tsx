'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, Loader2, Maximize2, Minimize2, History, MessageSquare, Plus, Trash2, Download, Volume2, VolumeX, Settings, Sparkles, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import ChatGraph from './ChatGraph';
import jsPDF from 'jspdf';

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
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState<string>('current');
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimated, setIsAnimated] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<string>('onyx');
    const [voiceModel, setVoiceModel] = useState<'tts-1' | 'tts-1-hd'>('tts-1');
    const [showSpeechBubble, setShowSpeechBubble] = useState(false);
    const [speechBubbleType, setSpeechBubbleType] = useState<'login' | 'open'>('login');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Check if user just logged in (simulate 30-day absence)
    useEffect(() => {
        const lastLoginTime = localStorage.getItem('mazwi_last_login');
        const now = Date.now();
        
        // If no last login or more than 30 days (simulated as always show for demo)
        if (!lastLoginTime) {
            // Show login speech bubble after a short delay
            setTimeout(() => {
                setShowSpeechBubble(true);
                setSpeechBubbleType('login');
            }, 1000);
        }
        
        // Update last login time
        localStorage.setItem('mazwi_last_login', now.toString());
    }, []);
    
    // Show speech bubble when chatbot opens
    useEffect(() => {
        if (isOpen && !showSpeechBubble) {
            setTimeout(() => {
                setShowSpeechBubble(true);
                setSpeechBubbleType('open');
            }, 500);
        }
    }, [isOpen]);

    // Load conversations from localStorage on mount
    useEffect(() => {
        const savedConversations = localStorage.getItem('mazwi_conversations');
        const savedVoiceSettings = localStorage.getItem('mazwi_voice_settings');

        if (savedConversations) {
            try {
                const parsed = JSON.parse(savedConversations);
                const conversationsWithDates = parsed.map((conv: any) => ({
                    ...conv,
                    timestamp: new Date(conv.timestamp)
                }));
                setConversations(conversationsWithDates);

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

        // Load voice settings
        if (savedVoiceSettings) {
            try {
                const voiceSettings = JSON.parse(savedVoiceSettings);
                // Validate that the saved voice is a valid OpenAI voice
                const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
                const savedVoice = voiceSettings.selectedVoice;
                
                if (savedVoice && validVoices.includes(savedVoice)) {
                    setSelectedVoice(savedVoice);
                } else {
                    // Reset to default if invalid voice (e.g., old browser voice)
                    setSelectedVoice('onyx');
                }
                
                setVoiceModel(voiceSettings.model || 'tts-1');
                setVoiceEnabled(voiceSettings.enabled || false);
            } catch (error) {
                console.error('Error loading voice settings:', error);
            }
        }
    }, []);

    // Save voice settings to localStorage
    useEffect(() => {
        const voiceSettings = {
            selectedVoice,
            model: voiceModel,
            enabled: voiceEnabled
        };
        localStorage.setItem('mazwi_voice_settings', JSON.stringify(voiceSettings));
    }, [selectedVoice, voiceModel, voiceEnabled]);

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
        const currentConv = conversations.find(c => c.id === currentConversationId);
        if (currentConv && currentConv.messages.length === 0) {
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

    // OpenAI TTS voices with descriptions
    const openAIVoices = [
        { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced' },
        { id: 'echo', name: 'Echo', description: 'Male, clear' },
        { id: 'fable', name: 'Fable', description: 'Male, warm' },
        { id: 'onyx', name: 'Onyx', description: 'Male, deep, professional' },
        { id: 'nova', name: 'Nova', description: 'Female, friendly' },
        { id: 'shimmer', name: 'Shimmer', description: 'Female, soft' },
    ];

    // Text-to-speech function using OpenAI TTS API
    const speakText = async (text: string) => {
        if (!voiceEnabled) {
            return;
        }

        // Stop any ongoing speech
        stopSpeaking();

        // Remove graph markers from text before speaking
        const cleanText = text.replace(/\[GRAPH:.*?\].*?\[\/GRAPH\]/gs, '');

        if (!cleanText.trim()) return;

        setIsSpeaking(true);

        try {
            // Call our TTS API endpoint
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: cleanText,
                    voice: selectedVoice,
                    model: voiceModel,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('TTS API error:', errorData);
                throw new Error(errorData.error || 'Failed to generate speech');
            }

            // Get audio blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create and play audio
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                console.error('Audio playback error');
            };

            await audio.play();
        } catch (error) {
            console.error('TTS error:', error);
            setIsSpeaking(false);
        }
    };

    // Stop speaking
    const stopSpeaking = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsSpeaking(false);
    };

    // Toggle voice mode
    const toggleVoiceMode = () => {
        if (voiceEnabled) {
            stopSpeaking();
        }
        setVoiceEnabled(!voiceEnabled);
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            stopSpeaking();
        };
    }, []);

    // Auto-speak new assistant messages when voice mode is enabled
    useEffect(() => {
        if (voiceEnabled && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.content) {
                setTimeout(() => {
                    speakText(lastMessage.content);
                }, 300);
            }
        }
    }, [messages, voiceEnabled]);

    // Delete conversation
    const deleteConversation = (convId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (conversations.length <= 1) {
            return;
        }

        const updatedConversations = conversations.filter(c => c.id !== convId);
        setConversations(updatedConversations);
        saveConversationsToStorage(updatedConversations);

        if (convId === currentConversationId) {
            const firstConv = updatedConversations[0];
            setCurrentConversationId(firstConv.id);
            setMessages(firstConv.messages || []);
        }
    };

    // Export conversation to PDF
    const exportToPDF = async () => {
        const currentConv = conversations.find(c => c.id === currentConversationId);
        if (!currentConv || messages.length === 0) {
            return;
        }

        let userName = 'User';
        let organizationName = 'Organization';
        try {
            const response = await fetch('/api/dashboard');
            const data = await response.json();
            if (data.tenant) {
                organizationName = data.tenant.tenant_name || 'Organization';
            }
            if (data.user) {
                userName = data.user.name || data.user.email || 'User';
            }
        } catch (error) {
            console.error('Error fetching user info for PDF:', error);
        }

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Add title
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Mazwi Chat Conversation', margin, yPosition);
        yPosition += 10;

        // Add metadata
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100);
        pdf.text(`Organization: ${organizationName}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`User: ${userName}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Conversation: ${currentConv.title}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Date: ${currentConv.timestamp.toLocaleString()}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Messages: ${messages.length}`, margin, yPosition);
        yPosition += 12;

        // Add separator line
        pdf.setDrawColor(200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Add messages
        messages.forEach((message, index) => {
            if (yPosition > pageHeight - 40) {
                pdf.addPage();
                yPosition = margin;
            }

            // Message header
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0);

            if (message.role === 'user') {
                pdf.setTextColor(3, 109, 173);
                pdf.text('You:', margin, yPosition);
            } else {
                pdf.setTextColor(34, 139, 34);
                pdf.text('Mazwi:', margin, yPosition);
            }
            yPosition += 7;

            // Message content
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0);

            const lines = pdf.splitTextToSize(message.content, maxWidth);
            lines.forEach((line: string) => {
                if (yPosition > pageHeight - 30) {
                    pdf.addPage();
                    yPosition = margin;
                }
                pdf.text(line, margin, yPosition);
                yPosition += 5;
            });

            // Add graph info if present
            if (message.graphs && message.graphs.length > 0) {
                yPosition += 3;
                pdf.setTextColor(100);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'italic');
                message.graphs.forEach((graph) => {
                    if (yPosition > pageHeight - 30) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(`[Graph: ${graph.title}]`, margin + 5, yPosition);
                    yPosition += 5;
                });
            }

            yPosition += 8;

            if (index < messages.length - 1) {
                pdf.setDrawColor(230);
                pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 8;
            }
        });

        // Add footer
        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(
                `Page ${i} of ${totalPages} | Generated by Mazwi - ProSuite GRC Assistant`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        const fileName = `mazwi-chat-${currentConv.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;
        pdf.save(fileName);
    };

    // Toggle between animated and static icon
    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimated(true);

            setTimeout(() => {
                setIsAnimated(false);
            }, 2000);
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    // Handle hover to play animation and pulse
    const handleMouseEnter = () => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        if (pulseTimeoutRef.current) {
            clearTimeout(pulseTimeoutRef.current);
        }

        setIsAnimated(true);
        setIsPulsing(true);

        animationTimeoutRef.current = setTimeout(() => {
            setIsAnimated(false);
        }, 2000);

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

        const graphRegex = /\[GRAPH:(bar|pie|line):([^\]]+)\]\s*(\[[\s\S]*?\])\s*\[\/GRAPH\]/g;
        let match;

        while ((match = graphRegex.exec(content)) !== null) {
            try {
                const type = match[1] as 'bar' | 'pie' | 'line';
                const title = match[2].trim();
                const dataStr = match[3];
                const data = JSON.parse(dataStr);

                graphs.push({ type, title, data });
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
                    conversationHistory: messages.slice(-10)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const { content, graphs } = parseGraphs(data.message);

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
    
    // Handle quick action clicks
    const handleQuickAction = (action: string) => {
        setShowSpeechBubble(false);
        setIsOpen(true);
        
        // Set the input and send the message
        setTimeout(() => {
            setInput(action);
            // Trigger send after a brief delay
            setTimeout(() => {
                const userMessage = action;
                setInput('');
                
                const newMessages: Message[] = [
                    ...messages,
                    { role: 'user', content: userMessage }
                ];
                setMessages(newMessages);
                setIsLoading(true);
                
                fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: userMessage,
                        conversationHistory: messages.slice(-10)
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        const { content, graphs } = parseGraphs(data.message);
                        setMessages([
                            ...newMessages,
                            { role: 'assistant', content, graphs }
                        ]);
                    }
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Chat error:', error);
                    setIsLoading(false);
                });
            }, 100);
        }, 100);
    };

    return (
        <>
            {/* Chatbot Icon Button */}
            <div className="fixed bottom-6 right-6 z-[60] w-16 h-16">
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

            {/* Speech Bubble Notification */}
            {showSpeechBubble && !isOpen && (
                <div className="fixed bottom-28 right-6 z-[59] animate-bounce-in">
                    <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#036DAD] p-5 max-w-sm">
                        {/* Close button */}
                        <button
                            onClick={() => setShowSpeechBubble(false)}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <X size={16} className="text-gray-500" />
                        </button>

                        {/* Speech bubble tail */}
                        <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white border-r-2 border-b-2 border-[#036DAD] transform rotate-45"></div>

                        {/* Content */}
                        <div className="pr-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Image
                                    src="/mazwi-static.png"
                                    alt="Mazwi"
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900">Mazwi</h3>
                                    <p className="text-xs text-gray-500">Your GRC Assistant</p>
                                </div>
                            </div>

                            {speechBubbleType === 'login' ? (
                                <>
                                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                                        👋 Welcome back! It's been a while. Let me catch you up on what's been happening with your GRC data.
                                    </p>

                                    {/* Emphasized Catchup Button */}
                                    <button
                                        onClick={() => handleQuickAction("Give me a comprehensive catchup on everything that's happened in the last 30 days - new risks, incidents, compliance changes, and key metrics")}
                                        className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-[#036DAD] to-[#0284c7] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={18} />
                                        <span>📊 Get 30-Day Catchup</span>
                                    </button>

                                    {/* Quick Actions */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Or explore:</p>
                                        
                                        <button
                                            onClick={() => handleQuickAction("Show me the latest critical risks")}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-lg text-sm font-medium hover:from-red-100 hover:to-red-200 transition-all duration-200 flex items-center gap-2 border border-red-200"
                                        >
                                            <AlertCircle size={16} />
                                            <span>Critical Risks</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickAction("What's my current compliance status?")}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg text-sm font-medium hover:from-green-100 hover:to-green-200 transition-all duration-200 flex items-center gap-2 border border-green-200"
                                        >
                                            <FileText size={16} />
                                            <span>Compliance Status</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickAction("Show me key trends and insights")}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:from-purple-100 hover:to-purple-200 transition-all duration-200 flex items-center gap-2 border border-purple-200"
                                        >
                                            <TrendingUp size={16} />
                                            <span>Trends & Insights</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                                        💡 How can I help you today?
                                    </p>

                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleQuickAction("Show me my risk dashboard")}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:from-blue-100 hover:to-blue-200 transition-all duration-200 flex items-center gap-2 border border-blue-200"
                                        >
                                            <AlertCircle size={16} />
                                            <span>Risk Dashboard</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickAction("What incidents need my attention?")}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:from-orange-100 hover:to-orange-200 transition-all duration-200 flex items-center gap-2 border border-orange-200"
                                        >
                                            <AlertCircle size={16} />
                                            <span>Active Incidents</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickAction("Show me compliance overview")}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg text-sm font-medium hover:from-green-100 hover:to-green-200 transition-all duration-200 flex items-center gap-2 border border-green-200"
                                        >
                                            <FileText size={16} />
                                            <span>Compliance Overview</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
        
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          50% {
            transform: translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>

            {/* Chatbot Window */}
            {isOpen && (
                <div className={`fixed z-50 bg-white rounded-2xl shadow-2xl flex border border-gray-200 overflow-hidden transition-all duration-300 ${
                    isMaximized
                        ? 'top-4 left-4 right-4 bottom-24'
                        : 'bottom-24 right-6 w-[500px] h-[600px]'
                }`}>
                    {/* History Sidebar (visible when maximized) */}
                    {isMaximized && (
                        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
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
                                    onClick={toggleVoiceMode}
                                    className={`p-1 hover:bg-white/20 rounded-lg transition-colors ${
                                        voiceEnabled ? 'bg-white/20' : ''
                                    } ${isSpeaking ? 'animate-pulse' : ''}`}
                                    aria-label={voiceEnabled ? "Disable voice mode" : "Enable voice mode"}
                                    title={voiceEnabled ? "Voice mode ON" : "Voice mode OFF"}
                                >
                                    {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                </button>
                                {voiceEnabled && (
                                    <button
                                        onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                        aria-label="Voice settings"
                                        title="Voice settings"
                                    >
                                        <Settings size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={exportToPDF}
                                    disabled={messages.length === 0}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Download chat as PDF"
                                    title="Download chat as PDF"
                                >
                                    <Download size={20} />
                                </button>
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

                        {/* Voice Settings Panel */}
                        {showVoiceSettings && voiceEnabled && (
                            <div className="bg-blue-50 border-b border-blue-200 p-4">
                                <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                                    <Settings size={16} />
                                    Voice Settings
                                </h4>

                                {/* Voice Selection */}
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Voice (OpenAI TTS)
                                    </label>
                                    <select
                                        value={selectedVoice}
                                        onChange={(e) => setSelectedVoice(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent outline-none"
                                    >
                                        {openAIVoices.map((voice) => (
                                            <option key={voice.id} value={voice.id}>
                                                {voice.name} - {voice.description}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        🎯 Recommended: Onyx (professional male voice)
                                    </p>
                                </div>

                                {/* Quality Control */}
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Quality
                                    </label>
                                    <select
                                        value={voiceModel}
                                        onChange={(e) => setVoiceModel(e.target.value as 'tts-1' | 'tts-1-hd')}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent outline-none"
                                    >
                                        <option value="tts-1">Standard (Faster, Lower Cost)</option>
                                        <option value="tts-1-hd">HD (Higher Quality)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        HD quality provides more natural speech
                                    </p>
                                </div>

                                {/* Test Button */}
                                <button
                                    onClick={() => speakText("Hello, I'm Mazwi, your GRC assistant. This is a test of my voice.")}
                                    disabled={isSpeaking}
                                    className="w-full bg-[#036DAD] text-white px-4 py-2 rounded-lg hover:bg-[#025a8f] transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    {isSpeaking ? 'Speaking...' : 'Test Voice'}
                                </button>

                                {isSpeaking && (
                                    <button
                                        onClick={stopSpeaking}
                                        className="w-full mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                    >
                                        Stop Speaking
                                    </button>
                                )}
                            </div>
                        )}

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
                                {voiceEnabled && <span className="ml-2">• 🎙️ Voice Mode Active</span>}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}