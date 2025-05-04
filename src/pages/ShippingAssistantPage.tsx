
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader, MessageCircle, Bot, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ShippingAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi there! I'm your shipping assistant. Ask me anything about shipping, rates, or packaging options.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call the shipping assistant edge function
      const { data, error } = await supabase.functions.invoke('shipping-assistant', {
        body: { 
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });
      
      if (error) throw new Error(error.message);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "I'm sorry, I couldn't process your request.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling shipping assistant:', error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      
      // Add fallback message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center">
        <MessageCircle className="mr-3 h-8 w-8 text-blue-600" />
        Shipping Assistant
      </h1>
      
      <Card className="border-2 border-gray-200 shadow-lg mb-8 h-[70vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5 text-blue-500" />
            Shipping AI Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex gap-3 max-w-[80%]">
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-blue-100 text-blue-600">AI</AvatarFallback>
                      <AvatarImage src="/assets/ai-avatar.png" />
                    </Avatar>
                  )}
                  
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-blue-600 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">AI</AvatarFallback>
                  </Avatar>
                  <div className="p-3 rounded-lg bg-gray-100">
                    <div className="flex items-center space-x-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      <p>Thinking...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="pt-2">
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about shipping options, package requirements, etc."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShippingAssistantPage;
