import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';

interface VoiceCommandOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  aiResponse?: string;
}

const VoiceCommandOverlay: React.FC<VoiceCommandOverlayProps> = ({
  isOpen,
  onClose,
  onTranscript,
  isProcessing,
  aiResponse
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Audio for visualizer
  const initAudioVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      
      drawVisualizer();
    } catch (error) {
      console.error('Error initializing audio visualizer:', error);
    }
  }, []);

  // Draw waveform visualizer
  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isListening) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        // Gradient from purple to blue
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.9)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
      }
    };
    
    draw();
  }, [isListening]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(interimTranscript || finalTranscript);
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening && isOpen) {
          // Restart if still supposed to be listening
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Recognition already started');
          }
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, isListening, onTranscript]);

  // Start/stop listening
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = async () => {
    setIsListening(true);
    setTranscript('');
    
    await initAudioVisualizer();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log('Recognition already started');
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Speak AI response
  const speakResponse = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    
    // Force American English voice - prioritize Google US voices
    const voices = window.speechSynthesis.getVoices();
    const americanVoice = voices.find(voice => 
      voice.lang === 'en-US' && voice.name.includes('Google')
    ) || voices.find(voice => 
      voice.lang === 'en-US' && (voice.name.includes('Samantha') || voice.name.includes('Alex'))
    ) || voices.find(voice => 
      voice.lang === 'en-US'
    );
    
    if (americanVoice) {
      utterance.voice = americanVoice;
    }
    utterance.lang = 'en-US';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Speak AI response when received
  useEffect(() => {
    if (aiResponse && !isProcessing) {
      speakResponse(aiResponse);
    }
  }, [aiResponse, isProcessing, speakResponse]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  // Handle close with interrupt
  const handleClose = () => {
    stopListening();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTranscript('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg flex flex-col items-center justify-center">
      {/* Close Button */}
      <Button
        variant="ghost"
        onClick={handleClose}
        className="absolute top-6 right-6 text-white hover:bg-white/10 h-12 w-12 rounded-full"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-2">QuickShip AI Voice</h2>
        <p className="text-purple-200">
          {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Processing...' : 'Click the mic to start'}
        </p>
      </div>

      {/* Waveform Visualizer */}
      <div className="relative mb-8">
        <canvas
          ref={canvasRef}
          width={400}
          height={100}
          className="rounded-lg bg-black/20"
        />
        {!isListening && !isSpeaking && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-purple-300 text-sm">Audio waveform will appear here</div>
          </div>
        )}
      </div>

      {/* Mic Button */}
      <div className="relative mb-8">
        <Button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`h-24 w-24 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isListening ? (
            <MicOff className="w-10 h-10 text-white" />
          ) : isSpeaking ? (
            <Volume2 className="w-10 h-10 text-white animate-pulse" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </Button>
        
        {/* Pulse rings when listening */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-red-400/50 animate-ping" />
            <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>

      {/* Transcript Display */}
      <div className="w-full max-w-2xl px-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 min-h-[100px]">
          <p className="text-white text-lg text-center">
            {transcript || (isProcessing ? 'Processing your request...' : aiResponse || 'Say something like "Ship a 5lb package from Miami to New York"')}
          </p>
        </div>
      </div>

      {/* AI Response */}
      {aiResponse && !isProcessing && (
        <div className="mt-6 w-full max-w-2xl px-8">
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className={`w-5 h-5 text-purple-300 ${isSpeaking ? 'animate-pulse' : ''}`} />
              <span className="text-purple-200 text-sm">QuickShip AI Response</span>
            </div>
            <p className="text-white text-lg">{aiResponse}</p>
          </div>
        </div>
      )}

      {/* Quick Commands */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center px-8">
        {[
          'Ship a package to NYC',
          'Show me rates',
          'Go to settings',
          'Upload a batch'
        ].map((cmd, i) => (
          <Button
            key={i}
            variant="outline"
            onClick={() => {
              setTranscript(cmd);
              onTranscript(cmd);
            }}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {cmd}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default VoiceCommandOverlay;
