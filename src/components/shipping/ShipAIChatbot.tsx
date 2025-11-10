
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, X, MessageCircle, TrendingUp, Package, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ShipAIChatbotProps {
  onClose?: () => void;
}

const ShipAIChatbot: React.FC<ShipAIChatbotProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
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
      // Check for prefilled message
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
      const { data, error } = await supabase.functions.invoke('ship-ai-chat', {
        body: {
          message: messageToSend,
          context: 'shipping_assistant'
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm here to help with your shipping needs. Can you please rephrase your question?",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
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
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] max-w-[90vw] max-h-[80vh]">
          <Card className="h-full flex flex-col shadow-2xl border-2 border-purple-200 bg-white">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">ShipAI Assistant</h3>
                    <p className="text-xs text-purple-100">Smart shipping insights</p>
                  </div>
                </div>
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

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Welcome to ShipAI!</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      I'm here to help you with shipping insights and recommendations.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage('What are the cheapest rates?')}
                        className="text-xs"
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        Cheapest rates
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage('Show fastest delivery')}
                        className="text-xs"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Fastest delivery
                      </Button>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.isUser
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me about shipping rates, delivery times, or recommendations..."
                  className="flex-1 min-h-[40px] max-h-[80px] resize-none"
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
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ShipAIChatbot;
