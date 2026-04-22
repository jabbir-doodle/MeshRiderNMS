import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Use z-ai-web-dev-sdk for LLM response
    const ZAI = await import('z-ai-web-dev-sdk');
    const zai = await (ZAI.default || ZAI).create();

    const systemPrompt = `You are the AI Network Advisor for Doodle Labs Mesh Rider NMS. You help operators manage their mesh radio fleet. 
Current fleet context: 24 Mesh Rider radios across 5 sites (Alpha, Bravo, Charlie, Delta, Echo). 
Products: Nano², Mini, OEM, Boost, Wearable running Mesh Rider OS v7.x.
Bands: L-Band, S-Band, C-Band, L+S Band, L+S+C Band.
Be concise, technical, and actionable. Use monospace for technical values. Keep responses under 200 words.`;

    const userMessage = context
      ? `[Context: ${context}]\n\n${message}`
      : message;

    const result = await zai.functions.invoke('llm', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply =
      result.data?.choices?.[0]?.message?.content ||
      result.data?.response ||
      result.data?.content ||
      'I apologize, I was unable to process your request. Please try again.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI Advisor API error:', error);
    return NextResponse.json(
      { reply: 'I encountered an error processing your request. The AI service may be temporarily unavailable. Please try again.' },
      { status: 200 },
    );
  }
}
