
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface UniversalAIChatbotProps {
  className?: string;
}

const UniversalAIChatbot: React.FC<UniversalAIChatbotProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const criteria = ['Price', 'Speed', 'Reliability'];

  const initialMessage: Message = {
    id: '1',
    text: `Hello! I'm your AI shipping assistant. I analyze shipping options based on ${criteria.length} key criteria: ${criteria.join(', ')}. How can I help you optimize your shipping today?`,
    sender: 'bot',
    timestamp: new Date()
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cheap') || lowerMessage.includes('cost')) {
      return 'Based on price analysis, USPS Ground Advantage usually offers the best value for standard delivery. For urgent shipments, UPS 3-Day Select provides good speed-to-cost ratio. Should I help you compare current rates?';
    }
    
    if (lowerMessage.includes('fast') || lowerMessage.includes('quick') || lowerMessage.includes('speed')) {
      return 'For fastest delivery, I recommend FedEx Priority Overnight or UPS Next Day Air. FedEx typically delivers by 10:30 AM, while UPS offers end-of-day delivery at a lower cost. Both have excellent reliability scores.';
    }
    
    if (lowerMessage.includes('reliable') || lowerMessage.includes('trust') || lowerMessage.includes('safe')) {
      return 'Based on reliability metrics, UPS and USPS have the highest delivery success rates (98.5% and 97.8% respectively). UPS excels in tracking accuracy, while USPS has better coverage for rural areas.';
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('best')) {
      return `Based on the 3 criteria analysis (${criteria.join(', ')}), I recommend USPS Priority Mail for the best overall value - it offers good speed (2-3 days), competitive pricing, and reliable tracking.`;
    }
    
    if (lowerMessage.includes('tracking') || lowerMessage.includes('track')) {
      return 'All major carriers provide real-time tracking. FedEx has the most detailed updates, UPS offers the most accurate delivery windows, and USPS provides good basic tracking with recent improvements in scan frequency.';
    }
    
    return `I'm here to help with shipping optimization using ${criteria.join(', ')} analysis. You can ask me about carrier recommendations, cost comparisons, delivery speed options, or reliability insights. What would you like to know?`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(userMessage.text),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full p-4"
          size="lg"
        >
          <MessageCircle className="h-6 w-6 mr-2" />
          <Sparkles className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`w-96 shadow-2xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 ${isMinimized ? 'h-16' : 'h-[500px]'} transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span className="font-semibold">AI Shipping Assistant</span>
            <Badge className="bg-white text-purple-600 text-xs">
              {criteria.length} Criteria
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 p-1"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 h-80 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === 'bot' ? (
                        <Bot className="h-3 w-3 text-purple-600" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">
                        {message.sender === 'bot' ? 'AI Assistant' : 'You'}
                      </span>
                    </div>
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Bot className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-medium">AI Assistant</span>
                    </div>
                    <div className="flex space-x-1 mt-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-purple-200 bg-white rounded-b-lg">
              <div className="flex space-x-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask about ${criteria.join(', ').toLowerCase()}...`}
                  className="flex-1 border-purple-200 focus:border-purple-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Analyzing: {criteria.join(' • ')}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default UniversalAIChatbot;
