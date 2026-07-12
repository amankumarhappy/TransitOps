// Application-wide constants

export const DRIVER_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  OFF_DUTY: 'OFF_DUTY',
  SUSPENDED: 'SUSPENDED',
} as const;

export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  IN_SHOP: 'IN_SHOP',
  RETIRED: 'RETIRED',
} as const;

export const TRIP_STATUS = {
  DRAFT: 'DRAFT',
  DISPATCHED: 'DISPATCHED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const MAINTENANCE_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  FLEET_MANAGER: 'FLEET_MANAGER',
  DISPATCHER: 'DISPATCHER',
  DRIVER: 'DRIVER',
} as const;

export const STATUS_COLORS = {
  // Driver / Vehicle availability
  AVAILABLE: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  ON_TRIP: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  OFF_DUTY: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  BREAK: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  DRIVING: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  IN_SHOP: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  RETIRED: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  // Trip statuses
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  DISPATCHED: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  // Maintenance
  ACTIVE: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
};

export const VEHICLE_TYPES = ['BUS', 'TRUCK', 'VAN', 'MINIBUS', 'CAR', 'OTHER'];
export const MAINTENANCE_TYPES = ['ROUTINE', 'REPAIR', 'INSPECTION', 'EMERGENCY'];
export const EXPENSE_CATEGORIES = ['FUEL', 'TOLL', 'REPAIR', 'MAINTENANCE', 'PARKING', 'OTHER'];

export const INDIAN_ROUTES = [
  { source: 'Patna', destination: 'Buxar' },
  { source: 'Buxar', destination: 'Ara' },
  { source: 'Patna', destination: 'Gaya' },
  { source: 'Patna', destination: 'Muzaffarpur' },
  { source: 'Gaya', destination: 'Bodh Gaya' },
  { source: 'Muzaffarpur', destination: 'Darbhanga' },
  { source: 'Patna', destination: 'Bihar Sharif' },
  { source: 'Ara', destination: 'Bhabua' },
];

export const COLLECTIONS = {
  USERS: 'users',
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  TRIPS: 'trips',
  MAINTENANCE: 'maintenance',
  FUEL_LOGS: 'fuelLogs',
  EXPENSES: 'expenses',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activityLogs',
  IMPORTS: 'imports',
};
