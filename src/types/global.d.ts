// src/types/global.d.ts
// Global TypeScript declarations to fix errors

declare global {
    interface Window {
      SpeechRecognition: any;
      webkitSpeechRecognition: any;
      speechSynthesis: SpeechSynthesis;
    }
  
    interface SpeechRecognition extends EventTarget {
      continuous: boolean;
      grammars: SpeechGrammarList;
      interimResults: boolean;
      lang: string;
      maxAlternatives: number;
      serviceURI: string;
      start(): void;
      stop(): void;
      abort(): void;
      onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
      onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
      onend: ((this: SpeechRecognition, ev: Event) => any) | null;
      onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
      onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
      onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
      onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
      onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
      onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
      onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
      onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    }
  
    interface SpeechRecognitionEvent extends Event {
      resultIndex: number;
      results: SpeechRecognitionResultList;
    }
  
    interface SpeechRecognitionErrorEvent extends Event {
      error: string;
      message: string;
    }
  
    interface SpeechRecognitionResult {
      isFinal: boolean;
      length: number;
      item(index: number): SpeechRecognitionAlternative;
      [index: number]: SpeechRecognitionAlternative;
    }
  
    interface SpeechRecognitionResultList {
      length: number;
      item(index: number): SpeechRecognitionResult;
      [index: number]: SpeechRecognitionResult;
    }
  
    interface SpeechRecognitionAlternative {
      transcript: string;
      confidence: number;
    }
  
    var SpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
  
    var webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
  }
  
  export {};