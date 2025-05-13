
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShipmentResult {
  id: string;
  tracking_code: string;
  label_url: string;
  status: "pending" | "processing" | "error" | "completed";
  row: number;
  recipient: string;
  carrier: string;
  service: string;
  rate: number;
  details: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    parcel_length?: number;
    parcel_width?: number;
    parcel_height?: number;
    parcel_weight?: number;
  }
}

interface ProcessingError {
  row: number;
  error: string;
  details: string;
}

interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  company?: string;
}

// Carrier logos and info - these would be actual URLs in production
const carrierInfo = {
  USPS: {
    logo: "https://example.com/usps-logo.png",
    colors: {
      primary: "#004B87",
      secondary: "#DA291C"
    },
    formats: ["PDF", "PNG", "ZPL"]
  },
  UPS: {
    logo: "https://example.com/ups-logo.png",
    colors: {
      primary: "#351C15",
      secondary: "#FFB500"
    },
    formats: ["PDF", "PNG", "ZPL"]
  },
  FedEx: {
    logo: "https://example.com/fedex-logo.png",
    colors: {
      primary: "#4D148C",
      secondary: "#FF6600"
    },
    formats: ["PDF", "PNG", "ZPL"]
  },
  DHL: {
    logo: "https://example.com/dhl-logo.png",
    colors: {
      primary: "#FFCC00",
      secondary: "#D40511"
    },
    formats: ["PDF", "PNG"]
  }
};

// Get pre-defined carrier packages/boxes for selection
const getCarrierPackages = (carrier: string) => {
  const packages: {[key: string]: { name: string, dimensions: {length: number, width: number, height: number, weight: number}}} = {
    USPS: {
      "flat_rate_envelope": {
        name: "Flat Rate Envelope",
        dimensions: { length: 12.5, width: 9.5, height: 0.5, weight: 1 }
      },
      "small_flat_rate_box": {
        name: "Small Flat Rate Box",
        dimensions: { length: 8.625, width: 5.375, height: 1.625, weight: 4 }
      },
      "medium_flat_rate_box": {
        name: "Medium Flat Rate Box",
        dimensions: { length: 11.0, width: 8.5, height: 5.5, weight: 20 }
      },
      "large_flat_rate_box": {
        name: "Large Flat Rate Box",
        dimensions: { length: 12.0, width: 12.0, height: 5.5, weight: 70 }
      }
    },
    UPS: {
      "small_box": {
        name: "Small Box",
        dimensions: { length: 13, width: 11, height: 2, weight: 30 }
      },
      "medium_box": {
        name: "Medium Box",
        dimensions: { length: 16, width: 13, height: 3, weight: 30 }
      },
      "large_box": {
        name: "Large Box",
        dimensions: { length: 18, width: 13, height: 3, weight: 30 }
      }
    },
    FedEx: {
      "small_box": {
        name: "Small Box",
        dimensions: { length: 12.375, width: 10.875, height: 1.5, weight: 20 }
      },
      "medium_box": {
        name: "Medium Box",
        dimensions: { length: 13.25, width: 11.5, height: 2.375, weight: 20 }
      },
      "large_box": {
        name: "Large Box",
        dimensions: { length: 17.5, width: 12.375, height: 3, weight: 20 }
      }
    },
    DHL: {
      "small_box": {
        name: "Small Box",
        dimensions: { length: 12, width: 9, height: 3, weight: 10 }
      },
      "medium_box": {
        name: "Medium Box",
        dimensions: { length: 14, width: 11, height: 5, weight: 25 }
      },
      "large_box": {
        name: "Large Box",
        dimensions: { length: 18, width: 14, height: 8, weight: 40 }
      }
    }
  };
  
  return packages[carrier] || {};
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse request body
    const { csvContent, origin } = await req.json();
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'Missing CSV content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!origin) {
      return new Response(
        JSON.stringify({ error: 'Missing origin address' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process the CSV content
    const rows = csvContent.split('\n');
    const headers = rows[0].toLowerCase().split(',');
    
    // Check if we have data rows (excluding header)
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file must have at least one data row' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate required headers
    const requiredFields = ['name', 'street1', 'city', 'state', 'zip', 'country'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ error: `CSV is missing required fields: ${missingFields.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get the indexes for each field
    const fieldIndexes = {
      name: headers.indexOf('name'),
      company: headers.indexOf('company'),
      street1: headers.indexOf('street1'),
      street2: headers.indexOf('street2'),
      city: headers.indexOf('city'),
      state: headers.indexOf('state'),
      zip: headers.indexOf('zip'),
      country: headers.indexOf('country'),
      phone: headers.indexOf('phone'),
      parcel_length: headers.indexOf('parcel_length'),
      parcel_width: headers.indexOf('parcel_width'),
      parcel_height: headers.indexOf('parcel_height'),
      parcel_weight: headers.indexOf('parcel_weight'),
      email: headers.indexOf('email'),
      carrier_preference: headers.indexOf('carrier_preference'),
      service_preference: headers.indexOf('service_preference'),
      package_type: headers.indexOf('package_type')
    };
    
    // Process each data row
    const total = rows.length - 1; // Exclude header row
    const processedShipments: ShipmentResult[] = [];
    const failedShipments: ProcessingError[] = [];
    
    // Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i].split(',');
      
      // Skip empty rows
      if (rowData.join('').trim() === '') continue;
      
      try {
        // Extract address data
        const recipientDetails = {
          name: rowData[fieldIndexes.name],
          company: fieldIndexes.company >= 0 ? rowData[fieldIndexes.company] : undefined,
          street1: rowData[fieldIndexes.street1],
          street2: fieldIndexes.street2 >= 0 ? rowData[fieldIndexes.street2] : undefined,
          city: rowData[fieldIndexes.city],
          state: rowData[fieldIndexes.state],
          zip: rowData[fieldIndexes.zip],
          country: rowData[fieldIndexes.country],
          phone: fieldIndexes.phone >= 0 ? rowData[fieldIndexes.phone] : undefined,
          email: fieldIndexes.email >= 0 ? rowData[fieldIndexes.email] : undefined,
          parcel_length: fieldIndexes.parcel_length >= 0 ? parseFloat(rowData[fieldIndexes.parcel_length]) || 8 : 8,
          parcel_width: fieldIndexes.parcel_width >= 0 ? parseFloat(rowData[fieldIndexes.parcel_width]) || 6 : 6,
          parcel_height: fieldIndexes.parcel_height >= 0 ? parseFloat(rowData[fieldIndexes.parcel_height]) || 4 : 4,
          parcel_weight: fieldIndexes.parcel_weight >= 0 ? parseFloat(rowData[fieldIndexes.parcel_weight]) || 16 : 16,
          carrier_preference: fieldIndexes.carrier_preference >= 0 ? rowData[fieldIndexes.carrier_preference] : undefined,
          service_preference: fieldIndexes.service_preference >= 0 ? rowData[fieldIndexes.service_preference] : undefined,
          package_type: fieldIndexes.package_type >= 0 ? rowData[fieldIndexes.package_type] : undefined
        };
        
        // Validate the address
        if (!recipientDetails.street1 || !recipientDetails.city || !recipientDetails.state || !recipientDetails.zip || !recipientDetails.country) {
          throw new Error('Missing required address fields');
        }
        
        // In a real implementation, we would call EasyPost API here
        // const shipment = await createEasyPostShipment(origin, toAddress, parcelData, apiKey);
        
        // For this demo, we'll generate mock data
        const recipient = recipientDetails.name;
        
        // Use carrier preference if specified
        let selectedCarrier = recipientDetails.carrier_preference;
        let selectedService = recipientDetails.service_preference;
        
        // If no preference, assign a random carrier
        if (!selectedCarrier) {
          const availableCarriers = ['USPS', 'UPS', 'FedEx', 'DHL'];
          selectedCarrier = availableCarriers[Math.floor(Math.random() * availableCarriers.length)];
        }
        
        // Get carrier-specific services
        const carrierServices = {
          'USPS': ['Priority', 'First-Class', 'Ground', 'Express'],
          'UPS': ['Ground', '2nd Day Air', 'Next Day Air', '3-Day Select'],
          'FedEx': ['Ground', 'Express', '2Day', 'Overnight'],
          'DHL': ['Express', 'Express Worldwide', 'Express Economy']
        };
        
        // If no service preference, assign a random service for the selected carrier
        if (!selectedService) {
          const services = carrierServices[selectedCarrier as keyof typeof carrierServices] || ['Standard'];
          selectedService = services[Math.floor(Math.random() * services.length)];
        }
        
        // Check if package type was specified and use predefined dimensions if available
        if (recipientDetails.package_type) {
          const packageTypes = getCarrierPackages(selectedCarrier);
          const packageType = recipientDetails.package_type.toLowerCase().replace(/\s+/g, '_');
          
          if (packageTypes && packageTypes[packageType]) {
            const packageDimensions = packageTypes[packageType].dimensions;
            recipientDetails.parcel_length = packageDimensions.length;
            recipientDetails.parcel_width = packageDimensions.width;
            recipientDetails.parcel_height = packageDimensions.height;
            recipientDetails.parcel_weight = packageDimensions.weight;
          }
        }
        
        // Generate a base rate between $5-20 based on package weight
        const weight = recipientDetails.parcel_weight || 1;
        const baseRate = 5 + (weight * 0.2) + (Math.random() * 10);
        
        // Add carrier info
        const carrier = selectedCarrier.toUpperCase();
        const carrierData = carrierInfo[carrier as keyof typeof carrierInfo] || {
          logo: "",
          colors: { primary: "#000000", secondary: "#666666" },
          formats: ["PDF"]
        };
        
        // Create a mock processed shipment result with label URL and properly typed status
        processedShipments.push({
          id: `ship_${crypto.randomUUID().substring(0, 8)}`,
          tracking_code: `EZ${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
          label_url: 'https://assets.easypost.com/shipping_labels/example_label.png',
          status: "pending", // Using the proper enum value
          row: i,
          recipient,
          carrier: selectedCarrier,
          service: selectedService,
          rate: parseFloat(baseRate.toFixed(2)),
          details: {
            ...recipientDetails,
            carrier_logo: carrierData.logo,
            carrier_colors: carrierData.colors,
            carrier_formats: carrierData.formats
          }
        });
      } catch (error) {
        // Add to failed shipments
        failedShipments.push({
          row: i,
          error: error instanceof Error ? 'Validation Error' : 'Processing Error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successful = processedShipments.length;
    const failed = failedShipments.length;
    
    // Calculate total cost based on shipment rates
    const totalCost = processedShipments.reduce((sum, shipment) => sum + shipment.rate, 0);
    
    // Organize shipments by carrier
    const organizeShipmentsByCarrier = (shipments: ShipmentResult[]) => {
      // Define carrier order for consistent presentation
      const carrierOrder = ['USPS', 'UPS', 'FedEx', 'DHL'];
      
      // Sort shipments by carrier first, then by recipient name within each carrier
      return shipments.sort((a, b) => {
        const carrierA = a.carrier.toUpperCase();
        const carrierB = b.carrier.toUpperCase();
        
        // Compare carriers based on predefined order
        const orderA = carrierOrder.indexOf(carrierA);
        const orderB = carrierOrder.indexOf(carrierB);
        
        // If carriers are in our predefined list, sort by that order
        if (orderA >= 0 && orderB >= 0) {
          if (orderA !== orderB) return orderA - orderB;
        } else if (orderA >= 0) {
          return -1; // A is in the list, B is not
        } else if (orderB >= 0) {
          return 1; // B is in the list, A is not
        }
        
        // If carriers are the same or neither is in our list, sort alphabetically
        if (carrierA !== carrierB) {
          return carrierA.localeCompare(carrierB);
        }
        
        // Within same carrier, sort by recipient name
        return a.recipient.localeCompare(b.recipient);
      });
    };
    
    // Return the results with detailed information
    return new Response(
      JSON.stringify({ 
        total: total,
        successful,
        failed,
        totalCost,
        processedShipments: organizeShipmentsByCarrier(processedShipments),
        failedShipments,
        message: `Processed ${successful} out of ${total} shipments successfully` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in process-bulk-upload function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
