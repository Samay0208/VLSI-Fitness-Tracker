export const AI_PROVIDER = 'gemini';

export async function ai(msg, sys = "", hist = []) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: 'text',
        provider: AI_PROVIDER,
        message: msg,
        system: sys,
        history: hist
      })
    });
    
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.reply || "No response from AI.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I couldn't process that right now.";
  }
}

export async function aiJson(msg, sys = "", hist = []) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: 'text',
        provider: AI_PROVIDER,
        message: msg,
        system: sys + " YOU MUST RETURN ONLY VALID PARSABLE JSON. NO MARKDOWN FORMATTING OR TEXT BEFORE/AFTER.",
        history: hist
      })
    });
    
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    const cleanJson = data.reply.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI JSON Error:", error);
    return null;
  }
}

export async function aiVision(imageB64, mediaType, promptText, sys = "") {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: 'vision',
        provider: AI_PROVIDER,
        imageB64,
        mediaType,
        promptText,
        system: sys
      })
    });
    
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.reply || "Could not analyze image.";
  } catch (error) {
    console.error("AI Vision Error:", error);
    return "Sorry, vision analysis failed.";
  }
}
