
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Anchor, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Port {
  name: string;
  country: string;
  type: 'port' | 'airport';
  code: string;
}

const ports: Port[] = [
  // US Ports
  { name: 'Los Angeles', country: 'United States', type: 'port', code: 'USLAX' },
  { name: 'Long Beach', country: 'United States', type: 'port', code: 'USLGB' },
  { name: 'New York', country: 'United States', type: 'port', code: 'USNYC' },
  { name: 'Newark', country: 'United States', type: 'port', code: 'USEWR' },
  { name: 'Savannah', country: 'United States', type: 'port', code: 'USSAV' },
  { name: 'Houston', country: 'United States', type: 'port', code: 'USHOU' },
  { name: 'Seattle', country: 'United States', type: 'port', code: 'USSEA' },
  { name: 'Oakland', country: 'United States', type: 'port', code: 'USOAK' },
  { name: 'Miami', country: 'United States', type: 'port', code: 'USMIA' },
  { name: 'Charleston', country: 'United States', type: 'port', code: 'USCHS' },
  
  // International Ports
  { name: 'Shanghai', country: 'China', type: 'port', code: 'CNSHA' },
  { name: 'Singapore', country: 'Singapore', type: 'port', code: 'SGSIN' },
  { name: 'Rotterdam', country: 'Netherlands', type: 'port', code: 'NLRTM' },
  { name: 'Hamburg', country: 'Germany', type: 'port', code: 'DEHAM' },
  { name: 'Antwerp', country: 'Belgium', type: 'port', code: 'BEANR' },
  { name: 'Hong Kong', country: 'Hong Kong', type: 'port', code: 'HKHKG' },
  { name: 'Busan', country: 'South Korea', type: 'port', code: 'KRPUS' },
  { name: 'Dubai', country: 'United Arab Emirates', type: 'port', code: 'AEDXB' },
  { name: 'London', country: 'United Kingdom', type: 'port', code: 'GBLON' },
  { name: 'Tokyo', country: 'Japan', type: 'port', code: 'JPNRT' },
  { name: 'Mumbai', country: 'India', type: 'port', code: 'INBOM' },
  { name: 'Delhi', country: 'India', type: 'port', code: 'INDEL' },
  { name: 'Chennai', country: 'India', type: 'port', code: 'INMAA' },
  { name: 'Kolkata', country: 'India', type: 'port', code: 'INCCU' },
  { name: 'Le Havre', country: 'France', type: 'port', code: 'FRLEH' },
  { name: 'Felixstowe', country: 'United Kingdom', type: 'port', code: 'GBFXT' },
  { name: 'Barcelona', country: 'Spain', type: 'port', code: 'ESBCN' },
  { name: 'Genoa', country: 'Italy', type: 'port', code: 'ITGOA' },
  { name: 'Valencia', country: 'Spain', type: 'port', code: 'ESVLC' },
  
  // Major Airports
  { name: 'Los Angeles International Airport', country: 'United States', type: 'airport', code: 'USLAX' },
  { name: 'John F. Kennedy International Airport', country: 'United States', type: 'airport', code: 'USNYC' },
  { name: 'Chicago O\'Hare International Airport', country: 'United States', type: 'airport', code: 'USCHI' },
  { name: 'Miami International Airport', country: 'United States', type: 'airport', code: 'USMIA' },
  { name: 'Shanghai Pudong International Airport', country: 'China', type: 'airport', code: 'CNSHA' },
  { name: 'Singapore Changi Airport', country: 'Singapore', type: 'airport', code: 'SGSIN' },
  { name: 'Frankfurt Airport', country: 'Germany', type: 'airport', code: 'DEFRA' },
  { name: 'Amsterdam Schiphol Airport', country: 'Netherlands', type: 'airport', code: 'NLAMS' },
  { name: 'London Heathrow Airport', country: 'United Kingdom', type: 'airport', code: 'GBLON' },
  { name: 'Tokyo Narita International Airport', country: 'Japan', type: 'airport', code: 'JPNRT' },
  { name: 'Dubai International Airport', country: 'United Arab Emirates', type: 'airport', code: 'AEDXB' },
  { name: 'Hong Kong International Airport', country: 'Hong Kong', type: 'airport', code: 'HKHKG' },
  { name: 'Seoul Incheon International Airport', country: 'South Korea', type: 'airport', code: 'KRPUS' },
];

interface PortSelectorProps {
  label: string;
  value: string;
  onChange: (portName: string, country: string) => void;
  placeholder?: string;
}

const PortSelector: React.FC<PortSelectorProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select a port or airport..."
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredPorts = useMemo(() => {
    if (!searchValue) return ports;
    
    return ports.filter((port) =>
      port.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      port.country.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue]);

  const selectedPort = ports.find((port) => port.name === value);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        {label} *
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 text-left font-normal"
          >
            <div className="flex items-center justify-between w-full">
              {selectedPort ? (
                <div className="flex items-center space-x-2">
                  {selectedPort.type === 'port' ? (
                    <Anchor className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Plane className="w-4 h-4 text-green-600" />
                  )}
                  <div>
                    <div className="font-medium">{selectedPort.name}</div>
                    <div className="text-xs text-gray-500">{selectedPort.country}</div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search ports and airports..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No ports or airports found.</CommandEmpty>
              
              <CommandGroup heading="Seaports">
                {filteredPorts.filter(port => port.type === 'port').map((port) => (
                  <CommandItem
                    key={port.code}
                    value={port.name}
                    onSelect={() => {
                      onChange(port.name, port.country);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Anchor className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium">{port.name}</div>
                        <div className="text-xs text-gray-500">{port.country}</div>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === port.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandGroup heading="Airports">
                {filteredPorts.filter(port => port.type === 'airport').map((port) => (
                  <CommandItem
                    key={port.code}
                    value={port.name}
                    onSelect={() => {
                      onChange(port.name, port.country);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Plane className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium">{port.name}</div>
                        <div className="text-xs text-gray-500">{port.country}</div>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === port.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PortSelector;
