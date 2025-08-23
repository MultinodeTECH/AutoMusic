# Handles audio loading, onset detection, and feature extraction.
import librosa
import numpy as np
from typing import Tuple, List

# Import configuration
import config


def load_audio(file_path: str) -> Tuple[np.ndarray, int]:
    """
    Loads, resamples, and converts an audio file to a mono waveform.

    Returns:
        A tuple of (waveform, sample_rate).
    """
    try:
        waveform, sr = librosa.load(file_path, sr=config.TARGET_SR, mono=True)
        return waveform, sr
    except Exception as e:
        print(f"Error loading audio file: {e}")
        raise


def detect_onsets(waveform: np.ndarray, sr: int) -> np.ndarray:
    """
    Detects onset timestamps in a waveform.

    Returns:
        An array of timestamps in seconds.
    """
    return librosa.onset.onset_detect(y=waveform, sr=sr, units="time", backtrack=True)


def extract_features_for_onsets(
    waveform: np.ndarray, sr: int, onset_timestamps: np.ndarray
) -> List[np.ndarray]:
    """
    Extracts a feature vector for each onset.

    Returns:
        A list of feature vectors (each vector is a NumPy array).
    """
    feature_list = []
    window_samples = int((config.ONSET_WINDOW_MS / 1000) * sr)

    for timestamp in onset_timestamps:
        onset_sample = int(timestamp * sr)
        start = max(0, onset_sample - window_samples // 2)
        end = start + window_samples
        audio_slice = waveform[start:end]

        # Calculate MFCCs and aggregate
        mfccs = librosa.feature.mfcc(y=audio_slice, sr=sr, n_mfcc=config.N_MFCC)
        feature_vector = np.mean(mfccs, axis=1)
        feature_list.append(feature_vector)

    return feature_list


def estimate_bpm(waveform: np.ndarray, sr: int) -> float:
    """
    Estimates the tempo of the audio.

    Returns:
        The estimated BPM as a float.
    """
    bpm, _ = librosa.beat.beat_track(y=waveform, sr=sr)
    return float(bpm)
