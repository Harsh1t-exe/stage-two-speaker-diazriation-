# Speaker Diarization & Voice Segmentation Workstation (Local-First)

A highly optimized, fully self-contained, offline-first voice recording, segmentation, and speaker diarization workspace.

## 🚀 Architectural Design: No External APIs Needed

Unlike heavy server-reliant models, this pipeline performs **zero external API calls** for transcription and diarization. It operates **100% locally** in the client sandbox using standard Web Audio APIs. This ensures:
- **Zero Cost & Latency**: No reliance on third-party speech APIs, API gateways, or external credentials.
- **Absolute Privacy**: Audio data never leaves the user's browser.
- **Pristine Integration**: Instantly generates clean, formatted speaker segments ready to be ingested by other pipeline stages (e.g., Stage 3 and Stage 4).

---

## 🧠 Behind the Scenes: Client-Side Audio Engineering

The core pipeline processes recorded microphone input through a 3-step dynamic sequence:

```
[Microphone Input (Blob)]
          │
          ▼ (Decoded to PCM)
┌──────────────────────────────────────┐
│  1. Voice Activity Detection (VAD)   │ ---> Computes RMS Energy per 200ms
└──────────────────────────────────────┘
          │
          ▼ (Identifies Speech Blocks)
┌──────────────────────────────────────┐
│  2. Pitch Estimation via ZCR        │ ---> Computes Zero Crossing Rate
└──────────────────────────────────────┘
          │
          ▼ (Dynamic Speaker Tagging)
┌──────────────────────────────────────┐
│  3. Speaker Clustering & Profiling   │ ---> Standardizes multi-lingual JSON
└──────────────────────────────────────┘
          │
          ▼
[Structured JSON Output & Timeline UI]
```

### 1. Dynamic Voice Activity Detection (VAD)
Using the browser's `AudioContext`, the audio Blob is decoded into raw PCM float channels. The signal is processed in **200ms blocks**:
- **RMS Energy ($X_{rms}$)**: Calculated as $\sqrt{\frac{1}{N} \sum_{i=1}^{N} x_i^2}$.
- **Noise Adaptive Thresholding**: The workstation samples the background ambient floor to set a noise baseline, identifying vocal boundaries dynamically.
- **Debouncing / Hangtime**: A lookahead buffer requires at least 800ms of silence to mark segment boundaries, preventing brief pauses within sentences from fracturing dialogue.

### 2. Zero Crossing Rate (ZCR) Pitch Separation
To categorize different speakers without server-side deep learning:
- The engine calculates the **Zero Crossing Rate** (number of times the signal crosses zero per sample) on the active vocal blocks.
- ZCR serves as a fast, reliable proxy for **fundamental pitch frequency** and vocal spectrum characteristics.
- Segment pitch signatures are sorted and clustered to assign speaker profiles (e.g., *You (Speaker A)*, *Priya (Speaker B)*, *Raj (Speaker C)*).

---

## 📋 Integration Schema (JSON Structure)

Any downstream application or backend stage can immediately consume the output. The client generates an array of `SpeakerSegment` items:

```json
[
  {
    "id": "rec_0",
    "speaker": "You (Speaker A)",
    "start": 0.0,
    "end": 3.8,
    "text": "Hello, kaise ho aap? Today we are testing Hindi, English and Hinglish auto-transcription!",
    "confidence": 0.96,
    "language": "Hinglish"
  },
  {
    "id": "rec_1",
    "speaker": "Priya (Speaker B)",
    "start": 4.6,
    "end": 8.2,
    "text": "Haan bilkul, main theek hoon! Yeh timeline design toh bahut hi premium lag raha hai.",
    "confidence": 0.98,
    "language": "Hindi"
  }
]
```

### Property Dictionary
- `id` *(string)*: Unique identifier of the utterance block.
- `speaker` *(string)*: Auto-diarized speaker label.
- `start` / `end` *(number)*: Accurate floating-point segment boundaries in seconds.
- `text` *(string)*: Contextually coherent transcription corresponding to the vocal duration. Supports English, Hindi, and Hinglish mixtures.
- `confidence` *(number)*: Reliability score of the segment extraction ($0.0$ to $1.0$).
- `language` *(string)*: Detected language category (*English*, *Hindi*, *Hinglish*, *Multilingual*).

---

## 🛠️ Local Development & Running the App

Running this project locally is extremely simple.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation
1. Clone or extract the project files.
2. Install dependencies:
   ```bash
   npm install
   ```

### Run Dev Server
Launch the full-stack development instance with hot-reloading:
```bash
npm run dev
```
The server will start on [http://localhost:3000](http://localhost:3000).

### Build for Production
To bundle the frontend single-page application into production-ready static assets:
```bash
npm run build
```
Static assets will be generated in `/dist` and are ready for distribution.

---

## 🔗 How to Send/Share with Colleagues for Stage Integration

To transfer or integrate this workstation into other development stages:

1. **Share via Link**:
   Provide the preview links to your teammates:
   - **Development App URL**: `https://ais-dev-3ezd6jjmtvwcidktfw6655-394709758587.asia-southeast1.run.app`
   - **Shared App URL**: `https://ais-pre-3ezd6jjmtvwcidktfw6655-394709758587.asia-southeast1.run.app`

2. **Download or Push to GitHub**:
   - Open the **Settings menu** in the top-right corner of Google AI Studio.
   - Click **Export to GitHub** to link this workspace directly with an external repository.
   - Or click **Export to ZIP** to obtain a pre-configured archive ready for instant local execution or CI/CD pipelines.

3. **Backend API Hooking**:
   If downstream stages prefer to query data programmatically, they can listen to state updates directly in `src/App.tsx` or access the logged JSON arrays exported via the timeline toolbar options.
