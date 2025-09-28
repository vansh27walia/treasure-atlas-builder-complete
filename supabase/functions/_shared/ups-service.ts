
// UPS API Service for international shipping
export interface UPSAddress {
  AddressLine: string[];
  City: string;
  StateProvinceCode?: string;
  PostalCode: string;
  CountryCode: string;
}

export interface UPSPackage {
  PackagingType: { Code: string; Description: string };
  PackageWeight: { UnitOfMeasurement: { Code: string }; Weight: string };
  Dimensions?: {
    UnitOfMeasurement: { Code: string };
    Length: string;
    Width: string;
    Height: string;
  };
}

export interface UPSRateRequest {
  RateRequest: {
    Request: {
      RequestOption: string;
    };
    Shipment: {
      Shipper: {
        Name: string;
        ShipperNumber: string;
        Address: UPSAddress;
      };
      ShipTo: {
        Name: string;
        Address: UPSAddress;
      };
      ShipFrom: {
        Name: string;
        Address: UPSAddress;
      };
      Package: UPSPackage[];
    };
  };
}

export interface UPSShipRequest {
  ShipmentRequest: {
    Request: {
      RequestOption: string;
    };
    Shipment: {
      Description: string;
      Shipper: {
        Name: string;
        ShipperNumber: string;
        Address: UPSAddress;
      };
      ShipTo: {
        Name: string;
        Address: UPSAddress;
      };
      ShipFrom: {
        Name: string;
        Address: UPSAddress;
      };
      PaymentInformation: {
        ShipmentCharge: {
          Type: string;
          BillShipper: {
            AccountNumber: string;
          };
        };
      };
      Service: {
        Code: string;
        Description: string;
      };
      Package: UPSPackage[];
      LabelSpecification: {
        LabelImageFormat: {
          Code: string;
        };
        LabelStockSize: {
          Height: string;
          Width: string;
        };
      };
      InternationalForms?: {
        FormType: string;
        InvoiceNumber: string;
        ReasonForExport: string;
        Comments: string;
        DeclarationStatement: string;
        Product: Array<{
          Description: string;
          CommodityCode: string;
          PartNumber: string;
          OriginCountryCode: string;
          JointProductionIndicator: string;
          NetCostCode: string;
          NetCostDateRange: {
            BeginDate: string;
            EndDate: string;
          };
          PreferenceCriteria: string;
          ProducerInfo: string;
          MarksAndNumbers: string;
          NumberOfPackagesPerCommodity: string;
          ProductWeight: {
            UnitOfMeasurement: {
              Code: string;
            };
            Weight: string;
          };
          VehicleID: string;
          ScheduleB: string;
          ExportType: string;
          SEDTotalValue: string;
          ExcludeFromForm: string;
          PackingListInfo: {
            PackageAssociated: string;
          };
          EEIInformation: {
            ExportInformation: string;
            License: {
              Number: string;
              Code: string;
            };
            DDTCInformation: {
              ITARExemptionNumber: string;
              USMLCategoryCode: string;
              EligiblePartyIndicator: string;
              RegistrationNumber: string;
            };
          };
          Unit: {
            UnitOfMeasurement: {
              Code: string;
            };
            Value: string;
          };
        }>;
      };
    };
  };
}

export class UPSService {
  private clientId: string;
  private clientSecret: string;
  private accountNumber: string;
  private baseUrl: string;
  private availableServicesCache: Map<string, any[]> = new Map();
  
  constructor(clientId: string, clientSecret: string, accountNumber: string, isProduction = false) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accountNumber = accountNumber;
    this.baseUrl = isProduction 
      ? 'https://onlinetools.ups.com' 
      : 'https://wwwcie.ups.com';
  }

  async getOAuthToken(): Promise<string> {
    const url = `${this.baseUrl}/security/v1/oauth/token`;
    
    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('UPS OAuth Error:', errorData);
      throw new Error(`UPS OAuth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  private generateCacheKey(shipment: any): string {
    return `${shipment.fromAddress.country}-${shipment.fromAddress.zip}-${shipment.toAddress.country}-${shipment.toAddress.zip}`;
  }

  private isInternationalShipment(fromCountry: string, toCountry: string): boolean {
    return fromCountry !== toCountry;
  }

  private validateStateProvince(address: any): string {
    // For India, common state codes
    if (address.country === 'IN') {
      const indianStates: { [key: string]: string } = {
        'DL': 'DL', 'DELHI': 'DL', 'NEW DELHI': 'DL',
        'MH': 'MH', 'MAHARASHTRA': 'MH', 'MUMBAI': 'MH',
        'KA': 'KA', 'KARNATAKA': 'KA', 'BANGALORE': 'KA',
        'TN': 'TN', 'TAMIL NADU': 'TN', 'CHENNAI': 'TN',
        'WB': 'WB', 'WEST BENGAL': 'WB', 'KOLKATA': 'WB'
      };
      
      const state = address.state?.toUpperCase();
      return indianStates[state] || 'DL'; // Default to Delhi if not found
    }
    
    // For US addresses, keep as is
    if (address.country === 'US') {
      return address.state || 'CA';
    }
    
    // For other countries, use a default or the provided state
    return address.state || '';
  }

  async getRates(shipment: any): Promise<any> {
    try {
      console.log('UPS: Starting rate request with Shop option for shipment:', {
        from: `${shipment.fromAddress.city}, ${shipment.fromAddress.country}`,
        to: `${shipment.toAddress.city}, ${shipment.toAddress.country}`
      });

      const token = await this.getOAuthToken();
      
      const fromCountry = shipment.fromAddress.country || 'US';
      const toCountry = shipment.toAddress.country || 'US';
      const isIntl = this.isInternationalShipment(fromCountry, toCountry);
      
      console.log(`UPS: ${isIntl ? 'International' : 'Domestic'} shipment detected`);
      
      // Validate and fix state codes
      const fromState = this.validateStateProvince(shipment.fromAddress);
      const toState = this.validateStateProvince(shipment.toAddress);
      
      console.log('UPS: Using validated state codes:', { fromState, toState });
      
      // CRITICAL: Use "Shop" to get ALL available services - this prevents 111100 error
      const rateRequest: UPSRateRequest = {
        RateRequest: {
          Request: {
            RequestOption: 'Shop', // Shop returns all available services for the route
          },
          Shipment: {
            Shipper: {
              Name: shipment.fromAddress.name || 'Shipper',
              ShipperNumber: this.accountNumber,
              Address: {
                AddressLine: [shipment.fromAddress.street1, shipment.fromAddress.street2].filter(Boolean),
                City: shipment.fromAddress.city,
                StateProvinceCode: fromState,
                PostalCode: shipment.fromAddress.zip,
                CountryCode: fromCountry,
              },
            },
            ShipTo: {
              Name: shipment.toAddress.name || 'Recipient',
              Address: {
                AddressLine: [shipment.toAddress.street1, shipment.toAddress.street2].filter(Boolean),
                City: shipment.toAddress.city,
                StateProvinceCode: toState,
                PostalCode: shipment.toAddress.zip,
                CountryCode: toCountry,
              },
            },
            ShipFrom: {
              Name: shipment.fromAddress.name || 'Shipper',
              Address: {
                AddressLine: [shipment.fromAddress.street1, shipment.fromAddress.street2].filter(Boolean),
                City: shipment.fromAddress.city,
                StateProvinceCode: fromState,
                PostalCode: shipment.fromAddress.zip,
                CountryCode: fromCountry,
              },
            },
            Package: [{
              PackagingType: { Code: '02', Description: 'Package' },
              PackageWeight: { 
                UnitOfMeasurement: { Code: 'LBS' }, 
                Weight: (shipment.parcel.weight / 16).toString() // Convert oz to lbs
              },
              ...(shipment.parcel.length && {
                Dimensions: {
                  UnitOfMeasurement: { Code: 'IN' },
                  Length: shipment.parcel.length.toString(),
                  Width: shipment.parcel.width.toString(),
                  Height: shipment.parcel.height.toString(),
                }
              })
            }],
          },
        },
      };

      console.log('UPS: Sending Shop request to get all available services:', JSON.stringify(rateRequest, null, 2));

      const response = await fetch(`${this.baseUrl}/api/rating/v2403/Rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(rateRequest),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('UPS API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });

        // Parse error response
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText };
        }

        // Handle specific UPS error codes
        if (errorData.response?.errors) {
          const errors = errorData.response.errors;
          console.log('UPS: Specific errors found:', errors);
          
          // Check for service availability errors (111100)
          const serviceError = errors.find((err: any) => 
            err.code === '111100' || 
            err.message?.includes('service is invalid') ||
            err.message?.includes('not available')
          );
          
          if (serviceError) {
            console.log('UPS: Service not available for this route, returning empty rates');
            return { RateResponse: { RatedShipment: [] } };
          }
        }

        throw new Error(`UPS API Error: ${response.status} - ${errorData.message || responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('UPS: Successfully received rate response with available services:', {
        ratedShipments: data.RateResponse?.RatedShipment?.length || 0
      });

      // Cache the available services for this route
      if (data.RateResponse?.RatedShipment) {
        const cacheKey = this.generateCacheKey(shipment);
        const availableServices = Array.isArray(data.RateResponse.RatedShipment) 
          ? data.RateResponse.RatedShipment 
          : [data.RateResponse.RatedShipment];
        
        this.availableServicesCache.set(cacheKey, availableServices);
        console.log(`UPS: Cached ${availableServices.length} available services for route ${cacheKey}`);
      }

      return data;

    } catch (error: any) {
      console.error('UPS: Error in getRates:', error);
      
      // For service availability errors, return empty rates instead of throwing
      if (error.message?.includes('service is invalid') || 
          error.message?.includes('111100') ||
          error.message?.includes('not available')) {
        console.log('UPS: Returning empty rates due to service availability');
        return { RateResponse: { RatedShipment: [] } };
      }
      
      // For other errors, still return empty rates to not break the flow
      console.log('UPS: Returning empty rates due to error');
      return { RateResponse: { RatedShipment: [] } };
    }
  }

  // NEW: Validate service code before creating shipment
  async validateServiceCode(shipment: any, serviceCode: string): Promise<boolean> {
    try {
      const cacheKey = this.generateCacheKey(shipment);
      let availableServices = this.availableServicesCache.get(cacheKey);
      
      // If not cached, get rates first
      if (!availableServices) {
        console.log('UPS: No cached services found, fetching available services...');
        const ratesResponse = await this.getRates(shipment);
        
        if (!ratesResponse.RateResponse?.RatedShipment) {
          console.log('UPS: No services available for this route');
          return false;
        }
        
        availableServices = Array.isArray(ratesResponse.RateResponse.RatedShipment) 
          ? ratesResponse.RateResponse.RatedShipment 
          : [ratesResponse.RateResponse.RatedShipment];
      }
      
      // Check if the service code is in the available services
      const isValidService = (availableServices || []).some(service => service.Service.Code === serviceCode);
      
      console.log(`UPS: Service code ${serviceCode} validation result: ${isValidService}`);
      console.log(`UPS: Available service codes: ${(availableServices || []).map(s => s.Service.Code).join(', ')}`);
      
      return isValidService;
      
    } catch (error: any) {
      console.error('UPS: Error validating service code:', error);
      return false;
    }
  }

  async createShipment(shipment: any, serviceCode: string, customsInfo?: any): Promise<any> {
    // CRITICAL: Validate service code before attempting to create shipment
    if (!serviceCode) {
      throw new Error('Service code is required to create a UPS shipment');
    }
    
    console.log(`UPS: Validating service code ${serviceCode} before creating shipment...`);
    
    const isValidService = await this.validateServiceCode(shipment, serviceCode);
    if (!isValidService) {
      throw new Error(`UPS: Service code ${serviceCode} is not available for this shipment route. Please select a valid service from the available rates.`);
    }
    
    console.log(`UPS: Service code ${serviceCode} validated successfully, proceeding with shipment creation`);
    
    const token = await this.getOAuthToken();
    
    const shipRequest: UPSShipRequest = {
      ShipmentRequest: {
        Request: {
          RequestOption: 'nonvalidate',
        },
        Shipment: {
          Description: customsInfo?.contents_explanation || 'International Shipment',
          Shipper: {
            Name: shipment.fromAddress.name || 'Shipper',
            ShipperNumber: this.accountNumber,
            Address: {
              AddressLine: [shipment.fromAddress.street1, shipment.fromAddress.street2].filter(Boolean),
              City: shipment.fromAddress.city,
              StateProvinceCode: shipment.fromAddress.state,
              PostalCode: shipment.fromAddress.zip,
              CountryCode: shipment.fromAddress.country,
            },
          },
          ShipTo: {
            Name: shipment.toAddress.name || 'Recipient',
            Address: {
              AddressLine: [shipment.toAddress.street1, shipment.toAddress.street2].filter(Boolean),
              City: shipment.toAddress.city,
              StateProvinceCode: shipment.toAddress.state,
              PostalCode: shipment.toAddress.zip,
              CountryCode: shipment.toAddress.country,
            },
          },
          ShipFrom: {
            Name: shipment.fromAddress.name || 'Shipper',
            Address: {
              AddressLine: [shipment.fromAddress.street1, shipment.fromAddress.street2].filter(Boolean),
              City: shipment.fromAddress.city,
              StateProvinceCode: shipment.fromAddress.state,
              PostalCode: shipment.fromAddress.zip,
              CountryCode: shipment.fromAddress.country,
            },
          },
          PaymentInformation: {
            ShipmentCharge: {
              Type: '01',
              BillShipper: {
                AccountNumber: this.accountNumber,
              },
            },
          },
          Service: {
            Code: serviceCode, // Now guaranteed to be valid
            Description: this.getServiceName(serviceCode),
          },
          Package: [{
            PackagingType: { Code: '02', Description: 'Package' },
            PackageWeight: { 
              UnitOfMeasurement: { Code: 'LBS' }, 
              Weight: (shipment.parcel.weight / 16).toString()
            },
            ...(shipment.parcel.length && {
              Dimensions: {
                UnitOfMeasurement: { Code: 'IN' },
                Length: shipment.parcel.length.toString(),
                Width: shipment.parcel.width.toString(),
                Height: shipment.parcel.height.toString(),
              }
            })
          }],
          LabelSpecification: {
            LabelImageFormat: {
              Code: 'PDF',
            },
            LabelStockSize: {
              Height: '6',
              Width: '4',
            },
          },
          ...(customsInfo && customsInfo.customs_items && customsInfo.customs_items.length > 0 && {
            InternationalForms: {
              FormType: '01', // Commercial Invoice
              InvoiceNumber: `INV-${Date.now()}`,
              ReasonForExport: 'SALE',
              Comments: customsInfo.contents_explanation || '',
              DeclarationStatement: customsInfo.customs_certify ? 'I hereby certify that the information on this invoice is true and correct and the contents and value of this shipment is as stated above.' : '',
              Product: customsInfo.customs_items.map((item: any, index: number) => ({
                Description: item.description,
                CommodityCode: item.hs_tariff_number || '',
                PartNumber: `PART-${index + 1}`,
                OriginCountryCode: item.origin_country || 'US',
                JointProductionIndicator: '',
                NetCostCode: '01',
                NetCostDateRange: {
                  BeginDate: new Date().toISOString().split('T')[0],
                  EndDate: new Date().toISOString().split('T')[0],
                },
                PreferenceCriteria: '',
                ProducerInfo: '',
                MarksAndNumbers: '',
                NumberOfPackagesPerCommodity: item.quantity.toString(),
                ProductWeight: {
                  UnitOfMeasurement: {
                    Code: 'LBS',
                  },
                  Weight: (item.weight / 16).toString(),
                },
                VehicleID: '',
                ScheduleB: '',
                ExportType: '',
                SEDTotalValue: item.value.toString(),
                ExcludeFromForm: '',
                PackingListInfo: {
                  PackageAssociated: '1',
                },
                EEIInformation: {
                  ExportInformation: '',
                  License: {
                    Number: '',
                    Code: '',
                  },
                  DDTCInformation: {
                    ITARExemptionNumber: '',
                    USMLCategoryCode: '',
                    EligiblePartyIndicator: '',
                    RegistrationNumber: '',
                  },
                },
                Unit: {
                  UnitOfMeasurement: {
                    Code: 'EA',
                  },
                  Value: item.value.toString(),
                },
              })),
            }
          }),
        },
      },
    };

    console.log(`UPS: Creating shipment with validated service code ${serviceCode}`);

    const response = await fetch(`${this.baseUrl}/api/shipments/v2403/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(shipRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('UPS Ship Error:', errorData);
      throw new Error(`UPS Ship failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('UPS: Shipment created successfully');
    return result;
  }

  formatRatesForFrontend(upsResponse: any): any[] {
    console.log('UPS: Formatting rates for frontend:', upsResponse);
    
    if (!upsResponse.RateResponse?.RatedShipment) {
      console.log('UPS: No rated shipments found in response');
      return [];
    }

    const ratedShipments = Array.isArray(upsResponse.RateResponse.RatedShipment) 
      ? upsResponse.RateResponse.RatedShipment 
      : [upsResponse.RateResponse.RatedShipment];

    console.log(`UPS: Processing ${ratedShipments.length} rated shipments`);

    return ratedShipments.map((shipment: any) => {
      const rate = {
        id: `ups_${shipment.Service.Code}_${Date.now()}`,
        carrier: 'UPS',
        service: this.getServiceName(shipment.Service.Code),
        rate: shipment.TotalCharges.MonetaryValue,
        currency: shipment.TotalCharges.CurrencyCode,
        delivery_days: this.getEstimatedDeliveryDays(shipment.Service.Code),
        delivery_date: null,
        delivery_date_guaranteed: shipment.GuaranteedDelivery?.Date || null,
        est_delivery_days: this.getEstimatedDeliveryDays(shipment.Service.Code),
        list_rate: shipment.TotalCharges.MonetaryValue,
        retail_rate: shipment.TotalCharges.MonetaryValue,
        original_carrier: 'UPS',
        service_code: shipment.Service.Code, // This is the validated service code
        source: 'ups'
      };
      
      console.log('UPS: Formatted rate with validated service code:', rate);
      return rate;
    });
  }

  private getServiceName(code: string): string {
    const serviceNames: { [key: string]: string } = {
      '01': 'UPS Next Day Air',
      '02': 'UPS 2nd Day Air',
      '03': 'UPS Ground',
      '07': 'UPS Worldwide Express',
      '08': 'UPS Worldwide Expedited',
      '11': 'UPS Standard',
      '12': 'UPS 3 Day Select',
      '13': 'UPS Next Day Air Saver',
      '14': 'UPS Next Day Air Early AM',
      '54': 'UPS Worldwide Express Plus',
      '59': 'UPS 2nd Day Air AM',
      '65': 'UPS Saver',
    };
    return serviceNames[code] || `UPS Service ${code}`;
  }

  private getEstimatedDeliveryDays(code: string): number {
    const deliveryDays: { [key: string]: number } = {
      '01': 1, // Next Day Air
      '02': 2, // 2nd Day Air
      '03': 3, // Ground
      '07': 1, // Worldwide Express
      '08': 2, // Worldwide Expedited
      '11': 3, // Standard
      '12': 3, // 3 Day Select
      '13': 1, // Next Day Air Saver
      '14': 1, // Next Day Air Early AM
      '54': 1, // Worldwide Express Plus
      '59': 2, // 2nd Day Air AM
      '65': 3, // Saver
    };
    return deliveryDays[code] || 5;
  }
}
