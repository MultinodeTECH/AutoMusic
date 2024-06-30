import unittest
from app.input_processing import process_input

class TestInputProcessing(unittest.TestCase):
    def test_process_input(self):
        drum_input = "test_drum"
        piano_input = "test_piano"
        guitar_input = "test_guitar"
        result = process_input(drum_input, piano_input, guitar_input)
        self.assertEqual(result, {
            "drum": drum_input,
            "piano": piano_input,
            "guitar": guitar_input
        })

if __name__ == "__main__":
    unittest.main()
