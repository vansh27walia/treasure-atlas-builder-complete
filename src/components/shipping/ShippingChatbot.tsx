
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageSquare, Bot, User, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ShippingChatbotProps {
  onRateAdjustment: (instruction: string) => void;
}

const ShippingChatbot: React.FC<ShippingChatbotProps> = ({ onRateAdjustment }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your shipping AI assistant. I can help you find the best rates, adjust preferences, and answer questions about your shipment. What would you like to know?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [masterPrompt, setMasterPrompt] = useState('');
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputText);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      // Trigger rate adjustment if needed
      if (inputText.toLowerCase().includes('fastest') || 
          inputText.toLowerCase().includes('cheapest') ||
          inputText.toLowerCase().includes('fedex') ||
          inputText.toLowerCase().includes('ups')) {
        onRateAdjustment(inputText);
      }
    }, 1000);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('fastest')) {
      return "I'll prioritize the fastest delivery options for you. Looking at your rates now and moving expedited services to the top!";
    }
    
    if (input.includes('cheapest') || input.includes('lowest cost')) {
      return "I'll sort your rates by cost, showing the most economical options first. Budget-friendly shipping coming right up!";
    }
    
    if (input.includes('fedex')) {
      return "I'll filter to show FedEx options and highlight their best services for your shipment.";
    }
    
    if (input.includes('ups')) {
      return "I'll focus on UPS services and show you their most suitable options.";
    }
    
    if (input.includes('overnight') || input.includes('next day')) {
      return "I'll filter for overnight and next-day delivery options only. Fast shipping is the priority!";
    }
    
    if (input.includes('insurance')) {
      return "I can help you understand insurance options. Your package will be protected at $2 per $100 of declared value. Would you like me to adjust the coverage?";
    }
    
    return "I understand you're looking for shipping assistance. I can help you prioritize rates, filter carriers, or adjust preferences. Try asking me to 'show fastest options' or 'filter by UPS' for specific results!";
  };

  const handleMasterPromptSubmit = () => {
    if (!masterPrompt.trim()) return;

    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      text: `Master prompt updated: "${masterPrompt}" - I'll now adjust my behavior according to these instructions.`,
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, systemMessage]);
    setMasterPrompt('');
    setShowMasterPrompt(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          AI Shipping Assistant
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            Powered by Gemini
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id} className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-2 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center gap-1 mb-1">
                  {message.sender === 'user' ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3 text-blue-600" />
                  )}
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-3">
              <div className="bg-white border border-gray-200 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-3 h-3 text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about rates, carriers, or shipping options..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="sm" disabled={isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Master Prompt Section */}
        <div className="border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMasterPrompt(!showMasterPrompt)}
            className="w-full flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Master Prompt Controls
          </Button>
          
          {showMasterPrompt && (
            <div className="mt-3 space-y-2">
              <Label className="text-xs font-medium">Customize AI Behavior:</Label>
              <Textarea
                value={masterPrompt}
                onChange={(e) => setMasterPrompt(e.target.value)}
                placeholder="e.g., 'Prioritize overnight shipping only' or 'Include carbon footprint in decisions'"
                className="text-sm"
                rows={3}
              />
              <Button onClick={handleMasterPromptSubmit} size="sm" className="w-full">
                Apply Master Prompt
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShippingChatbot;
