import unittest
from app.music_generation import generate_music

class TestMusicGeneration(unittest.TestCase):
    def test_generate_music(self):
        processed_input = {
            "drum": "test_drum",
            "piano": "test_piano",
            "guitar": "test_guitar"
        }
        result = generate_music(processed_input)
        self.assertIn("Generated music based on", result)

if __name__ == "__main__":
    unittest.main()
