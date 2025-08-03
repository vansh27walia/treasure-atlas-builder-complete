
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

interface UniversalShippingChatbotProps {
  mode: 'normal' | 'bulk';
  onClose?: () => void;
  className?: string;
}

const UniversalShippingChatbot: React.FC<UniversalShippingChatbotProps> = ({ 
  mode, 
  onClose,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const criteria = mode === 'normal' 
    ? ['Price', 'Speed', 'Reliability', 'Insurance'] 
    : ['Price', 'Speed', 'Reliability', 'Bulk Efficiency'];

  const initialMessage: Message = {
    id: '1',
    text: `Hello! I'm your comprehensive AI shipping assistant with full access to all ShipAI features. I can help you with:

🚚 **Shipping & Labels**: Create labels, compare rates, track packages
📊 **Analytics**: Download shipping data, analyze costs and performance  
📋 **Bulk Processing**: Upload CSV files, process multiple shipments
🔍 **Rate Analysis**: Find best rates using ${criteria.join(', ')} criteria
📦 **Carrier Selection**: Choose between UPS, USPS, FedEx based on your needs
💰 **Cost Optimization**: Insurance calculations, delivery time estimates
📈 **Historical Data**: Access your shipping history and trends

What can I help you with today? You can ask me to analyze rates, upload files, or perform any shipping task!`,
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

  useEffect(() => {
    // Listen for payment events to close chatbot
    const handlePaymentEvent = () => {
      setIsOpen(false);
      if (onClose) onClose();
    };

    document.addEventListener('payment-started', handlePaymentEvent);
    document.addEventListener('payment-cancelled', handlePaymentEvent);
    
    return () => {
      document.removeEventListener('payment-started', handlePaymentEvent);
      document.removeEventListener('payment-cancelled', handlePaymentEvent);
    };
  }, [onClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // CSV and file upload responses
    if (lowerMessage.includes('csv') || lowerMessage.includes('upload') || lowerMessage.includes('file')) {
      return 'I can help you process CSV files for bulk shipping! Upload your CSV file and I\'ll analyze the addresses, suggest rate optimizations, and help create multiple labels efficiently. I can also map CSV headers automatically and validate address data.';
    }
    
    // Analytics and download responses
    if (lowerMessage.includes('analytics') || lowerMessage.includes('download') || lowerMessage.includes('report')) {
      return 'I can help you access and download your shipping analytics! You can find detailed reports in the Settings → Analytics section, or I can help you export specific data like shipping costs, delivery performance, and carrier comparisons in CSV format.';
    }
    
    // Carrier selection responses
    if (lowerMessage.includes('carrier') || lowerMessage.includes('ups') || lowerMessage.includes('usps') || lowerMessage.includes('fedex')) {
      return `I can help you choose the best carrier! Based on the ${criteria.join(', ')} criteria:\n\n📦 **UPS**: Best for business deliveries, excellent tracking\n📮 **USPS**: Most cost-effective for residential, good rural coverage\n✈️ **FedEx**: Fastest for express, reliable for time-sensitive shipments\n\nI can filter and compare rates from all carriers to find your optimal choice!`;
    }
    
    // Rate and pricing responses
    if (lowerMessage.includes('price') || lowerMessage.includes('cheap') || lowerMessage.includes('cost') || lowerMessage.includes('rate')) {
      return mode === 'bulk' 
        ? `For bulk shipping cost optimization, I recommend:\n\n💰 **Volume Discounts**: Consolidate to fewer carriers\n🏠 **Residential vs Commercial**: USPS for homes, UPS/FedEx for businesses\n📍 **Zone Optimization**: Group shipments by destination zones\n🛡️ **Insurance Balance**: Optimal coverage without overpaying\n\nI can analyze your current rates and suggest 15-30% cost savings!`
        : `For the best rates, I analyze ${criteria.join(', ')} to recommend:\n\n🥇 **Best Value**: Usually USPS Priority Mail (2-3 days)\n💨 **Fastest**: FedEx Priority Overnight or UPS Next Day Air\n💰 **Cheapest**: USPS Ground Advantage for non-urgent items\n🛡️ **With Insurance**: Consider coverage for valuable items\n\nShall I help you compare current rates?`;
    }
    
    // Speed and delivery responses
    if (lowerMessage.includes('fast') || lowerMessage.includes('quick') || lowerMessage.includes('speed') || lowerMessage.includes('overnight')) {
      return 'For fastest delivery:\n\n⚡ **Same Day**: Available in major cities via FedEx SameDay\n🌅 **Overnight**: FedEx Priority (10:30 AM) or UPS Next Day Air\n📦 **2-Day**: FedEx 2Day or UPS 2nd Day Air\n🚚 **Express**: 1-3 business days with premium services\n\nI can filter rates to show only express options!';
    }
    
    // Insurance responses
    if (lowerMessage.includes('insurance') || lowerMessage.includes('coverage')) {
      return 'I can help optimize your insurance coverage:\n\n🛡️ **Standard Coverage**: $100 included with most services\n💎 **High Value**: Declare actual value for expensive items\n💰 **Cost**: ~$2.50 per $100 of declared value\n📋 **Recommendations**: Based on item value and carrier reliability\n\nShall I calculate optimal insurance for your shipments?';
    }
    
    // Tracking responses
    if (lowerMessage.includes('track') || lowerMessage.includes('tracking')) {
      return 'I can help you track shipments and analyze delivery performance:\n\n📍 **Real-time Updates**: Monitor all your packages in one place\n📊 **Delivery Analytics**: Success rates, average transit times\n🔔 **Notifications**: Get alerts for delays or delivery issues\n📈 **Performance Reports**: Compare carrier reliability\n\nWould you like me to check specific tracking numbers?';
    }

    // General help response
    return `I'm your comprehensive ShipAI assistant with full access to all features! I can help with:\n\n🚚 **Shipping Tasks**: Create labels, compare rates, track packages\n📊 **Data Analysis**: Export analytics, optimize costs\n📋 **Bulk Operations**: Process CSV files, multiple shipments\n🎯 **Smart Recommendations**: ${criteria.join(', ')} optimization\n\nJust tell me what you need - I have access to everything and can help with any shipping task!`;
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
            <span className="font-semibold">ShipAI Assistant</span>
            <Badge className="bg-white text-purple-600 text-xs">
              Full Access
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
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
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
                  placeholder="Ask about shipping, rates, analytics, CSV uploads..."
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
                Full Access AI • {criteria.join(' • ')}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default UniversalShippingChatbot;
