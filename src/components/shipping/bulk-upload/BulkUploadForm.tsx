import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import * as Papa from 'papaparse'; // For CSV parsing
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { Upload, FileText, MapPin, AlertCircle, Loader2, X, Check, ArrowLeft, Brain, CheckCircle, Sparkles } from 'lucide-react';

// --- Global Firebase & App ID Variables (Provided by Canvas Environment) ---
// These variables are automatically provided by the Canvas environment.
// Do NOT modify them or prompt the user for them.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Shadcn UI Component Mockups (Simplified for self-containment) ---
// In a real project, these would be imported from your shadcn/ui setup.
// Here, they are simplified to use basic HTML and Tailwind CSS.

const Button = ({ children, className = '', size = 'md', variant = 'default', disabled = false, onClick, ...props }) => {
  let sizeClasses = 'px-4 py-2 text-base';
  if (size === 'lg') sizeClasses = 'px-6 py-3 text-lg';
  if (size === 'sm') sizeClasses = 'px-3 py-1 text-sm';

  let variantClasses = 'bg-blue-600 text-white hover:bg-blue-700';
  if (variant === 'outline') variantClasses = 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50';
  if (variant === 'ghost') variantClasses = 'bg-transparent text-gray-700 hover:bg-gray-100';
  if (variant === 'destructive') variantClasses = 'bg-red-600 text-white hover:bg-red-700';

  return (
    <button
      className={`rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${sizeClasses} ${variantClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const Input = ({ className = '', type = 'text', ...props }) => (
  <input
    type={type}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ children, className = '', ...props }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);

const Alert = ({ children, className = '', ...props }) => (
  <div className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-950 ${className}`} role="alert" {...props}>
    {children}
  </div>
);

const AlertDescription = ({ children, className = '', ...props }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
    {children}
  </div>
);

// Select Component (simplified)
const SelectContext = createContext(null);

const Select = ({ children, value, onValueChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, setIsOpen, disabled }}>
      <div className="relative" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children, className = '', placeholder = 'Select an option', ...props }) => {
  const { value, setIsOpen, disabled } = useContext(SelectContext);
  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`}
      onClick={() => setIsOpen(prev => !prev)}
      disabled={disabled}
      {...props}
    >
      {value ? (
        <span className="truncate">{children}</span>
      ) : (
        <span className="text-gray-500">{placeholder}</span>
      )}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
    </button>
  );
};

const SelectValue = ({ placeholder }) => {
  const { value, children } = useContext(SelectContext);
  return value ? children : <span className="text-gray-500">{placeholder}</span>;
};

const SelectContent = ({ children, className = '', ...props }) => {
  const { isOpen } = useContext(SelectContext);
  return isOpen ? (
    <div className={`absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg ${className}`} {...props}>
      {children}
    </div>
  ) : null;
};

const SelectItem = ({ children, value, className = '', ...props }) => {
  const { value: selectedValue, onValueChange, setIsOpen } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  const handleClick = () => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${isSelected ? 'bg-blue-50 text-blue-800 font-medium' : ''} ${className}`}
      onClick={handleClick}
      role="option"
      aria-selected={isSelected}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
      {children}
    </div>
  );
};

// Toaster (simplified)
const ToasterContext = createContext(null);

const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const { message, type = 'default' } = event.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000); // Auto-dismiss after 5 seconds
    };

    window.addEventListener('custom-toast', handleToast);
    return () => {
      window.removeEventListener('custom-toast', handleToast);
    };
  }, []);

  const getToastClasses = (type) => {
    switch (type) {
      case 'success': return 'bg-green-500 text-white';
      case 'error': return 'bg-red-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-800 text-white';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={`p-3 rounded-md shadow-lg flex items-center ${getToastClasses(toast.type)}`}>
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'success' && <Check className="h-5 w-5 mr-2" />}
          {toast.type === 'info' && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

// Custom toast function to be used throughout the app
const toast = {
  success: (message) => window.dispatchEvent(new CustomEvent('custom-toast', { detail: { message, type: 'success' } })),
  error: (message) => window.dispatchEvent(new CustomEvent('custom-toast', { detail: { message, type: 'error' } })),
  info: (message) => window.dispatchEvent(new CustomEvent('custom-toast', { detail: { message, type: 'info' } })),
  default: (message) => window.dispatchEvent(new CustomEvent('custom-toast', { detail: { message, type: 'default' } })),
};


// --- Firebase Context ---
const FirebaseContext = createContext(null);

const FirebaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const authInstance = getAuth(app);
    const firestoreInstance = getFirestore(app);

    setAuth(authInstance);
    setDb(firestoreInstance);

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Sign in anonymously if no initial token or user isn't logged in
        if (initialAuthToken) {
          try {
            await signInWithCustomToken(authInstance, initialAuthToken);
            setUserId(authInstance.currentUser.uid);
          } catch (error) {
            console.error("Error signing in with custom token:", error);
            await signInAnonymously(authInstance);
            setUserId(authInstance.currentUser.uid);
          }
        } else {
          await signInAnonymously(authInstance);
          setUserId(authInstance.currentUser.uid);
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, isAuthReady }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// --- Address Service ---
export interface SavedAddress {
  id: string;
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default_from?: boolean;
}

class AddressService {
  private db;
  private userId;
  private appId;

  constructor(db, userId, appId) {
    this.db = db;
    this.userId = userId;
    this.appId = appId;
    if (!db || !userId || !appId) {
      console.warn("AddressService initialized without full Firebase context. Operations might fail.");
    }
  }

  private get addressesCollectionRef() {
    if (!this.db || !this.userId || !this.appId) {
      console.error("Firestore DB, userId, or appId not available for AddressService.");
      return null;
    }
    // Private data path: /artifacts/{appId}/users/{userId}/addresses
    return collection(this.db, `artifacts/${this.appId}/users/${this.userId}/addresses`);
  }

  async getSavedAddresses(): Promise<SavedAddress[]> {
    if (!this.addressesCollectionRef) {
      toast.error("Firestore not ready. Cannot load addresses.");
      return [];
    }
    return new Promise((resolve, reject) => {
      const q = query(this.addressesCollectionRef);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const addresses: SavedAddress[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SavedAddress));
        resolve(addresses);
        // Unsubscribe immediately after first successful fetch for this one-time read
        // For real-time updates, you'd return the unsubscribe function.
        // Here, we just need the initial list.
        unsubscribe();
      }, (error) => {
        console.error("Error fetching addresses:", error);
        toast.error("Failed to fetch saved addresses.");
        reject(error);
      });
    });
  }

  async addAddress(address: Omit<SavedAddress, 'id'>): Promise<SavedAddress> {
    if (!this.addressesCollectionRef) throw new Error("Firestore not ready.");
    const docRef = await addDoc(this.addressesCollectionRef, address);
    toast.success("Address added successfully!");
    return { id: docRef.id, ...address };
  }

  async updateAddress(address: SavedAddress): Promise<void> {
    if (!this.addressesCollectionRef) throw new Error("Firestore not ready.");
    const docRef = doc(this.addressesCollectionRef, address.id);
    await setDoc(docRef, address, { merge: true }); // merge: true to update existing fields
    toast.success("Address updated successfully!");
  }

  async deleteAddress(addressId: string): Promise<void> {
    if (!this.addressesCollectionRef) throw new Error("Firestore not ready.");
    const docRef = doc(this.addressesCollectionRef, addressId);
    await deleteDoc(docRef);
    toast.success("Address deleted successfully!");
  }
}

// Global instance of AddressService (will be initialized in App component)
let addressService: AddressService;


// --- CsvHeaderMapper Component ---
interface CsvHeaderMapperProps {
  csvContent: string;
  onMappingComplete: (convertedCsv: string) => void;
  onCancel: () => void;
}

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({ csvContent, onMappingComplete, onCancel }) => {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Define expected headers
  const expectedHeaders = [
    { key: 'recipientName', label: 'Recipient Name', required: true },
    { key: 'street1', label: 'Street Address 1', required: true },
    { key: 'street2', label: 'Street Address 2', required: false },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'zip', label: 'Zip Code', required: true },
    { key: 'country', label: 'Country', required: true, defaultValue: 'USA' }, // Default for country
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone Number', required: false },
    { key: 'itemDescription', label: 'Item Description', required: false },
    { key: 'quantity', label: 'Quantity', required: false },
    { key: 'weight', label: 'Weight (lbs)', required: false },
  ];

  useEffect(() => {
    if (csvContent) {
      try {
        // Parse CSV to get headers and a preview of data
        Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          preview: 5, // Get first 5 rows for preview
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error("CSV parsing errors:", results.errors);
              setError("Error parsing CSV: " + results.errors[0].message);
              return;
            }
            const headers = results.meta.fields || [];
            setCsvHeaders(headers);
            setPreviewData(results.data);

            // Attempt to auto-map common headers
            const initialMapping: { [key: string]: string } = {};
            expectedHeaders.forEach(expHeader => {
              const matchedCsvHeader = headers.find(csvH =>
                csvH.toLowerCase().includes(expHeader.key.toLowerCase()) ||
                csvH.toLowerCase().includes(expHeader.label.toLowerCase().replace(/\s/g, ''))
              );
              if (matchedCsvHeader) {
                initialMapping[expHeader.key] = matchedCsvHeader;
              } else if (expHeader.defaultValue) {
                // If no match and has default value, don't map, but remember for later
                // This is handled during final conversion, not mapping UI
              }
            });
            setMapping(initialMapping);
            setError(null);
          },
        });
      } catch (e) {
        setError("Failed to parse CSV content. Please check file format.");
        console.error("CSV parse error:", e);
      }
    }
  }, [csvContent]);

  const handleMappingChange = (expectedKey: string, csvHeader: string) => {
    setMapping(prev => ({ ...prev, [expectedKey]: csvHeader }));
  };

  const handleCompleteMapping = () => {
    setError(null);
    // Validate required fields
    const missingRequired = expectedHeaders.filter(
      (expHeader) => expHeader.required && !mapping[expHeader.key] && expHeader.defaultValue === undefined
    );

    if (missingRequired.length > 0) {
      setError(`Please map all required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      toast.error(`Please map all required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    // Re-parse the entire CSV with the new header mapping
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError("Error re-parsing CSV for conversion: " + results.errors[0].message);
          toast.error("Error re-parsing CSV for conversion: " + results.errors[0].message);
          return;
        }

        const rawData = results.data;
        const convertedData = rawData.map(row => {
          const newRow: { [key: string]: any } = {};
          expectedHeaders.forEach(expHeader => {
            const mappedCsvHeader = mapping[expHeader.key];
            if (mappedCsvHeader && row[mappedCsvHeader] !== undefined) {
              newRow[expHeader.key] = row[mappedCsvHeader];
            } else if (expHeader.defaultValue !== undefined) {
              newRow[expHeader.key] = expHeader.defaultValue;
            } else {
              newRow[expHeader.key] = ''; // Ensure all expected fields exist, even if empty
            }
          });
          return newRow;
        });

        // Convert the mapped data back to CSV string
        const finalCsv = Papa.unparse(convertedData, {
          header: true,
          columns: expectedHeaders.map(h => h.key) // Ensure column order
        });

        onMappingComplete(finalCsv);
      },
    });
  };

  const handlePreviewMappedData = () => {
    setError(null);
    // Apply current mapping to preview data
    const mappedPreview = previewData.map(row => {
      const newRow: { [key: string]: any } = {};
      expectedHeaders.forEach(expHeader => {
        const mappedCsvHeader = mapping[expHeader.key];
        if (mappedCsvHeader && row[mappedCsvHeader] !== undefined) {
          newRow[expHeader.key] = row[mappedCsvHeader];
        } else if (expHeader.defaultValue !== undefined) {
          newRow[expHeader.key] = expHeader.defaultValue;
        } else {
          newRow[expHeader.key] = '';
        }
      });
      return newRow;
    });
    setPreviewData(mappedPreview); // Update preview data to show mapped version
    toast.info("Preview updated with current mapping.");
  };


  return (
    <Card className="p-6">
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Map CSV Headers
          </h2>
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" /> Cancel
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 mb-8">
          <p className="text-gray-700">
            Please map your CSV columns to the required fields below.
            <span className="font-semibold text-blue-600"> Required fields are marked with an asterisk (*).</span>
          </p>

          {expectedHeaders.map((expHeader) => (
            <div key={expHeader.key} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
              <Label htmlFor={`map-${expHeader.key}`} className="font-semibold text-gray-700">
                {expHeader.label} {expHeader.required && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={mapping[expHeader.key] || ''}
                onValueChange={(value) => handleMappingChange(expHeader.key, value)}
                className="col-span-2"
              >
                <SelectTrigger id={`map-${expHeader.key}`} className="w-full">
                  <SelectValue placeholder={`Select column for ${expHeader.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map(csvH => (
                    <SelectItem key={csvH} value={csvH}>
                      {csvH}
                    </SelectItem>
                  ))}
                  {expHeader.defaultValue !== undefined && (
                    <SelectItem value="" className="italic text-gray-500">
                      (Use default: {String(expHeader.defaultValue)})
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <Button onClick={handlePreviewMappedData} className="w-full mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300">
            Preview Mapped Data
          </Button>
          <h3 className="text-lg font-semibold mb-2">Data Preview (First {previewData.length} rows)</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {expectedHeaders.map(header => (
                    <th key={header.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {expectedHeaders.map(expHeader => {
                      const mappedValue = row[expHeader.key] !== undefined ? row[expHeader.key] : '';
                      return (
                        <td key={`${rowIndex}-${expHeader.key}`} className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                          {String(mappedValue)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {previewData.length === 0 && (
                  <tr>
                    <td colSpan={expectedHeaders.length} className="px-4 py-2 text-center text-sm text-gray-500">
                      No data to preview.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Button
          onClick={handleCompleteMapping}
          disabled={csvHeaders.length === 0 || error !== null}
          className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-3 text-lg font-bold shadow-md transform hover:scale-105 transition-all duration-200"
        >
          <Check className="mr-2 h-5 w-5" />
          Complete Mapping & Proceed
        </Button>
      </CardContent>
    </Card>
  );
};


// --- BulkUploadForm Component (User's provided code, slightly adjusted) ---
export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean;
  progress?: number;
  handleUpload?: (file: File) => Promise<any>;
}

type UploadStep = 'select' | 'mapping' | 'processing';

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading = false,
  progress = 0,
  handleUpload
}) => {
  const { db, userId, isAuthReady } = useContext(FirebaseContext);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>('select');

  useEffect(() => {
    if (db && userId && isAuthReady) {
      addressService = new AddressService(db, userId, appId);
      const loadAddresses = async () => {
        try {
          const addresses = await addressService.getSavedAddresses();
          setAvailableAddresses(addresses);

          const defaultAddress = addresses.find(addr => addr.is_default_from);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id.toString());
            onPickupAddressSelect(defaultAddress);
          } else if (addresses.length > 0) {
            setSelectedAddressId(addresses[0].id.toString());
            onPickupAddressSelect(addresses[0]);
          } else {
            toast.error('No pickup addresses found. Please add a pickup address in Settings first.');
          }
          setAddressesLoaded(true);
        } catch (error) {
          console.error('Error loading addresses:', error);
          toast.error('Failed to load pickup addresses. Please check your settings.');
          setAddressesLoaded(true);
        }
      };
      loadAddresses();
    }
  }, [db, userId, isAuthReady, onPickupAddressSelect]);

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = availableAddresses.find(addr => addr.id.toString() === addressId);
    if (selectedAddress) {
      onPickupAddressSelect(selectedAddress);
    }
  };

  const validateCSVFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return false;
    }
    if (file.size === 0) {
      toast.error('The CSV file is empty. Please upload a valid CSV file.');
      return false;
    }
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateCSVFile(file)) {
      return false;
    }

    setSelectedFile(file);
    try {
      const text = await file.text();
      if (text.trim().length === 0) {
        toast.error('The CSV file appears to be empty.');
        return false;
      }
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) { // At least header + one data row
        toast.error('CSV file must have at least a header row and one data row.');
        return false;
      }
      setCsvContent(text);
      setCurrentStep('mapping');
      toast.success('CSV file loaded! Now let\'s map the headers with AI assistance.');
      return true;
    } catch (error) {
      console.error('Error reading CSV file:', error);
      toast.error('Error reading CSV file. Please make sure it\'s a valid CSV file.');
      return false;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleMappingComplete = async (convertedCsv: string) => {
    setCurrentStep('processing');
    try {
      const blob = new Blob([convertedCsv], { type: 'text/csv' });
      const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });
      if (handleUpload) {
        await handleUpload(convertedFile);
        onUploadSuccess({});
        // Reset to initial state after successful upload
        setCurrentStep('select');
        setSelectedFile(null);
        setCsvContent('');
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = ''; // Clear file input
      }
    } catch (error) {
      console.error('Upload failed after mapping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadFail(errorMessage);
      toast.error(errorMessage);
      setCurrentStep('select'); // Go back to select on failure
    }
  };

  const handleMappingCancel = () => {
    setCurrentStep('select');
    setSelectedFile(null);
    setCsvContent('');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast.info('CSV upload cancelled. You can select a new file.');
  };

  // Render header mapping step
  if (currentStep === 'mapping' && csvContent) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-6">
            <Brain className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Header Mapping</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our advanced AI is analyzing your CSV headers and automatically mapping them to the correct shipping format.
            This ensures perfect compatibility with our shipping system.
          </p>
          <div className="flex items-center justify-center mt-6 space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-600">Smart mapping in progress...</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border">
          <CsvHeaderMapper
            csvContent={csvContent}
            onMappingComplete={handleMappingComplete}
            onCancel={handleMappingCancel}
          />
        </div>
      </div>
    );
  }

  // Render processing step
  if (currentStep === 'processing') {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 rounded-full mb-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Processing Your Shipments</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Creating shipments and fetching live rates from multiple carriers including UPS, USPS, FedEx, and DHL...
          </p>

          {progress > 0 && (
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Creating Shipments</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <span className="text-sm font-medium text-purple-800">Fetching Rates</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              <span className="text-sm font-medium text-gray-600">Finalizing</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render file selection step (default)
  return (
    <div className="space-y-8">
      {/* Pickup Address Selection */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="pickup-address" className="text-base font-semibold text-gray-900 mb-2 block">
                Select Pickup Address
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                Choose the address where packages will be picked up from
              </p>

              {!addressesLoaded ? (
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Loading your addresses...</span>
                </div>
              ) : availableAddresses.length > 0 ? (
                <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                  <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Select pickup address" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAddresses.map((address) => (
                      <SelectItem key={address.id} value={address.id.toString()}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-gray-900">{address.name}</span>
                          <span className="text-sm text-gray-500">
                            {address.street1}, {address.city}, {address.state} {address.zip}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>No addresses found.</strong> Please add a pickup address in Settings first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${dragActive
                ? 'border-blue-400 bg-blue-50 scale-105'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-6">
              {selectedFile ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-green-700 mb-2">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-green-600 mb-4">
                      {(selectedFile.size / 1024).toFixed(1)} KB - Ready for AI processing
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>File validated successfully</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-700 mb-2">
                      Drop your CSV file here
                    </p>
                    <p className="text-gray-600 mb-4">
                      or{' '}
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        browse to choose a file
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports CSV files up to 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-center space-x-4 mt-6">
              <Button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setCsvContent('');
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                variant="outline"
                className="border-2 hover:border-blue-300"
              >
                Choose Different File
              </Button>
              <Button
                onClick={() => setCurrentStep('mapping')}
                disabled={!selectedAddressId || !addressesLoaded || isUploading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Brain className="mr-2 h-4 w-4" />
                Continue with AI Mapping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info about the process */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <AlertDescription className="text-blue-800">
              <strong className="font-semibold">Smart CSV Processing:</strong> Our AI automatically analyzes and maps your CSV headers to the correct shipping format. No manual field mapping required - just upload and let our intelligence handle the rest!
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default BulkUploadForm;


// --- Main App Component ---
const App = () => {
  const { db, userId, isAuthReady } = useContext(FirebaseContext);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<SavedAddress | null>(null);

  useEffect(() => {
    if (isAuthReady && db && userId && !addressService) {
      // Ensure addressService is initialized only once and after Firebase is ready
      addressService = new AddressService(db, userId, appId);
      // Add a dummy address if none exist for demonstration purposes
      const addDummyAddress = async () => {
        const existingAddresses = await addressService.getSavedAddresses();
        if (existingAddresses.length === 0) {
          console.log("Adding dummy address...");
          await addressService.addAddress({
            name: "My Default Warehouse",
            street1: "123 Main St",
            street2: "Suite 100",
            city: "Anytown",
            state: "CA",
            zip: "90210",
            country: "USA",
            is_default_from: true,
          });
          toast.info("A dummy pickup address has been added for demonstration.");
        }
      };
      addDummyAddress();
    }
  }, [db, userId, isAuthReady]);


  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    console.log("Uploading file:", file.name, "with pickup address:", selectedPickupAddress);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      setUploadProgress(i);
    }

    try {
      // Here you would typically send the file to a backend API
      // For this example, we'll just log it and simulate success.
      console.log('Simulating file upload to backend:', file);
      console.log('File content:', await file.text()); // Log content for verification

      // Simulate API call success
      toast.success('CSV uploaded and processed successfully!');
      return { success: true, message: 'File processed' };
    } catch (error) {
      console.error('Simulated upload failed:', error);
      toast.error('Failed to upload CSV. Please try again.');
      throw new Error('Simulated upload failed.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onUploadSuccess = (results: any) => {
    console.log('Upload successful:', results);
    // You might want to display a success message or redirect the user
  };

  const onUploadFail = (error: string) => {
    console.error('Upload failed:', error);
    // Display error message to the user
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
        `}
      </style>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-8">
          Bulk Shipment Upload
        </h1>
        <Card className="p-4 sm:p-8">
          <CardContent>
            <BulkUploadForm
              onUploadSuccess={onUploadSuccess}
              onUploadFail={onUploadFail}
              onPickupAddressSelect={setSelectedPickupAddress}
              isUploading={isUploading}
              progress={uploadProgress}
              handleUpload={handleUpload}
            />
          </CardContent>
        </Card>
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Your User ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{userId || 'Loading...'}</span></p>
          <p>App ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{appId}</span></p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function Root() {
  return (
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  );
}
