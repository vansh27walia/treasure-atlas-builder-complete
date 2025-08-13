
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
    
    console.log('UPS OAuth request to:', url);
    
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
    console.log('UPS OAuth successful');
    return data.access_token;
  }

  private isInternationalShipment(fromCountry: string, toCountry: string): boolean {
    return fromCountry !== toCountry;
  }

  private validateAddress(address: any): boolean {
    // Basic validation for required fields
    if (!address.city || !address.country) {
      console.error('UPS Address validation failed: Missing city or country');
      return false;
    }
    
    // For US addresses, state and zip are required
    if (address.country === 'US' && (!address.state || !address.zip)) {
      console.error('UPS Address validation failed: US address missing state or zip');
      return false;
    }
    
    return true;
  }

  private getValidServices(fromCountry: string, toCountry: string): string[] {
    const isInternational = this.isInternationalShipment(fromCountry, toCountry);
    
    if (isInternational) {
      // International services only
      return ['07', '08', '54', '65']; // Worldwide Express, Expedited, Express Plus, Saver
    } else {
      // Domestic US services
      return ['01', '02', '03', '12', '13', '14']; // Next Day Air, 2nd Day, Ground, 3 Day, etc.
    }
  }

  async getRates(shipment: any): Promise<any> {
    try {
      console.log('--- START UPS API REQUEST LOG ---');
      
      // Validate addresses first
      if (!this.validateAddress(shipment.fromAddress) || !this.validateAddress(shipment.toAddress)) {
        throw new Error('Invalid address format for UPS API');
      }
      
      const token = await this.getOAuthToken();
      
      const fromCountry = shipment.fromAddress.country || 'US';
      const toCountry = shipment.toAddress.country || 'US';
      const isInternational = this.isInternationalShipment(fromCountry, toCountry);
      
      console.log(`UPS Rate request: ${fromCountry} -> ${toCountry} (International: ${isInternational})`);
      
      // Build the shipper address (this should be your business address)
      const shipperAddress: UPSAddress = {
        AddressLine: [shipment.fromAddress.street1 || shipment.fromAddress.city],
        City: shipment.fromAddress.city,
        StateProvinceCode: shipment.fromAddress.state || undefined,
        PostalCode: shipment.fromAddress.zip || '00000',
        CountryCode: fromCountry,
      };
      
      // Build the ship-to address
      const shipToAddress: UPSAddress = {
        AddressLine: [shipment.toAddress.street1 || shipment.toAddress.city],
        City: shipment.toAddress.city,
        StateProvinceCode: shipment.toAddress.state || undefined,
        PostalCode: shipment.toAddress.zip || '00000',
        CountryCode: toCountry,
      };
      
      const rateRequest: UPSRateRequest = {
        RateRequest: {
          Request: {
            RequestOption: 'Rate', // Changed from 'Shop' to 'Rate' for international
          },
          Shipment: {
            Shipper: {
              Name: shipment.fromAddress.name || 'Rate Calculator',
              ShipperNumber: this.accountNumber,
              Address: shipperAddress,
            },
            ShipTo: {
              Name: shipment.toAddress.name || 'Recipient',
              Address: shipToAddress,
            },
            ShipFrom: {
              Name: shipment.fromAddress.name || 'Rate Calculator',
              Address: shipperAddress, // Ship from same as shipper for rate requests
            },
            Package: [{
              PackagingType: { Code: '02', Description: 'Package' },
              PackageWeight: { 
                UnitOfMeasurement: { Code: 'LBS' }, 
                Weight: (shipment.parcel.weight / 16).toFixed(2) // Convert oz to lbs
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

      console.log('Sending UPS RateRequest:', JSON.stringify(rateRequest, null, 2));

      const response = await fetch(`${this.baseUrl}/api/rating/v2403/Rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'transId': `rate_${Date.now()}`,
          'transactionSrc': 'testing',
        },
        body: JSON.stringify(rateRequest),
      });

      console.log('--- END UPS API REQUEST LOG ---');

      if (!response.ok) {
        const errorData = await response.text();
        console.error('UPS Rates Error:', errorData);
        
        // Check for specific error codes
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.response?.errors?.[0]?.code === '111100') {
            console.log('UPS Error 111100: Invalid service from origin. This may be due to test account limitations.');
            // Return empty rates instead of throwing
            return { RateResponse: { RatedShipment: [] } };
          }
        } catch (e) {
          // Not JSON, continue with original error
        }
        
        throw new Error(`UPS Rates failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('UPS Rates Response received successfully');
      return responseData;

    } catch (error) {
      console.error('UPS Service Error:', error);
      // Return empty rates instead of throwing to allow EasyPost fallback
      return { RateResponse: { RatedShipment: [] } };
    }
  }

  async createShipment(shipment: any, serviceCode: string, customsInfo?: any): Promise<any> {
    const token = await this.getOAuthToken();
    
    const fromCountry = shipment.fromAddress.country || 'US';
    const toCountry = shipment.toAddress.country || 'US';
    const isInternational = this.isInternationalShipment(fromCountry, toCountry);
    
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
              CountryCode: fromCountry,
            },
          },
          ShipTo: {
            Name: shipment.toAddress.name || 'Recipient',
            Address: {
              AddressLine: [shipment.toAddress.street1, shipment.toAddress.street2].filter(Boolean),
              City: shipment.toAddress.city,
              StateProvinceCode: shipment.toAddress.state,
              PostalCode: shipment.toAddress.zip,
              CountryCode: toCountry,
            },
          },
          ShipFrom: {
            Name: shipment.fromAddress.name || 'Shipper',
            Address: {
              AddressLine: [shipment.fromAddress.street1, shipment.fromAddress.street2].filter(Boolean),
              City: shipment.fromAddress.city,
              StateProvinceCode: shipment.fromAddress.state,
              PostalCode: shipment.fromAddress.zip,
              CountryCode: fromCountry,
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
            Code: serviceCode,
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
          ...(isInternational && customsInfo && customsInfo.customs_items && customsInfo.customs_items.length > 0 && {
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
                OriginCountryCode: item.origin_country || fromCountry,
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

    return await response.json();
  }

  formatRatesForFrontend(upsResponse: any): any[] {
    if (!upsResponse.RateResponse?.RatedShipment) {
      console.log('No UPS rates found in response');
      return [];
    }

    const ratedShipments = Array.isArray(upsResponse.RateResponse.RatedShipment) 
      ? upsResponse.RateResponse.RatedShipment 
      : [upsResponse.RateResponse.RatedShipment];

    console.log(`Formatting ${ratedShipments.length} UPS rates for frontend`);

    return ratedShipments.map((shipment: any) => ({
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
      service_code: shipment.Service.Code,
      source: 'ups'
    }));
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
