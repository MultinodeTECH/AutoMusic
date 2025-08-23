# Script to automatically create a labeled drum sound dataset.
# This script takes a clean drum audio track and a corresponding MIDI file
# and slices the audio into labeled samples (kick, snare, hihat) for training.

import os
import mido
import librosa
import soundfile as sf
import numpy as np

# --- Configuration ---
# Path to the directory where the sliced & labeled samples will be saved.
OUTPUT_DATASET_DIR = "dataset"
# The audio window size (in ms) to slice around each MIDI note.
SLICE_WINDOW_MS = 120
# The sample rate to use for all processing.
TARGET_SR = 44100

# MIDI note numbers for common drum instruments (GM Standard).
DRUM_MAP = {
    36: "kick",
    38: "snare",
    42: "hihat",
    # Add other instruments if your MIDI files include them
    # 46: 'hihat_open',
    # 49: 'crash',
    # 51: 'ride',
}


def create_labeled_slices(audio_path: str, midi_path: str):
    """
    Processes a single audio/MIDI pair to generate labeled audio slices.
    """
    print(
        f"\nProcessing pair: {os.path.basename(audio_path)} and {os.path.basename(midi_path)}"
    )

    # 1. Load the audio file
    try:
        waveform, sr = librosa.load(audio_path, sr=TARGET_SR, mono=True)
    except Exception as e:
        print(f"  - Error loading audio file: {e}")
        return

    # 2. Load the MIDI file
    try:
        mid = mido.MidiFile(midi_path)
    except Exception as e:
        print(f"  - Error loading MIDI file: {e}")
        return

    # 3. Iterate through MIDI messages to find drum hits
    current_time_seconds = 0.0
    slice_count = 0
    for msg in mid:
        # Accumulate delta times to get the absolute time of each message
        current_time_seconds += msg.time

        if msg.type == "note_on" and msg.velocity > 0:
            instrument_label = DRUM_MAP.get(msg.note)

            # If this note corresponds to a drum instrument we want to train
            if instrument_label:
                # 4. Slice the audio at the note's timestamp
                start_sample = int(current_time_seconds * sr)
                window_samples = int((SLICE_WINDOW_MS / 1000) * sr)
                half_window = window_samples // 2

                audio_slice = waveform[
                    max(0, start_sample - half_window) : start_sample + half_window
                ]

                # 5. Save the slice to the appropriate directory
                if len(audio_slice) > 0:
                    # Create the instrument's directory if it doesn't exist
                    instrument_dir = os.path.join(OUTPUT_DATASET_DIR, instrument_label)
                    os.makedirs(instrument_dir, exist_ok=True)

                    # Generate a unique filename
                    filename = f"{os.path.splitext(os.path.basename(audio_path))[0]}_{slice_count}.wav"
                    output_path = os.path.join(instrument_dir, filename)

                    sf.write(output_path, audio_slice, sr)
                    slice_count += 1

    print(f"  - Successfully created {slice_count} labeled slices.")


if __name__ == "__main__":
    # --- Example Usage ---
    # To use this, you need to find a song, get its MIDI drum track,
    # and use Spleeter to get its clean drum audio track.

    # 1. Define the paths to your source files
    #    (Replace these with your actual file paths)
    drum_audio_file = "path/to/your/song_drums.wav"
    drum_midi_file = "path/to/your/song_drums.mid"

    print("Starting dataset creation process...")

    if os.path.exists(drum_audio_file) and os.path.exists(drum_midi_file):
        create_labeled_slices(drum_audio_file, drum_midi_file)
        print("\nDataset creation finished.")
        print(f"Check the '{OUTPUT_DATASET_DIR}' directory for your new samples.")
    else:
        print("\n--- Please Read ---")
        print("Could not find the example audio/MIDI files.")
        print("To run this script, you need to:")
        print(
            "  1. Find a song that has a publicly available and accurate MIDI drum transcription."
        )
        print(
            "  2. Use a tool like Spleeter to separate the drum audio from the original song."
        )
        print(
            "  3. Update the 'drum_audio_file' and 'drum_midi_file' variables in this script to point to your files."
        )
