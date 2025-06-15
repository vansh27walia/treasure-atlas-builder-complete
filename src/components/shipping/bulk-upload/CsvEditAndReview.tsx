
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

// PROPS: rows (array), headers (array), requiredHeaders (array), onDone (fn)
interface CsvEditAndReviewProps {
  rows: any[];
  headers: string[];
  requiredHeaders: string[];
  onDone: (fixedRows: any[]) => void;
}
const CsvEditAndReview: React.FC<CsvEditAndReviewProps> = ({ rows, headers, requiredHeaders, onDone }) => {
  const [editedRows, setEditedRows] = useState<any[]>(rows);

  const handleChange = (rowIdx: number, header: string, value: string) => {
    const newRows = editedRows.map((row, idx) =>
      idx === rowIdx ? { ...row, [header]: value } : row
    );
    setEditedRows(newRows);
  };

  const hasMissing = editedRows.some(row =>
    requiredHeaders.some(header => !row[header] || row[header].toString().trim() === "")
  );

  const handleSave = () => {
    if (hasMissing) {
      toast.error("Please fill all required fields before proceeding.");
      return;
    }
    onDone(editedRows);
  };

  return (
    <div className="my-4 border rounded-lg p-4 bg-yellow-50">
      <h4 className="font-medium mb-2">Fill in missing/required data</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {headers.map(header => (
                <th 
                  key={header} 
                  className={`px-2 py-1 border-b font-semibold ${requiredHeaders.includes(header) ? 'text-blue-700' : 'text-gray-600'}`}
                >
                  {header}{requiredHeaders.includes(header) && <span className="text-red-500 ml-1">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editedRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {headers.map(header => (
                  <td key={header} className="px-2 py-1 border-b">
                    <input
                      type="text"
                      className={`border px-1 rounded w-28 ${requiredHeaders.includes(header) && (!row[header] || row[header].toString().trim() === "") ? "border-red-500" : "border-gray-300"}`}
                      value={row[header] || ""}
                      onChange={e => handleChange(rowIdx, header, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-2">
        <Button onClick={handleSave} disabled={hasMissing} className="px-6 bg-blue-600 hover:bg-blue-700 text-white">
          Save & Continue
        </Button>
      </div>
      {hasMissing && (
        <p className="text-red-500 text-xs mt-2">Fill in all required fields (highlighted in red) to continue.</p>
      )}
    </div>
  );
};

export default CsvEditAndReview;

