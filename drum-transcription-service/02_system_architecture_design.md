# Drum Transcription Service - System Architecture Design

## 1. Introduction

This document outlines the system architecture for the Drum Transcription Service. The architecture is designed as a linear, multi-stage processing pipeline. Each stage takes the output of the previous one as its input, processes it, and passes it to the next, culminating in the final JSON drum score.

## 2. Architectural Principles

*   **Pipeline Processing:** The core design is a sequential pipeline. This is a natural fit for the task and makes the system easy to understand, debug, and test, as the output of each stage can be inspected independently.
*   **Modularity:** Each major processing step (source separation, onset detection, etc.) will be encapsulated in its own Python module or class. This promotes code reuse and separation of concerns.
*   **Data Immutability (Conceptual):** While not strictly enforced, the design philosophy is that each stage receives data and produces a new piece of data, rather than modifying data in place. For example, the source separator takes a waveform and produces a new waveform for the drum stem.

## 3. High-Level Architecture Diagram

The system is best represented as a data flow diagram, showing the transformation of data at each stage.

```mermaid
graph TD
    A[Input Audio File<br/>(song.mp3)] --> B(Stage 1: Audio Loader);
    B -- Raw Waveform & Sample Rate --> C(Stage 2: Source Separator);
    C -- Drum Stem Waveform --> D(Stage 3: Onset Detector);
    D -- Onset Timestamps Array --> E(Stage 4: Feature Extractor);
    E -- Feature Vectors Array --> F(Stage 5: Instrument Classifier);
    F -- Classified Onsets Array --> G(Stage 6: Score Formatter);
    G -- JSON Data Structure --> H[Output JSON File<br/>(score.json)];

    subgraph Pre-trained Models
        M1[Source Separation Model<br/>(e.g., Demucs)] --> C;
        M2[Instrument Classification Model<br/>(e.g., SVM)] --> F;
    end
```

## 4. Component Breakdown

### 4.1. Main Controller (`transcribe.py`)
*   **Responsibility:** This is the main entry point of the CLI tool. It's responsible for parsing command-line arguments, orchestrating the pipeline, and providing user feedback.
*   **Logic:**
    1.  Parse `--input` and `--output` arguments.
    2.  Instantiate and call each pipeline module in the correct order.
    3.  Pass the data from one module to the next.
    4.  Print progress messages to the console.
    5.  Handle exceptions from any stage of the pipeline.

### 4.2. Stage 1: Audio Loader (`audio_loader.py`)
*   **Responsibility:** Loads an audio file from disk into a standardized format.
*   **Input:** File path (string).
*   **Output:** A tuple `(waveform, sample_rate)`, where `waveform` is a NumPy array and `sample_rate` is an integer.
*   **Technology:** `librosa.load()`.
*   **Logic:**
    *   Uses `librosa` to open the audio file.
    *   Resamples the audio to a fixed sample rate (e.g., 44100 Hz) to ensure consistency for downstream models.
    *   Converts stereo audio to mono, as this is sufficient for drum transcription.

### 4.3. Stage 2: Source Separator (`source_separator.py`)
*   **Responsibility:** Isolates the drum track from the full audio mix.
*   **Input:** `(waveform, sample_rate)`.
*   **Output:** `drum_waveform` (NumPy array).
*   **Technology:** A pre-trained `demucs` model.
*   **Logic:**
    *   Loads the pre-trained Demucs model.
    *   Feeds the input waveform into the model.
    *   The model returns multiple stems (drums, bass, vocals, other).
    *   This module selects and returns only the "drums" stem.

### 4.4. Stage 3: Onset Detector (`onset_detector.py`)
*   **Responsibility:** Finds the exact time of each percussive event in the drum stem.
*   **Input:** `drum_waveform`.
*   **Output:** `onset_timestamps` (an array of timestamps in seconds).
*   **Technology:** `librosa.onset.onset_detect()`.
*   **Logic:**
    *   Calculates an onset strength envelope from the drum waveform.
    *   Applies an onset detection algorithm to find the peaks in the envelope, which correspond to drum hits.
    *   Converts the resulting frame indices to timestamps (in seconds).

### 4.5. Stage 4 & 5: Classifier (`instrument_classifier.py`)
This component combines feature extraction and classification.
*   **Responsibility:** To identify which drum instrument was played at each onset time.
*   **Input:** `drum_waveform` and `onset_timestamps`.
*   **Output:** `classified_onsets` (an array of objects, e.g., `[{time: 0.5, instrument: 'kick'}, ...]`).
*   **Technology:** `librosa` for feature extraction, `scikit-learn` for the classification model.
*   **Logic:**
    1.  **Load Model:** Load the pre-trained scikit-learn classification model (e.g., from a `.pkl` file).
    2.  **Iterate Onsets:** For each timestamp in `onset_timestamps`:
        a.  **Slicing:** Extract a small window of audio (e.g., 100ms) from the `drum_waveform` centered around the onset time.
        b.  **Feature Extraction:** Calculate a feature vector for this audio slice (e.g., MFCCs).
        c.  **Prediction:** Feed the feature vector into the loaded model to get a predicted instrument label (e.g., 'kick', 'snare', 'hihat').
    3.  **Collect Results:** Store the `(time, predicted_label)` pair.
    4.  Return the full list of classified onsets.

### 4.6. Stage 6: Score Formatter (`score_formatter.py`)
*   **Responsibility:** Converts the internal list of classified onsets into the final JSON output format.
*   **Input:** `classified_onsets` array and metadata (e.g., input filename).
*   **Output:** A Python dictionary representing the final JSON structure.
*   **Logic:**
    1.  **BPM Estimation:** Use `librosa.beat.beat_track` on the drum stem to estimate the song's tempo (BPM).
    2.  **Note Mapping:** Create a dictionary to map instrument labels to MIDI note numbers (e.g., `'kick': 36`).
    3.  **Build Note List:** Iterate through the `classified_onsets`. For each onset, convert its timestamp to milliseconds and look up its MIDI note number. Create a note object `{ "time": ms, "note": midi_note }`.
    4.  **Assemble JSON:** Create the final dictionary with `metadata` and the sorted `notes` list.
    5.  The main controller will then take this dictionary and write it to the output file.