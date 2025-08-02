
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Sparkles, Brain, Package, Truck, Calculator, MapPin, CreditCard } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
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
    ? ['Price', 'Speed', 'Reliability'] 
    : ['Price', 'Speed', 'Reliability', 'Bulk Efficiency'];

  const initialMessage: Message = {
    id: '1',
    text: `Hello! I'm your comprehensive AI shipping assistant. I can help you with everything from rate calculations and carrier selection to troubleshooting shipping issues and optimizing your logistics. I analyze shipments based on ${criteria.length} key criteria: ${criteria.join(', ')}. What can I help you with today?`,
    sender: 'bot',
    timestamp: new Date(),
    suggestions: [
      'Find cheapest rates',
      'Show fastest delivery',
      'Compare carriers',
      'Troubleshoot shipping issue',
      'International shipping help',
      'Track a package'
    ]
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

  const generateBotResponse = (userMessage: string): { text: string; suggestions?: string[] } => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Price-related queries
    if (lowerMessage.includes('price') || lowerMessage.includes('cheap') || lowerMessage.includes('cost') || lowerMessage.includes('save money')) {
      return {
        text: mode === 'bulk' 
          ? 'For bulk shipping cost optimization: 1) USPS Ground Advantage offers best rates for residential delivery, 2) Use zone skipping for high-volume shipments, 3) Consider UPS/FedEx for commercial addresses with better discounts, 4) Group shipments by delivery zones to maximize savings. I can analyze your current selection for specific cost recommendations!'
          : 'For the best prices, I recommend: 1) USPS Ground Advantage for domestic shipments (lowest cost), 2) UPS 3-Day Select for time-sensitive but budget-conscious shipping, 3) Consider delivery confirmation vs. signature confirmation based on value. The system automatically shows you rates sorted by price when you select "cheapest" option.',
        suggestions: ['Show rate comparison', 'Volume discounts info', 'Zone skipping explained', 'Money-saving tips']
      };
    }
    
    // Speed-related queries
    if (lowerMessage.includes('fast') || lowerMessage.includes('quick') || lowerMessage.includes('speed') || lowerMessage.includes('urgent') || lowerMessage.includes('overnight')) {
      return {
        text: 'For fastest delivery options: 1) FedEx First Overnight (by 8AM next business day), 2) UPS Next Day Air Early (by 8:30AM), 3) FedEx Priority Overnight (by 10:30AM), 4) UPS Next Day Air (end of next business day). For same-day delivery in select cities, consider UPS Express Critical or FedEx SameDay services.',
        suggestions: ['Same-day options', 'Weekend delivery', 'International express', 'Time-sensitive shipping']
      };
    }
    
    // Reliability queries
    if (lowerMessage.includes('reliable') || lowerMessage.includes('trust') || lowerMessage.includes('safe') || lowerMessage.includes('insurance')) {
      return {
        text: 'Based on reliability metrics: 1) UPS has the highest on-time delivery rate (98.7%), 2) FedEx excels in package tracking accuracy, 3) USPS offers excellent value with 97.8% reliability, 4) DHL is best for international reliability. All carriers offer insurance and tracking. Consider signature confirmation for valuable items.',
        suggestions: ['Insurance options', 'Tracking features', 'Delivery confirmation', 'Package protection']
      };
    }

    // Bulk-specific queries
    if (lowerMessage.includes('bulk') && mode === 'bulk') {
      return {
        text: 'Bulk shipping optimization strategies: 1) Use CSV templates for efficient data management, 2) Group shipments by carrier for volume discounts, 3) Consider zone skipping for cross-country shipments, 4) Implement address validation to reduce failed deliveries, 5) Use automated carrier selection based on destination zones.',
        suggestions: ['CSV template help', 'Volume discounts', 'Address validation', 'Carrier automation']
      };
    }

    // Carrier-specific queries
    if (lowerMessage.includes('ups')) {
      return {
        text: 'UPS Services Overview: 1) UPS Ground - economical for 1-5 business days, 2) UPS 3 Day Select - guaranteed 3rd business day, 3) UPS 2nd Day Air - guaranteed 2nd business day, 4) UPS Next Day Air - next business day delivery. UPS excels in B2B deliveries and offers excellent tracking with UPS My Choice for recipients.',
        suggestions: ['UPS rates comparison', 'UPS My Choice benefits', 'UPS business solutions', 'UPS international']
      };
    }

    if (lowerMessage.includes('fedex')) {
      return {
        text: 'FedEx Services Overview: 1) FedEx Ground - 1-5 business days, economical, 2) FedEx Express Saver - 3 business days by 4:30 PM, 3) FedEx 2Day - 2 business days by 4:30 PM, 4) FedEx Standard Overnight - next business day by 4:30 PM. FedEx is excellent for time-critical shipments and offers superior international express services.',
        suggestions: ['FedEx rates', 'FedEx international', 'FedEx delivery options', 'FedEx business account']
      };
    }

    if (lowerMessage.includes('usps')) {
      return {
        text: 'USPS Services Overview: 1) USPS Ground Advantage - economical 2-5 business days, 2) USPS Priority Mail - 1-3 business days with flat rate options, 3) USPS Priority Mail Express - overnight to 2-day guaranteed, 4) USPS First-Class Mail - lightweight items up to 15.994 oz. USPS offers the best coverage for rural areas and competitive residential delivery rates.',
        suggestions: ['USPS flat rate boxes', 'USPS rural delivery', 'USPS PO Box delivery', 'USPS business mail']
      };
    }

    // Tracking queries
    if (lowerMessage.includes('track') || lowerMessage.includes('where is my package') || lowerMessage.includes('delivery status')) {
      return {
        text: 'Package Tracking Help: 1) Use the tracking number from your shipping label, 2) Check multiple carrier websites if unsure of carrier, 3) Most tracking updates occur at major facility scans, 4) Delivery exceptions are common and usually resolve within 24-48 hours, 5) Contact carrier directly for packages delayed beyond expected delivery date.',
        suggestions: ['How to track', 'Tracking problems', 'Delivery exceptions', 'Multiple package tracking']
      };
    }

    // International shipping
    if (lowerMessage.includes('international') || lowerMessage.includes('customs') || lowerMessage.includes('global')) {
      return {
        text: 'International Shipping Guide: 1) Complete customs forms accurately (CN22/CN23), 2) Declare actual value and detailed descriptions, 3) Consider duties and taxes for recipient, 4) Use restricted/prohibited item lists for each country, 5) FedEx and UPS offer excellent international tracking, DHL specializes in European deliveries.',
        suggestions: ['Customs forms help', 'Prohibited items', 'International rates', 'Duties calculator']
      };
    }

    // Problem-solving queries
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('lost') || lowerMessage.includes('damaged') || lowerMessage.includes('delayed')) {
      return {
        text: 'Shipping Problem Resolution: 1) For lost packages: File a claim after the expected delivery date passes, 2) For damaged items: Document with photos and file damage claims within time limits, 3) For delivery delays: Check tracking for exceptions and contact carrier, 4) For incorrect addresses: Contact carrier immediately for address correction services.',
        suggestions: ['File insurance claim', 'Address correction', 'Delivery confirmation', 'Customer service contacts']
      };
    }

    // General recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('best') || lowerMessage.includes('which carrier')) {
      return {
        text: mode === 'bulk'
          ? `For bulk shipments, I recommend a mixed approach: 65% USPS for residential addresses (cost-effective), 25% UPS for commercial addresses (reliable tracking), 10% FedEx for time-critical shipments. This optimizes your ${criteria.join(', ')} criteria while maintaining flexibility.`
          : `Based on comprehensive analysis of ${criteria.join(', ')}, I recommend: 1) USPS Priority Mail for general shipments (best value), 2) FedEx Express for urgent deliveries, 3) UPS Ground for large/heavy items, 4) Always compare rates as prices vary by route and package size.`,
        suggestions: ['Carrier comparison tool', 'Rate calculator', 'Service recommendations', 'Cost analysis']
      };
    }

    // Default comprehensive response
    return {
      text: mode === 'bulk' 
        ? `I'm here to help with all aspects of bulk shipping! I can assist with: shipping rates and carrier selection, CSV template guidance, bulk processing optimization, international shipping requirements, tracking and delivery issues, cost-saving strategies, address validation, packaging recommendations, and logistics planning. What specific challenge can I help you solve?`
        : `I'm your comprehensive shipping assistant! I can help with: rate comparisons across all carriers, packaging and dimension guidance, international shipping and customs, tracking and delivery issues, cost optimization strategies, service level selection, address validation, insurance and liability options, delivery scheduling, and problem resolution. What would you like to know more about?`,
      suggestions: ['Rate comparison', 'Packaging help', 'International guide', 'Cost optimization', 'Tracking help', 'Problem solving']
    };
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = generateBotResponse(userMessage.text);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: response.suggestions
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
          <Brain className="h-4 w-4 mr-2" />
          Master AI Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`w-96 shadow-2xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 ${isMinimized ? 'h-16' : 'h-[600px]'} transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span className="font-semibold">Master AI Assistant</span>
            <Badge className="bg-white text-purple-600 text-xs">
              {criteria.length} Criteria Analysis
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
            <div className="flex-1 overflow-y-auto p-4 h-96 space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender === 'bot' ? (
                          <Brain className="h-3 w-3 text-purple-600" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span className="text-xs font-medium">
                          {message.sender === 'bot' ? 'Master AI' : 'You'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.sender === 'bot' && (
                    <div className="mt-2 flex flex-wrap gap-2 justify-start">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-white hover:bg-purple-50 border-purple-200"
                          onClick={() => handleSendMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-medium">Master AI</span>
                    </div>
                    <div className="flex space-x-1 mt-2">
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
                  placeholder="Ask me anything about shipping, rates, tracking, problems..."
                  className="flex-1 border-purple-200 focus:border-purple-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Master AI analyzing: {criteria.join(' • ')}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default UniversalShippingChatbot;
