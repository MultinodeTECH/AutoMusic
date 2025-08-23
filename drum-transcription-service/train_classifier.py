# Script to train the instrument classifier model.
# This script scans a directory of labeled audio samples (created by create_dataset.py),
# extracts features, trains a scikit-learn model, and saves it to a file.

import os
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Import project modules
import config
import audio_processor

# --- Configuration ---
DATASET_DIR = "dataset"
MODEL_OUTPUT_PATH = config.CLASSIFIER_MODEL_PATH


def load_data_from_directory(directory: str):
    """
    Loads all .wav files from subdirectories of the given directory.
    The subdirectory name is used as the label.
    """
    features = []
    labels = []

    print(f"Scanning directory: {directory}")

    for instrument_label in os.listdir(directory):
        instrument_dir = os.path.join(directory, instrument_label)
        if os.path.isdir(instrument_dir):
            print(f"  - Loading samples for: {instrument_label}")
            for filename in os.listdir(instrument_dir):
                if filename.endswith(".wav"):
                    file_path = os.path.join(instrument_dir, filename)

                    # Load audio and extract features
                    waveform, sr = audio_processor.load_audio(file_path)

                    # We treat the whole short clip as the feature
                    mfccs = librosa.feature.mfcc(
                        y=waveform, sr=sr, n_mfcc=config.N_MFCC
                    )
                    feature_vector = np.mean(mfccs, axis=1)

                    features.append(feature_vector)
                    labels.append(instrument_label)

    return np.array(features), np.array(labels)


def main():
    """Main function to run the training process."""
    print("--- Starting Instrument Classifier Training ---")

    # 1. Load the dataset
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Dataset directory not found at '{DATASET_DIR}'")
        print("Please run 'create_dataset.py' first to generate the training samples.")
        return

    features, labels = load_data_from_directory(DATASET_DIR)

    if len(features) == 0:
        print("No features were loaded. Is the dataset directory empty?")
        return

    print(
        f"\nLoaded {len(features)} samples belonging to {len(np.unique(labels))} classes."
    )

    # 2. Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"Training set size: {len(X_train)}")
    print(f"Testing set size: {len(X_test)}")

    # 3. Train the model
    # A RandomForestClassifier is a good, robust choice for this kind of task.
    print("\nTraining RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    print("Training complete.")

    # 4. Evaluate the model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy on Test Set: {accuracy * 100:.2f}%")

    # 5. Save the trained model
    # Ensure the 'models' directory exists
    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    joblib.dump(model, MODEL_OUTPUT_PATH)
    print(f"\nModel successfully saved to: {MODEL_OUTPUT_PATH}")
    print("You can now run the main 'transcribe.py' script.")


if __name__ == "__main__":
    # Need to import librosa here because it's used in the feature extraction part
    import librosa

    main()
