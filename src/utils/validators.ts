import { ImportPreviewRow } from '../types';

// ---- Email validation ----
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// ---- Date validation ----
export const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

// ---- Column normalization ----
const normalize = (str: string): string =>
  str.toLowerCase().replace(/[\s_\-]/g, '');

const findColumn = (row: Record<string, string>, ...aliases: string[]): string => {
  const normalizedAliases = aliases.map(normalize);
  const key = Object.keys(row).find(k => normalizedAliases.includes(normalize(k)));
  return key ? (row[key] || '').toString().trim() : '';
};

// ---- Driver row validation ----
export const validateDriverRow = (
  row: Record<string, string>,
  rowIndex: number,
  existingLicenses: Set<string>,
  existingEmails: Set<string>
): ImportPreviewRow => {
  const errors: string[] = [];

  const name = findColumn(row, 'driver_name', 'name', 'driverName', 'fullname');
  const email = findColumn(row, 'email');
  const phone = findColumn(row, 'phone_number', 'phone', 'phoneNumber', 'mobile');
  const licenseNumber = findColumn(row, 'license_number', 'licenseNumber', 'licence_number', 'licenceNumber');
  const licenseExpiry = findColumn(row, 'license_expiry', 'licenseExpiry', 'licence_expiry', 'expiry');
  const driverId = findColumn(row, 'driver_id', 'driverId', 'employeeId', 'employee_id');
  const age = findColumn(row, 'age');
  const gender = findColumn(row, 'gender');
  const city = findColumn(row, 'city');
  const experience = findColumn(row, 'experience_years', 'experienceYears', 'experience');
  const statusRaw = findColumn(row, 'status');

  if (!name) errors.push('Name is required');
  if (!licenseNumber) errors.push('License number is required');
  if (!licenseExpiry) errors.push('License expiry is required');
  else if (!isValidDate(licenseExpiry)) errors.push('Invalid license expiry date');

  // Email is optional for import (drivers sign up themselves)
  if (email && !isValidEmail(email)) errors.push('Invalid email format');

  let isDuplicate = false;
  if (licenseNumber && existingLicenses.has(licenseNumber.toUpperCase())) {
    isDuplicate = true;
  }
  if (email && existingEmails.has(email.toLowerCase())) {
    isDuplicate = true;
  }

  // Map status
  const statusMap: Record<string, string> = {
    active: 'AVAILABLE',
    available: 'AVAILABLE',
    inactive: 'OFF_DUTY',
    'off duty': 'OFF_DUTY',
    'on leave': 'OFF_DUTY',
    suspended: 'SUSPENDED',
    'on trip': 'ON_TRIP',
  };
  const mappedStatus = statusMap[statusRaw.toLowerCase()] || 'AVAILABLE';

  const normalizedRow: Record<string, string> = {
    driver_id: driverId,
    driver_name: name,
    age,
    gender,
    phone_number: phone,
    license_number: licenseNumber,
    license_expiry: licenseExpiry,
    city,
    experience_years: experience,
    status: mappedStatus,
    email,
  };

  if (licenseNumber) existingLicenses.add(licenseNumber.toUpperCase());
  if (email) existingEmails.add(email.toLowerCase());

  return {
    rowIndex,
    data: normalizedRow,
    errors,
    isValid: errors.length === 0,
    isDuplicate,
  };
};

// ---- Vehicle row validation ----
export const validateVehicleRow = (
  row: Record<string, string>,
  rowIndex: number,
  existingRegs: Set<string>
): ImportPreviewRow => {
  const errors: string[] = [];

  const reg = findColumn(row, 'registrationNumber', 'registration_number', 'reg', 'registration', 'vehicleReg', 'vehicle_reg');
  const model = findColumn(row, 'model');
  const manufacturer = findColumn(row, 'manufacturer', 'make', 'brand');
  const type = findColumn(row, 'type', 'vehicleType', 'vehicle_type');
  const capacity = findColumn(row, 'maxCapacityKg', 'max_capacity_kg', 'capacity', 'maxCapacity', 'capacityKg');
  const odometer = findColumn(row, 'odometerKm', 'odometer_km', 'odometer', 'mileage');
  const acquisitionDate = findColumn(row, 'acquisitionDate', 'acquisition_date', 'purchaseDate', 'purchase_date');
  const acquisitionCost = findColumn(row, 'acquisitionCost', 'acquisition_cost', 'cost', 'price');
  const statusRaw = findColumn(row, 'status');

  if (!reg) errors.push('Registration number is required');
  if (!model) errors.push('Model is required');
  if (!type) errors.push('Vehicle type is required');
  if (!capacity) errors.push('Max capacity is required');
  else if (isNaN(Number(capacity))) errors.push('Capacity must be a number');

  let isDuplicate = false;
  if (reg && existingRegs.has(reg.toUpperCase())) {
    isDuplicate = true;
  }

  const validTypes = ['BUS', 'TRUCK', 'VAN', 'MINIBUS', 'CAR', 'OTHER'];
  const mappedType = validTypes.includes(type.toUpperCase()) ? type.toUpperCase() : 'OTHER';

  const statusMap: Record<string, string> = {
    available: 'AVAILABLE',
    active: 'AVAILABLE',
    'on trip': 'ON_TRIP',
    'in shop': 'IN_SHOP',
    'in maintenance': 'IN_SHOP',
    retired: 'RETIRED',
    inactive: 'RETIRED',
  };
  const mappedStatus = statusMap[statusRaw.toLowerCase()] || 'AVAILABLE';

  const normalizedRow: Record<string, string> = {
    registrationNumber: reg,
    model,
    manufacturer,
    type: mappedType,
    maxCapacityKg: capacity,
    odometerKm: odometer || '0',
    acquisitionDate,
    acquisitionCost,
    status: mappedStatus,
  };

  if (reg) existingRegs.add(reg.toUpperCase());

  return {
    rowIndex,
    data: normalizedRow,
    errors,
    isValid: errors.length === 0,
    isDuplicate,
  };
};
