-- ==========================================
-- Smart Health Database Schema (PostgreSQL)
-- Optimized with Custom ENUMs & Storage Constraints
-- Target Location Focus: Indore, Madhya Pradesh
-- ==========================================

-- Clean up existing tables if they exist (ordered by dependencies)
DROP TABLE IF EXISTS demand_forecasts CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS equipment_inventory CASCADE;
DROP TABLE IF EXISTS equipments CASCADE;
DROP TABLE IF EXISTS test_availability CASCADE;
DROP TABLE IF EXISTS diagnostic_tests CASCADE;
DROP TABLE IF EXISTS redistribution_recommendations CASCADE;
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS stock_inventory CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS patient_footfall CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS duty_rosters CASCADE;
DROP TABLE IF EXISTS doctor_attendance CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS health_centres CASCADE;
DROP TABLE IF EXISTS districts CASCADE;

-- Clean up existing custom types if they exist
DROP TYPE IF EXISTS alert_severity CASCADE;
DROP TYPE IF EXISTS alert_type CASCADE;
DROP TYPE IF EXISTS equipment_status CASCADE;
DROP TYPE IF EXISTS recommendation_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS bed_status CASCADE;
DROP TYPE IF EXISTS bed_type CASCADE;
DROP TYPE IF EXISTS shift_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS doctor_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS centre_type CASCADE;

-- ==========================================
-- Define Custom ENUM Types for Fixed Values
-- ==========================================
CREATE TYPE centre_type AS ENUM ('PHC', 'CHC');
CREATE TYPE user_role AS ENUM ('DistrictAdmin', 'CenterManager', 'Doctor', 'Pharmacist', 'LabTechnician', 'Citizen');
CREATE TYPE doctor_status AS ENUM ('Active', 'Inactive', 'Suspended');
CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'OnLeave');
CREATE TYPE shift_type AS ENUM ('Morning', 'Evening', 'Night', 'General');
CREATE TYPE bed_type AS ENUM ('General', 'ICU', 'Maternity', 'Pediatric', 'Emergency');
CREATE TYPE bed_status AS ENUM ('Available', 'Occupied', 'Maintenance');
CREATE TYPE transaction_type AS ENUM ('Inflow', 'Outflow', 'Expiry', 'Redistribution_In', 'Redistribution_Out');
CREATE TYPE recommendation_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Completed');
CREATE TYPE equipment_status AS ENUM ('Operational', 'NeedsMaintenance', 'Broken', 'OutofService');
CREATE TYPE alert_type AS ENUM ('StockOut', 'LowStock', 'HighFootfall', 'DoctorAbsenteeism', 'BedShortage', 'TestUnavailable', 'EquipmentFailure');
CREATE TYPE alert_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- ==========================================
-- Table Definitions
-- ==========================================

-- 1. Districts Table
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    state VARCHAR(60) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Health Centres Table (PHCs / CHCs linked directly to Districts)
CREATE TABLE health_centres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    type centre_type NOT NULL, -- Enum validation
    district_id INT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    address TEXT,
    pincode VARCHAR(6) CONSTRAINT chk_centre_pincode CHECK (pincode ~ '^[0-9]{6}$'),
    contact_no VARCHAR(15),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(60) NOT NULL, -- Optimized for Bcrypt hashes
    role user_role NOT NULL, -- Enum validation
    health_centre_id INT REFERENCES health_centres(id) ON DELETE SET NULL,
    pincode VARCHAR(6) CONSTRAINT chk_user_pincode CHECK (pincode ~ '^[0-9]{6}$'),
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Doctors Table
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    specialization VARCHAR(50) NOT NULL,
    degree VARCHAR(50),
    license_no VARCHAR(25) NOT NULL UNIQUE,
    status doctor_status DEFAULT 'Active' -- Enum validation
);

-- 5. Doctor Attendance Table
CREATE TABLE doctor_attendance (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL, -- Enum validation
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_doctor_date UNIQUE (doctor_id, date)
);

-- 6. Duty Rosters Table
CREATE TABLE duty_rosters (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_type shift_type NOT NULL, -- Enum validation
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_date_roster UNIQUE (user_id, date)
);

-- 7. Beds Table
CREATE TABLE beds (
    id SERIAL PRIMARY KEY,
    health_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    ward_name VARCHAR(50) NOT NULL,
    bed_type bed_type NOT NULL, -- Enum validation
    status bed_status NOT NULL, -- Enum validation
    bed_number VARCHAR(20) NOT NULL,
    CONSTRAINT uq_centre_ward_bed UNIQUE (health_centre_id, ward_name, bed_number)
);

-- 8. Patient Footfall Table (Hour-by-hour Tracking)
CREATE TABLE patient_footfall (
    id SERIAL PRIMARY KEY,
    health_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hourly_slot INT NOT NULL CONSTRAINT chk_hourly_slot CHECK (hourly_slot BETWEEN 0 AND 23),
    outpatient_count INT DEFAULT 0 CONSTRAINT chk_op_count CHECK (outpatient_count >= 0),
    inpatient_count INT DEFAULT 0 CONSTRAINT chk_ip_count CHECK (inpatient_count >= 0),
    emergency_count INT DEFAULT 0 CONSTRAINT chk_er_count CHECK (emergency_count >= 0),
    avg_waiting_time_mins INT DEFAULT 0 CONSTRAINT chk_wait_time CHECK (avg_waiting_time_mins >= 0),
    CONSTRAINT uq_centre_date_hour UNIQUE (health_centre_id, date, hourly_slot)
);

-- 9. Medicines Table (Catalog)
CREATE TABLE medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    generic_name VARCHAR(80) NOT NULL,
    category VARCHAR(40) NOT NULL,
    dosage_form VARCHAR(25) NOT NULL,
    CONSTRAINT uq_med_name_form UNIQUE (name, dosage_form)
);

-- 10. Stock Inventory Table (Live Stock Levels)
CREATE TABLE stock_inventory (
    id SERIAL PRIMARY KEY,
    health_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    current_stock INT NOT NULL CONSTRAINT chk_curr_stock CHECK (current_stock >= 0),
    min_required_stock INT NOT NULL CONSTRAINT chk_min_stock CHECK (min_required_stock >= 0),
    reorder_level INT NOT NULL CONSTRAINT chk_reorder CHECK (reorder_level >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_centre_medicine UNIQUE (health_centre_id, medicine_id)
);

-- 11. Stock Transactions Table (Inventory Audit Trail)
CREATE TABLE stock_transactions (
    id SERIAL PRIMARY KEY,
    health_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL, -- Enum validation
    quantity INT NOT NULL CONSTRAINT chk_trans_qty CHECK (quantity > 0),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reference_id INT,
    notes TEXT
);

-- 12. Redistribution Recommendations Table (AI-driven resource redistribution)
CREATE TABLE redistribution_recommendations (
    id SERIAL PRIMARY KEY,
    source_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    destination_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    recommended_quantity INT NOT NULL CONSTRAINT chk_recommend_qty CHECK (recommended_quantity > 0),
    status recommendation_status DEFAULT 'Pending', -- Enum validation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_diff_centres CHECK (source_centre_id <> destination_centre_id)
);

-- 13. Diagnostic Tests Table (Catalog)
CREATE TABLE diagnostic_tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    category VARCHAR(40) NOT NULL
);

-- 14. Test Availability Table (Diagnostic Availability Audits)
CREATE TABLE test_availability (
    id SERIAL PRIMARY KEY,
    health_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    test_id INT NOT NULL REFERENCES diagnostic_tests(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    daily_capacity INT DEFAULT 0 CONSTRAINT chk_capacity CHECK (daily_capacity >= 0),
    status_notes TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_centre_test UNIQUE (health_centre_id, test_id)
);

-- 15. Equipments Table (Master Catalog)
CREATE TABLE equipments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    criticality alert_severity NOT NULL, -- Mapped to alert_severity Enum (Low, Medium, High, Critical)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Equipment Inventory Table
CREATE TABLE equipment_inventory (
    id SERIAL PRIMARY KEY,
    health_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    equipment_id INT NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    serial_no VARCHAR(25) NOT NULL, -- Optimized length limit
    status equipment_status NOT NULL, -- Enum validation
    last_inspected_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    CONSTRAINT uq_centre_equip_serial UNIQUE (health_centre_id, equipment_id, serial_no)
);

-- 17. Alerts Table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    health_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL, -- Enum validation
    severity alert_severity NOT NULL, -- Enum validation
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 18. Demand Forecasts Table (AI Predictions)
CREATE TABLE demand_forecasts (
    id SERIAL PRIMARY KEY,
    health_centre_id INT NOT NULL REFERENCES health_centres(id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    forecasted_demand DECIMAL(10,2) NOT NULL CONSTRAINT chk_forecast_demand CHECK (forecasted_demand >= 0),
    confidence_interval_lower DECIMAL(10,2) NOT NULL CONSTRAINT chk_forecast_lower CHECK (confidence_interval_lower >= 0),
    confidence_interval_upper DECIMAL(10,2) NOT NULL CONSTRAINT chk_forecast_upper CHECK (confidence_interval_upper >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_centre_med_forecast_date UNIQUE (health_centre_id, medicine_id, forecast_date),
    CONSTRAINT chk_ci CHECK (confidence_interval_lower <= confidence_interval_upper)
);

-- ==========================================
-- Performance Indexes
-- ==========================================

CREATE INDEX idx_centres_district ON health_centres(district_id);
CREATE INDEX idx_users_centre ON users(health_centre_id);
CREATE INDEX idx_doctors_user ON doctors(user_id);
CREATE INDEX idx_doc_attend_doctor ON doctor_attendance(doctor_id);
CREATE INDEX idx_rosters_user ON duty_rosters(user_id);
CREATE INDEX idx_beds_centre ON beds(health_centre_id);
CREATE INDEX idx_footfall_centre ON patient_footfall(health_centre_id);
CREATE INDEX idx_inventory_centre ON stock_inventory(health_centre_id);
CREATE INDEX idx_inventory_medicine ON stock_inventory(medicine_id);
CREATE INDEX idx_transactions_centre ON stock_transactions(health_centre_id);
CREATE INDEX idx_transactions_medicine ON stock_transactions(medicine_id);
CREATE INDEX idx_redist_source ON redistribution_recommendations(source_centre_id);
CREATE INDEX idx_redist_dest ON redistribution_recommendations(destination_centre_id);
CREATE INDEX idx_redist_medicine ON redistribution_recommendations(medicine_id);
CREATE INDEX idx_test_avail_centre ON test_availability(health_centre_id);
CREATE INDEX idx_test_avail_test ON test_availability(test_id);
CREATE INDEX idx_equip_inventory_centre ON equipment_inventory(health_centre_id);
CREATE INDEX idx_equip_inventory_equip ON equipment_inventory(equipment_id);
CREATE INDEX idx_alerts_centre ON alerts(health_centre_id);
CREATE INDEX idx_forecasts_centre ON demand_forecasts(health_centre_id);
CREATE INDEX idx_forecasts_medicine ON demand_forecasts(medicine_id);

CREATE INDEX idx_doc_attend_date ON doctor_attendance(date);
CREATE INDEX idx_rosters_date ON duty_rosters(date);
CREATE INDEX idx_footfall_date ON patient_footfall(date);
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_forecasts_date ON demand_forecasts(forecast_date);
CREATE INDEX idx_transactions_date ON stock_transactions(transaction_date);
