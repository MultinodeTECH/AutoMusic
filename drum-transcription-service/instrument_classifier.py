# Classifies drum sounds from audio features.
import joblib
import numpy as np
from typing import List, Dict, Any

# Import configuration and feature extraction logic
import config
from audio_processor import extract_features_for_onsets


class InstrumentClassifier:
    def __init__(self, model_path: str = config.CLASSIFIER_MODEL_PATH):
        """
        Initializes the classifier by loading a pre-trained model.

        Args:
            model_path: Path to a serialized scikit-learn model file.
        """
        try:
            self.model = joblib.load(model_path)
            print(f"Classifier model loaded from {model_path}")
        except FileNotFoundError:
            print(f"Error: Classifier model not found at {model_path}.")
            print(
                "Please ensure the model is trained and placed in the correct directory."
            )
            self.model = None
        except Exception as e:
            print(f"Error loading classifier model: {e}")
            self.model = None

    def classify_onsets(
        self, waveform: np.ndarray, sr: int, onset_timestamps: np.ndarray
    ) -> List[Dict[str, Any]]:
        """
        Takes a waveform and a list of onset times, and returns a list of classified onsets.

        Returns:
            A list of dictionaries, e.g., [{'time': 0.5, 'instrument': 'kick'}, ...]
        """
        if self.model is None:
            print("Classifier not loaded. Cannot perform classification.")
            return []

        # 1. Extract features for all onsets
        feature_vectors = extract_features_for_onsets(waveform, sr, onset_timestamps)

        if not feature_vectors:
            return []

        # 2. Predict the class for each feature vector
        predicted_labels = self.model.predict(feature_vectors)

        # 3. Combine timestamps with predicted labels
        classified_onsets = []
        for i, timestamp in enumerate(onset_timestamps):
            classified_onsets.append(
                {"time": timestamp, "instrument": predicted_labels[i]}
            )

        return classified_onsets


# Example usage (for testing the module directly)
if __name__ == "__main__":
    # This is a placeholder for a real test.
    # To run this, you would need a trained model and a sample audio file.
    print("Testing Instrument Classifier...")

    # 1. Instantiate the classifier
    # This will fail if 'models/drum_classifier.pkl' does not exist.
    classifier = InstrumentClassifier()

    if classifier.model:
        # 2. Load some sample audio (replace with a real file)
        # waveform, sr = librosa.load('path_to_drum_stem.wav', sr=config.TARGET_SR)

        # 3. Get onsets (replace with real onset detection)
        # onset_times = np.array([0.5, 0.7, 1.0])

        # 4. Classify
        # results = classifier.classify_onsets(waveform, sr, onset_times)
        # print("Classification results:")
        # print(results)
        pass
