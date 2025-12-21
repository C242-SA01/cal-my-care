// netlify/functions/chat.ts
import { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Simplified for debugging - no DB, no streaming, no complex context
const handler: Handler = async (event: HandlerEvent) => {
  // 1. Check for POST method
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 2. Check for API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return { statusCode: 500, body: "Server configuration error: Missing API Key." };
  }

  try {
    // 3. Parse request body
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, body: "Bad Request: message is required." };
    }

    // 4. Initialize AI client and make a non-streaming call
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(message);
    const responseText = result.response.text();

    // 5. Return a simple JSON response
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: responseText }),
    };

  } catch (error: any) {
    // 6. Catch and log any error
    console.error("Error in simplified chat function:", error);
    return { statusCode: 500, body: `Internal Server Error: ${error.message}` };
  }
};

export { handler };
