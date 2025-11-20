import React from "react";
// Re-importing UI components from the original file path (assuming they are correctly installed in your project)
// If you run this code without a Next.js/Shadcn-UI environment, you must mock these too.
// For this change, we'll assume the basic UI components (Card, Tabs, Button, Progress, Alert) are accessible.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
// Icons from lucide-react
import { FileText, Upload, CheckCircle, Download, Info, Sparkles, Brain } from "lucide-react";

// --- START: MOCK COMPONENTS TO REPLACE EXTERNAL FILES ---

// 1. Mock BulkUpload component (Replaces "@/components/shipping/BulkUpload")
// This component now uses the setUploadProgress prop from the parent
const MockBulkUpload = ({ setUploadProgress }) => {
  const handleSimulateUpload = () => {
    // Start progress
    setUploadProgress(10);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Ensure progress is exactly 100 when done
        setUploadProgress(100);
      }
    }, 500);
  };

  return (
    <Card className="shadow-2xl border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-700">
          <Upload className="h-5 w-5 mr-2" /> Upload Your CSV
        </CardTitle>
        <CardDescription>Drag and drop your shipping file here, or click to browse.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="border-4 border-dashed border-blue-300 rounded-lg p-12 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
          <Upload className="h-10 w-10 mx-auto text-blue-500 mb-2" />
          <p className="text-gray-600 font-medium">Click here to upload or drag & drop CSV file.</p>
          <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
        </div>
        <Button onClick={handleSimulateUpload} className="w-full bg-blue-600 hover:bg-blue-700">
          Simulate File Upload & Processing
        </Button>
      </CardContent>
    </Card>
  );
};

// 2. Mock ShipAIChatbot component (Replaces "@/components/shipping/ShipAIChatbot")
const MockShipAIChatbot = () => (
  <div className="fixed bottom-4 right-4 z-50">
    <Button
      className="rounded-full h-14 w-14 bg-purple-600 hover:bg-purple-700 shadow-xl"
      onClick={() => alert("ShipAI Chatbot opened!")} // Added onClick alert for interaction
    >
      <Brain className="h-6 w-6" />
    </Button>
  </div>
);

// 3. Mock BulkUploadProgressBar component (Replaces "@/components/shipping/bulk-upload/BulkUploadProgressBar")
const MockBulkUploadProgressBar = ({ currentStep, completedSteps }) => {
  const steps = [
    { key: "upload", title: "Upload" },
    { key: "mapping", title: "Mapping" },
    { key: "rates", title: "Rates" },
    { key: "labels", title: "Labels" },
  ];

  return (
    <div className="flex justify-between items-center p-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300 
                ${
                  completedSteps.includes(step.key)
                    ? "bg-green-500"
                    : currentStep === step.key
                      ? "bg-blue-500"
                      : "bg-gray-300"
                }`}
            >
              {completedSteps.includes(step.key) ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center ${currentStep === step.key ? "text-blue-600 font-semibold" : "text-gray-500"}`}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 mx-2 h-1 transition-colors duration-300 ${completedSteps.includes(steps[index + 1].key) ? "bg-green-500" : completedSteps.includes(step.key) ? "bg-green-300" : "bg-gray-300"}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// --- END: MOCK COMPONENTS ---

// Removed the original external imports
// import BulkUpload from "@/components/shipping/BulkUpload";
// import ShipAIChatbot from "@/components/shipping/ShipAIChatbot";
// import BulkUploadProgressBar from "@/components/shipping/bulk-upload/BulkUploadProgressBar";

const BulkUploadPage = () => {
  const [activeTab, setActiveTab] = React.useState("upload");
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // LOGIC FOR STEP PROGRESS BAR based on current uploadProgress
  const getCurrentStep = (): "upload" | "mapping" | "rates" | "labels" => {
    if (uploadProgress === 0) return "upload";
    if (uploadProgress > 0 && uploadProgress < 100) return "mapping";
    if (uploadProgress === 100) return "rates";
    return "labels"; // Placeholder for the final step
  };

  const getCompletedSteps = (): Array<"upload" | "mapping" | "rates" | "labels"> => {
    const completed = [];
    if (uploadProgress > 0) completed.push("upload");
    if (uploadProgress === 100) completed.push("mapping");
    // Add 'rates' and 'labels' completion logic here based on actual app state
    // For now, only mock completion of upload and mapping.
    return completed;
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      "to_name,to_street1,to_street2,to_city,to_state,to_zip,to_country,weight,length,width,height,reference",
      "John Doe,123 Main St,,San Francisco,CA,94105,US,1.5,12,8,4,Order #1234",
      "Jane Smith,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,2.0,10,6,3,Order #1235",
      "Bob Johnson,789 Pine St,,New York,NY,10001,US,3.0,15,10,6,Order #1236",
    ].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "bulk_shipping_template.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url); // Good practice to clean up
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-[6px] px-[5px]">
        {/* 🚀 STEP PROGRESS BAR: MOVED TO THE VERY TOP (ABOVE THE HEADING) */}
        <div className="bg-white shadow-sm border-b rounded-3xl">
          {/* Using Mocked Progress Bar */}
          <MockBulkUploadProgressBar currentStep={getCurrentStep()} completedSteps={getCompletedSteps()} />
        </div>
        {/* END OF STEP PROGRESS BAR */}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 text-center">
            Bulk Shipping
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your CSV file and let our AI handle the rest. Smart mapping, live rates, and instant label
            generation.
          </p>
        </div>

        {/* 1. PERCENTAGE PROGRESS BAR: This remains where it was, below the heading and above the tabs. */}
        {uploadProgress > 0 && uploadProgress <= 100 && (
          <div className="max-w-6xl mx-auto px-0 mb-6">
            <h3 className="text-md font-semibold text-blue-600 mb-2">
              {uploadProgress < 100 ? "Upload and Processing Progress" : "Processing Complete"}
            </h3>
            <Progress key={uploadProgress} value={uploadProgress} className="w-full h-3" />
            <p className="text-sm text-gray-500 mt-1">
              {uploadProgress < 100 ? `${uploadProgress}% Complete` : "100% Complete. Calculating Rates..."}
            </p>
          </div>
        )}
        {/* END OF PERCENTAGE PROGRESS BAR */}

        {/* 2. TABS: This block is below all progress bars. */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto px-0">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white shadow-lg rounded-lg p-1">
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Smart Upload
            </TabsTrigger>
            <TabsTrigger
              value="template"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Template & Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-0">
            {/* Using Mocked BulkUpload component and passing state setter */}
            <MockBulkUpload setUploadProgress={setUploadProgress} />
          </TabsContent>

          <TabsContent value="template" className="space-y-8">
            {/* ... Template Content ... */}
            <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <AlertDescription className="text-green-800">
                    <strong className="font-semibold">Shipping Integration:</strong> This template follows recommended
                    CSV format for bulk shipping. Pickup addresses are selected from your saved addresses - only
                    recipient details go in the CSV.
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Template Download */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-xl">
                  <FileText className="h-6 w-6 mr-3" />
                  Bulk Shipping CSV Template
                </CardTitle>
                <CardDescription className="text-green-100">
                  Standard format for bulk shipping uploads with AI-powered processing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                      Template Features:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Recipient address (to_address) fields</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Package dimensions (L×W×H)</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Weight in pounds</span>
                        </li>
                      </ul>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Reference field for tracking</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>API compatibility</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span>AI-powered header mapping</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadTemplate}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Shipping Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Guide */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-center font-normal">
                  <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                  Smart Shipping Workflow
                </CardTitle>
                <CardDescription>Follow our AI-enhanced workflow for optimal bulk shipping results</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  {[
                    {
                      step: 1,
                      title: "Setup Pickup Address",
                      description:
                        "Save your pickup/from address in Settings. This will be used for all shipments in the batch.",
                      color: "bg-blue-100 text-blue-600",
                    },
                    {
                      step: 2,
                      title: "Upload CSV with AI",
                      description:
                        "Upload your CSV file and let our AI automatically map headers to the correct format. No manual mapping required!",
                      color: "bg-purple-100 text-purple-600",
                    },
                    {
                      step: 3,
                      title: "Smart Rate Fetching",
                      description:
                        "System creates shipments and fetches live rates from multiple carriers (UPS, USPS, FedEx, DHL) instantly.",
                      color: "bg-green-100 text-green-600",
                    },
                    {
                      step: 4,
                      title: "Select & Customize",
                      description:
                        "Review and select preferred carriers/services for each shipment. Apply bulk changes or customize individually.",
                      color: "bg-orange-100 text-orange-600",
                    },
                    {
                      step: 5,
                      title: "Generate & Download",
                      description:
                        "Confirm selections and generate all labels at once. Download individually, as batches, or in multiple formats.",
                      color: "bg-emerald-100 text-emerald-600",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-6">
                      <div
                        className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}
                      >
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h4>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CSV Field Requirements */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">CSV Field Requirements</CardTitle>
                <CardDescription>Required and optional fields following standard shipping format</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-4 text-lg flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Required Fields
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          field: "to_name",
                          desc: "Recipient name",
                        },
                        {
                          field: "to_street1",
                          desc: "Street address",
                        },
                        {
                          field: "to_city",
                          desc: "City name",
                        },
                        {
                          field: "to_state",
                          desc: "State/Province",
                        },
                        {
                          field: "to_zip",
                          desc: "ZIP/Postal code",
                        },
                        {
                          field: "to_country",
                          desc: "Country (US)",
                        },
                        {
                          field: "weight",
                          desc: "Weight (pounds)",
                        },
                        {
                          field: "length",
                          desc: "Length (inches)",
                        },
                        {
                          field: "width",
                          desc: "Width (inches)",
                        },
                        {
                          field: "height",
                          desc: "Height (inches)",
                        },
                      ].map((item) => (
                        <div
                          key={item.field}
                          className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <span className="font-mono text-sm font-medium text-green-800">{item.field}</span>
                          <span className="text-sm text-green-600">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-600 mb-4 text-lg flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Optional Fields
                    </h4>
                    <div className="space-y-3 mb-6">
                      {[
                        {
                          field: "to_street2",
                          desc: "Apt/Suite number",
                        },
                        {
                          field: "reference",
                          desc: "Order/Reference #",
                        },
                      ].map((item) => (
                        <div
                          key={item.field}
                          className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <span className="font-mono text-sm font-medium text-blue-800">{item.field}</span>
                          <span className="text-sm text-blue-600">{item.desc}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                      <h5 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <Brain className="w-5 h-5 mr-2" />
                        AI Magic:
                      </h5>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        Don't worry about exact field names! Our AI can automatically detect and map columns like
                        "Customer Name" → "to_name" or "ZIP Code" → "to_zip". Just upload your CSV and let our
                        intelligence handle the mapping.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Unified AI Chatbot */}
      {/* Using Mocked ShipAIChatbot component */}
      <MockShipAIChatbot />
    </div>
  );
};
export default BulkUploadPage;
