import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'placeholder';

const ai = new GoogleGenAI({ apiKey });

export async function generateQuests(mood, time, interests, location) {
  const prompt = `Generate 3 unique, gamified real-life micro-adventures (quests) based on the following criteria:
Mood: ${mood || 'Curious'}
Time Available: ${time || '30 minutes'}
Interests: ${interests || 'Anything'}
Location: ${location || 'Anywhere'}

Format the response as a JSON array of objects. Each object should have:
- title: A catchy, action-oriented title
- category: A short uppercase string (e.g. CREATIVE, COZY, ACTIVE, EXPLORE)
- rarity: Choose from 'Common', 'Rare', 'Epic', 'Legendary' (Make them 60% Common, 25% Rare, 10% Epic, 5% Legendary)
- xp: An integer (Common: 10-50, Rare: 50-100, Epic: 100-200, Legendary: 300-500)
- description: A short 2-3 sentence engaging description of what to do
- durationStr: A string like "30 min"
- difficulty: A string (easy, medium, hard)

Return ONLY the raw JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to generate quests:", error);
    // Return some fallbacks if API fails or isn't set up yet
    return [
      {
        title: "Write a Love Letter to Your Favorite Book",
        category: "CREATIVE",
        rarity: "Common",
        xp: 50,
        description: "Choose a book that changed you and write it a heartfelt thank-you note. Read it aloud over coffee.",
        durationStr: "35 min",
        difficulty: "medium"
      },
      {
        title: "Create a Tiny Book Sanctuary Corner",
        category: "COZY",
        rarity: "Rare",
        xp: 80,
        description: "Transform one cozy spot in your home into a reading nook. Adjust lighting and settle in with tea.",
        durationStr: "45 min",
        difficulty: "medium"
      },
      {
        title: "The Ultimate Urban Exploration Challenge",
        category: "EXPLORE",
        rarity: "Legendary",
        xp: 400,
        description: "Find the highest safe vantage point in your city you've never been to, take a photo of the horizon, and send it to a friend.",
        durationStr: "2 hours",
        difficulty: "hard"
      }
    ];
  }
}

// Convert a File object to Google Generative AI compatible Part object
async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type
    },
  };
}

export async function verifyQuestCompletion(photoFile, questDescription, questDurationStr, timeTakenMinutes) {
  if (!photoFile) {
    return { verified: false, reason: "No photo provided. Photo proof is mandatory." };
  }

  // Quick heuristic speed check before hitting the AI
  const expectedMins = parseInt(questDurationStr.match(/\d+/)?.[0] || '15');
  // If they claim to finish a 2-hour task in less than 5 minutes...
  if (expectedMins > 30 && timeTakenMinutes < 5) {
    return { 
      verified: false, 
      reason: `Speed Check Failed: This quest takes ${questDurationStr}, but you claimed it after only ${timeTakenMinutes} minutes. That's physically impossible!` 
    };
  }

  try {
    const imagePart = await fileToGenerativePart(photoFile);
    
    const prompt = `You are a strict anti-cheat judge for a real-life RPG game.
The user claims they have completed the following quest: "${questDescription}"
Analyze the attached photo uploaded by the user as proof.
Does this photo reasonably prove they did the quest? 
Look out for cheating (e.g. taking a picture of a TV screen, a blank wall, or an unrelated object).
Reply STRICTLY with a JSON object in this format: { "verified": boolean, "reason": "string explaining why" }
Return ONLY the raw JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt, imagePart],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Verification failed:", error);
    // If the API fails for whatever reason, err on the side of caution or let it pass if we don't want to block users
    return { verified: true, reason: "API verification skipped." };
  }
}
