# Isolates the drum track from an audio file using Spleeter.
import numpy as np
from spleeter.separator import Separator
from spleeter.audio.adapter import AudioAdapter

# Import configuration
import config

# Initialize the Spleeter separator.
# This will download the pre-trained model on its first run.
# We use the 4-stem model which includes drums.
separator = Separator("spleeter:4stems")
audio_adapter = AudioAdapter.default()


def separate_drums(waveform: np.ndarray, sr: int) -> np.ndarray:
    """
    Separates the drum track from a given waveform.

    Args:
        waveform: The input audio waveform (mono or stereo).
        sr: The sample rate of the input waveform.

    Returns:
        The isolated drum waveform as a mono NumPy array.
    """
    # Spleeter expects a specific sample rate, but our loader ensures this.
    # If the input waveform is mono, we need to convert it to stereo for Spleeter.
    if waveform.ndim == 1:
        waveform = np.stack([waveform, waveform], axis=-1)

    # Perform the separation
    prediction = separator.separate(waveform)

    # Extract the drum stem and convert it to mono by taking the mean of the channels.
    drum_stem_stereo = prediction["drums"]
    drum_stem_mono = np.mean(drum_stem_stereo, axis=1)

    return drum_stem_mono


# Example usage (for testing the module directly)
if __name__ == "__main__":
    import soundfile as sf

    print("Testing source separation module...")
    # Create a dummy stereo waveform for testing
    # In a real scenario, you would load an audio file.
    sr = config.TARGET_SR
    dummy_waveform, _ = sf.read(
        "path_to_your_test_song.mp3", always_2d=True, dtype="float32"
    )

    print("Separating drums (this may take a while and download models)...")
    drum_track = separate_drums(dummy_waveform, sr)

    # Save the output to a file to verify
    output_filename = "output/drums_only.wav"
    sf.write(output_filename, drum_track, sr)
    print(f"Drum track saved to {output_filename}")
