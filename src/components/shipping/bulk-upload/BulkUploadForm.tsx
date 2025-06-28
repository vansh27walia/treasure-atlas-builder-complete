import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';

// --- Mock UI Components (Simplified versions for demonstration) ---

const Button = ({ children, onClick, className = '', type = 'button', disabled = false, variant = 'default', size = 'md' }) => {
  let baseStyle = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  let variantStyle = '';
  let sizeStyle = '';

  switch (variant) {
    case 'outline':
      variantStyle = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
      break;
    case 'default':
    default:
      variantStyle = 'bg-blue-600 text-white hover:bg-blue-700';
      break;
  }

  switch (size) {
    case 'sm':
      sizeStyle = 'h-8 px-3';
      break;
    case 'lg':
      sizeStyle = 'h-12 px-6';
      break;
    case 'md':
    default:
      sizeStyle = 'h-10 px-4 py-2';
      break;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Input = ({ id, name, value, onChange, className = '', type = 'text', required = false }) => (
  <input
    id={id}
    name={name}
    type={type}
    value={value}
    onChange={onChange}
    required={required}
    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${className}`}
  />
);

const Label = ({ htmlFor, children, className = '' }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);

const Select = ({ value, onValueChange, children, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerClick = () => setIsOpen(!isOpen);

  const selectedItem = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.props.value === value
  );

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <div
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-default"
        onClick={handleTriggerClick}
      >
        {selectedItem ? selectedItem.props.children : <span className="text-gray-500">{placeholder}</span>}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-50"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-[--radix-select-content-max-height] overflow-y-auto">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectItem) {
              return React.cloneElement(child, {
                onClick: () => {
                  onValueChange(child.props.value);
                  setIsOpen(false);
                },
                isActive: child.props.value === value,
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

const SelectTrigger = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between px-4 py-2 ${className}`}>
    {children}
  </div>
);

const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;

const SelectContent = ({ children, className = '' }) => (
  <div className={`p-1 ${className}`}>
    {children}
  </div>
);

const SelectItem = ({ children, value, onClick, className = '', isActive = false }) => (
  <div
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${isActive ? 'bg-gray-100' : ''} hover:bg-gray-100 ${className}`}
    onClick={onClick}
    role="option"
    aria-selected={isActive}
  >
    {children}
  </div>
);


const Alert = ({ children, className = '' }) => (
  <div className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 ${className}`}>
    {children}
  </div>
);

const AlertDescription = ({ children, className = '' }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
    {children}
  </div>
);

// Lucide-react icons (simple placeholders)
const CloudUpload = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v6"/><path d="m15 15-3 3-3-3"/></svg>;
const FileUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>;
const Loader2 = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const Upload = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
const FileText = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
const MapPin = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z"/><circle cx="12" cy="10" r="3"/></svg>;
const AlertCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;


// Toast context and hook (simple implementation)
const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'default') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3 rounded-md shadow-lg text-white ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return { toast: { success: (msg) => context.addToast(msg, 'success'), error: (msg) => context.addToast(msg, 'error') } };
};

// --- Mock Address Service and Components ---

export interface SavedAddress {
  id: string;
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string;
  is_default_from: boolean;
  is_default_to: boolean;
}

// Firebase setup and AddressService mock
let app;
let db;
let auth;
let userId;
let firebaseInitialized = false;

const initializeFirebase = async () => {
  if (firebaseInitialized) return;

  try {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    if (typeof __initial_auth_token !== 'undefined') {
      await signInWithCustomToken(auth, __initial_auth_token);
    } else {
      await signInAnonymously(auth);
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        userId = user.uid;
        console.log("Firebase Auth State Changed: User ID", userId);
      } else {
        // Fallback for demonstration if user is somehow null
        userId = crypto.randomUUID();
        console.log("Firebase Auth State Changed: Anonymous User ID", userId);
      }
    });

    firebaseInitialized = true;
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
};

const addressService = {
  getSavedAddresses: async (): Promise<SavedAddress[]> => {
    await initializeFirebase();
    if (!userId) {
      console.warn("User ID not available for Firestore. Waiting for auth state.");
      return [];
    }
    const addressesCol = collection(db, `artifacts/${__app_id}/users/${userId}/addresses`);
    const addressSnapshot = await getDocs(addressesCol);
    const addresses: SavedAddress[] = [];
    addressSnapshot.forEach(doc => {
      addresses.push({ id: doc.id, ...doc.data() } as SavedAddress);
    });
    return addresses;
  },

  createAddress: async (addressData: Omit<SavedAddress, 'id'>, isNew: boolean): Promise<SavedAddress | null> => {
    await initializeFirebase();
    if (!userId) {
      console.warn("User ID not available for Firestore. Cannot create address.");
      return null;
    }

    if (isNew) {
      const newDocRef = doc(collection(db, `artifacts/${__app_id}/users/${userId}/addresses`));
      const newAddress: SavedAddress = {
        id: newDocRef.id,
        ...addressData,
        is_default_from: addressData.is_default_from || false,
        is_default_to: addressData.is_default_to || false,
      };
      await setDoc(newDocRef, newAddress);
      return newAddress;
    } else {
      if (!addressData.id) {
        console.error("Address ID missing for update operation.");
        return null;
      }
      const addressDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/addresses`, addressData.id);
      await updateDoc(addressDocRef, addressData);
      return { id: addressData.id, ...addressData } as SavedAddress;
    }
  },

  setDefaultFromAddress: async (addressId: string): Promise<void> => {
    await initializeFirebase();
    if (!userId) {
      console.warn("User ID not available for Firestore. Cannot set default address.");
      return;
    }

    const addressesCol = collection(db, `artifacts/${__app_id}/users/${userId}/addresses`);
    const currentDefaultsQuery = query(addressesCol, where('is_default_from', '==', true));
    const currentDefaultsSnapshot = await getDocs(currentDefaultsQuery);

    const batchUpdates = currentDefaultsSnapshot.docs.map(d =>
      updateDoc(doc(db, `artifacts/${__app_id}/users/${userId}/addresses`, d.id), { is_default_from: false })
    );
    await Promise.all(batchUpdates);

    const newDefaultRef = doc(db, `artifacts/${__app_id}/users/${userId}/addresses`, addressId);
    await updateDoc(newDefaultRef, { is_default_from: true });
  },

  getDefaultFromAddress: async (): Promise<SavedAddress | null> => {
    await initializeFirebase();
    if (!userId) {
      console.warn("User ID not available for Firestore. Waiting for auth state.");
      return null;
    }
    const addressesCol = collection(db, `artifacts/${__app_id}/users/${userId}/addresses`);
    const q = query(addressesCol, where('is_default_from', '==', true));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as SavedAddress;
    }
    return null;
  }
};


// CsvHeaderMapper (from Code A, with minor adjustments)
const CsvHeaderMapper = ({ csvContent, onMappingComplete, onCancel }) => {
  const { toast } = useToast();
  const [headers, setHeaders] = useState([]);
  const [mappedHeaders, setMappedHeaders] = useState({});
  const requiredFields = ['street1', 'city', 'state', 'zip']; // Example required fields

  useEffect(() => {
    if (csvContent) {
      const lines = csvContent.split('\n');
      if (lines.length > 0) {
        const firstLine = lines[0];
        const parsedHeaders = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
        setHeaders(parsedHeaders);

        const initialMapping = {};
        parsedHeaders.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('street') && lowerHeader.includes('1')) initialMapping['street1'] = header;
          else if (lowerHeader.includes('street') && lowerHeader.includes('2')) initialMapping['street2'] = header;
          else if (lowerHeader.includes('city')) initialMapping['city'] = header;
          else if (lowerHeader.includes('state')) initialMapping['state'] = header;
          else if (lowerHeader.includes('zip') || lowerHeader.includes('postal')) initialMapping['zip'] = header;
          else if (lowerHeader.includes('name')) initialMapping['name'] = header;
          else if (lowerHeader.includes('company')) initialMapping['company'] = header;
          else if (lowerHeader.includes('country')) initialMapping['country'] = header;
          else if (lowerHeader.includes('phone')) initialMapping['phone'] = header;
        });
        setMappedHeaders(initialMapping);
      }
    }
  }, [csvContent]);

  const handleFieldChange = (field, csvHeader) => {
    setMappedHeaders(prev => ({ ...prev, [field]: csvHeader }));
  };

  const handleConfirm = () => {
    const missingRequired = requiredFields.filter(field => !mappedHeaders[field]);
    if (missingRequired.length > 0) {
      toast.error(`Please map all required fields: ${missingRequired.join(', ')}`);
      return;
    }

    // In a real app, you'd parse the CSV content using the mappedHeaders
    // and then pass the transformed data/CSV to onMappingComplete.
    // For this mock, we just pass the original content to simulate success.
    console.log('Mapping confirmed:', mappedHeaders);
    toast.success('Header mapping complete!');
    onMappingComplete(csvContent, mappedHeaders); // Pass mappedHeaders for potential backend use
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Map CSV Headers</h3>
      <p className="text-gray-600 mb-6">Match your CSV columns to the required address fields.</p>

      <div className="space-y-4">
        {['name', 'company', 'street1', 'street2', 'city', 'state', 'zip', 'country', 'phone'].map(field => (
          <div key={field} className="flex items-center justify-between">
            <Label className="w-1/3">
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}{' '}
              {requiredFields.includes(field) && <span className="text-red-500">*</span>}
            </Label>
            <select
              value={mappedHeaders[field] || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="w-2/3 p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">-- Select Column --</option>
              {headers.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2 mt-8">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleConfirm}>Confirm Mapping</Button>
      </div>
    </Card>
  );
};


// --- Blended BulkUploadForm Component ---

export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading: boolean;
  progress: number;
  handleUpload: (file: File, mappedHeaders?: Record<string, string>) => Promise<void>; // Added mappedHeaders
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading,
  progress,
  handleUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [csvContent, setCsvContent] = useState<string>(''); // For header mapper
  const [showHeaderMapper, setShowHeaderMapper] = useState(false); // To show header mapper
  const [finalMappedHeaders, setFinalMappedHeaders] = useState<Record<string, string>>({}); // Store final mapped headers

  const { toast } = useToast();

  // Load addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await addressService.getSavedAddresses();
        setAvailableAddresses(addresses);

        const defaultAddress = await addressService.getDefaultFromAddress();
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id.toString());
          onPickupAddressSelect(defaultAddress);
        } else if (addresses.length > 0) {
          // If no explicit default, use the first address as a fallback
          setSelectedAddressId(addresses[0].id.toString());
          onPickupAddressSelect(addresses[0]);
        } else {
            setSelectedAddressId(''); // Ensure no address is selected if none exist
            onPickupAddressSelect(null);
        }

        setAddressesLoaded(true);
      } catch (error) {
        console.error('Error loading addresses:', error);
        toast.error('Failed to load pickup addresses');
        setAddressesLoaded(true);
      }
    };

    loadAddresses();
  }, [onPickupAddressSelect, toast]);

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = availableAddresses.find(addr => addr.id.toString() === addressId);
    onPickupAddressSelect(selectedAddress || null);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      setSelectedFile(null); // Clear previous selection
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      setSelectedFile(null); // Clear previous selection
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setShowHeaderMapper(true); // Show header mapper after file is loaded
    };
    reader.readAsText(file);
  };

  const handleMappingComplete = async (convertedCsv: string, mappedHeaders: Record<string, string>) => {
    console.log('Header mapping complete, ready for upload.');
    setFinalMappedHeaders(mappedHeaders); // Store the mapped headers
    setShowHeaderMapper(false); // Hide the mapper

    // Now, the upload button will be enabled, and handleSubmit will use selectedFile and finalMappedHeaders
  };

  const handleMappingCancel = () => {
    setShowHeaderMapper(false);
    setSelectedFile(null);
    setCsvContent('');
    setFinalMappedHeaders({});
    // Reset file input to allow re-selection
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!selectedAddressId) {
      toast.error('Please select a pickup address');
      return;
    }

    // Ensure header mapping has been completed and stored
    if (Object.keys(finalMappedHeaders).length === 0) {
      toast.error('Please complete the CSV header mapping first.');
      setShowHeaderMapper(true); // Re-show the mapper if somehow skipped
      return;
    }

    try {
      // Pass the mapped headers to the handleUpload function
      await handleUpload(selectedFile, finalMappedHeaders);
      onUploadSuccess({ message: 'Upload successful' });
      // Reset form after successful upload
      setSelectedFile(null);
      setCsvContent('');
      setFinalMappedHeaders({});
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadFail(errorMessage);
      toast.error(errorMessage);
    }
  };

  // If header mapper is active, render it instead of the main form
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

  // Main form rendering
  return (
    <div className="space-y-8">
      {/* Pickup Address Selection */}
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
            <Select value={selectedAddressId} onValueChange={handleAddressChange} placeholder="Choose your pickup address" className="w-full max-w-md">
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
              No pickup addresses found. Please add a pickup address in Settings before uploading. (This demo does not include an "Add New Address" button here. Please refer to "Code A" in a real scenario for that functionality, or add addresses manually to Firestore if testing.)
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
              : selectedFile && Object.keys(finalMappedHeaders).length > 0
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
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
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
            selectedFile ? (Object.keys(finalMappedHeaders).length > 0 ? 'bg-green-500' : 'bg-blue-500') : 'bg-blue-500'
          }`}>
            {selectedFile ? (
              <FileText className="h-8 w-8 text-white" />
            ) : (
              <Upload className="h-8 w-8 text-white" />
            )}
          </div>

          {selectedFile ? (
            <div>
              <p className="text-lg font-semibold text-gray-800">File Selected</p>
              <p className={`text-gray-600 ${Object.keys(finalMappedHeaders).length > 0 ? 'text-green-600' : ''}`}>
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
               {Object.keys(finalMappedHeaders).length === 0 && (
                <p className="text-sm text-orange-600 mt-2">
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

      {/* Upload Button */}
      <Button
        onClick={handleSubmit}
        // Button enabled only if file selected, address selected, NOT uploading, AND header mapping completed
        disabled={!selectedFile || !selectedAddressId || isUploading || Object.keys(finalMappedHeaders).length === 0}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
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
export default function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPickupAddress, setCurrentPickupAddress] = useState<SavedAddress | null>(null);

  useEffect(() => {
    initializeFirebase();
  }, []);

  const handleUpload = async (file: File, mappedHeaders?: Record<string, string>) => {
    setIsUploading(true);
    setProgress(0);
    console.log(`Simulating upload of file: ${file.name}`);
    console.log('Using mapped headers:', mappedHeaders);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    }

    setIsUploading(false);
    console.log('Upload simulated successfully!');
    // In a real application, you'd send the file and mappedHeaders to a backend here.
  };

  const onUploadSuccess = (results: any) => {
    console.log('Upload successful!', results);
    toast.success('CSV uploaded and processed successfully!');
  };

  const onUploadFail = (error: string) => {
    console.error('Upload failed:', error);
    toast.error(`Upload failed: ${error}`);
  };

  const onPickupAddressSelect = (address: SavedAddress | null) => {
    console.log('App: Pickup address selected:', address);
    setCurrentPickupAddress(address);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 md:p-8 font-inter">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
            }
          `}
        </style>
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Bulk Shipment Upload</h1>
          <BulkUploadForm
            onUploadSuccess={onUploadSuccess}
            onUploadFail={onUploadFail}
            onPickupAddressSelect={onPickupAddressSelect}
            isUploading={isUploading}
            progress={progress}
            handleUpload={handleUpload}
          />
        </div>
        {userId && (
          <div className="absolute bottom-4 left-4 p-2 bg-gray-800 text-white text-xs rounded-md">
            User ID: {userId}
          </div>
        )}
      </div>
    </ToastProvider>
  );
}