# Detailed Design: Score Formatter Module

## 1. Introduction

This document provides the detailed design for the **Score Formatter Module**. This is the final stage in the transcription pipeline. It takes the raw, classified onset data and transforms it into the clean, structured, and musically coherent JSON format that is the final product of the service.

## 2. Module Responsibilities

*   Accept a list of classified onsets (timestamps and instrument labels).
*   Accept metadata such as estimated BPM and the original filename.
*   (Optional but Recommended) Quantize the onset times to a musical grid.
*   Map instrument labels to their corresponding General MIDI (GM) note numbers.
*   Assemble the final data structure, including metadata and the sorted list of notes.
*   Provide a method to save the final data structure to a JSON file.

## 3. Public API / Interface

This module can be implemented as a class to handle the formatting process.

```python
# Filename: score_formatter.py
import json
from typing import List, Dict, Any

class ScoreFormatter:
    def __init__(self, classified_onsets: List[Dict[str, Any]], bpm: float, original_filename: str):
        """
        Initializes the formatter with the necessary data.
        'classified_onsets' is a list of dicts, e.g., [{'time': 1.23, 'instrument': 'kick'}, ...]
        """
        # ...

    def quantize_onsets(self, subdivision: int = 16):
        """
        Aligns onset times to the nearest musical subdivision (e.g., 16th notes).
        This is an optional but highly recommended step.
        """
        # ...

    def generate_score_dict(self) -> Dict[str, Any]:
        """
        Generates the final Python dictionary that represents the JSON score.
        """
        # ...

    def save_to_json(self, output_path: str):
        """
        Saves the generated score dictionary to a JSON file.
        """
        # ...
```

## 4. Core Logic & Behavior

### 4.1. `__init__`
1.  Store the input `classified_onsets`, `bpm`, and `original_filename`.
2.  Define the mapping from instrument labels to MIDI note numbers.
    ```python
    self.instrument_to_midi = {
        'kick': 36,
        'snare': 38,
        'hihat': 42,
        # Add more mappings as the classifier improves
    }
    ```

### 4.2. `quantize_onsets` (Optional Step)
1.  **Calculate Grid Interval:** Determine the duration of a single subdivision in seconds.
    *   `seconds_per_beat = 60.0 / self.bpm`
    *   `seconds_per_subdivision = seconds_per_beat / (subdivision / 4)` (e.g., for 16th notes, subdivision is 16, so `seconds_per_beat / 4`).
2.  **Align Timestamps:** Iterate through `self.classified_onsets`. For each onset:
    *   `original_time = onset['time']`
    *   `grid_steps = round(original_time / seconds_per_subdivision)`
    *   `quantized_time = grid_steps * seconds_per_subdivision`
    *   Update the onset's time: `onset['time'] = quantized_time`.
3.  **Remove Duplicates:** After quantization, it's possible for two different hits (e.g., a kick and a hi-hat) that were very close together to be quantized to the exact same timestamp. The logic should handle this gracefully. For the MVP, we can simply keep both.

### 4.3. `generate_score_dict`
1.  **Initialize Score Structure:** Create the main dictionary: `score = {"metadata": {}, "notes": []}`.
2.  **Populate Metadata:**
    *   `score['metadata']['title'] = f"Drum Transcription of {self.original_filename}"`
    *   `score['metadata']['bpm'] = round(self.bpm, 2)`
    *   `score['metadata']['difficulty'] = "N/A"`
3.  **Populate Notes:**
    *   Iterate through `self.classified_onsets`.
    *   For each `onset`:
        a.  Get the instrument label (e.g., 'kick').
        b.  Look up the MIDI note number from `self.instrument_to_midi`. If the label is not in the map, skip it.
        c.  Convert the timestamp (in seconds) to milliseconds: `time_ms = int(onset['time'] * 1000)`.
        d.  Create the note object: `note_obj = {"time": time_ms, "note": midi_note}`.
        e.  Append `note_obj` to the `score['notes']` list.
4.  **Sort Notes:** Although the onsets should already be sorted by time, it's good practice to sort the final `notes` list one last time to guarantee correctness: `score['notes'].sort(key=lambda x: x['time'])`.
5.  **Calculate Duration:** The duration is the time of the last note. `last_note_time = score['notes'][-1]['time'] if score['notes'] else 0`. Set `score['metadata']['duration'] = last_note_time`.
6.  **Return:** Return the completed `score` dictionary.

### 4.4. `save_to_json`
1.  Call `self.generate_score_dict()` to get the final data.
2.  Use Python's `json` library to write the dictionary to the specified `output_path`.
    ```python
    import json
    with open(output_path, 'w') as f:
        json.dump(score_data, f, indent=2)
    ```
    Using `indent=2` makes the output file human-readable.

## 5. Data Structures

*   **Input (`classified_onsets`):** A list of dictionaries, where each dictionary is `{'time': float_seconds, 'instrument': 'string_label'}`.
*   **Output:** A dictionary conforming to the pre-defined drum score JSON format.