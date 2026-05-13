import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, message, system, history, imageB64, mediaType, promptText, model: requestedModel } = req.body;

  // --- GROQ (Primary) ---
  if (type === 'text' && process.env.GROQ_API_KEY) {
    try {
      const groqModel = requestedModel || 'llama-3.3-70b-versatile';
      
      const messages = [];
      if (system) messages.push({ role: 'system', content: system });
      
      // Add history
      if (history && history.length) {
        for (const h of history) {
          messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
        }
      }
      messages.push({ role: 'user', content: message });

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: groqModel,
          messages,
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (groqRes.status === 429) {
        console.warn("Groq rate limited, falling back to Gemini...");
        // Fall through to Gemini below
      } else if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.error("Groq error:", groqRes.status, errText);
        // Fall through to Gemini
      } else {
        const data = await groqRes.json();
        const reply = data.choices?.[0]?.message?.content || 'No response.';
        return res.status(200).json({ reply, provider: 'groq' });
      }
    } catch (err) {
      console.error("Groq fetch error:", err.message);
      // Fall through to Gemini
    }
  }

  // --- GEMINI (Fallback for text, Primary for vision) ---
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'No AI provider available', code: 'NO_PROVIDER' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    if (type === 'text') {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: system });
      
      const formattedHistory = (history || []).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(message);
      const response = await result.response;
      return res.status(200).json({ reply: response.text(), provider: 'gemini' });
    } 
    else if (type === 'vision') {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: system });
      
      const imagePart = {
        inlineData: {
          data: imageB64,
          mimeType: mediaType
        }
      };

      const result = await model.generateContent([promptText, imagePart]);
      const response = await result.response;
      return res.status(200).json({ reply: response.text(), provider: 'gemini' });
    }

    return res.status(400).json({ error: 'Invalid request type' });

  } catch (error) {
    console.error("API Error:", error.message);
    
    // Detect quota errors from Gemini
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ 
        error: 'AI quota exceeded', 
        code: 'QUOTA_EXCEEDED',
        resetHint: 'Groq resets at midnight UTC. Gemini resets at 12:30 AM IST (midnight Pacific).'
      });
    }

    return res.status(500).json({ error: 'AI processing failed', code: 'SERVER_ERROR' });
  }
}
