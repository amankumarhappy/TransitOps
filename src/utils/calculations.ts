import { Driver, Vehicle } from '../types';

// ---- Date Helpers ----
export const isLicenceExpired = (expiryDate: string): boolean => {
  if (!expiryDate) return true;
  return new Date(expiryDate) < new Date();
};

export const isLicenceExpiringSoon = (expiryDate: string, daysThreshold = 30): boolean => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  return expiry > new Date() && expiry <= threshold;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const timeAgo = (dateStr: string): string => {
  const now = new Date();
  const past = new Date(dateStr);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ---- Dispatch Validations ----
export interface DispatchValidation {
  valid: boolean;
  errors: string[];
}

export const validateDispatch = (
  driver: Driver,
  vehicle: Vehicle,
  cargoWeightKg: number
): DispatchValidation => {
  const errors: string[] = [];

  if (driver.status !== 'AVAILABLE') {
    errors.push(`Driver is ${driver.status.replace('_', ' ').toLowerCase()} — cannot dispatch.`);
  }
  if (isLicenceExpired(driver.licenseExpiry)) {
    errors.push(`Driver's licence expired on ${formatDate(driver.licenseExpiry)}.`);
  }
  if (vehicle.status !== 'AVAILABLE') {
    errors.push(`Vehicle is ${vehicle.status.replace('_', ' ').toLowerCase()} — cannot dispatch.`);
  }
  if (cargoWeightKg > vehicle.maxCapacityKg) {
    const excess = cargoWeightKg - vehicle.maxCapacityKg;
    errors.push(`Cargo exceeds vehicle capacity by ${excess} kg (max: ${vehicle.maxCapacityKg} kg).`);
  }

  return { valid: errors.length === 0, errors };
};

// ---- Fuel Efficiency ----
export const calcFuelEfficiency = (distanceKm: number, liters: number): number => {
  if (!liters || liters === 0) return 0;
  return Math.round((distanceKm / liters) * 10) / 10;
};

// ---- Trip Code Generator ----
export const generateTripCode = (): string => {
  const date = new Date();
  const yymmdd = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TRP-${yymmdd}-${rand}`;
};

// ---- Fleet Utilization ----
export const calcFleetUtilization = (vehicles: Vehicle[]): number => {
  const operational = vehicles.filter(v => v.status !== 'RETIRED');
  if (!operational.length) return 0;
  const onTrip = operational.filter(v => v.status === 'ON_TRIP').length;
  return Math.round((onTrip / operational.length) * 100);
};

// ---- Currency ----
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// ---- Greeting ----
export const getGreeting = (name: string): string => {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${timeGreet}, ${name.split(' ')[0]}`;
};
