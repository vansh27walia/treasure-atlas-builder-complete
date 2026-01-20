import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, X, MessageCircle, Clock, DollarSign, Package, MapPin, CreditCard, FileText, Mic, MicOff, Volume2, VolumeX, Settings, LayoutGrid, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAIActionHandler } from '@/hooks/useAIActionHandler';
import { AIRateCard, AIBatchUploader, AIAddressCard, AIDimensionsCard } from './ai-tools';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isSystem?: boolean;
  timestamp: Date;
  toolData?: {
    type: 'rate_card' | 'batch_uploader' | 'address_card' | 'dimensions_card' | 'rate_list';
    data: any;
  };
}

interface ShipAIChatbotProps {
  onClose?: () => void;
}

const WORKFLOW_STEPS = [
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'dimensions', label: 'Specs', icon: Package },
  { id: 'rates', label: 'Rates', icon: DollarSign },
  { id: 'payment', label: 'Pay', icon: CreditCard },
  { id: 'label', label: 'Label', icon: FileText },
];

const ShipAIChatbot: React.FC<ShipAIChatbotProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('address');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // AI Action Handler with navigation support
  const { handleAIAction } = useAIActionHandler({
    onFillAddress: (data) => console.log('Fill address:', data),
    onFillDimensions: (data) => console.log('Fill dimensions:', data),
    onFetchRates: () => console.log('Fetch rates triggered'),
    onConfirmRate: (data) => console.log('Confirm rate:', data),
    onTriggerPayment: (data) => console.log('Trigger payment:', data),
    onGenerateLabel: (data) => console.log('Generate label:', data),
    onNavigate: (data) => console.log('Navigate:', data),
    onAutoFillHistory: (data) => console.log('Auto fill history:', data),
    onStepChange: (step) => setCurrentStep(step),
  }, navigate);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
        // Auto-send after voice input
        setTimeout(() => handleSendMessage(transcript), 300);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice input failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Text-to-speech for AI responses
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
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
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('Listening... Speak now');
    }
  };

  const toggleSpeaker = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };
  
  // Listen for auto-send event from AI Rate Analysis panel
  useEffect(() => {
    const handleAutoSend = (e: CustomEvent) => {
      const message = e.detail?.message;
      if (message) {
        setIsOpen(true);
        setTimeout(() => {
          handleSendMessage(message);
        }, 300);
      }
    };

    const handleOpenChatbot = () => {
      setIsOpen(true);
      const prefillMessage = sessionStorage.getItem('ai-chat-prefill');
      if (prefillMessage) {
        sessionStorage.removeItem('ai-chat-prefill');
        setTimeout(() => {
          handleSendMessage(prefillMessage);
        }, 300);
      }
    };

    document.addEventListener('ai-chat-auto-send', handleAutoSend as EventListener);
    document.addEventListener('open-ai-chatbot', handleOpenChatbot);
    return () => {
      document.removeEventListener('ai-chat-auto-send', handleAutoSend as EventListener);
      document.removeEventListener('open-ai-chatbot', handleOpenChatbot);
    };
  }, []);

  // Check for pre-filled context from sessionStorage
  useEffect(() => {
    if (isOpen) {
      const contextMessage = sessionStorage.getItem('chatbot-context');
      if (contextMessage) {
        setInputMessage(contextMessage);
        sessionStorage.removeItem('chatbot-context');
      }
    }
  }, [isOpen]);

  const handleSendMessage = async (predefinedMessage?: string) => {
    const messageToSend = predefinedMessage || inputMessage;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get conversation history for context
      const conversationHistory = messages.slice(-10).map(m => ({
        content: m.content,
        isUser: m.isUser
      }));

      const { data, error } = await supabase.functions.invoke('ship-ai-chat', {
        body: {
          message: messageToSend,
          context: 'shipping_assistant',
          conversationHistory
        }
      });

      if (error) throw error;

      // Handle AI action if present
      if (data.action && data.action !== 'SHOW_INFO' && data.action !== 'ASK_QUESTION') {
        const systemMessage = handleAIAction({
          action: data.action,
          data: data.data,
          currentStep: data.currentStep
        });
        
        // Add system message if action was performed
        if (systemMessage) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 0.5).toString(),
            content: systemMessage,
            isUser: false,
            isSystem: true,
            timestamp: new Date()
          }]);
        }
      }

      // Update step from response
      if (data.currentStep) {
        setCurrentStep(data.currentStep);
      }

      // Determine if we should add a tool UI component
      let toolData: Message['toolData'] | undefined;
      
      if (data.action === 'FILL_ADDRESS' && data.data) {
        toolData = {
          type: 'address_card',
          data: {
            pickupAddress: data.data.pickup_address,
            dropoffAddress: data.data.dropoff_address
          }
        };
      } else if (data.action === 'FILL_DIMENSIONS' && data.data) {
        toolData = {
          type: 'dimensions_card',
          data: {
            weight: data.data.weight || 5,
            length: data.data.length || 12,
            width: data.data.width || 10,
            height: data.data.height || 8,
            packageType: data.data.packageType || 'box'
          }
        };
      } else if (data.action === 'CONFIRM_RATE' && data.data) {
        toolData = {
          type: 'rate_card',
          data: {
            carrier_name: data.data.carrier_name,
            service_type: data.data.service_type,
            price: data.data.price || 0,
            isBestValue: true
          }
        };
      } else if (data.action === 'NAVIGATE' && data.data?.path === '/bulk-upload') {
        toolData = {
          type: 'batch_uploader',
          data: {}
        };
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm here to help with your shipping needs. Can you please rephrase your question?",
        isUser: false,
        timestamp: new Date(),
        toolData
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Speak AI response if voice is enabled
      if (voiceEnabled && data.response) {
        speakText(data.response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const getStepIndex = (stepId: string) => {
    return WORKFLOW_STEPS.findIndex(s => s.id === stepId);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </Button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[650px] max-w-[90vw] max-h-[85vh]">
          <Card className="h-full flex flex-col shadow-2xl border-2 border-purple-200 bg-white">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">QuickShip AI</h3>
                    <p className="text-xs text-purple-100">Master Orchestrator</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSpeaker}
                    className="text-white hover:bg-purple-500/20 h-8 w-8 p-0"
                    title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-white hover:bg-purple-500/20 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Progress Stepper */}
              <div className="flex items-center justify-between px-2">
                {WORKFLOW_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = getStepIndex(currentStep) > index;
                  
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isActive 
                            ? 'bg-white text-purple-600 ring-2 ring-yellow-300' 
                            : isCompleted 
                              ? 'bg-green-400 text-white' 
                              : 'bg-purple-400/50 text-purple-200'
                        }`}>
                          <StepIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[10px] mt-1 ${isActive ? 'text-white font-medium' : 'text-purple-200'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < WORKFLOW_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${
                          isCompleted ? 'bg-green-400' : 'bg-purple-400/50'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-3">
                      <Sparkles className="w-7 h-7 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Welcome to QuickShip AI!</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      I can assist you with everything from batch creation and rate calculation to managing your shipping settings.
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage('I want to ship a 5lb box from Miami to New York')}
                        className="text-xs w-full justify-start"
                      >
                        <Package className="w-3 h-3 mr-2" />
                        "Ship a 5lb box from Miami to NYC"
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage('What are the cheapest rates for my shipment?')}
                        className="text-xs w-full justify-start"
                      >
                        <DollarSign className="w-3 h-3 mr-2" />
                        "Find me the cheapest rates"
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage('How do I upload a batch?')}
                        className="text-xs w-full justify-start"
                      >
                        <LayoutGrid className="w-3 h-3 mr-2" />
                        "How do I upload a batch?"
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage('Take me to settings')}
                        className="text-xs w-full justify-start"
                      >
                        <Settings className="w-3 h-3 mr-2" />
                        "Take me to settings"
                      </Button>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.isSystem ? (
                      <div className="w-full bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">
                        {message.content}
                      </div>
                    ) : (
                      <div className={`max-w-[90%] ${message.isUser ? '' : 'w-full'}`}>
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            message.isUser
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {!message.isUser && voiceEnabled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => speakText(message.content)}
                                className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Generative UI Components */}
                        {message.toolData && (
                          <div className="mt-2">
                            {message.toolData.type === 'address_card' && (
                              <AIAddressCard
                                pickupAddress={message.toolData.data.pickupAddress}
                                dropoffAddress={message.toolData.data.dropoffAddress}
                              />
                            )}
                            {message.toolData.type === 'dimensions_card' && (
                              <AIDimensionsCard dimensions={message.toolData.data} />
                            )}
                            {message.toolData.type === 'rate_card' && (
                              <AIRateCard rate={message.toolData.data} />
                            )}
                            {message.toolData.type === 'batch_uploader' && (
                              <AIBatchUploader compact />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-gray-50 rounded-b-lg">
              <div className="flex gap-2">
                <Button
                  onClick={toggleVoiceInput}
                  variant={isListening ? "destructive" : "outline"}
                  className={`h-10 w-10 p-0 ${isListening ? 'animate-pulse' : ''}`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Tell me what to ship..."
                  className="flex-1 min-h-[40px] max-h-[80px] resize-none text-sm"
                  onKeyPress={handleKeyPress}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700 h-10 w-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-center">
                🎤 Voice enabled • AI will auto-fill forms and navigate for you
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ShipAIChatbot;
