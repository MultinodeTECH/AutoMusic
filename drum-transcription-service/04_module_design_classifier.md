# Detailed Design: Instrument Classifier Module

## 1. Introduction

This document provides the detailed design for the **Instrument Classifier Module**. This is a critical component in the transcription pipeline, responsible for identifying which drum instrument was played at each detected onset time. The design follows a standard machine learning approach: extracting features from audio segments and using a pre-trained model to predict the instrument class.

## 2. Module Responsibilities

*   Load a pre-trained instrument classification model from disk.
*   For each onset timestamp provided, extract a relevant audio segment from the drum waveform.
*   Calculate a feature vector for each audio segment that describes its timbral characteristics.
*   Use the loaded model to predict the instrument label (e.g., 'kick', 'snare', 'hihat') for each feature vector.
*   Return a structured list of classified onsets, pairing each timestamp with its predicted instrument label.

## 3. Public API / Interface

This module will be implemented as a class that encapsulates the trained model and the prediction logic.

```python
# Filename: instrument_classifier.py
import numpy as np
from typing import List, Dict, Any

class InstrumentClassifier:
    def __init__(self, model_path: str):
        """
        Initializes the classifier by loading a pre-trained model.
        'model_path' should point to a serialized model file (e.g., a .pkl file for scikit-learn).
        """
        # ...

    def classify_onsets(self, waveform: np.ndarray, sr: int, onset_timestamps: np.ndarray) -> List[Dict[str, Any]]:
        """
        Takes a waveform and a list of onset times, and returns a list of classified onsets.
        
        Returns:
            A list of dictionaries, e.g., [{'time': 0.5, 'instrument': 'kick'}, ...]
        """
        # ...

    @staticmethod
    def _extract_features(audio_slice: np.ndarray, sr: int) -> np.ndarray:
        """
        A static helper method to extract features from a single audio slice.
        This logic is shared between training and prediction.
        """
        # ...
```

## 4. Core Logic & Behavior

### 4.1. `__init__`
1.  **Load Model:** The constructor will take a path to a model file. It will use a library like `joblib` or `pickle` to load the pre-trained `scikit-learn` model (e.g., SVM, RandomForest) into memory.
2.  **Error Handling:** Implement `try...except` to handle cases where the model file is not found or corrupted.

### 4.2. `classify_onsets`
1.  **Initialization:** Create an empty list, `classified_onsets`, to store the results.
2.  **Iterate Onsets:** For each `timestamp` in the input `onset_timestamps`:
    a.  **Slicing:** Extract a small window of audio from the `waveform` centered around the onset time. This is identical to the slicing logic in `03_module_design_audio_processing.md`.
    b.  **Feature Extraction:** Call the static helper `_extract_features` on the audio slice to get its feature vector.
    c.  **Prediction:** Use the loaded model's `.predict()` method on the feature vector. The model will return an array with a single predicted label (e.g., `['kick']`).
    d.  **Store Result:** Create a dictionary `{'time': timestamp, 'instrument': predicted_label[0]}` and append it to the `classified_onsets` list.
3.  **Return:** Return the completed `classified_onsets` list.

### 4.3. `_extract_features` (Helper Method)
This method contains the core feature extraction logic, which must be identical to the logic used when training the model.
1.  **MFCCs:** The primary feature will be Mel-Frequency Cepstral Coefficients (MFCCs), as they are excellent for capturing timbre.
    *   `mfccs = librosa.feature.mfcc(y=audio_slice, sr=sr, n_mfcc=13)`
2.  **Aggregation:** The `mfcc` function returns a 2D array (`n_mfcc` x `time_frames`). To get a single feature vector for the classifier, this needs to be aggregated. Taking the mean across the time frames is a robust and effective method.
    *   `feature_vector = np.mean(mfccs, axis=1)`
3.  **Return:** Return the final 1D `feature_vector`.

## 5. Model Training (Offline Process)

The classifier model must be trained offline before the main application can use it. This is a separate process that involves the following steps:

1.  **Data Collection:** Gather a dataset of labeled drum sounds. This consists of short audio files (`.wav`) of individual kick, snare, and hi-hat hits.
2.  **Feature Extraction:** For each audio file in the dataset, load it and run the `_extract_features` logic to compute its feature vector.
3.  **Labeling:** Create a parallel array of labels (e.g., 'kick', 'snare', 'hihat') corresponding to each extracted feature vector.
4.  **Training:**
    *   Split the data into training and testing sets.
    *   Choose a classifier from `scikit-learn` (e.g., `sklearn.svm.SVC` or `sklearn.ensemble.RandomForestClassifier`).
    *   Train the classifier using the `.fit(X_train, y_train)` method.
5.  **Evaluation:** Test the model's accuracy on the test set.
6.  **Serialization:** Once satisfied with the model's performance, save the trained model object to a file using `joblib.dump()`. This file is the `model.pkl` that the `InstrumentClassifier` class will load.

## 6. Data Structures

*   **Input:** `waveform` (1D NumPy array), `onset_timestamps` (1D NumPy array of seconds).
*   **Internal:** `feature_vector` (1D NumPy array of floats, shape `(13,)` if using 13 MFCCs).
*   **Output:** A list of dictionaries: `[{'time': float, 'instrument': str}, ...]`.