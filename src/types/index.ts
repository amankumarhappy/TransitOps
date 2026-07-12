// ============================================================
// TransitOps — Central Type Definitions
// ============================================================

export type UserRole = 'ADMIN' | 'FLEET_MANAGER' | 'DISPATCHER' | 'DRIVER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  driverId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Driver ------------------------------------------------
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'BREAK' | 'DRIVING' | 'SUSPENDED';

export interface Driver {
  id: string;
  driverId: string;          // e.g. DRV001
  name: string;
  email: string;
  phone: string;
  age?: number;
  gender?: string;
  city?: string;
  employeeId?: string;
  licenseNumber: string;
  licenseCategory?: string;
  licenseExpiry: string;     // ISO date string
  experienceYears?: number;
  safetyScore?: number;
  status: DriverStatus;
  authUid?: string;
  currentTripId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Vehicle -----------------------------------------------
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
export type VehicleType = 'BUS' | 'TRUCK' | 'VAN' | 'MINIBUS' | 'CAR' | 'OTHER';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  manufacturer: string;
  type: VehicleType;
  maxCapacityKg: number;
  odometerKm: number;
  acquisitionDate?: string;
  acquisitionCost?: number;
  status: VehicleStatus;
  currentTripId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Trip --------------------------------------------------
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  vehicleId: string;
  vehicleRegistration: string;
  driverId: string;
  driverName: string;
  cargoDescription?: string;
  cargoWeightKg: number;
  plannedDistanceKm?: number;
  actualDistanceKm?: number;
  scheduledDeparture: string;
  dispatchedAt?: string;
  completedAt?: string;
  status: TripStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Maintenance -------------------------------------------
export type MaintenanceStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type MaintenanceType = 'ROUTINE' | 'REPAIR' | 'INSPECTION' | 'EMERGENCY';

export interface Maintenance {
  id: string;
  vehicleId: string;
  vehicleRegistration: string;
  type: MaintenanceType;
  description: string;
  startDate: string;
  completedDate?: string;
  cost: number;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
}

// ---- Fuel Log ----------------------------------------------
export interface FuelLog {
  id: string;
  vehicleId: string;
  vehicleRegistration?: string;
  tripId?: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometerKm: number;
  createdAt: string;
}

// ---- Expense -----------------------------------------------
export type ExpenseCategory = 'FUEL' | 'TOLL' | 'REPAIR' | 'MAINTENANCE' | 'PARKING' | 'OTHER';

export interface Expense {
  id: string;
  vehicleId?: string;
  tripId?: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

// ---- Notification ------------------------------------------
export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

// ---- Activity Log ------------------------------------------
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

// ---- Import Record -----------------------------------------
export interface ImportRecord {
  id: string;
  fileName: string;
  fileType: string;
  importedBy: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  entityType: 'drivers' | 'vehicles';
  createdAt: string;
}

// ---- Import Preview ----------------------------------------
export interface ImportPreviewRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
  isDuplicate: boolean;
}

export interface ImportPreview {
  entityType: 'drivers' | 'vehicles';
  fileName: string;
  totalRows: number;
  validRows: ImportPreviewRow[];
  invalidRows: ImportPreviewRow[];
  duplicateRows: ImportPreviewRow[];
}
