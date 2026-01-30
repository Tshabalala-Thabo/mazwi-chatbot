import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getTenantData, queryTenantData, buildSystemPrompt } from '@/lib/chatbot-context';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Get tenant context and data
    const tenantData = getTenantData(user.tenant_id);
    
    if (!tenantData) {
      return NextResponse.json(
        { error: 'Failed to fetch tenant data' },
        { status: 500 }
      );
    }

    // Query relevant data based on user message
    const relevantData = queryTenantData(user.tenant_id, message);

    // Build context for the AI
    const context = {
      tenantId: user.tenant_id,
      tenantName: tenantData.tenant?.tenant_name || 'Unknown',
      userId: user.id,
      userName: user.name
    };

    const systemPrompt = buildSystemPrompt(context, tenantData);

    // Add relevant data to the context if available
    let dataContext = '';
    if (relevantData && Object.keys(relevantData).length > 0) {
      dataContext = '\n\nRELEVANT DATA FOR THIS QUERY:\n' + JSON.stringify(relevantData, null, 2);
    }

    // Prepare messages for OpenAI
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt + dataContext
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return NextResponse.json({
      message: assistantMessage,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Handle specific OpenAI errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your configuration.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
