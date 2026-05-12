import { GoogleGenerativeAI } from '@google/generative-ai';

// Fallback to Anthropic if needed
// import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, provider, message, system, history, imageB64, mediaType, promptText } = req.body;

  try {
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      if (type === 'text') {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: system });
        
        // Convert history to Gemini format
        const formattedHistory = (history || []).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
          history: formattedHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return res.status(200).json({ reply: response.text() });
      } 
      else if (type === 'vision') {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: system });
        
        const imagePart = {
          inlineData: {
            data: imageB64,
            mimeType: mediaType
          }
        };

        const result = await model.generateContent([promptText, imagePart]);
        const response = await result.response;
        return res.status(200).json({ reply: response.text() });
      }
    }

    // Optional Claude fallback implementation
    /*
    if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      // ... Claude logic ...
    }
    */

    return res.status(400).json({ error: 'Invalid request type or provider' });

  } catch (error) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
