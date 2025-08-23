# Generates a MIDI file from classified drum onsets.
from mido import Message, MetaMessage, MidiFile, MidiTrack, bpm2tempo, second2tick
from typing import List, Dict, Any

# Import configuration
import config


class MidiGenerator:
    def __init__(self, classified_onsets: List[Dict[str, Any]], bpm: float):
        """
        Initializes the generator with the necessary data.

        Args:
            classified_onsets: A list of dicts, e.g., [{'time': 1.23, 'instrument': 'kick'}, ...]
            bpm: The estimated beats per minute of the track.
        """
        self.classified_onsets = sorted(classified_onsets, key=lambda x: x["time"])
        self.bpm = bpm
        self.instrument_to_midi = {
            "kick": 36,
            "snare": 38,
            "hihat": 42,
            # Add more mappings as the classifier improves
        }

    def generate_midi_file(self) -> MidiFile:
        """
        Generates the final Mido MidiFile object.
        """
        mid = MidiFile(type=1)
        track = MidiTrack()
        mid.tracks.append(track)

        # Set the tempo
        track.append(MetaMessage("set_tempo", tempo=bpm2tempo(self.bpm)))

        last_event_time_seconds = 0.0

        for onset in self.classified_onsets:
            instrument = onset["instrument"]
            midi_note = self.instrument_to_midi.get(instrument)

            if midi_note is None:
                print(f"Warning: Unknown instrument '{instrument}' found. Skipping.")
                continue

            current_time_seconds = onset["time"]
            delta_seconds = current_time_seconds - last_event_time_seconds

            # Convert delta time from seconds to MIDI ticks
            delta_ticks = second2tick(
                delta_seconds, mid.ticks_per_beat, bpm2tempo(self.bpm)
            )

            # Add note_on and note_off messages
            # Channel 9 is conventionally used for percussion in General MIDI
            track.append(
                Message(
                    "note_on",
                    note=midi_note,
                    velocity=config.DEFAULT_VELOCITY,
                    time=round(delta_ticks),
                    channel=9,
                )
            )
            track.append(
                Message(
                    "note_off",
                    note=midi_note,
                    velocity=0,
                    time=config.NOTE_DURATION_TICKS,
                    channel=9,
                )
            )

            # Update the time of the last event
            # Note: The duration of the note_off message also consumes time.
            duration_seconds = (config.NOTE_DURATION_TICKS / mid.ticks_per_beat) * (
                60 / self.bpm
            )
            last_event_time_seconds = current_time_seconds + duration_seconds

        return mid

    def save_to_file(self, output_path: str):
        """
        Saves the generated MIDI data to a .mid file.
        """
        midi_file = self.generate_midi_file()
        midi_file.save(output_path)
        print(f"MIDI file saved to {output_path}")


# Example usage
if __name__ == "__main__":
    print("Testing MIDI Generator...")
    # Create some dummy classified onsets
    dummy_onsets = [
        {"time": 0.5, "instrument": "kick"},
        {"time": 1.0, "instrument": "hihat"},
        {"time": 1.5, "instrument": "snare"},
        {"time": 2.0, "instrument": "hihat"},
        {"time": 2.5, "instrument": "kick"},
        {"time": 3.0, "instrument": "hihat"},
        {"time": 3.5, "instrument": "snare"},
        {"time": 4.0, "instrument": "hihat"},
    ]
    dummy_bpm = 120.0

    generator = MidiGenerator(dummy_onsets, dummy_bpm)
    generator.save_to_file("output/test_beat.mid")
