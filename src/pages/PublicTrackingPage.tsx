import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Truck, CheckCircle, Clock, MapPin, Mail, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrackingEvent {
  id: string;
  event_date: string;
  event_status: string;
  event_description: string;
  location: string;
}

interface TrackingData {
  tracking_number: string;
  carrier: string;
  service: string | null;
  status: string;
  estimated_delivery: string | null;
  created_at: string;
  recipient_name: string | null;
  events: TrackingEvent[];
  merchant: {
    logo_url: string | null;
    brand_color: string;
    support_email: string | null;
    custom_message: string | null;
    banner_message: string | null;
    store_name: string | null;
    website_url: string | null;
    tracking_template: string;
  } | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  delivered: { icon: <CheckCircle className="h-5 w-5" />, color: '#22C55E', label: 'Delivered' },
  in_transit: { icon: <Truck className="h-5 w-5" />, color: '#3B82F6', label: 'In Transit' },
  out_for_delivery: { icon: <Truck className="h-5 w-5" />, color: '#F59E0B', label: 'Out for Delivery' },
  created: { icon: <Package className="h-5 w-5" />, color: '#6B7280', label: 'Label Created' },
  pre_transit: { icon: <Package className="h-5 w-5" />, color: '#6B7280', label: 'Pre-Transit' },
};

const getStatusInfo = (status: string) => {
  const normalized = status?.toLowerCase().replace(/[\s-]/g, '_') || 'created';
  return statusConfig[normalized] || { icon: <Package className="h-5 w-5" />, color: '#6B7280', label: status || 'Unknown' };
};

const PublicTrackingPage: React.FC = () => {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(trackingNumber || '');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (trackingNumber) fetchTracking(trackingNumber);
  }, [trackingNumber]);

  const fetchTracking = async (tn: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('public-tracking', {
        body: { tracking_number: tn },
      });
      if (fnError || data?.error) {
        setError(data?.error || 'Failed to fetch tracking information');
        setTrackingData(null);
      } else {
        setTrackingData(data);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) navigate(`/track/${searchInput.trim()}`);
  };

  const brandColor = trackingData?.merchant?.brand_color || '#3B82F6';
  const template = trackingData?.merchant?.tracking_template || 'timeline';
  const statusInfo = trackingData ? getStatusInfo(trackingData.status) : null;

  // Search-only view
  if (!trackingNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Track Your Package</h1>
            <p className="text-gray-500 mt-2">Enter your tracking number below</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Enter tracking number" className="text-base" />
            <Button type="submit" style={{ backgroundColor: '#3B82F6' }}>
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      {trackingData?.merchant?.banner_message && (
        <div className="text-white text-center text-sm py-2 px-4" style={{ backgroundColor: brandColor }}>
          {trackingData.merchant.banner_message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {trackingData?.merchant?.logo_url ? (
              <img src={trackingData.merchant.logo_url} alt="Store logo" className="h-10 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6" style={{ color: brandColor }} />
                <span className="font-semibold text-gray-900">
                  {trackingData?.merchant?.store_name || 'Package Tracking'}
                </span>
              </div>
            )}
            {trackingData?.merchant?.website_url && (
              <a href={trackingData.merchant.website_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Track another package" className="w-48 text-sm" />
            <Button type="submit" size="sm" variant="outline"><Search className="h-4 w-4" /></Button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Looking up your package...</p>
          </div>
        )}

        {error && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Tracking Not Found</h2>
              <p className="text-gray-500 mb-6">{error}</p>
              <form onSubmit={handleSearch} className="flex gap-2 max-w-sm mx-auto">
                <Input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Try another tracking number" />
                <Button type="submit" style={{ backgroundColor: brandColor }}><Search className="h-4 w-4" /></Button>
              </form>
            </CardContent>
          </Card>
        )}

        {trackingData && !loading && statusInfo && (
          <>
            {template === 'minimal' && <MinimalTemplate data={trackingData} statusInfo={statusInfo} brandColor={brandColor} />}
            {template === 'timeline' && <TimelineTemplate data={trackingData} statusInfo={statusInfo} brandColor={brandColor} />}
            {template === 'modern' && <ModernTemplate data={trackingData} statusInfo={statusInfo} brandColor={brandColor} />}
          </>
        )}
      </main>
    </div>
  );
};

// ── Template Props ──
interface TemplateProps {
  data: TrackingData;
  statusInfo: { icon: React.ReactNode; color: string; label: string };
  brandColor: string;
}

// ── MINIMAL TEMPLATE ──
const MinimalTemplate: React.FC<TemplateProps> = ({ data, statusInfo, brandColor }) => (
  <div className="space-y-6">
    <div className="text-center py-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>
        {statusInfo.icon}
      </div>
      <Badge className="text-sm" style={{ backgroundColor: statusInfo.color, color: '#fff' }}>{statusInfo.label}</Badge>
      <p className="font-mono text-sm text-gray-500 mt-3">{data.tracking_number}</p>
      <p className="text-sm text-gray-600 mt-1">{data.carrier}{data.service ? ` • ${data.service}` : ''}</p>
      {data.estimated_delivery && (
        <p className="text-sm mt-2 text-gray-700">
          Est. delivery: <strong>{new Date(data.estimated_delivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
        </p>
      )}
    </div>

    {data.merchant?.custom_message && (
      <div className="text-center text-sm text-gray-600 border-t pt-4">{data.merchant.custom_message}</div>
    )}

    {data.events.length > 0 && (
      <div className="space-y-2">
        {data.events.map(event => (
          <div key={event.id} className="flex justify-between items-start text-sm py-2 border-b last:border-0">
            <div>
              <p className="font-medium text-gray-900">{event.event_status}</p>
              {event.location && <p className="text-xs text-gray-400">{event.location}</p>}
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    )}

    <MerchantFooter data={data} brandColor={brandColor} />
  </div>
);

// ── TIMELINE TEMPLATE (default) ──
const TimelineTemplate: React.FC<TemplateProps> = ({ data, statusInfo, brandColor }) => (
  <div className="space-y-6">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>
            {statusInfo.icon}
          </div>
          <div>
            <Badge style={{ backgroundColor: statusInfo.color, color: '#fff' }}>{statusInfo.label}</Badge>
            <p className="text-sm text-gray-500 mt-1">
              Tracking: <span className="font-mono font-medium text-gray-900">{data.tracking_number}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Carrier</p><p className="font-medium text-gray-900">{data.carrier}</p></div>
          {data.service && <div><p className="text-gray-500">Service</p><p className="font-medium text-gray-900">{data.service}</p></div>}
          {data.estimated_delivery && (
            <div><p className="text-gray-500">Estimated Delivery</p><p className="font-medium text-gray-900">{new Date(data.estimated_delivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p></div>
          )}
          {data.recipient_name && <div><p className="text-gray-500">Recipient</p><p className="font-medium text-gray-900">{data.recipient_name}</p></div>}
        </div>
      </CardContent>
    </Card>

    {data.merchant?.custom_message && (
      <div className="rounded-lg p-4 border-l-4" style={{ borderColor: brandColor, backgroundColor: `${brandColor}08` }}>
        <p className="text-gray-700">{data.merchant.custom_message}</p>
      </div>
    )}

    {data.events.length > 0 && (
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Tracking History
          </h3>
          <div className="space-y-0">
            {data.events.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: index === 0 ? brandColor : '#D1D5DB' }} />
                  {index < data.events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-medium ${index === 0 ? 'text-gray-900' : 'text-gray-600'}`}>{event.event_status}</p>
                  {event.event_description && <p className="text-xs text-gray-500 mt-0.5">{event.event_description}</p>}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {new Date(event.event_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    {event.location && (<><span>•</span><span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {event.location}</span></>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    <MerchantFooter data={data} brandColor={brandColor} />
  </div>
);

// ── MODERN CARD TEMPLATE ──
const ModernTemplate: React.FC<TemplateProps> = ({ data, statusInfo, brandColor }) => {
  const steps = ['Label Created', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
  const normalizedStatus = data.status?.toLowerCase().replace(/[\s-]/g, '_') || 'created';
  const statusMap: Record<string, number> = { created: 0, pre_transit: 0, picked_up: 1, in_transit: 2, out_for_delivery: 3, delivered: 4 };
  const currentStep = statusMap[normalizedStatus] ?? 0;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: i <= currentStep ? brandColor : '#E5E7EB',
                      color: i <= currentStep ? '#fff' : '#9CA3AF',
                    }}
                  >
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-gray-500 text-center max-w-[60px]">{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-1 rounded" style={{ backgroundColor: i < currentStep ? brandColor : '#E5E7EB' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="text-center">
            <Badge className="text-sm mb-2" style={{ backgroundColor: statusInfo.color, color: '#fff' }}>{statusInfo.label}</Badge>
            <p className="font-mono text-sm text-gray-500">{data.tracking_number}</p>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Carrier</p>
            <p className="font-semibold text-sm text-gray-900">{data.carrier}</p>
          </CardContent>
        </Card>
        {data.service && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Service</p>
              <p className="font-semibold text-sm text-gray-900">{data.service}</p>
            </CardContent>
          </Card>
        )}
        {data.estimated_delivery && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Est. Delivery</p>
              <p className="font-semibold text-sm text-gray-900">{new Date(data.estimated_delivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </CardContent>
          </Card>
        )}
        {data.recipient_name && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Recipient</p>
              <p className="font-semibold text-sm text-gray-900">{data.recipient_name}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {data.merchant?.custom_message && (
        <div className="rounded-lg p-4" style={{ backgroundColor: `${brandColor}10`, border: `1px solid ${brandColor}30` }}>
          <p className="text-sm text-gray-700">{data.merchant.custom_message}</p>
        </div>
      )}

      {/* Events */}
      {data.events.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
            {data.events.map((event, i) => (
              <div key={event.id} className="flex items-start gap-3 pb-4 last:pb-0">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: i === 0 ? brandColor : '#D1D5DB' }} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">{event.event_status}</p>
                    <p className="text-xs text-gray-400">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  {event.event_description && <p className="text-xs text-gray-500">{event.event_description}</p>}
                  {event.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{event.location}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <MerchantFooter data={data} brandColor={brandColor} />
    </div>
  );
};

// ── Shared Footer ──
const MerchantFooter: React.FC<{ data: TrackingData; brandColor: string }> = ({ data, brandColor }) => (
  <>
    {data.merchant?.support_email && (
      <div className="text-center text-sm text-gray-500 pt-4">
        Need help?{' '}
        <a href={`mailto:${data.merchant.support_email}`} className="underline" style={{ color: brandColor }}>
          {data.merchant.support_email}
        </a>
      </div>
    )}
  </>
);

export default PublicTrackingPage;
