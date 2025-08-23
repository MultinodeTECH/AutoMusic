# Detailed Design: Audio Processing & Feature Extraction Module

## 1. Introduction

This document provides the detailed design for the **Audio Processing & Feature Extraction Module**. This module is a collection of functions responsible for all low-level audio handling using the `librosa` library. It covers loading audio, detecting onsets, and extracting features for the classification stage.

## 2. Module Responsibilities

*   Load an audio file from a given path into a standardized format (mono waveform, fixed sample rate).
*   Detect percussive onsets (hit timings) from a given waveform.
*   Extract descriptive feature vectors from small audio segments centered around each onset.
*   Estimate the overall tempo (BPM) of a given waveform.

## 3. Public API / Interface

This module will be implemented as a set of pure functions in a Python file, as they are stateless operations.

```python
# Filename: audio_processor.py
import numpy as np
from typing import Tuple, List

# Configuration constants
TARGET_SR = 44100
ONSET_WINDOW_MS = 100 # ms

def load_audio(file_path: str) -> Tuple[np.ndarray, int]:
    """
    Loads, resamples, and converts an audio file to a mono waveform.
    Returns: (waveform, sample_rate)
    """
    # ...

def detect_onsets(waveform: np.ndarray, sr: int) -> np.ndarray:
    """
    Detects onset timestamps in a waveform.
    Returns: An array of timestamps in seconds.
    """
    # ...

def extract_features_for_onsets(waveform: np.ndarray, sr: int, onset_timestamps: np.ndarray) -> List[np.ndarray]:
    """
    Extracts a feature vector for each onset.
    Returns: A list of feature vectors (each vector is a NumPy array).
    """
    # ...

def estimate_bpm(waveform: np.ndarray, sr: int) -> float:
    """
    Estimates the tempo of the audio.
    Returns: The estimated BPM as a float.
    """
    # ...
```

## 4. Core Logic & Behavior

### 4.1. `load_audio`
1.  **Call `librosa.load`:**
    *   Use `path=file_path` to specify the input file.
    *   Use `sr=TARGET_SR` to ensure the audio is resampled to our target sample rate.
    *   Use `mono=True` to convert the audio to a single channel.
2.  **Error Handling:** Wrap the call in a `try...except` block to catch file-not-found or unsupported format errors.
3.  **Return:** Return the resulting `waveform` and `sample_rate`.

### 4.2. `detect_onsets`
1.  **Call `librosa.onset.onset_detect`:**
    *   Use `y=waveform` and `sr=sr` for the input audio.
    *   Specify `units='time'` to get the output directly in seconds.
    *   **Tuning Parameters:** The default parameters are a good starting point. We may need to experiment with `backtrack=True` or adjust the `wait` and `pre_avg`/`post_avg` parameters if the detection is poor.
2.  **Return:** Return the NumPy array of timestamps.

### 4.3. `extract_features_for_onsets`
1.  **Initialization:** Create an empty list, `feature_list`, to store the results.
2.  **Calculate Window Size:** Convert `ONSET_WINDOW_MS` to a number of samples: `window_samples = int((ONSET_WINDOW_MS / 1000) * sr)`.
3.  **Iterate through Onsets:** For each `timestamp` in `onset_timestamps`:
    a.  **Convert Time to Sample Index:** `onset_sample = int(timestamp * sr)`.
    b.  **Slice the Waveform:** Extract a segment of the waveform centered on the onset. `start = max(0, onset_sample - window_samples // 2)`, `end = start + window_samples`. `audio_slice = waveform[start:end]`.
    c.  **Feature Calculation:** Calculate a set of features on this `audio_slice`. For the MVP, we will use Mel-Frequency Cepstral Coefficients (MFCCs) as they are very effective for timbre classification.
        *   `mfccs = librosa.feature.mfcc(y=audio_slice, sr=sr, n_mfcc=13)`.
        *   The result is a 2D array (`n_mfcc` x `n_frames`). We need to aggregate this into a single feature vector. A common technique is to take the mean across the time frames: `feature_vector = np.mean(mfccs, axis=1)`.
    d.  **Append to List:** Add the `feature_vector` to `feature_list`.
4.  **Return:** Return the `feature_list`.

### 4.4. `estimate_bpm`
1.  **Call `librosa.beat.beat_track`:**
    *   Use `y=waveform` and `sr=sr`. This function returns both the estimated BPM and the frame indices of the detected beats.
2.  **Extract BPM:** The first element of the returned tuple is the BPM.
3.  **Return:** Return the BPM value.

## 5. Data Structures

*   **Waveform:** A 1D NumPy array of floating-point numbers, typically between -1.0 and 1.0.
*   **Onset Timestamps:** A 1D NumPy array of floats, representing seconds.
*   **Feature Vector:** A 1D NumPy array of floats. For `n_mfcc=13`, this will be an array of shape `(13,)`.
*   **List of Feature Vectors:** A standard Python list where each element is a feature vector. The list will have the same length as the `onset_timestamps` array.

## 6. Configuration & Tunability

The performance of this module is highly dependent on its parameters. These should be stored in a central configuration file (`config.py`) for easy tuning.

*   `TARGET_SR`: The sample rate to use for all processing.
*   `ONSET_WINDOW_MS`: The size of the audio window to use for feature extraction.
*   `N_MFCC`: The number of MFCCs to compute.
*   Parameters for `librosa.onset.onset_detect` (e.g., `wait`, `delta`).