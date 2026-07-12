
# TransitOps

**Smart Transport Operations Platform**

TransitOps is a user-centric transport operations web application for managing vehicles, drivers, trips, maintenance, fuel, expenses, and fleet analytics in one real-time system.

It is built to replace spreadsheets and manual logbooks with a centralized workflow where:

- Admins manage master data and user access
- Dispatchers create and dispatch trips
- Drivers manage their availability and view assignments
- Fleet managers monitor vehicles, maintenance, and performance

---

## Live Demo

- Admin Dashboard: https://transit-ops-khaki.vercel.app/admin/dashboard

---

## Screenshots

> Add 4–6 screenshots here for the best submission quality.

### Suggested screenshots
1. Login page
2. Admin dashboard
3. Vehicles page
4. Drivers page
5. Trip creation / dispatch flow
6. Mobile driver dashboard

### Example format

| Login | Admin Dashboard |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Admin Dashboard](docs/screenshots/admin-dashboard.png) |

| Vehicles | Trips |
|---|---|
| ![Vehicles](docs/screenshots/vehicles.png) | ![Trips](docs/screenshots/trips.png) |

---

## What this project does

TransitOps provides:

- Firebase Authentication for secure login
- Role-based access control
- Vehicle management
- Driver management
- Trip planning and dispatch
- Automatic vehicle and driver status updates
- Maintenance tracking
- Fuel and expense logging
- Real-time dashboard updates
- CSV/XLSX import for bulk data entry

---

## Main roles

### Admin
- Manages all data
- Imports drivers and vehicles
- Creates and edits users
- Monitors dashboards and logs

### Fleet Manager
- Manages fleet-related operations
- Monitors vehicle status and maintenance

### Dispatcher
- Creates trips
- Assigns eligible drivers and vehicles
- Dispatches and completes trips

### Driver
- Views assigned trips
- Updates availability
- Sees own profile and notifications

---

## Core features

### Authentication
- Email/password login
- Protected routes
- Role-based redirection

### Vehicle management
- Add, edit, view, search vehicles
- Status tracking:
  - Available
  - On Trip
  - In Shop
  - Retired

### Driver management
- Add, edit, view, search drivers
- Licence expiry tracking
- Safety score tracking
- Status tracking:
  - Available
  - On Trip
  - Off Duty
  - Suspended

### Trips
- Create trip
- Validate vehicle capacity
- Validate driver availability
- Prevent duplicate assignment
- Dispatch trip
- Complete trip
- Automatic state transitions

### Maintenance
- Create maintenance record
- Mark vehicle as In Shop
- Restore vehicle after maintenance

### Fuel and expenses
- Record fuel logs
- Track tolls, repairs, and other expenses
- Calculate efficiency and operational cost

### Import system
- Upload CSV/XLSX files
- Preview and validate rows
- Import drivers and vehicles into Firestore

### Real-time updates
- Driver availability changes instantly
- Dashboard reflects status changes immediately
- Dispatcher sees current availability without refresh

---

## Tech stack

- **Frontend:** React, Vite
- **Styling:** Tailwind CSS
- **Backend / Database:** Firebase
- **Auth:** Firebase Authentication
- **Database:** Cloud Firestore
- **File import:** SheetJS (`xlsx`)
- **Charts:** Recharts
- **Deployment:** Vercel / Firebase Hosting

---

## Database collections

- `users`
- `drivers`
- `vehicles`
- `trips`
- `maintenance`
- `fuelLogs`
- `expenses`
- `notifications`
- `activityLogs`
- `imports`

---

## Business rules

- Only available vehicles can be dispatched
- Only available drivers can be dispatched
- Expired or suspended drivers cannot be assigned
- Cargo weight cannot exceed vehicle capacity
- Dispatching a trip changes:
  - Trip: `DRAFT → DISPATCHED`
  - Vehicle: `AVAILABLE → ON_TRIP`
  - Driver: `AVAILABLE → ON_TRIP`
- Completing a trip restores vehicle and driver availability
- Maintenance moves a vehicle to `IN_SHOP`
- In-shop vehicles cannot be dispatched

---

## Sample workflow

1. Admin logs in
2. Admin imports drivers and vehicles from CSV/XLSX
3. Records appear in Firestore
4. Driver signs up using the registered email
5. Driver gets linked to the imported profile
6. Driver updates availability
7. Dispatcher creates a trip
8. System validates assignment rules
9. Dispatcher dispatches trip
10. Vehicle and driver status update automatically
11. Trip is completed
12. Vehicle returns to available status

---

## Project structure

```text
src/
  components/
  pages/
  services/
  config/
  hooks/
  contexts/
  utils/
  types/
