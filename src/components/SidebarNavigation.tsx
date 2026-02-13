import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Zap, Mic } from 'lucide-react';
import SidebarContent from './sidebar/SidebarContent';
import ToggleButton from './sidebar/ToggleButton';
import VoiceCommandOverlay from './shipping/VoiceCommandOverlay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SidebarNavigationProps {
  children: React.ReactNode;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide sidebar on auth pages
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/reset-password';

  // Handle sidebar collapse toggle
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Handle voice transcript
  const handleVoiceTranscript = async (text: string) => {
    setIsProcessing(true);
    setAiResponse('');

    try {
      const { data, error } = await supabase.functions.invoke('ship-ai-chat', {
        body: {
          message: text,
          context: 'voice_command'
        }
      });

      if (error) throw error;

      const response = data.response || "I'm processing your request.";
      setAiResponse(response);

      // Handle navigation actions
      if (data.action === 'NAVIGATE' && data.data?.path) {
        setTimeout(() => {
          navigate(data.data.path);
          setVoiceOverlayOpen(false);
        }, 2000);
      }

      // Dispatch AI events to the chatbot
      if (data.action && data.action !== 'SHOW_INFO') {
        document.dispatchEvent(new CustomEvent('ai-voice-action', {
          detail: { action: data.action, data: data.data }
        }));
      }
    } catch (error) {
      console.error('Voice command error:', error);
      toast.error('Failed to process voice command');
      setAiResponse('Sorry, I had trouble processing that. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isAuthPage) {
    return (
      <div className="h-screen w-full overflow-hidden">
        <div className="h-full overflow-y-auto bg-gray-50 w-full">
          {children}
        </div>
      </div>);

  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          'bg-blue-950 text-white transition-all duration-300 h-full flex flex-col relative',
          collapsed ? 'w-20' : 'w-64'
        )}>

        {/* Logo and Brand */}
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
            <Zap className="h-8 w-8 text-blue-400 flex-shrink-0" />
            {!collapsed &&
            <span className="font-bold text-lg text-white">ShippingQuick.io</span>
            }
          </div>
          <ToggleButton collapsed={collapsed} onClick={toggleSidebar} />
        </div>

        {/* Voice Command Button */}
        <div className={cn("p-3 border-b border-blue-800", collapsed && "px-2")}>
          









        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <SidebarContent collapsed={collapsed} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto bg-gray-50 w-full">
        {children}
      </div>

      {/* Voice Command Overlay */}
      <VoiceCommandOverlay
        isOpen={voiceOverlayOpen}
        onClose={() => {
          setVoiceOverlayOpen(false);
          setAiResponse('');
        }}
        onTranscript={handleVoiceTranscript}
        isProcessing={isProcessing}
        aiResponse={aiResponse} />

    </div>);

};

export default SidebarNavigation;