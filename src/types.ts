export interface SpeakerSegment {
  id: string;
  speaker: string;
  start: number; // in seconds
  end: number;   // in seconds
  text?: string;
  language?: string;
  confidence: number;
}

export interface AudioSample {
  id: string;
  name: string;
  duration: number; // in seconds
  description: string;
  segments: SpeakerSegment[];
}

export interface DiarizationParams {
  clusteringThreshold: number; // 0.0 - 1.0
  minDurationOn: number;       // seconds
  minDurationOff: number;      // seconds
  overlapThreshold: number;     // 0.0 - 1.0
  maxSpeakers: number | null;
}

export interface CodeLanguage {
  id: string;
  name: string;
  extension: string;
  code: string;
}

export interface SchemaDefinition {
  title: string;
  description: string;
  direction: 'input' | 'output';
  stage: string;
  json: string;
}

export interface BenchmarkMetric {
  cores: number;
  onnxRtf: number;  // Real-time factor for ONNX
  torchRtf: number; // Real-time factor for PyTorch
  ramMb: number;
}
