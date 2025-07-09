import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import * as Papa from 'papaparse'; // For CSV parsing
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { Upload, FileText, MapPin, AlertCircle, Loader2, X, Check, ArrowLeft } from 'lucide-react';

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

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading = false,
  progress = 0,
  handleUpload
}) => {
  // Correctly use useContext to get Firebase-related values
  const { db, userId, isAuthReady } = useContext(FirebaseContext);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [showHeaderMapper, setShowHeaderMapper] = useState(false);

  // Load addresses when component mounts and Firebase is ready
  useEffect(() => {
    // Only proceed if Firebase is ready and db/userId are available
    if (db && userId && isAuthReady) {
      // Initialize addressService here, within the scope where db, userId, appId are available
      // This ensures addressService is properly instantiated with the necessary Firebase objects.
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
          }
          setAddressesLoaded(true);
        } catch (error) {
          console.error('Error loading addresses:', error);
          toast.error('Failed to load pickup addresses');
          setAddressesLoaded(true);
        }
      };
      loadAddresses();
    }
  }, [db, userId, isAuthReady, onPickupAddressSelect]); // Added db, userId, isAuthReady to dependencies

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = availableAddresses.find(addr => addr.id.toString() === addressId);
    onPickupAddressSelect(selectedAddress || null);
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File is too large. Maximum size is 10MB.');
      return false;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setShowHeaderMapper(true);
    };
    reader.readAsText(file);
    return true;
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
    console.log('Header mapping complete, proceeding with converted CSV');

    const blob = new Blob([convertedCsv], { type: 'text/csv' });
    const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });

    try {
      if (handleUpload) {
        await handleUpload(convertedFile);
        onUploadSuccess({});
        setShowHeaderMapper(false);
        setSelectedFile(null); // Clear selected file after successful upload
        setCsvContent(''); // Clear CSV content
        // Reset file input for re-selection
        const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        onUploadFail('Upload handler not available');
        toast.error('Upload handler not available');
      }
    } catch (error) {
      console.error('Upload error after mapping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process converted file';
      onUploadFail(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleMappingCancel = () => {
    setShowHeaderMapper(false);
    setSelectedFile(null);
    setCsvContent('');
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast.info('CSV header mapping cancelled.');
  };

  const handleSubmit = async () => {
    // This button should ideally not be active if showHeaderMapper is true,
    // as the CsvHeaderMapper component takes over.
    // This path is mainly for direct uploads if mapping was somehow bypassed
    // or if this button is intended for a final "confirm" after mapping.
    // Given the flow, `handleMappingComplete` is the primary trigger for upload.
    // This button's `disabled` state handles the logic.
    if (!selectedFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const currentPickupAddress = availableAddresses.find(addr => addr.id.toString() === selectedAddressId);
    if (!currentPickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    // If we are here, it means showHeaderMapper is false, and a file is selected.
    // This implies either mapping was not needed (unlikely with this setup)
    // or the file was already processed and this is a re-submission.
    // The intended flow is for `handleMappingComplete` to call `handleUpload`.
    // This `handleSubmit` is more of a fallback or initial trigger before mapping.
    // With `showHeaderMapper` controlling the render, this button will only be visible
    // when mapping is NOT active.
    // The `disabled` prop on the button already prevents it from being clicked
    // if `showHeaderMapper` is true.
    toast.info("Please select a CSV file to proceed with mapping.");
  };

  if (showHeaderMapper && csvContent) {
    return (
      <div className="space-y-6">
        <CsvHeaderMapper
          csvContent={csvContent}
          onMappingComplete={handleMappingComplete}
          onCancel={handleMappingCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pickup Address Selection - Centered */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-600" />
          <Label className="text-lg font-medium">Select Pickup Address</Label>
        </div>

        {!addressesLoaded ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Loading pickup addresses...</span>
          </div>
        ) : availableAddresses.length > 0 ? (
          <div className="flex justify-center">
            <Select value={selectedAddressId} onValueChange={handleAddressChange} disabled={isUploading}>
              <SelectTrigger className="w-full max-w-md p-4 text-left bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Choose your pickup address" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {availableAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id.toString()} className="hover:bg-gray-50 cursor-pointer">
                    <div className="flex flex-col">
                      <span className="font-medium">{address.name}</span>
                      <span className="text-sm text-gray-600">
                        {address.street1}, {address.city}, {address.state} {address.zip}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              No pickup addresses found. Please add a pickup address in Settings before uploading.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* File Upload Area */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Upload CSV File</Label>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 scale-105'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading || showHeaderMapper}
          />

          <div className="space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              selectedFile ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {selectedFile ? (
                <FileText className="h-8 w-8 text-white" />
              ) : (
                <Upload className="h-8 w-8 text-white" />
              )}
            </div>

            {selectedFile ? (
              <div>
                <p className="text-lg font-semibold text-green-800">File Selected</p>
                <p className="text-green-600">{selectedFile.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                {showHeaderMapper && (
                    <p className="text-orange-600 text-sm mt-2">
                        Please complete header mapping below.
                    </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-gray-500 mt-2">
                  Supports CSV files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && progress > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Upload Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Upload Button - This button is primarily for initial file selection or if mapping is not active.
          The actual upload after mapping is handled by `handleMappingComplete`. */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedFile || !selectedAddressId || isUploading || showHeaderMapper}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Processing Upload...
          </>
        ) : (
          <>
            <Upload className="mr-3 h-6 w-6" />
            Upload & Process CSV
          </>
        )}
      </Button>
    </div>
  );
};


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
};

export default function Root() {
  return (
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  );
}