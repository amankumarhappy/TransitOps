import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, ArrowRight, RotateCcw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ImportPreview, ImportPreviewRow } from '../../types';
import { validateDriverRow, validateVehicleRow } from '../../utils/validators';
import { bulkUpsertDrivers } from '../../services/driverService';
import { bulkUpsertVehicles } from '../../services/vehicleService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

type Step = 'select' | 'upload' | 'preview' | 'done';
type EntityType = 'drivers' | 'vehicles';

const DRIVER_TEMPLATE = [
  { driver_id: 'DRV001', driver_name: 'Rajesh Kumar', age: 34, gender: 'Male', phone_number: '9876501001', license_number: 'DL-BR01-20180012345', license_expiry: '2029-05-14', city: 'Patna', experience_years: 8, status: 'Active', email: 'rajesh@example.com' }
];
const VEHICLE_TEMPLATE = [
  { registrationNumber: 'BR-01-AB-4521', manufacturer: 'Tata', model: 'LPT 1613', type: 'TRUCK', maxCapacityKg: 8000, odometerKm: 45000, acquisitionDate: '2021-06-15', status: 'AVAILABLE' }
];

const downloadTemplate = (entityType: EntityType) => {
  const data = entityType === 'drivers' ? DRIVER_TEMPLATE : VEHICLE_TEMPLATE;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${entityType}_template.xlsx`);
};

const exportToExcel = (data: Record<string, string>[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename);
};

export const ImportData: React.FC = () => {
  const { userProfile } = useAuth();
  const { success, error: showError, warning } = useToast();
  const [step, setStep] = useState<Step>('select');
  const [entityType, setEntityType] = useState<EntityType>('drivers');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });

        if (rows.length === 0) {
          showError('Empty file', 'The uploaded file has no data rows.');
          setLoading(false);
          return;
        }

        const existingLicenses = new Set<string>();
        const existingEmails = new Set<string>();
        const existingRegs = new Set<string>();

        const validRows: ImportPreviewRow[] = [];
        const invalidRows: ImportPreviewRow[] = [];
        const duplicateRows: ImportPreviewRow[] = [];

        rows.forEach((row, idx) => {
          const result = entityType === 'drivers'
            ? validateDriverRow(row, idx + 2, existingLicenses, existingEmails)
            : validateVehicleRow(row, idx + 2, existingRegs);

          if (result.isDuplicate) duplicateRows.push(result);
          else if (!result.isValid) invalidRows.push(result);
          else validRows.push(result);
        });

        setPreview({
          entityType,
          fileName: file.name,
          totalRows: rows.length,
          validRows,
          invalidRows,
          duplicateRows,
        });
        setStep('preview');
      } catch (err) {
        showError('Parse error', 'Could not read the file. Make sure it is a valid .csv or .xlsx file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleConfirmImport = async () => {
    if (!preview || !userProfile) return;
    setLoading(true);
    try {
      const rowsToImport = preview.validRows.map(r => r.data);
      let result;
      if (entityType === 'drivers') {
        result = await bulkUpsertDrivers(rowsToImport, userProfile.uid, userProfile.name);
      } else {
        result = await bulkUpsertVehicles(rowsToImport, userProfile.uid, userProfile.name);
      }
      setImportResult(result);
      setStep('done');
      success('Import complete!', `${result.success} records imported successfully.`);
    } catch (err: any) {
      showError('Import failed', err?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('select');
    setPreview(null);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Import Data</h1>
        <p className="text-gray-500 text-sm mt-1">Upload CSV or XLSX files to batch-import drivers and vehicles into Firestore.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {(['select', 'upload', 'preview', 'done'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === s ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i + 1}
              </div>
              <span className="hidden sm:inline capitalize">{s}</span>
            </div>
            {i < 3 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select entity type */}
      {step === 'select' && (
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800">Step 1: Select data type</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['drivers', 'vehicles'] as EntityType[]).map(type => (
              <button
                key={type}
                onClick={() => { setEntityType(type); setStep('upload'); }}
                className={`p-6 rounded-2xl border-2 text-left transition-all hover:shadow-md ${entityType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
              >
                <div className="text-3xl mb-3">{type === 'drivers' ? '👤' : '🚛'}</div>
                <p className="font-bold text-gray-800 capitalize">{type}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {type === 'drivers'
                    ? 'Import driver profiles with license details'
                    : 'Import vehicle fleet with capacity specs'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Step 2: Upload {entityType} file</h2>
            <button onClick={() => setStep('select')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
          </div>

          {/* Download template */}
          <button
            onClick={() => downloadTemplate(entityType)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Download className="w-4 h-4" />
            Download sample template (.xlsx)
          </button>

          {/* Drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-gray-600">Parsing file...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-700">Drop your file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, .xls · Max 5 MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Accepted columns info */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
            <p className="font-semibold mb-1">
              {entityType === 'drivers' ? 'Driver' : 'Vehicle'} file columns:
            </p>
            {entityType === 'drivers' ? (
              <p>driver_id, driver_name*, age, gender, phone_number, license_number*, license_expiry*, city, experience_years, status, email</p>
            ) : (
              <p>registrationNumber*, manufacturer, model*, type*, maxCapacityKg*, odometerKm, acquisitionDate, acquisitionCost, status</p>
            )}
            <p className="text-gray-400 mt-1">* Required columns</p>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Step 3: Review and confirm</h2>
            <button onClick={() => setStep('upload')} className="text-sm text-gray-500 hover:text-gray-700">← Re-upload</button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-800">{preview.totalRows}</p>
              <p className="text-xs text-gray-500">Total rows</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-green-700">{preview.validRows.length}</p>
              <p className="text-xs text-green-600">Valid</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-700">{preview.duplicateRows.length}</p>
              <p className="text-xs text-amber-600">Duplicates</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-red-700">{preview.invalidRows.length}</p>
              <p className="text-xs text-red-600">Invalid</p>
            </div>
          </div>

          {/* Valid rows table */}
          {preview.validRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Valid rows ({preview.validRows.length}) — will be imported</span>
              </div>
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">#</th>
                      {Object.keys(preview.validRows[0]?.data || {}).slice(0, 6).map(k => (
                        <th key={k} className="px-3 py-2 text-left text-gray-600 font-semibold">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.validRows.map(row => (
                      <tr key={row.rowIndex} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                        {Object.values(row.data).slice(0, 6).map((v, i) => (
                          <td key={i} className="px-3 py-2 text-gray-700">{v || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invalid rows */}
          {preview.invalidRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">Invalid rows ({preview.invalidRows.length}) — will be skipped</span>
              </div>
              <div className="divide-y divide-red-50 max-h-40 overflow-y-auto">
                {preview.invalidRows.map(row => (
                  <div key={row.rowIndex} className="px-4 py-2">
                    <p className="text-xs font-medium text-gray-700">Row {row.rowIndex}: {row.data.driver_name || row.data.registrationNumber || '—'}</p>
                    <p className="text-xs text-red-600">{row.errors.join('; ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate rows */}
          {preview.duplicateRows.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {preview.duplicateRows.length} duplicate row(s) detected. These will be skipped during import.
              </p>
            </div>
          )}

          {/* Confirm button */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirmImport}
              disabled={loading || preview.validRows.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/30"
            >
              {loading ? <LoadingSpinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Importing...' : `Confirm Import (${preview.validRows.length} rows)`}
            </button>
            <button onClick={reset} className="px-4 py-3 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && importResult && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Import Complete!</h2>
          <div className="flex justify-center gap-6 mt-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-black text-green-600">{importResult.success}</p>
              <p className="text-xs text-gray-500">Imported</p>
            </div>
            {importResult.failed > 0 && (
              <div className="text-center">
                <p className="text-3xl font-black text-red-600">{importResult.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">
            All imported records are now live in Firestore and visible on dashboards.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
