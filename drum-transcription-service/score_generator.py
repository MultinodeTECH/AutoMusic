# Generates a musical score (e.g., MusicXML) from a MIDI file.
from music21 import converter, stream


class ScoreGenerator:
    def __init__(self, midi_path: str):
        """
        Initializes the generator with the path to the MIDI file.

        Args:
            midi_path: The path to the input .mid file.
        """
        self.midi_path = midi_path
        try:
            self.score = converter.parse(self.midi_path)
            print(f"Successfully parsed MIDI file: {self.midi_path}")
        except Exception as e:
            print(f"Error parsing MIDI file: {e}")
            self.score = None

    def save_to_musicxml(self, output_path: str):
        """
        Saves the parsed score to a MusicXML file.
        """
        if self.score:
            try:
                self.score.write("musicxml", fp=output_path)
                print(f"Score saved to MusicXML file: {output_path}")
            except Exception as e:
                print(f"Error writing MusicXML file: {e}")
        else:
            print("No score was loaded. Cannot save to MusicXML.")


# Example usage
if __name__ == "__main__":
    print("Testing Score Generator...")
    # This assumes 'output/test_beat.mid' was created by midi_generator.py
    input_midi = "output/test_beat.mid"
    output_xml = "output/test_beat.xml"

    # Check if the input file exists first
    import os

    if os.path.exists(input_midi):
        generator = ScoreGenerator(input_midi)
        generator.save_to_musicxml(output_xml)
    else:
        print(f"Input MIDI file not found: {input_midi}")
        print("Please run midi_generator.py first to create the test file.")
