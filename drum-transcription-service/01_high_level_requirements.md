# Drum Transcription Service - High-Level Requirements Specification

## 1. Introduction

This document outlines the high-level functional and non-functional requirements for the MVP of the Drum Transcription Service. The primary goal is to create a command-line tool that can automatically generate a drum score from a given audio file.

## 2. System Overview

The system will function as a non-interactive pipeline. A user provides an audio file, and the system processes it through several stages—source separation, onset detection, instrument classification, and formatting—to produce a JSON file representing the drum track.

## 3. Functional Requirements (FR)

### FR1: Input Handling
*   **FR1.1:** The system MUST accept a path to an audio file as a command-line argument.
*   **FR1.2:** The system MUST support at least two common audio formats: `.mp3` and `.wav`.
*   **FR1.3:** The system MUST handle potential errors related to file input, such as the file not being found or being in an unsupported format.

### FR2: Audio Processing Pipeline
*   **FR2.1: Source Separation:** The system MUST process the input audio to isolate a "drums" audio stem. The other stems (bass, vocals, other) can be discarded.
*   **FR2.2: Onset Detection:** The system MUST analyze the drum stem to detect the timestamps of individual drum hits (onsets).
*   **FR2.3: Instrument Classification:** For each detected onset, the system MUST classify the instrument that was most likely played.
*   **FR2.4:** The MVP classification model MUST be able to distinguish between at least three core drum types: Kick, Snare, and Hi-Hat.

### FR3: Output Generation
*   **FR3.1:** The system MUST generate a JSON file as its primary output.
*   **FR3.2:** The output JSON file MUST conform to the structure defined in the "Drum Score JSON" data format document (metadata and a sorted list of notes).
*   **FR3.3:** The system MUST allow the user to specify the output file path via a command-line argument.
*   **FR3.4:** The `metadata` section of the output JSON SHOULD be populated with basic information, such as a title derived from the input filename and an estimated BPM.

## 4. Non-Functional Requirements (NFR)

### NFR1: Performance & Resource Usage
*   **NFR1.1:** The transcription process is not real-time. The total processing time for a typical 3-minute song on standard consumer hardware should be reasonable (e.g., under 5 minutes).
*   **NFR1.2:** The system, particularly the source separation model, will be memory-intensive. It should be designed to function on a system with a reasonable amount of RAM (e.g., 8-16 GB). If a GPU is available, the system SHOULD utilize it to accelerate processing.

### NFR2: Accuracy & Reliability
*   **NFR2.1:** The accuracy of the transcription will not be perfect. The MVP should aim for a reasonable level of precision and recall for the three core instruments in songs with clear, prominent drum tracks.
*   **NFR2.2:** The system MUST be deterministic. Given the same input file and model versions, it MUST always produce the exact same output.
*   **NFR2.3:** The system's dependencies (Python libraries, pre-trained models) MUST be clearly documented to ensure reproducibility.

### NFR3: Usability (CLI)
*   **NFR3.1:** The command-line interface MUST be simple to use.
*   **NFR3.2:** The tool SHOULD provide progress feedback to the user during the lengthy transcription process (e.g., "Step 1/4: Separating audio sources...").
*   **NFR3.3:** The tool MUST provide clear error messages if any stage of the process fails.

## 5. Out of Scope for MVP

*   A graphical user interface (GUI).
*   Real-time transcription.
*   Support for a wide range of less common percussion instruments.
*   Training the source separation model from scratch (pre-trained models will be used).
*   Advanced musical feature analysis (e.g., time signature detection, swing detection).
*   An online/web-based service.