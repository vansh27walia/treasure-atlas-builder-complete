
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, MessageCircle, Send, Bot, Minimize2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface UniversalShippingChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  context: 'normal' | 'bulk';
  shipments?: any[];
  currentShipment?: any;
}

const UniversalShippingChatbot: React.FC<UniversalShippingChatbotProps> = ({
  isOpen,
  onClose,
  context,
  shipments = [],
  currentShipment = null
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-close chatbot on payment events
  useEffect(() => {
    const handlePaymentStart = () => onClose();
    const handlePaymentSuccess = () => onClose();
    const handlePaymentCancel = () => onClose();
    
    document.addEventListener('payment-start', handlePaymentStart);
    document.addEventListener('payment-success', handlePaymentSuccess);
    document.addEventListener('payment-cancel', handlePaymentCancel);
    
    return () => {
      document.removeEventListener('payment-start', handlePaymentStart);
      document.removeEventListener('payment-success', handlePaymentSuccess);
      document.removeEventListener('payment-cancel', handlePaymentCancel);
    };
  }, [onClose]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contextData = {
        type: context,
        shipments: context === 'bulk' ? shipments : (currentShipment ? [currentShipment] : []),
        totalShipments: context === 'bulk' ? shipments.length : (currentShipment ? 1 : 0),
        currentShipment: context === 'normal' ? currentShipment : null,
        criteria: context === 'bulk' ? 4 : 3 // 4 criteria for bulk, 3 for normal
      };

      const { data, error } = await supabase.functions.invoke('ship-ai-chat', {
        body: {
          message: userMessage.content,
          context: contextData
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getContextTitle = () => {
    switch (context) {
      case 'bulk':
        return `Bulk Shipping Assistant (${shipments.length} shipments)`;
      case 'normal':
        return 'Shipping Assistant';
      default:
        return 'Shipping Assistant';
    }
  };

  const getWelcomeMessage = () => {
    switch (context) {
      case 'bulk':
        return `Hi! I'm your bulk shipping assistant. I can help you optimize rates, select carriers, and manage your ${shipments.length} shipments efficiently.`;
      case 'normal':
        return 'Hi! I can help you with shipping rates, carrier selection, and address validation. What can I assist you with?';
      default:
        return 'Hi! How can I help you with shipping today?';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 shadow-2xl border-2 border-purple-200 ${isMinimized ? 'h-16' : 'h-96'}`}>
        <CardHeader className="flex flex-row items-center justify-between p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <CardTitle className="text-sm">{getContextTitle()}</CardTitle>
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-medium text-purple-800">AI Shipping Assistant</p>
                  <p className="text-xs mt-2">{getWelcomeMessage()}</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-2 rounded-lg max-w-[90%] ${
                    message.role === 'user'
                      ? 'bg-purple-100 text-purple-900 ml-auto'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-xs">{message.content}</p>
                  <span className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
              
              {isLoading && (
                <div className="bg-gray-100 p-2 rounded-lg max-w-[90%]">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                    <span className="text-xs text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <div className="border-t p-3 bg-gray-50">
              <div className="flex space-x-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about rates, carriers, optimization..."
                  className="flex-1 h-8 resize-none text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UniversalShippingChatbot;
