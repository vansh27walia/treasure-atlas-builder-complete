
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
  onClose?: () => void;
  className?: string;
}

const UniversalAIChatbot: React.FC<UniversalAIChatbotProps> = ({ 
  onClose,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessage: Message = {
    id: '1',
    text: `Hello! I'm your AI shipping assistant. I can help you with shipping rates, label creation, tracking, and answer any questions about our shipping services. How can I assist you today?`,
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
      return 'I can help you find the most cost-effective shipping options. USPS Ground Advantage typically offers the best value for standard delivery, while UPS and FedEx have competitive rates for expedited services. Would you like me to help you compare rates for your specific shipment?';
    }
    
    if (lowerMessage.includes('fast') || lowerMessage.includes('quick') || lowerMessage.includes('speed') || lowerMessage.includes('urgent')) {
      return 'For fastest delivery, I recommend FedEx Priority Overnight (delivers by 10:30 AM) or UPS Next Day Air. Both services have excellent reliability. Express Mail from USPS is also a good option for urgent shipments. What's your destination and timing requirements?';
    }
    
    if (lowerMessage.includes('track') || lowerMessage.includes('where is my')) {
      return 'I can help you track your shipments! You can use our tracking page to monitor your packages. All major carriers (USPS, UPS, FedEx) provide real-time tracking updates. Do you have a tracking number you'd like me to help you with?';
    }
    
    if (lowerMessage.includes('label') || lowerMessage.includes('print')) {
      return 'I can guide you through creating shipping labels! Our platform supports creating labels for USPS, UPS, and FedEx. You can create single labels or bulk labels for multiple shipments. Would you like help with single label creation or bulk processing?';
    }
    
    if (lowerMessage.includes('bulk') || lowerMessage.includes('multiple') || lowerMessage.includes('batch')) {
      return 'Our bulk shipping feature allows you to process multiple shipments efficiently! You can upload a CSV file with your shipment details, and we'll help you create labels in batch. This is perfect for businesses with high shipping volumes. Would you like guidance on the bulk upload process?';
    }
    
    if (lowerMessage.includes('international')) {
      return 'For international shipping, I recommend using USPS Priority Mail International or FedEx/UPS international services. You'll need to complete customs forms and declare the contents and value. Our platform handles all the necessary documentation. What country are you shipping to?';
    }
    
    if (lowerMessage.includes('insurance')) {
      return 'Shipping insurance protects your packages against loss or damage. Most carriers offer insurance at around $2 per $100 of declared value. For high-value items, I definitely recommend adding insurance. Our platform makes it easy to add insurance when creating labels.';
    }
    
    if (lowerMessage.includes('pickup')) {
      return 'You can schedule package pickups directly through our platform! UPS and FedEx offer free pickup services for regular accounts, while USPS charges a small fee. This saves you time by having the carrier come to you. Would you like help scheduling a pickup?';
    }
    
    if (lowerMessage.includes('calculator') || lowerMessage.includes('rate')) {
      return 'Our shipping calculator helps you compare rates across all major carriers instantly! Just enter your package details and addresses, and we'll show you all available options with prices and delivery times. It's the fastest way to find the best shipping option for your needs.';
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return 'I'm here to help with all aspects of shipping! I can assist with: rate calculations, label creation, tracking shipments, bulk processing, international shipping, insurance options, pickup scheduling, and general shipping advice. What specific area would you like help with?';
    }
    
    return 'I'm your AI shipping assistant, ready to help with rates, labels, tracking, bulk shipping, and more! You can ask me about specific carriers, shipping methods, costs, or any shipping-related questions. How can I assist you today?';
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

    // Simulate typing delay
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
    if (onClose) onClose();
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
              Smart Help
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
                  placeholder="Ask about shipping rates, labels, tracking..."
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
                Your AI shipping expert
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default UniversalAIChatbot;
