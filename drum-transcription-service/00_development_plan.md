# MP3 to Drum Score Transcription Service - Development Plan

## 1. Core Goal

To develop a robust, automated system capable of processing a standard audio file (e.g., MP3, WAV), identifying the drum track within it, and transcribing the drum hits into a structured, machine-readable format (e.g., the JSON drum score format we previously defined).

## 2. Core Features (MVP)

The MVP will focus on delivering a functional proof-of-concept that can handle common drum sounds in relatively clear audio mixes.

*   **Audio File Input:**
    *   Accept an audio file (MP3, WAV) as input.
*   **Source Separation (Simplified):**
    *   Isolate the percussive elements from the rest of the audio mix (e.g., vocals, bass, synths).
*   **Onset Detection:**
    *   Accurately detect the precise timing of each drum hit (the "onset").
*   **Instrument Classification:**
    *   For each detected onset, classify which drum instrument was played. The MVP will focus on the most common kit pieces:
        *   Kick Drum
        *   Snare Drum
        *   Hi-Hat (can be simplified to a single class, ignoring open/closed distinction for now)
*   **Score Generation:**
    *   Convert the list of timed, classified drum hits into the previously defined JSON drum score format.

## 3. Technology Stack & Approach

This project is heavily focused on audio signal processing and machine learning.

*   **Core Language:** Python. It has an unparalleled ecosystem of libraries for scientific computing, audio processing, and machine learning.
*   **Core Libraries:**
    *   **`librosa`:** The industry standard for audio analysis and feature extraction in Python. It will be used for loading audio, calculating spectrograms, and onset detection.
    *   **`demucs` or `spleeter`:** Pre-trained deep learning models for music source separation. These are excellent for isolating the drum track from a full mix. `demucs` is a more modern and often higher-quality choice.
    *   **`scikit-learn`:** For building a classical machine learning model (e.g., SVM, RandomForest) for drum sound classification. This is a good starting point before moving to more complex deep learning models.
    *   **`numpy`:** For all numerical operations.
*   **Execution Environment:**
    *   **Command-Line Interface (CLI):** The MVP will be a CLI tool. A user will run a command like `python transcribe.py --input song.mp3 --output score.json`.
    *   **Jupyter Notebooks:** Will be used extensively for research, prototyping, and visualizing the results of each step in the pipeline.

## 4. Development Phases

The project can be broken down into a clear, sequential pipeline.

*   **Phase 1: Research & Data Preparation**
    *   **Goal:** Understand the fundamentals of ADT and gather a small dataset for training and testing.
    *   **Tasks:**
        *   Research existing ADT techniques.
        *   Find a small, labeled dataset of drum stems or full songs with corresponding MIDI/annotations.
        *   Set up the Python environment with all necessary libraries.

*   **Phase 2: The Processing Pipeline**
    *   **Goal:** Build the end-to-end audio processing pipeline.
    *   **Tasks:**
        1.  **Audio Loading:** Implement logic to load and resample audio to a consistent sample rate.
        2.  **Source Separation:** Integrate a pre-trained model (e.g., `demucs`) to extract the drum stem.
        3.  **Onset Detection:** Use `librosa.onset.onset_detect` on the drum stem to get a list of hit timestamps.

*   **Phase 3: Classification Model**
    *   **Goal:** Build a model that can classify the instrument for each detected onset.
    *   **Tasks:**
        1.  **Feature Extraction:** For each onset, extract a small audio segment around it and compute features (e.g., MFCCs, spectral centroid) using `librosa`.
        2.  **Model Training:** Train a classifier (e.g., a Support Vector Machine) on the labeled dataset to distinguish between Kick, Snare, and Hi-Hat based on their features.
        3.  **Integration:** Integrate the trained model into the pipeline to classify the onsets detected in Phase 2.

*   **Phase 4: Score Generation & Refinement**
    *   **Goal:** Convert the classified hits into the final JSON format and refine the output.
    *   **Tasks:**
        1.  **Formatter:** Write a module that takes the final list of `(timestamp, instrument_label)` and converts it into the JSON score format (mapping labels to MIDI notes).
        2.  **Quantization (Optional but Recommended):** Implement a simple quantization algorithm to align the detected hit times to a musical grid (e.g., the nearest 16th note). This makes the output much cleaner and more useful.

## 5. Future Roadmap

*   **Deep Learning for Classification:** Replace the scikit-learn model with a more powerful Convolutional Neural Network (CNN) trained on spectrograms for higher accuracy.
*   **Expanded Instrument Set:** Train the model to recognize more instruments (toms, cymbals, open vs. closed hi-hats).
*   **Web Interface:** Wrap the Python backend in a simple Flask/FastAPI server and build a web UI for users to upload songs and get results.
*   **Real-time Transcription:** Explore real-time audio processing for live applications.