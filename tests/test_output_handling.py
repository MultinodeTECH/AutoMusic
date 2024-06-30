import unittest
import os
from app.output_handling import save_output

class TestOutputHandling(unittest.TestCase):
    def test_save_output(self):
        generated_music = "test_generated_music"
        save_output(generated_music)
        self.assertTrue(os.path.exists("output_music.txt"))
        with open("output_music.txt", "r") as file:
            content = file.read()
        self.assertEqual(content, generated_music)
        os.remove("output_music.txt")

if __name__ == "__main__":
    unittest.main()
