import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { ScoreLoader } from '../src/score_loader.js';

describe('ScoreLoader', () => {
    let scoreLoader;
    let originalFetch;

    beforeEach(() => {
        scoreLoader = new ScoreLoader();
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('should load and parse a valid score JSON file', async () => {
        const mockScore = {
            metadata: { title: 'Test Beat' },
            notes: [{ time: 0, note: 36 }],
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockScore),
            })
        );

        const score = await scoreLoader.loadScore('scores/test.json');
        expect(score).toEqual(mockScore);
        expect(global.fetch).toHaveBeenCalledWith('scores/test.json');
    });

    test('should handle fetch errors gracefully', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 404,
            })
        );

        await expect(scoreLoader.loadScore('scores/nonexistent.json')).rejects.toThrow(
            'HTTP error! status: 404'
        );
    });

    test('should handle JSON parsing errors gracefully', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.reject(new Error('Invalid JSON')),
            })
        );

        await expect(scoreLoader.loadScore('scores/invalid.json')).rejects.toThrow(
            'Invalid JSON'
        );
    });
});