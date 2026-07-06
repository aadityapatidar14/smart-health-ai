# Database Dictionary

This document provides a professional database specification for the **Smart Health – AI-Driven Health Center & Supply Chain Management** platform. It defines the tables, custom types, columns, constraints, relationships, business rules, and AI configurations for the 18-table schema optimized for Indore District, Madhya Pradesh.

---

# Custom ENUM Types

The database defines 12 custom enumerated types (`ENUM`) to enforce constraints, ensure data integrity, and minimize storage footprints.

| Type Name | Allowed Options | Purpose |
| :--- | :--- | :--- |
| `centre_type` | `'PHC', 'CHC'` | Identifies facility tiers. |
| `user_role` | `'DistrictAdmin', 'CenterManager', 'Doctor', 'Pharmacist', 'LabTechnician', 'Citizen'` | System authentication roles. |
| `doctor_status` | `'Active', 'Inactive', 'Suspended'` | Licensing and validation state. |
| `attendance_status`| `'Present', 'Absent', 'OnLeave'` | Daily clock-in attendance state. |
| `shift_type` | `'Morning', 'Evening', 'Night', 'General'` | Duty roster shift scheduling categories. |
| `bed_type` | `'General', 'ICU', 'Maternity', 'Pediatric', 'Emergency'`| Specialty ward mapping for admissions. |
| `bed_status` | `'Available', 'Occupied', 'Maintenance'` | Current status of ward beds. |
| `transaction_type` | `'Inflow', 'Outflow', 'Expiry', 'Redistribution_In', 'Redistribution_Out'` | Inventory ledger tracking category. |
| `recommendation_status`| `'Pending', 'Approved', 'Rejected', 'Completed'` | Redistribution transfer tracking state. |
| `equipment_status` | `'Operational', 'NeedsMaintenance', 'Broken', 'OutofService'` | Medical hardware diagnostics status. |
| `alert_type` | `'StockOut', 'LowStock', 'HighFootfall', 'DoctorAbsenteeism', 'BedShortage', 'TestUnavailable', 'EquipmentFailure'` | Type of system alerts. |
| `alert_severity` | `'Low', 'Medium', 'High', 'Critical'` | Priority level of generated system alerts. |

---

# districts

## Purpose
Stores the names and states of the administrative districts governed by the application. It acts as the top-level parent entity of the geographic hierarchy.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
None.

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for each district. |
| `name` | VARCHAR(60) | NO | Unique name of the district (e.g., Indore). |
| `state` | VARCHAR(60) | NO | Name of the state (e.g., Madhya Pradesh). |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | The date and time the district record was created. |

## Relationships
- One-to-Many with `health_centres` (A district contains multiple health centres).

## Business Rules
- District name must be unique.
- The state name cannot be empty.

## AI Usage
- Used in **Health Centre Performance Monitoring** to aggregate operational reports and metrics (e.g., avg wait times, attendance rate) at the district level for regional administrators.

---

# health_centres

## Purpose
Stores metadata and details for each primary health centre (PHC) and community health centre (CHC) mapped directly to its governing district.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `district_id` &rarr; `districts.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for each health centre. |
| `name` | VARCHAR(80) | NO | Public name of the health facility (e.g., PHC Simrol). |
| `type` | `centre_type` | NO | Custom ENUM of the facility category: 'PHC' or 'CHC'. |
| `district_id` | INT | NO | Foreign key mapping the facility directly to its district. |
| `address` | TEXT | YES | Full street and geographic location address. |
| `pincode` | VARCHAR(6) | YES | 6-digit Indian postal code validated by constraint. |
| `contact_no` | VARCHAR(15) | YES | Official office phone number of the centre. |
| `latitude` | DECIMAL(9,6) | YES | GPS latitude coordinates for mapping. |
| `longitude` | DECIMAL(9,6) | YES | GPS longitude coordinates for mapping. |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | Record creation timestamp. |

## Relationships
- Many-to-One with `districts` (Many health centres belong to one district).
- One-to-Many with `users`, `beds`, `patient_footfall`, `stock_inventory`, `stock_transactions`, `test_availability`, `equipment_inventory`, `alerts`, `demand_forecasts`, and `redistribution_recommendations` (as source/destination).

## Business Rules
- The pincode must be exactly 6 digits (`chk_centre_pincode`).
- Centre type is strictly validated against the `centre_type` ENUM.

## AI Usage
- Essential for **Health Centre Performance Monitoring** and **Resource Redistribution**. Serves as the primary grouping node for training models to flag underperforming sites or calculate transfer travel costs based on coordinates.

---

# users

## Purpose
Maintains authentication profiles, system roles, facility assignments, and localization preferences for system staff and public citizens.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for each user. |
| `name` | VARCHAR(60) | NO | User's full name. |
| `email` | VARCHAR(80) | NO | Unique login and communication email address. |
| `password_hash` | VARCHAR(60) | NO | Secure Bcrypt hash of the password (exactly 60 chars). |
| `role` | `user_role` | NO | Custom ENUM defining system role. |
| `health_centre_id` | INT | YES | FK mapping the user to their workplace or nearest facility (Citizens). |
| `pincode` | VARCHAR(6) | YES | 6-digit residential postal code of the user. |
| `preferred_language` | VARCHAR(10) | YES | Language code (default 'en') for localized interface. |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | Account registration timestamp. |

## Relationships
- Many-to-One with `health_centres` (Many users belong to one health centre. Nullable for district-level admins).
- One-to-One with `doctors` (If user role is 'Doctor').
- One-to-Many with `duty_rosters` (Rosters are assigned to users).

## Business Rules
- Email addresses must be unique.
- User pincode must be exactly 6 digits (`chk_user_pincode`).
- Role is strictly validated against the `user_role` ENUM.

## AI Usage
- Used indirectly by **Citizen Search** and **Alert Generation**. Pincodes are matched to compute distance matrices to prompt citizens with resource availability (e.g. nearby active diagnostic test availability).

---

# doctors

## Purpose
Stores medical credentials, specialization tags, and practice status for users who are doctors. It extends the `users` table with medical professional records.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `user_id` &rarr; `users.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for each doctor. |
| `user_id` | INT | NO | Unique link to the user record. |
| `specialization` | VARCHAR(50) | NO | Area of clinical specialization (e.g. Pediatrics). |
| `license_no` | VARCHAR(25) | NO | Unique medical registration license code. |
| `status` | `doctor_status` | YES | Active state ENUM: Active, Inactive, Suspended (default Active). |

## Relationships
- One-to-One with `users` (A doctor record extends exactly one user record).
- One-to-Many with `doctor_attendance` (One doctor logs multiple attendance entries).

## Business Rules
- The license number must be unique.
- Doctor status is strictly validated against the `doctor_status` ENUM.

## AI Usage
- Used in **Alert Generation** and **Roster Optimization** to map doctors' clinical specialties to facility care capacity requirements during footfall surges.

---

# doctor_attendance

## Purpose
Logs the daily attendance states, check-in, and check-out timestamps for doctors. It tracks clinical presence.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `doctor_id` &rarr; `doctors.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for attendance logs. |
| `doctor_id` | INT | NO | Foreign key mapping to the doctor. |
| `date` | DATE | NO | Date of the attendance log. |
| `status` | `attendance_status` | NO | Log status ENUM: 'Present', 'Absent', or 'OnLeave'. |
| `check_in_time` | TIMESTAMP WITH TIME ZONE | YES | Clock-in time. |
| `check_out_time` | TIMESTAMP WITH TIME ZONE | YES | Clock-out time. |

## Relationships
- Many-to-One with `doctors` (A doctor has multiple daily attendance records).

## Business Rules
- A doctor can have only one attendance entry per day (`uq_doctor_date`).
- Attendance status is strictly validated against the `attendance_status` ENUM.

## AI Usage
- Core source for **Doctor Absenteeism Alert Generation**. An AI routine cross-references this with `duty_rosters` to detect scheduled shifts that lack check-in logs and flags absenteeism warnings.

---

# duty_rosters

## Purpose
Schedules work shifts for health centre employees (e.g. Doctors, Pharmacists, Technicians) indicating when they are scheduled to be on duty.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `user_id` &rarr; `users.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for roster shifts. |
| `user_id` | INT | NO | Link to the scheduled user. |
| `date` | DATE | NO | Scheduled shift date. |
| `shift_type` | `shift_type` | NO | Shift type ENUM: 'Morning', 'Evening', 'Night', 'General'. |
| `start_time` | TIME | NO | Scheduled shift start time. |
| `end_time` | TIME | NO | Scheduled shift end time. |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | Roster entry timestamp. |

## Relationships
- Many-to-One with `users` (A user has multiple scheduled shifts over time).

## Business Rules
- A user can only be scheduled for one shift per day (`uq_user_date_roster`).
- Shift type is strictly validated against the `shift_type` ENUM.

## AI Usage
- Used in **Staff Allocation Planning** and **Absenteeism Alerts** to match scheduled hours with actual check-in data.

---

# beds

## Purpose
Tracks the status and locations of individual hospital beds across various wards. It represents the physical admission capacity of a health centre.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for each bed. |
| `health_centre_id` | INT | NO | Link to the health centre containing this bed. |
| `ward_name` | VARCHAR(50) | NO | Local name of the ward (e.g. ICU Ward). |
| `bed_type` | `bed_type` | NO | Category ENUM: General, ICU, Maternity, Pediatric, Emergency. |
| `status` | `bed_status` | NO | State ENUM: Available, Occupied, Maintenance. |
| `bed_number` | VARCHAR(20) | NO | Local identification number of the bed. |

## Relationships
- Many-to-One with `health_centres` (Many beds are located in one health centre).

## Business Rules
- Bed numbers must be unique within the same ward of a health centre (`uq_centre_ward_bed`).
- Bed type is strictly validated against the `bed_type` ENUM.
- Bed status is strictly validated against the `bed_status` ENUM.

## AI Usage
- Used for **Bed Shortage Alert Generation** and **Emergency Care Referral routing**. AI monitors occupancy rates to trigger warnings when capacity falls below critical safety margins.

---

# patient_footfall

## Purpose
Records historical hour-by-hour patient visits (divided by outpatient, inpatient, and emergency) and waiting times. It registers patient traffic.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for the footfall log. |
| `health_centre_id` | INT | NO | Link to the tracked health centre. |
| `date` | DATE | NO | Date of the footfall record. |
| `hourly_slot` | INT | NO | The hour slot (0 to 23). |
| `outpatient_count` | INT | YES | Count of outpatient (OPD) visits. |
| `inpatient_count` | INT | YES | Count of inpatient (IPD) admissions. |
| `emergency_count` | INT | YES | Count of emergency room (ER) visits. |
| `avg_waiting_time_mins` | INT | YES | Average waiting time of patients during this hour. |

## Relationships
- Many-to-One with `health_centres` (A health centre has hourly footfall records over time).

## Business Rules
- Hourly slot must be between 0 and 23 (`chk_hourly_slot`).
- Counts and wait times cannot be negative (`chk_op_count`, `chk_ip_count`, `chk_er_count`, `chk_wait_time`).
- Only one log per hour per health centre per day (`uq_centre_date_hour`).

## AI Usage
- Primary input for **Patient Footfall Forecasting**, **Waiting Time Optimization**, and **Staff Shift Planning**. Machine learning models use this time-series data to predict seasonal patient surges.

---

# medicines

## Purpose
Acts as the central master catalog of all supported drugs, consumables, and vaccines. It stores pharmaceutical data.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
None.

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for the medicine. |
| `name` | VARCHAR(60) | NO | Commercial / brand name (e.g. Paracetamol 650mg). |
| `generic_name` | VARCHAR(80) | NO | Formulation chemical name (e.g. Paracetamol). |
| `category` | VARCHAR(40) | NO | Therapeutic category (e.g. Antibiotic). |
| `dosage_form` | VARCHAR(25) | NO | Administration form (e.g. Tablet, Syrup, Injection). |
| `unit` | VARCHAR(12) | NO | Dispensing packaging unit (e.g. Tab, Sachet, Vial). |

## Relationships
- One-to-Many with `stock_inventory`, `stock_transactions`, `redistribution_recommendations`, and `demand_forecasts`.

## Business Rules
- Combination of medicine name and dosage form must be unique (`uq_med_name_form`).

## AI Usage
- Serves as the master catalog index for **AI-driven Demand Forecasting** and **Resource Redistribution** models to predict item-level consumption and resolve shortages.

---

# stock_inventory

## Purpose
Keeps track of real-time available quantities of medicines, safety stocks, and reorder triggers at each health centre.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`
- `medicine_id` &rarr; `medicines.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for stock records. |
| `health_centre_id` | INT | NO | Link to the health centre. |
| `medicine_id` | INT | NO | Link to the medicine catalog. |
| `current_stock` | INT | NO | Current count of items on hand. |
| `min_required_stock` | INT | NO | Standard buffer stock required to avoid stock-outs. |
| `reorder_level` | INT | NO | The quantity threshold at which restocking must begin. |
| `last_updated` | TIMESTAMP WITH TIME ZONE | YES | Date and time of last stock update. |

## Relationships
- Many-to-One with `health_centres` (Many stocks belong to one health centre).
- Many-to-One with `medicines` (Many stocks relate to one medicine).

## Business Rules
- Stock counts must be greater than or equal to zero (`chk_curr_stock`, `chk_min_stock`, `chk_reorder`).
- Only one inventory record per medicine per health centre (`uq_centre_medicine`).

## AI Usage
- Used in **Medicine Stock-out Prediction** and **Alert Generation**. AI models calculate the burn rate (stock depletion rate) and flag stockout risks if current stock drops below reorder levels.

---

# stock_transactions

## Purpose
Logs the historic ledger (audit trail) of all stock movements, including patient sales, arrivals, vaccine expiries, and transfers.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`
- `medicine_id` &rarr; `medicines.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for the transaction. |
| `health_centre_id` | INT | NO | Link to the health centre logging the change. |
| `medicine_id` | INT | NO | Link to the medicine logged. |
| `transaction_type` | `transaction_type` | NO | Transaction type ENUM: Inflow, Outflow, Expiry, Redistribution_In, Redistribution_Out. |
| `quantity` | INT | NO | The count of items shifted. |
| `transaction_date` | TIMESTAMP WITH TIME ZONE | YES | Date and time the transaction occurred. |
| `reference_id` | INT | YES | Reference ID linking to related tables (e.g. transfer order ID). |
| `notes` | TEXT | YES | Descriptive logs or reason comments. |

## Relationships
- Many-to-One with `health_centres` (Many transactions occur at one health centre).
- Many-to-One with `medicines` (Many transactions relate to one medicine type).

## Business Rules
- The transaction quantity must be greater than zero (`chk_trans_qty`).
- The transaction type is strictly validated against the `transaction_type` ENUM.

## AI Usage
- Serves as historical training data for **AI Demand Forecasting** models to calculate seasonal patterns, daily dispensing rates, and drug waste (expiries) to improve inventory policies.

---

# redistribution_recommendations

## Purpose
Saves supply transfer recommendations generated by AI models, transferring excess stock from surplus health centres to shortage locations.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `source_centre_id` &rarr; `health_centres.id`
- `destination_centre_id` &rarr; `health_centres.id`
- `medicine_id` &rarr; `medicines.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for recommendations. |
| `source_centre_id` | INT | NO | FK to the health centre providing the surplus stock. |
| `destination_centre_id` | INT | NO | FK to the health centre experiencing the shortage. |
| `medicine_id` | INT | NO | FK referencing the medicine being moved. |
| `recommended_quantity` | INT | NO | Count of units recommended for transfer. |
| `status` | `recommendation_status` | YES | Status ENUM: 'Pending', 'Approved', 'Rejected', 'Completed'. |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | Timestamp when recommendation was generated. |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | Timestamp when status was updated. |

## Relationships
- Many-to-One with `health_centres` (as source and destination centres).
- Many-to-One with `medicines` (Many recommendations relate to one medicine catalog item).

## Business Rules
- Transfer quantity must be greater than zero (`chk_recommend_qty`).
- Source and destination health centres cannot be the same (`chk_diff_centres`).
- Recommendation status is strictly validated against the `recommendation_status` ENUM.

## AI Usage
- **Core AI Output table**. Stores supply redistribution matches calculated by resource optimization algorithms to balance stocks across the district.

---

# diagnostic_tests

## Purpose
Acts as the central master catalog of diagnostic tests and lab investigations supported by the health network.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
None.

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for the diagnostic test. |
| `name` | VARCHAR(60) | NO | Name of the test (e.g. Complete Blood Count). |
| `category` | VARCHAR(40) | NO | Investigation category (Pathology, Radiology, Cardiology). |

## Relationships
- One-to-Many with `test_availability`.

## Business Rules
- Test name must be unique.

## AI Usage
- Used in **Alert Generation** and **Citizen Diagnostics Search** to map testing capacity and equipment states to available test types.

---

# test_availability

## Purpose
Audits the daily operational availability, active state, and daily patient processing capacities of diagnostic tests at each health centre.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`
- `test_id` &rarr; `diagnostic_tests.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for test availability. |
| `health_centre_id` | INT | NO | Link to the health centre. |
| `test_id` | INT | NO | Link to the test catalog. |
| `is_available` | BOOLEAN | NO | Flag indicating if the test is currently operational (default True). |
| `daily_capacity` | INT | YES | Max tests the centre can process daily (default 0). |
| `status_notes` | TEXT | YES | Reason comments for unavailability or restrictions. |
| `last_updated` | TIMESTAMP WITH TIME ZONE | YES | Timestamp of last audit check. |

## Relationships
- Many-to-One with `health_centres` (Many test audits belong to one health centre).
- Many-to-One with `diagnostic_tests` (Many test audits relate to one test type).

## Business Rules
- Daily capacity cannot be less than zero (`chk_capacity`).
- Only one audit record per test per health centre (`uq_centre_test`).

## AI Usage
- Used in **Test Availability Alerts** and **Referral Routing**. The AI flags system anomalies when essential diagnostic tests (e.g., Malaria tests during monsoon) become unavailable, alerting administrators.

---

# equipments

## Purpose
Central catalog defining types of medical equipment, hardware, and analytical machines used across health centres.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
None.

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for the equipment. |
| `name` | VARCHAR(60) | NO | Name of the equipment (e.g. Ice Lined Refrigerator). |
| `criticality` | `alert_severity` | NO | Importance ENUM: Low, Medium, High, Critical. |
| `description` | TEXT | YES | Functional details and maintenance guidelines. |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | Record creation timestamp. |

## Relationships
- One-to-Many with `equipment_inventory`.

## Business Rules
- Equipment name must be unique.
- Criticality is strictly validated against the `alert_severity` ENUM.

## AI Usage
- Helps the **Alert Engine** prioritize machine alerts. Failures in 'Critical' devices (like vaccine refrigerators) trigger high-severity system alerts, whereas 'Low' failures trigger lower-severity notifications.

---

# equipment_inventory

## Purpose
Tracks individual, physical medical devices installed at health centres, including their unique serial numbers, operational statuses, and inspection logs.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`
- `equipment_id` &rarr; `equipments.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for each physical unit. |
| `health_centre_id` | INT | NO | Link to the health centre where it is deployed. |
| `equipment_id` | INT | NO | Link to the equipment catalog type. |
| `serial_no` | VARCHAR(25) | NO | Manufacturer serial number for auditing (optimized length). |
| `status` | `equipment_status` | NO | Status ENUM: Operational, NeedsMaintenance, Broken, OutofService. |
| `last_inspected_at` | TIMESTAMP WITH TIME ZONE | YES | Timestamp of last physical check. |
| `notes` | TEXT | YES | Logs for breakdowns or technician remarks. |

## Relationships
- Many-to-One with `health_centres` (Many devices are installed at one health centre).
- Many-to-One with `equipments` (Many inventory units belong to one equipment catalog entry).

## Business Rules
- The physical unit status is strictly validated against the `equipment_status` ENUM.
- Only one unique serial number record per equipment type per health centre (`uq_centre_equip_serial`).

## AI Usage
- Integrated with **Equipment Failure Alerting**. An AI system logs state changes from `Operational` to `Broken` or `NeedsMaintenance` and automatically triggers critical facility warnings.

---

# alerts

## Purpose
Stores active operational issues and alerts flagged for district administrators, requiring administrative intervention.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for alerts. |
| `health_centre_id` | INT | NO | Link to the health centre experiencing the alert. |
| `alert_type` | `alert_type` | NO | Alert type ENUM: StockOut, LowStock, HighFootfall, DoctorAbsenteeism, BedShortage, TestUnavailable, EquipmentFailure. |
| `severity` | `alert_severity` | NO | Severity ENUM: Low, Medium, High, Critical. |
| `message` | TEXT | NO | Description of the issue. |
| `is_resolved` | BOOLEAN | NO | Flag indicating if the issue was resolved (default False). |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | Date and time the alert was created. |
| `resolved_at` | TIMESTAMP WITH TIME ZONE | YES | Date and time the alert was resolved. |

## Relationships
- Many-to-One with `health_centres` (A health centre triggers multiple alerts over time).

## Business Rules
- Alert type is validated against the `alert_type` ENUM.
- Severity is validated against the `alert_severity` ENUM.

## AI Usage
- **Core Action Hub for AI Alerts**. Stores alerts triggered by AI models (such as stockout predictions or high footfall warnings) to prompt administrative decisions.

---

# demand_forecasts

## Purpose
Stores future medicine demand predictions generated by AI models, estimating quantities required for upcoming dates.

## Primary Key
- `id` (SERIAL)

## Foreign Keys
- `health_centre_id` &rarr; `health_centres.id`
- `medicine_id` &rarr; `medicines.id`

## Columns

| Column | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | NO | Unique auto-incremented identifier for predictions. |
| `health_centre_id` | INT | NO | Link to the health centre where demand is predicted. |
| `medicine_id` | INT | NO | Link to the medicine being predicted. |
| `forecast_date` | DATE | NO | Future date for which demand is estimated. |
| `forecasted_demand` | DECIMAL(10,2) | NO | Estimated medicine quantity required. |
| `confidence_interval_lower` | DECIMAL(10,2) | NO | Lower boundary of the forecast confidence interval. |
| `confidence_interval_upper` | DECIMAL(10,2) | NO | Upper boundary of the forecast confidence interval. |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | Timestamp when the forecast was generated. |

## Relationships
- Many-to-One with `health_centres` (Many forecasts belong to one health centre).
- Many-to-One with `medicines` (Many forecasts relate to one medicine catalogue entry).

## Business Rules
- Forecasted demand and confidence intervals must be greater than or equal to zero (`chk_forecast_demand`, `chk_forecast_lower`, `chk_forecast_upper`).
- Lower confidence interval must be less than or equal to the upper interval (`chk_ci`).
- Only one forecast per medicine per health centre per date (`uq_centre_med_forecast_date`).

## AI Usage
- **Core AI Forecast Repository**. Stores time-series demand predictions, helping pharmacists adjust reorder levels based on expected future consumption rather than past usage.

---

# Overall Database Architecture

The Smart Health database is a relational database designed using PostgreSQL. It is structured to support real-time facility monitoring, transactional auditing, and AI operations.

### Normalization and Integrity
The database is normalized to the **Third Normal Form (3NF)** to ensure consistency, eliminate data redundancy, and keep transaction operations fast:
- Core operational catalogs (`medicines`, `diagnostic_tests`, `equipments`) are stored in distinct tables, separating static references from live transactions.
- Transaction history is recorded in `stock_transactions`, while real-time stock balances are stored in `stock_inventory`, preventing calculation errors.
- Doctor details (`doctors`) extend the base `users` table, avoiding duplicate login fields.
- The geography is simplified: `health_centres` link directly to their parent `districts`, avoiding unnecessary intermediate tables.

### Data Flow Overview
1. **Administrative Scope:** `districts` acts as the root organizing `health_centres`.
2. **Operations:** `health_centres` links staff (`users`/`doctors`), facilities (`beds`, `equipments`), and clinical audits (`patient_footfall`, `test_availability`).
3. **Logistics:** Transactions (`stock_transactions`) modify current balances (`stock_inventory`). AI models analyze this data to write future predictions to `demand_forecasts`, trigger `alerts`, and suggest transfers in `redistribution_recommendations`.

---

# Entity Relationship Overview

The text-based diagram below maps the relationships across all tables in the database:

```
Districts
   │
   ▼
Health Centres
   ├── Users ──────────────► Doctors ──► Doctor Attendance
   │     │                      ▲
   │     ▼                      │
   │   Duty Rosters ────────────┘
   ├── Beds
   ├── Patient Footfall
   ├── Stock Inventory ◄──── Medicines
   ├── Stock Transactions ◄───┘    ▲
   │                               │
   ├── Equipment Inventory ◄─ Equipments
   ├── Test Availability ◄── Diagnostic Tests
   │
   ├── Alerts
   ├── Demand Forecasts ◄─── (Medicines / Health Centres)
   └── Redistribution Recommendations (Source / Destination / Medicines)
```

---

# Database Statistics

Below are the schema statistics for the Smart Health database:

- **Total Number of Tables:** 18
- **Total Primary Keys:** 18
- **Total Foreign Keys:** 22
- **Total Performance Indexes:** 22
- **Total CHECK Constraints:** 11
- **Total Custom ENUM Types:** 12

---

# AI Data Flow

This chart maps the flow of data through the system, from raw inputs to AI insights and admin alerts:

```
[Patient Footfall Logs] ───────► (Time-Series AI Model)
                                        │
                                        ▼
[Live Stock Inventory] ────────► [Demand Forecasts] ◄────── [Medicine Catalog]
         │                              │
         ▼                              ▼
(Stock Depletion Engine) ──────► (Redistribution Engine)
         │                              │
         ▼                              ▼
    [Alerts] ◄────────────── [Redistribution Recommendations]
```

1. **Forecasting Flow:** Historical hourly logs (`patient_footfall`) are analyzed by time-series forecasting models to generate daily estimates stored in `demand_forecasts`.
2. **Redistribution Flow:** Optimization models compare `stock_inventory` levels with predicted demand. If a shortage is detected at Centre A and a surplus is found at Centre B, the system logs a proposal in `redistribution_recommendations`.
3. **Alerting Flow:** The system monitors inventory thresholds and machine states (`equipment_inventory`). When thresholds are breached or machines break down, the system writes alerts directly to the `alerts` table.

---

# Future Backend Mapping

This section outlines the standard REST API endpoints required to map the database tables to a backend server (e.g. Node.js/Express, Python/FastAPI):

### districts
- `GET /api/districts` - List all districts.
- `POST /api/districts` - Add a new district.
- `GET /api/districts/:id` - Get specific district details.
- `PUT /api/districts/:id` - Update a district.
- `DELETE /api/districts/:id` - Delete a district.

### health_centres
- `GET /api/centres` - List all centres (with query filters).
- `POST /api/centres` - Register a new health centre.
- `GET /api/centres/:id` - Get centre details.
- `PUT /api/centres/:id` - Update address, coordinates, or contact details.
- `DELETE /api/centres/:id` - Delete a centre.

### users
- `POST /api/users/register` - Create a new user account (supports 'Citizen' sign-up).
- `POST /api/users/login` - Authenticate and return JWT token.
- `GET /api/users/:id` - Retrieve user profile.
- `PUT /api/users/:id` - Update profile, pincode, or language preference.

### doctors
- `GET /api/doctors` - List all doctors (supports specialization filters).
- `POST /api/doctors` - Register doctor credentials.
- `GET /api/doctors/:id` - Get doctor profile details.
- `PUT /api/doctors/:id` - Update specialization, license, or active status.

### doctor_attendance
- `GET /api/attendance` - Query attendance history.
- `POST /api/attendance/check-in` - Log daily arrival timestamp.
- `POST /api/attendance/check-out` - Log daily checkout timestamp.
- `PUT /api/attendance/:id` - Adjust attendance logs.

### duty_rosters
- `GET /api/rosters` - Get shift rosters.
- `POST /api/rosters` - Create a scheduled shift.
- `PUT /api/rosters/:id` - Reschedule a shift.
- `DELETE /api/rosters/:id` - Remove a scheduled shift.

### beds
- `GET /api/beds` - Get beds list.
- `POST /api/beds` - Add a new bed.
- `PUT /api/beds/:id` - Update bed status.
- `DELETE /api/beds/:id` - Remove a bed.

### patient_footfall
- `GET /api/footfall` - Query footfall stats.
- `POST /api/footfall` - Log hourly footfall counts.

### medicines
- `GET /api/medicines` - Get medicine catalog.
- `POST /api/medicines` - Add a new medicine.
- `PUT /api/medicines/:id` - Update medicine details.

### stock_inventory
- `GET /api/stock` - Get current stock levels.
- `GET /api/stock/:centre_id/:medicine_id` - Get stock details.
- `PUT /api/stock/:id` - Manually adjust stock counts or thresholds.

### stock_transactions
- `GET /api/transactions` - Audit logs.
- `POST /api/transactions` - Log a new transaction.

### redistribution_recommendations
- `GET /api/redistribute` - List recommendations.
- `PUT /api/redistribute/:id` - Approve, reject, or complete a transfer.

### diagnostic_tests
- `GET /api/tests` - Get testing catalog.
- `POST /api/tests` - Add a test type.

### test_availability
- `GET /api/test-status` - Query operational status of tests.
- `PUT /api/test-status/:id` - Update test availability and daily capacity.

### equipments
- `GET /api/equipments` - Get equipment catalog.
- `POST /api/equipments` - Add an equipment type.

### equipment_inventory
- `GET /api/equipment-inventory` - List items.
- `POST /api/equipment-inventory` - Register an installed machine unit.
- `PUT /api/equipment-inventory/:id` - Log inspections or change status.

### alerts
- `GET /api/alerts` - List active alerts.
- `PUT /api/alerts/:id/resolve` - Resolve and archive an alert.

### demand_forecasts
- `GET /api/forecasts` - Get AI demand predictions.
