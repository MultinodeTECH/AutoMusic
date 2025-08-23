# Configuration settings for the transcription service.

# Audio Processing Parameters
TARGET_SR = 44100  # Target sample rate for all audio processing.
ONSET_WINDOW_MS = (
    100  # Window size in milliseconds for feature extraction around an onset.
)
N_MFCC = 13  # Number of Mel-Frequency Cepstral Coefficients to compute.

# MIDI Generation Parameters
DEFAULT_VELOCITY = 100  # Default MIDI velocity for detected notes.
NOTE_DURATION_TICKS = 30  # A short, fixed duration for each drum hit in MIDI ticks.

# Model Paths
CLASSIFIER_MODEL_PATH = (
    "models/drum_classifier.pkl"  # Path to the pre-trained instrument classifier.
)
