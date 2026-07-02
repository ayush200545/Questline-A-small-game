import { describe, it, expect, vi } from 'vitest';
import { generateQuests } from './lib/ai';

// Mock the global fetch
global.fetch = vi.fn();

describe('AI Quest Generator', () => {
  it('should generate quests based on parameters', async () => {
    // Mock the Google Gemini API response
    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify([
                  {
                    title: "Test Quest",
                    description: "This is a test quest.",
                    duration: "10 mins",
                    xp: 50
                  }
                ])
              }
            ]
          }
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const quests = await generateQuests('Happy', '10 mins', 'Testing', 'Home');
    
    expect(quests).toBeInstanceOf(Array);
    expect(quests.length).toBeGreaterThan(0);
    expect(quests[0]).toHaveProperty('title');
    expect(quests[0]).toHaveProperty('description');
    expect(quests[0]).toHaveProperty('xp');
    expect(quests[0]).toHaveProperty('rarity'); // Rarity is injected by our wrapper!
  });
});
