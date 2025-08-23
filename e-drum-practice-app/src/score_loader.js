/**
 * @class ScoreLoader
 * @description Fetches and parses a drum score from a given URL.
 */
class ScoreLoader {
    /**
     * Asynchronously loads a score from a JSON file.
     * @param {string} url - The URL of the score's JSON file.
     * @returns {Promise<Object>} A promise that resolves to the parsed score object.
     * @throws {Error} Throws an error if the file cannot be fetched or if the JSON is invalid.
     */
    async loadScore(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const score = await response.json();
            return score;
        } catch (error) {
            console.error("Failed to load score:", error);
            throw error;
        }
    }
}

export { ScoreLoader };