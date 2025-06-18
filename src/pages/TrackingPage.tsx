
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, Search, RefreshCw, Truck, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';
import UniversalTrackingSearch from '@/components/tracking/UniversalTrackingSearch';
import EnhancedTrackingDashboard from '@/components/tracking/EnhancedTrackingDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TrackingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 w-full">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center">
        <Truck className="mr-3 h-8 w-8" />
        Track Your Shipments
      </h1>

      <Tabs defaultValue="universal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="universal">Universal Search</TabsTrigger>
          <TabsTrigger value="internal">Internal Tracking</TabsTrigger>
          <TabsTrigger value="dashboard">Overview Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="universal" className="space-y-6">
          <UniversalTrackingSearch />
        </TabsContent>

        <TabsContent value="internal" className="space-y-6">
          <EnhancedTrackingDashboard />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <TrackingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackingPage;
