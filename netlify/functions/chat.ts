// netlify/functions/chat.ts
import { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const handler: Handler = async (event: HandlerEvent) => {
  // --- KONFIGURASI CORS ---
  // Izinkan akses dari mana saja ('*') atau ganti dengan domain frontend Anda
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight request (OPTIONS) dari browser
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 1. Check for POST method
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // 2. Check for API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  try {
    // 3. Parse request body
    const { message } = JSON.parse(event.body || '{}');
    if (!message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required.' }) };
    }

    // 4. Initialize AI client
    const genAI = new GoogleGenerativeAI(apiKey);

    // KOREKSI: Gunakan model yang valid (1.5-flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    // 5. Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: responseText }),
    };
  } catch (error: any) {
    console.error('Error in chat function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};

export { handler };
