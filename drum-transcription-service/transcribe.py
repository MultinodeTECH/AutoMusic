# Main entry point for the drum transcription service.
import argparse
import os
import time

# Import core modules
import audio_processor
import source_separator
from instrument_classifier import InstrumentClassifier
from midi_generator import MidiGenerator
from score_generator import ScoreGenerator


def main():
    """Main function to run the transcription pipeline."""
    parser = argparse.ArgumentParser(
        description="Transcribe drum patterns from an audio file."
    )
    parser.add_argument(
        "--input",
        type=str,
        required=True,
        help="Path to the input audio file (e.g., song.mp3).",
    )
    parser.add_argument(
        "--output",
        type=str,
        required=True,
        help="Path for the output score file (e.g., score.xml).",
    )
    args = parser.parse_args()

    start_time = time.time()

    # --- Create output directory if it doesn't exist ---
    output_dir = os.path.dirname(args.output)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

    # --- Stage 1: Audio Loading ---
    print("\n[Stage 1/6] Loading audio file...")
    try:
        waveform, sr = audio_processor.load_audio(args.input)
    except Exception as e:
        print(f"Failed to load audio. Error: {e}")
        return
    print(f"Audio loaded successfully. Duration: {len(waveform)/sr:.2f} seconds.")

    # --- Stage 2: Source Separation ---
    print("\n[Stage 2/6] Separating drum track (this may take a while)...")
    drum_waveform = source_separator.separate_drums(waveform, sr)
    print("Drum track separated.")

    # --- Stage 3: Onset Detection ---
    print("\n[Stage 3/6] Detecting drum onsets...")
    onset_timestamps = audio_processor.detect_onsets(drum_waveform, sr)
    print(f"Detected {len(onset_timestamps)} potential onsets.")

    # --- Stage 4: Instrument Classification ---
    print("\n[Stage 4/6] Classifying instruments...")
    classifier = InstrumentClassifier()
    if not classifier.model:
        print("Cannot proceed without a trained classifier model.")
        return
    classified_onsets = classifier.classify_onsets(drum_waveform, sr, onset_timestamps)
    print("Instrument classification complete.")

    # --- Stage 5: MIDI Generation ---
    print("\n[Stage 5/6] Generating MIDI file...")
    bpm = audio_processor.estimate_bpm(drum_waveform, sr)
    print(f"Estimated BPM: {bpm:.2f}")
    midi_generator = MidiGenerator(classified_onsets, bpm)
    # Save the intermediate MIDI file
    midi_output_path = os.path.splitext(args.output)[0] + ".mid"
    midi_generator.save_to_file(midi_output_path)

    # --- Stage 6: Score Generation ---
    print("\n[Stage 6/6] Generating final score file...")
    score_generator = ScoreGenerator(midi_output_path)
    score_generator.save_to_musicxml(args.output)

    end_time = time.time()
    print(f"\nTranscription complete! Total time: {end_time - start_time:.2f} seconds.")
    print(f"Final score saved to: {args.output}")


if __name__ == "__main__":
    main()
