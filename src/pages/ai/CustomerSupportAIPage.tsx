import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Search, 
  Copy, 
  Send,
  AlertTriangle,
  CheckCircle2,
  User,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAILogistics } from '@/hooks/useAILogistics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';

interface CustomerMessage {
  id: string;
  tracking_code?: string;
  message_type: string;
  customer_ready_message: string;
  internal_notes?: string;
  sentiment: string;
  escalation_needed: boolean;
  escalation_reason?: string;
  created_at: string;
}

const CustomerSupportAIPage: React.FC = () => {
  const { user } = useAuth();
  const { isLoading, generateCustomerMessage } = useAILogistics();
  const [trackingCode, setTrackingCode] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState<any>(null);
  const [recentMessages, setRecentMessages] = useState<CustomerMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
    }
  }, [user]);

  const fetchRecentMessages = async () => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('ai_customer_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentMessages((data || []) as CustomerMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleGenerate = async () => {
    if (!trackingCode.trim()) {
      toast.error('Please enter a tracking code');
      return;
    }

    try {
      const result = await generateCustomerMessage('', trackingCode);
      setGeneratedMessage(result);
      await fetchRecentMessages();
    } catch (error) {
      console.error('Generation error:', error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copied to clipboard');
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 bg-green-500/20';
      case 'concerned': return 'text-orange-400 bg-orange-500/20';
      case 'urgent': return 'text-red-400 bg-red-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'status_update': return 'Status Update';
      case 'delay_notification': return 'Delay Notification';
      case 'delivery_confirmation': return 'Delivery Confirmation';
      case 'issue_resolution': return 'Issue Resolution';
      case 'proactive_update': return 'Proactive Update';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Customer Support AI</h1>
            <p className="text-indigo-200">AI-generated customer-ready responses (WISMO Killer)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator */}
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Generate Customer Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Tracking Code</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter tracking code..."
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  <Button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Generated Message */}
              {generatedMessage && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getSentimentColor(generatedMessage.sentiment)}>
                        {generatedMessage.sentiment}
                      </Badge>
                      <Badge variant="outline">
                        {getMessageTypeLabel(generatedMessage.messageType)}
                      </Badge>
                    </div>
                    {generatedMessage.escalationNeeded && (
                      <Badge className="bg-red-500 text-white">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Escalation Needed
                      </Badge>
                    )}
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-400" />
                        <span className="text-indigo-300 text-sm">Customer-Ready Message</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCopy(generatedMessage.customerReadyMessage)}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-white">{generatedMessage.customerReadyMessage}</p>
                  </div>

                  {generatedMessage.internalNotes && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-300 text-sm font-medium mb-1">Internal Notes</p>
                      <p className="text-slate-300 text-sm">{generatedMessage.internalNotes}</p>
                    </div>
                  )}

                  {generatedMessage.escalationReason && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <p className="text-red-300 text-sm font-medium mb-1">Escalation Reason</p>
                      <p className="text-slate-300 text-sm">{generatedMessage.escalationReason}</p>
                    </div>
                  )}
                </div>
              )}

              {!generatedMessage && !isLoading && (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Enter a tracking code to generate a customer message</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {loadingMessages ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : recentMessages.length > 0 ? (
                recentMessages.map((msg) => (
                  <div key={msg.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <code className="text-indigo-300 text-xs">{msg.tracking_code}</code>
                        <Badge variant="outline" className="text-xs">
                          {getMessageTypeLabel(msg.message_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getSentimentColor(msg.sentiment)}`}>
                          {msg.sentiment}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleCopy(msg.customer_ready_message)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-white text-sm line-clamp-2">{msg.customer_ready_message}</p>
                    {msg.escalation_needed && (
                      <div className="flex items-center gap-1 mt-2 text-red-400 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Escalation needed</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No messages generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <Card className="bg-gradient-to-r from-indigo-800/50 to-purple-800/50 border-indigo-500/30 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h3 className="text-white font-semibold mb-4">💡 How Customer Support AI Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-indigo-300 font-medium mb-2">1. Analyzes Shipment</h4>
                <p className="text-slate-400 text-sm">AI reviews tracking events, delays, and shipment history</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-indigo-300 font-medium mb-2">2. Generates Response</h4>
                <p className="text-slate-400 text-sm">Creates friendly, professional customer-ready message</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-indigo-300 font-medium mb-2">3. Flags Escalations</h4>
                <p className="text-slate-400 text-sm">Identifies when human intervention is needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerSupportAIPage;
