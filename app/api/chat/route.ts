import { NextResponse } from 'next/server';
import { processRAGQuery, ChatMessage } from '@/lib/rag';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body. "messages" array is required.' },
        { status: 400 }
      );
    }

    const ragResult = await processRAGQuery(messages);

    return NextResponse.json(ragResult);
  } catch (error: any) {
    console.error('API /api/chat error:', error);
    return NextResponse.json(
      {
        answer: 'Something went wrong while generating the response. Please try again.',
        sources: [],
        confidence: 'Low',
      },
      { status: 500 }
    );
  }
}
