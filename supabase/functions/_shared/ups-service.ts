
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

  async getRates(shipment: any): Promise<any> {
    const token = await this.getOAuthToken();
    
    const rateRequest: UPSRateRequest = {
      RateRequest: {
        Request: {
          RequestOption: 'Shop',
        },
        Shipment: {
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

    const response = await fetch(`${this.baseUrl}/api/rating/v2403/Rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(rateRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('UPS Rates Error:', errorData);
      throw new Error(`UPS Rates failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async createShipment(shipment: any, serviceCode: string, customsInfo?: any): Promise<any> {
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
            Code: serviceCode,
            Description: 'UPS Service',
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
      return [];
    }

    const ratedShipments = Array.isArray(upsResponse.RateResponse.RatedShipment) 
      ? upsResponse.RateResponse.RatedShipment 
      : [upsResponse.RateResponse.RatedShipment];

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
