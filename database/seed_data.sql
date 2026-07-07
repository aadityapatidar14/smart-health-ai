-- ==========================================
-- Smart Health Database Mock / Seed Data Script
-- Optimized with Custom ENUMs & Directly Mapped to District
-- Target Location Focus: Indore, Madhya Pradesh
-- ==========================================

-- Clean up any existing data (ordered by dependency)
TRUNCATE TABLE demand_forecasts, alerts, equipment_inventory, equipments,
               test_availability, diagnostic_tests, redistribution_recommendations,
               stock_transactions, stock_inventory, medicines, patient_footfall, patients,
               beds, duty_rosters, doctor_attendance, doctors, users,
               health_centres, districts RESTART IDENTITY CASCADE;

-- 1. Insert Districts
INSERT INTO districts (name, state) VALUES
('Indore', 'Madhya Pradesh');

-- 2. Insert Health Centres (6 CHCs and 25 PHCs from MP Health Directory, linked directly to District ID 1)
INSERT INTO health_centres (name, type, district_id, address, pincode, contact_no, latitude, longitude) VALUES
-- Community Health Centres (CHCs)
('CHC Depalpur', 'CHC', 1, 'Betma Road, Depalpur', '453115', '07322-220001', 22.8465, 75.5412),
('CHC Betma', 'CHC', 1, 'Pura Bazar, Betma', '453001', '07322-260100', 22.6841, 75.6121),
('CHC Manpur', 'CHC', 1, 'Labad-Manpur Highway, Manpur', '453661', '07324-275102', 22.4271, 75.6179),
('CHC Sanwer', 'CHC', 1, 'Ujjain Road, Sanwer', '453551', '0731-287103', 22.9774, 75.8271),
('CHC Hatod', 'CHC', 1, 'Major District Road, Hatod', '453111', '0731-283104', 22.7981, 75.7251),
('CHC Mangilal Churiya', 'CHC', 1, 'Nanda Nagar, Indore Urban', '452011', '0731-255105', 22.7482, 75.8791),

-- Primary Health Centres (PHCs)
('PHC Hatod', 'PHC', 1, 'Hatod Town, Indore', '453111', '9876543201', 22.7990, 75.7260),
('PHC Piwadai', 'PHC', 1, 'Piwadai Village, Indore', '452016', '9876543202', 22.7052, 75.9810),
('PHC Rajendranagar', 'PHC', 1, 'Rajendra Nagar, Indore Urban', '452012', '9876543203', 22.6782, 75.8241),
('PHC Bhicholi Hapsi', 'PHC', 1, 'Bhicholi Hapsi, Bypass Road', '452016', '9876543204', 22.7154, 75.9189),
('PHC M.O.G. Line', 'PHC', 1, 'M.O.G. Line, Indore City', '452002', '9876543205', 22.7112, 75.8451),
('PHC Holkar College', 'PHC', 1, 'Holkar College Campus, Indore', '452001', '9876543206', 22.7011, 75.8710),
('PHC Kanadia', 'PHC', 1, 'Kanadia Village, Indore', '452016', '9876543207', 22.7290, 75.9410),
('PHC Tillor Khurd', 'PHC', 1, 'Tillor Khurd, Indore Rural', '452020', '9876543208', 22.6102, 75.9721),
('PHC Bhagora', 'PHC', 1, 'Bhagora Village, Mhow', '453441', '9876543209', 22.5020, 75.8110),
('PHC Harsola', 'PHC', 1, 'Harsola Village, Mhow', '453441', '9876543210', 22.5312, 75.7912),
('PHC Gawli Palasia', 'PHC', 1, 'Gawli Palasia, Mhow', '453441', '9876543211', 22.5710, 75.7621),
('PHC Koderia', 'PHC', 1, 'Koderia, Mhow', '453441', '9876543212', 22.5152, 75.7312),
('PHC Hasalpur', 'PHC', 1, 'Hasalpur, Mhow', '453441', '9876543213', 22.4691, 75.7410),
('PHC Simrol', 'PHC', 1, 'Khandwa Road, Simrol', '452020', '9876543214', 22.5290, 75.9221),
('PHC Dhannad', 'PHC', 1, 'Dhannad, Depalpur Road', '453001', '9876543215', 22.6991, 75.6481),
('PHC Jalodia Gyan', 'PHC', 1, 'Jalodia Gyan, Depalpur', '453551', '9876543216', 22.8821, 75.6021),
('PHC Ataheda', 'PHC', 1, 'Ataheda Village, Depalpur', '453115', '9876543217', 22.9102, 75.5210),
('PHC Goutampura', 'PHC', 1, 'Goutampura Town, Depalpur', '453220', '9876543218', 22.9810, 75.4891),
('PHC Chandrawatiganj', 'PHC', 1, 'Chandrawatiganj, Sanwer', '453551', '9876543219', 23.0112, 75.6981),
('PHC Dakachia', 'PHC', 1, 'Dewas Road, Dakachia', '453771', '9876543220', 22.8410, 75.9712),
('PHC Palia', 'PHC', 1, 'Palia Railway Station Area', '453551', '9876543221', 22.9090, 75.8010),
('PHC Kshipra', 'PHC', 1, 'Kshipra Village, Dewas Road', '453771', '9876543222', 22.8890, 75.9921),
('PHC Kampel', 'PHC', 1, 'Kampel Road, Khudel Tehsil', '452020', '9876543223', 22.6510, 76.0121),
('PHC Palasia Par', 'PHC', 1, 'Palasia Par, Sanwer Rural', '453551', '9876543224', 22.9610, 75.7610),
('PHC Kudana', 'PHC', 1, 'Kudana Village, Sanwer', '453551', '9876543225', 22.9512, 75.8610);

-- 3. Insert Medicines Catalog (105 items)
INSERT INTO medicines (name, generic_name, category, dosage_form) VALUES
-- Analgesics & Antipyretics
('Paracetamol 650mg', 'Paracetamol', 'Analgesic/Antipyretic', 'Tablet'),
('Paracetamol 125mg/5ml', 'Paracetamol', 'Analgesic/Antipyretic', 'Syrup'),
('Ibuprofen 400mg', 'Ibuprofen', 'Analgesic/Antipyretic', 'Tablet'),
('Diclofenac Sodium 75mg/3ml', 'Diclofenac', 'Analgesic/Antipyretic', 'Injection'),
('Diclofenac Gel 1%', 'Diclofenac', 'Analgesic/Antipyretic', 'Topical'),
('Tramadol 50mg', 'Tramadol', 'Analgesic/Antipyretic', 'Capsule'),
('Aspirin 75mg', 'Aspirin', 'Analgesic/Antipyretic', 'Tablet'),
-- Antibiotics & Anti-Infectives
('Amoxicillin 500mg', 'Amoxicillin', 'Antibiotic', 'Capsule'),
('Amoxicillin 125mg/5ml', 'Amoxicillin', 'Antibiotic', 'Dry Syrup'),
('Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 'Tablet'),
('Ciprofloxacin 500mg', 'Ciprofloxacin', 'Antibiotic', 'Tablet'),
('Doxycycline 100mg', 'Doxycycline', 'Antibiotic', 'Tablet'),
('Ceftriaxone 1g', 'Ceftriaxone', 'Antibiotic', 'Injection'),
('Ceftriaxone 250mg', 'Ceftriaxone', 'Antibiotic', 'Injection'),
('Metronidazole 400mg', 'Metronidazole', 'Antibiotic', 'Tablet'),
('Metronidazole Infusion 500mg/100ml', 'Metronidazole', 'Antibiotic', 'IV Fluid'),
('Norfloxacin 400mg', 'Norfloxacin', 'Antibiotic', 'Tablet'),
('Gentamicin 80mg/2ml', 'Gentamicin', 'Antibiotic', 'Injection'),
('Erythromycin 250mg', 'Erythromycin', 'Antibiotic', 'Tablet'),
('Cotrimoxazole 480mg', 'Cotrimoxazole', 'Antibiotic', 'Tablet'),
-- Antifungals & Antivirals
('Fluconazole 150mg', 'Fluconazole', 'Antifungal', 'Tablet'),
('Clotrimazole Cream 1%', 'Clotrimazole', 'Antifungal', 'Topical'),
('Ketoconazole Shampoo 2%', 'Ketoconazole', 'Antifungal', 'Topical'),
('Acyclovir 400mg', 'Acyclovir', 'Antiviral', 'Tablet'),
('Acyclovir Ointment 5%', 'Acyclovir', 'Antiviral', 'Topical'),
-- Antimalarials & Antiparasitics
('Chloroquine Phosphate 250mg', 'Chloroquine', 'Antimalarial', 'Tablet'),
('Artemether 80mg + Lumefantrine 480mg', 'Artemether + Lumefantrine', 'Antimalarial', 'Tablet'),
('Primaquine 7.5mg', 'Primaquine', 'Antimalarial', 'Tablet'),
('Primaquine 15mg', 'Primaquine', 'Antimalarial', 'Tablet'),
('Artesunate 60mg', 'Artesunate', 'Antimalarial', 'Injection'),
('Albendazole 400mg', 'Albendazole', 'Anthelmintic', 'Tablet'),
('Mebendazole 100mg', 'Mebendazole', 'Anthelmintic', 'Tablet'),
-- Anti-Tuberculosis (TB) Drugs
('Isoniazid 100mg', 'Isoniazid', 'Anti-TB', 'Tablet'),
('Rifampicin 150mg', 'Rifampicin', 'Anti-TB', 'Capsule'),
('Pyrazinamide 500mg', 'Pyrazinamide', 'Anti-TB', 'Tablet'),
('Ethambutol 400mg', 'Ethambutol', 'Anti-TB', 'Tablet'),
-- Gastrointestinal Medicines
('Omeprazole 20mg', 'Omeprazole', 'Gastrointestinal', 'Capsule'),
('Ranitidine 150mg', 'Ranitidine', 'Gastrointestinal', 'Tablet'),
('Ranitidine 50mg/2ml', 'Ranitidine', 'Gastrointestinal', 'Injection'),
('Domperidone 10mg', 'Domperidone', 'Gastrointestinal', 'Tablet'),
('Ondansetron 4mg', 'Ondansetron', 'Gastrointestinal', 'Tablet'),
('Ondansetron 2mg/ml', 'Ondansetron', 'Gastrointestinal', 'Injection'),
('ORS Sachets', 'Oral Rehydration Salts', 'Rehydration', 'Powder'),
('Zinc Sulfate 20mg', 'Zinc Sulfate', 'Nutritional/GI', 'Tablet'),
('Dicyclomine 10mg', 'Dicyclomine', 'Gastrointestinal', 'Tablet'),
('Loperamide 2mg', 'Loperamide', 'Gastrointestinal', 'Tablet'),
('Bisacodyl 5mg', 'Bisacodyl', 'Gastrointestinal', 'Tablet'),
-- Cardiovascular & Antihypertensives
('Amlodipine 5mg', 'Amlodipine', 'Cardiovascular', 'Tablet'),
('Amlodipine 10mg', 'Amlodipine', 'Cardiovascular', 'Tablet'),
('Atenolol 50mg', 'Atenolol', 'Cardiovascular', 'Tablet'),
('Enalapril 5mg', 'Enalapril', 'Cardiovascular', 'Tablet'),
('Losartan Potassium 50mg', 'Losartan', 'Cardiovascular', 'Tablet'),
('Metoprolol Succinate 25mg', 'Metoprolol', 'Cardiovascular', 'Tablet'),
('Furosemide 40mg', 'Furosemide', 'Cardiovascular', 'Tablet'),
('Furosemide 20mg/2ml', 'Furosemide', 'Cardiovascular', 'Injection'),
('Atorvastatin 10mg', 'Atorvastatin', 'Cardiovascular', 'Tablet'),
('Clopidogrel 75mg', 'Clopidogrel', 'Cardiovascular', 'Tablet'),
('Glyceryl Trinitrate 0.5mg', 'Glyceryl Trinitrate', 'Cardiovascular', 'Tablet'),
-- Antidiabetics
('Metformin 500mg', 'Metformin', 'Antidiabetic', 'Tablet'),
('Metformin 1000mg', 'Metformin', 'Antidiabetic', 'Tablet'),
('Glimepiride 1mg', 'Glimepiride', 'Antidiabetic', 'Tablet'),
('Glimepiride 2mg', 'Glimepiride', 'Antidiabetic', 'Tablet'),
('Human Insulin Soluble 40 IU/ml', 'Insulin', 'Antidiabetic', 'Injection'),
('Human Insulin Isophane 40 IU/ml', 'Insulin', 'Antidiabetic', 'Injection'),
-- Respiratory & Antiallergics
('Salbutamol Nebulizer Solution 5mg/ml', 'Salbutamol', 'Respiratory', 'Inhalation'),
('Salbutamol Inhaler 100mcg', 'Salbutamol', 'Respiratory', 'Inhaler'),
('Budesonide Inhaler 200mcg', 'Budesonide', 'Respiratory', 'Inhaler'),
('Ipratropium Respirator Solution', 'Ipratropium', 'Respiratory', 'Inhalation'),
('Montelukast 10mg + Levocetirizine 5mg', 'Montelukast + Levocetirizine', 'Respiratory', 'Tablet'),
('Dextromethorphan Syrup 10mg/5ml', 'Dextromethorphan', 'Respiratory', 'Syrup'),
('Cetirizine 10mg', 'Cetirizine', 'Antihistamine', 'Tablet'),
('Pheniramine Maleate 22.75mg/ml', 'Pheniramine', 'Antihistamine', 'Injection'),
-- Hormones & Steroids
('Thyroxine Sodium 50mcg', 'Thyroxine', 'Hormonal', 'Tablet'),
('Thyroxine Sodium 100mcg', 'Thyroxine', 'Hormonal', 'Tablet'),
('Dexamethasone 4mg/ml', 'Dexamethasone', 'Steroid', 'Injection'),
('Prednisolone 5mg', 'Prednisolone', 'Steroid', 'Tablet'),
('Hydrocortisone Sodium Succinate 100mg', 'Hydrocortisone', 'Steroid', 'Injection'),
-- Anticonvulsants & Sedatives
('Phenytoin Sodium 100mg', 'Phenytoin', 'Anticonvulsant', 'Tablet'),
('Carbamazepine 200mg', 'Carbamazepine', 'Anticonvulsant', 'Tablet'),
('Diazepam 5mg', 'Diazepam', 'Sedative', 'Tablet'),
('Diazepam 10mg/2ml', 'Diazepam', 'Sedative', 'Injection'),
('Lorazepam 2mg', 'Lorazepam', 'Sedative', 'Tablet'),
-- Vaccines & Immunologicals
('BCG Vaccine', 'BCG', 'Vaccine', 'Injection'),
('Oral Polio Vaccine (OPV)', 'OPV', 'Vaccine', 'Oral Drop'),
('Rotavirus Vaccine', 'Rotavirus Vaccine', 'Vaccine', 'Oral Drop'),
('Tetanus Toxoid (TT)', 'Tetanus Toxoid', 'Vaccine', 'Injection'),
('Anti-Rabies Vaccine (ARV)', 'Rabies Vaccine', 'Vaccine', 'Injection'),
('DPT Vaccine', 'DPT', 'Vaccine', 'Injection'),
('Measles-Rubella (MR) Vaccine', 'MR Vaccine', 'Vaccine', 'Injection'),
('Covishield Vaccine', 'COVID-19 Vaccine', 'Vaccine', 'Injection'),
-- Intravenous (IV) Fluids
('Normal Saline (0.9% NaCl)', 'Normal Saline', 'IV Fluid', 'Infusion'),
('Ringer''s Lactate (RL)', 'Ringer''s Lactate', 'IV Fluid', 'Infusion'),
('Dextrose 5%', 'Dextrose', 'IV Fluid', 'Infusion'),
('Dextrose 10%', 'Dextrose', 'IV Fluid', 'Infusion'),
('Dextrose 5% in Normal Saline (DNS)', 'DNS', 'IV Fluid', 'Infusion'),
-- Nutritional Supplements & Vitamins
('Iron + Folic Acid (IFA)', 'Iron + Folic Acid', 'Nutritional', 'Tablet'),
('Calcium Carbonate + Vitamin D3', 'Calcium + Vitamin D3', 'Nutritional', 'Tablet'),
('Vitamin A Capsule 100,000 IU', 'Vitamin A', 'Nutritional', 'Capsule'),
('Vitamin C (Ascorbic Acid) 500mg', 'Vitamin C', 'Nutritional', 'Tablet'),
('Vitamin B-Complex', 'B-Complex', 'Nutritional', 'Tablet'),
-- Topical & Contraceptives
('Povidone-Iodine Ointment 5%', 'Povidone-Iodine', 'Dermatological', 'Topical'),
('Silver Sulfadiazine Cream 1%', 'Silver Sulfadiazine', 'Dermatological', 'Topical'),
('Permethrin Cream 5%', 'Permethrin', 'Dermatological', 'Topical'),
('Condoms', 'Condoms', 'Contraceptive', 'Barrier'),
('Oral Contraceptive Pills (Mala-D)', 'Mala-D', 'Contraceptive', 'Tablet');

-- 4. Insert Diagnostic Tests Catalog
INSERT INTO diagnostic_tests (name, category) VALUES
('Complete Blood Count (CBC)', 'Pathology'),
('Malaria Rapid Diagnostic Test (RDT)', 'Pathology'),
('Sputum Smear (TB Test)', 'Pathology'),
('Chest X-Ray', 'Radiology'),
('Abdominal Ultrasound', 'Radiology'),
('Urine Routine Analysis', 'Pathology'),
('Random Blood Sugar (RBS)', 'Pathology');

-- 5. Insert Equipments Catalog (25 entries, using alert_severity Enum: Critical, High/Important, Low/Basic)
INSERT INTO equipments (name, criticality, description) VALUES
('Ice Lined Refrigerator (ILR)', 'Critical', 'Cold-chain refrigerator for storing vaccines between 2 and 8 degrees C.'),
('Deep Freezer', 'Critical', 'Used for freezing ice packs used in vaccine carriers.'),
('Ventilator', 'Critical', 'ICU-grade life support ventilator for critical respiratory care.'),
('Baby Incubator', 'Critical', 'Neonatal incubator to maintain environmental conditions for premature babies.'),
('Radiant Warmer', 'Critical', 'Body temperature regulator for newborns.'),
('ECG Machine (12-Lead)', 'High', '12-lead electrocardiograph for cardiovascular checkups.'),
('X-Ray Machine (100mA)', 'High', 'Diagnostic radiography imaging machine.'),
('Ultrasound Machine (Color Doppler)', 'High', 'Medical imaging device for obstetrics and abdominal scans.'),
('Defibrillator', 'High', 'Electrical shock device for cardiac resuscitation.'),
('Patient Monitor (Multipara)', 'High', 'Multi-parameter bedside monitor tracking vitals.'),
('Oxygen Concentrator (10 LPM)', 'High', 'Medical oxygen delivery device producing 10 Litres Per Minute.'),
('Electric Suction Machine', 'High', 'Aspirator device to clear bodily fluids and airways.'),
('Autoclave (Steam Sterilizer)', 'High', 'Double-drum steam autoclave for sterilizing medical tools.'),
('Nebulizer (Compressor)', 'High', 'Drug delivery device for inhaling medication aerosol for asthma/COPD.'),
('Hematology Analyzer (3-part)', 'High', 'Automated hematology cell counter for CBC profiles.'),
('Biochemistry Analyzer', 'High', 'Semi-automated blood chemistry analyzer for LFT/KFT tests.'),
('Dental Chair with X-ray', 'High', 'Fully adjustable dental unit with dedicated oral radiography.'),
('Digital BP Monitor', 'Low', 'Oscillometric electronic blood pressure monitor.'),
('Mercury-Free Sphygmomanometer', 'Low', 'Manual dial sphygmomanometer for clinic blood pressure measurement.'),
('Pulse Oximeter (Handheld)', 'Low', 'Handheld arterial blood oxygen saturation checker.'),
('Blood Glucometer', 'Low', 'Handheld digital blood glucose testing kit.'),
('Binocular Microscope', 'Low', 'Laboratory light microscope for smears and cell examination.'),
('Centrifuge Machine (Laboratory)', 'Low', 'Laboratory rotor centrifuge for tube separation.'),
('Digital Thermometer', 'Low', 'Handheld digital thermometer for body temperatures.'),
('Stretcher Trolley', 'Low', 'Wheeled patient emergency transfer stretcher.');

-- 6. Insert Users (Total 70+ Users: 1 District Admin, 31 Managers, 53 Doctors, 10 Citizens, 6 Pharmacists, 6 LabTechs)
-- Super Admin / District Admin
INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode) VALUES
('Dr. Anurag Dixit (CMHO)', 'anurag.cmho@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'DistrictAdmin', NULL, '452001');

-- Managers for the 6 CHCs
INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode) VALUES
('Rajesh Nagar (Depalpur Manager)', 'manager.depalpur@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'CenterManager', 1, '453115'),
('Sanjay Gupta (Betma Manager)', 'manager.betma@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'CenterManager', 2, '453001'),
('Vinay Chouhan (Manpur Manager)', 'manager.manpur@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'CenterManager', 3, '453661'),
('Ashok Patidar (Sanwer Manager)', 'manager.sanwer@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'CenterManager', 4, '453551'),
('Kamlesh Dave (Hatod CHC Manager)', 'manager.hatodchc@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'CenterManager', 5, '453111'),
('Mahesh Sharma (Churiya Manager)', 'manager.churiya@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'CenterManager', 6, '452011');

-- Managers for the 25 PHCs (Inserting dynamically for ID 7 to 31)
INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode)
SELECT 
    'Manager PHC ' || hc.name,
    'manager.' || LOWER(REPLACE(hc.name, ' ', '')) || '@smarthealth.gov.in',
    '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6',
    'CenterManager',
    hc.id,
    hc.pincode
FROM health_centres hc
WHERE hc.type = 'PHC';

-- Pharmacists for the 6 CHCs
INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode) VALUES
('Ramesh Kumar (Depalpur Pharmacist)', 'pharm.depalpur@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 1, '453115'),
('Shyam Lal (Betma Pharmacist)', 'pharm.betma@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 2, '453001'),
('Ganesh Das (Manpur Pharmacist)', 'pharm.manpur@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 3, '453661'),
('Vikram Singh (Sanwer Pharmacist)', 'pharm.sanwer@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 4, '453551'),
('Pradeep Joshi (Hatod Pharmacist)', 'pharm.hatodchc@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 5, '453111'),
('Anil Verma (Churiya Pharmacist)', 'pharm.churiya@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 6, '452011');

-- Pharmacists for the 25 PHCs
INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode) VALUES
('Sanjay Sharma (PHC Hatod Pharmacist)', 'pharm.hatod@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 7, '453111'),
('Rahul Piwadai (PHC Piwadai Pharmacist)', 'pharm.piwadai@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 8, '452016'),
('Anil Rajendra (PHC Rajendranagar Pharmacist)', 'pharm.rajendranagar@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 9, '452012'),
('Sunil Hapsi (PHC Bhicholi Hapsi Pharmacist)', 'pharm.bhicholihapsi@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 10, '452016'),
('Vijay MOG (PHC M.O.G. Line Pharmacist)', 'pharm.m.o.g.line@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 11, '452002'),
('Kamlesh Holkar (PHC Holkar College Pharmacist)', 'pharm.holkarcollege@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 12, '452001'),
('Rajesh Kanadia (PHC Kanadia Pharmacist)', 'pharm.kanadia@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 13, '452016'),
('Deepak Tillor (PHC Tillor Khurd Pharmacist)', 'pharm.tillorkhurd@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 14, '452020'),
('Mahesh Bhagora (PHC Bhagora Pharmacist)', 'pharm.bhagora@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 15, '453441'),
('Kamal Harsola (PHC Harsola Pharmacist)', 'pharm.harsola@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 16, '453441'),
('Dinesh Palasia (PHC Gawli Palasia Pharmacist)', 'pharm.gawlipalasia@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 17, '453441'),
('Vikram Koderia (PHC Koderia Pharmacist)', 'pharm.koderia@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 18, '453441'),
('Amit Hasalpur (PHC Hasalpur Pharmacist)', 'pharm.hasalpur@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 19, '453441'),
('Suresh Simrol (PHC Simrol Pharmacist)', 'pharm.simrol@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 20, '452020'),
('Gopal Dhannad (PHC Dhannad Pharmacist)', 'pharm.dhannad@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 21, '453001'),
('Manoj Jalodia (PHC Jalodia Gyan Pharmacist)', 'pharm.jalodiagyan@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 22, '453551'),
('Arjun Ataheda (PHC Ataheda Pharmacist)', 'pharm.ataheda@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 23, '453115'),
('Shyam Goutampura (PHC Goutampura Pharmacist)', 'pharm.goutampura@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 24, '453220'),
('Karan Chandrawatiganj (PHC Chandrawatiganj Pharmacist)', 'pharm.chandrawatiganj@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 25, '453551'),
('Pradeep Dakachia (PHC Dakachia Pharmacist)', 'pharm.dakachia@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 26, '453771'),
('Vinod Palia (PHC Palia Pharmacist)', 'pharm.palia@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 27, '453551'),
('Ramesh Kshipra (PHC Kshipra Pharmacist)', 'pharm.kshipra@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 28, '453771'),
('Manish Kampel (PHC Kampel Pharmacist)', 'pharm.kampel@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 29, '452020'),
('Sandeep PalasiaPar (PHC Palasia Par Pharmacist)', 'pharm.palasiapar@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 30, '453551'),
('Preeti Kudana (PHC Kudana Pharmacist)', 'pharm.kudana@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'Pharmacist', 31, '453551');

-- Lab Technicians for the 6 CHCs
INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode) VALUES
('Pooja Sen (Depalpur LabTech)', 'lab.depalpur@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'LabTechnician', 1, '453115'),
('Ritu Verma (Betma LabTech)', 'lab.betma@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'LabTechnician', 2, '453001'),
('Sunita Patil (Manpur LabTech)', 'lab.manpur@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'LabTechnician', 3, '453661'),
('Manish Vyas (Sanwer LabTech)', 'lab.sanwer@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'LabTechnician', 4, '453551'),
('Deepak Soni (Hatod LabTech)', 'lab.hatodchc@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'LabTechnician', 5, '453111'),
('Kiran Solanki (Churiya LabTech)', 'lab.churiya@smarthealth.gov.in', '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6', 'LabTechnician', 6, '452011');


-- Doctors: 25 PHC Doctors (1 per PHC)
DO $$
DECLARE
    hc RECORD;
    new_user_id INT;
    doc_license_index INT := 10001;
    names VARCHAR[] := ARRAY[
        'Dr. Rajesh Kumar', 'Dr. Sunita Sharma', 'Dr. Anil Verma', 'Dr. Neha Gupta', 'Dr. Sanjay Patel',
        'Dr. Priya Joshi', 'Dr. Ramesh Singh', 'Dr. Swati Chouhan', 'Dr. Vijay Patidar', 'Dr. Kamlesh Dave',
        'Dr. Mahesh Sharma', 'Dr. Ritu Trivedi', 'Dr. Vikram Rathore', 'Dr. Sneha Shah', 'Dr. Arjun Pandey',
        'Dr. Divya Mishra', 'Dr. Deepak Yadav', 'Dr. Shalini Dubey', 'Dr. Manish Soni', 'Dr. Sunita Solanki',
        'Dr. Vinay Deshmukh', 'Dr. Neha Agarwal', 'Dr. Amit Choudhary', 'Dr. Sandeep Naik', 'Dr. Preeti Joshi'
    ];
    name_idx INT := 1;
BEGIN
    FOR hc IN SELECT id, name, pincode FROM health_centres WHERE type = 'PHC' LOOP
        -- Insert user record
        INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode, preferred_language)
        VALUES (
            names[name_idx],
            'doc.' || LOWER(REPLACE(SUBSTRING(names[name_idx] FROM 5), ' ', '')) || '@smarthealth.gov.in',
            '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6',
            'Doctor',
            hc.id,
            hc.pincode,
            'hi'
        ) RETURNING id INTO new_user_id;

        -- Insert doctor metadata
        INSERT INTO doctors (user_id, specialization, degree, license_no, status)
        VALUES (
            new_user_id,
            'General Physician (Medical Officer)',
            'MBBS',
            'MP-MC-' || doc_license_index,
            'Active'
        );
        doc_license_index := doc_license_index + 1;
        name_idx := name_idx + 1;
    END LOOP;
END $$;

-- Doctors: 28 CHC Doctors (Gynecologists, Pediatricians, Surgeons, General Physicians, Orthopedics)
-- Distributed across the 6 CHCs.
-- CHC IDs: 1 (Depalpur), 2 (Betma), 3 (Manpur), 4 (Sanwer), 5 (Hatod), 6 (Churiya)
DO $$
DECLARE
    chc_ids INT[] := ARRAY[1, 2, 3, 4, 5, 6];
    specs VARCHAR[] := ARRAY['Obstetrics & Gynecology', 'Pediatrics', 'General Surgery', 'General Medicine', 'Orthopedics'];
    chc_id INT;
    spec VARCHAR;
    new_user_id INT;
    doc_license_index INT := 20001;
    docs_to_add INT;
    i INT;
    chc_name VARCHAR;
    chc_pincode VARCHAR;
    doc_degree VARCHAR;
    names VARCHAR[] := ARRAY[
        'Dr. Vivek Saxena', 'Dr. Pooja Mehta', 'Dr. Rahul Shrivastava', 'Dr. Kavita Rao', 'Dr. Devendra Mishra',
        'Dr. Kiran Patil', 'Dr. Nitin Gawde', 'Dr. Manoj Deshpande', 'Dr. Archana Kulkarni', 'Dr. Suresh Bhat',
        'Dr. Harish Iyer', 'Dr. Gopal Pillai', 'Dr. Madhavan Nair', 'Dr. Anand Krishnan', 'Dr. Radha Menon',
        'Dr. Prakash Hegde', 'Dr. Venkat Raman', 'Dr. Karthik Subramanian', 'Dr. Balaji Srinivasan', 'Dr. Ranganathan Swamy',
        'Dr. Sridhar Murthy', 'Dr. Prabhakar Reddy', 'Dr. Sekhar Babu', 'Dr. Krishna Rao', 'Dr. Mohan Prasad',
        'Dr. Ramachandran Pillai', 'Dr. Narayanan Kutty', 'Dr. Subramaniam Iyer', 'Dr. Viswanathan Chettiar', 'Dr. Chandrasekharan Nair'
    ];
    name_idx INT := 1;
BEGIN
    FOREACH chc_id IN ARRAY chc_ids LOOP
        SELECT name, pincode INTO chc_name, chc_pincode FROM health_centres WHERE id = chc_id;
        -- 5 doctors for CHCs 1, 3, 4, 6 and 4 doctors for CHCs 2, 5 (Total = 5*4 + 4*2 = 28 doctors)
        IF chc_id IN (1, 3, 4, 6) THEN
            docs_to_add := 5;
        ELSE
            docs_to_add := 4;
        END IF;

        FOR i IN 1..docs_to_add LOOP
            spec := specs[((i - 1) % 5) + 1];
            
            IF spec = 'Obstetrics & Gynecology' THEN
                doc_degree := 'MD (OBG)';
            ELSIF spec = 'Pediatrics' THEN
                doc_degree := 'MD (Pediatrics)';
            ELSIF spec = 'General Surgery' THEN
                doc_degree := 'MS (Surgery)';
            ELSIF spec = 'General Medicine' THEN
                doc_degree := 'MD (Medicine)';
            ELSIF spec = 'Orthopedics' THEN
                doc_degree := 'MS (Orthopedics)';
            ELSE
                doc_degree := 'MBBS';
            END IF;

            -- Insert user record
            INSERT INTO users (name, email, password_hash, role, health_centre_id, pincode, preferred_language)
            VALUES (
                names[name_idx],
                'doc.' || LOWER(REPLACE(SUBSTRING(names[name_idx] FROM 5), ' ', '')) || chc_id || '@smarthealth.gov.in',
                '$2b$10$dd4V5rvfOsW0VoPVVHgMguYOGAPrNklgxS2i4Q6TgG8W1JUB8UbU6',
                'Doctor',
                chc_id,
                chc_pincode,
                'en'
            ) RETURNING id INTO new_user_id;

            -- Insert doctor metadata
            INSERT INTO doctors (user_id, specialization, degree, license_no, status)
            VALUES (
                new_user_id,
                spec,
                doc_degree,
                'MP-MC-' || doc_license_index,
                'Active'
            );
            doc_license_index := doc_license_index + 1;
            name_idx := name_idx + 1;
        END LOOP;
    END LOOP;
END $$;

-- 7. Insert Bed Inventories Mapped dynamically for all 31 health centres
-- PHCs (IDs 7 to 31) get 6 beds each: 4 General Wards, 2 Maternity Wards
-- CHCs (IDs 1 to 6) get 30 beds each: 15 General, 5 Maternity, 5 ICU, 5 Emergency
DO $$
DECLARE
    hc RECORD;
    i INT;
    bed_status VARCHAR;
BEGIN
    FOR hc IN SELECT id, type FROM health_centres LOOP
        IF hc.type = 'PHC' THEN
            -- General Wards (4 beds)
            FOR i IN 1..4 LOOP
                -- Distribute status: 3 Available, 1 Occupied
                IF i = 4 THEN bed_status := 'Occupied'; ELSE bed_status := 'Available'; END IF;
                INSERT INTO beds (health_centre_id, ward_name, bed_type, status, bed_number)
                VALUES (hc.id, 'General Ward', 'General', bed_status::bed_status, 'GW-0' || i);
            END LOOP;
            -- Maternity Wards (2 beds)
            FOR i IN 1..2 LOOP
                IF i = 2 THEN bed_status := 'Occupied'; ELSE bed_status := 'Available'; END IF;
                INSERT INTO beds (health_centre_id, ward_name, bed_type, status, bed_number)
                VALUES (hc.id, 'Maternity Ward', 'Maternity', bed_status::bed_status, 'MW-0' || i);
            END LOOP;
        ELSE -- CHC
            -- General Wards (15 beds)
            FOR i IN 1..15 LOOP
                -- Distribute status: 10 Occupied, 5 Available
                IF i <= 10 THEN bed_status := 'Occupied'; ELSE bed_status := 'Available'; END IF;
                INSERT INTO beds (health_centre_id, ward_name, bed_type, status, bed_number)
                VALUES (hc.id, 'General Ward', 'General', bed_status::bed_status, 'GW-' || (100 + i));
            END LOOP;
            -- Maternity Wards (5 beds)
            FOR i IN 1..5 LOOP
                IF i <= 3 THEN bed_status := 'Occupied'; ELSE bed_status := 'Available'; END IF;
                INSERT INTO beds (health_centre_id, ward_name, bed_type, status, bed_number)
                VALUES (hc.id, 'Maternity Ward', 'Maternity', bed_status::bed_status, 'MW-' || (100 + i));
            END LOOP;
            -- ICU Wards (5 beds)
            FOR i IN 1..5 LOOP
                -- For CHC Depalpur (ID 1), fill up all ICU beds to trigger ICU bed shortage!
                IF hc.id = 1 THEN
                    bed_status := 'Occupied';
                ELSE
                    IF i <= 2 THEN bed_status := 'Occupied'; ELSE bed_status := 'Available'; END IF;
                END IF;
                INSERT INTO beds (health_centre_id, ward_name, bed_type, status, bed_number)
                VALUES (hc.id, 'ICU Ward', 'ICU', bed_status::bed_status, 'ICU-' || (100 + i));
            END LOOP;
            -- Emergency Wards (5 beds)
            FOR i IN 1..5 LOOP
                -- One bed under maintenance
                IF i = 5 THEN bed_status := 'Maintenance';
                ELSIF i <= 3 THEN bed_status := 'Occupied';
                ELSE bed_status := 'Available'; END IF;
                INSERT INTO beds (health_centre_id, ward_name, bed_type, status, bed_number)
                VALUES (hc.id, 'Emergency Ward', 'Emergency', bed_status::bed_status, 'ER-' || (100 + i));
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 8. Insert Equipment Inventories
DO $$
DECLARE
    hc RECORD;
    eq_id INT;
    eq_status VARCHAR;
    serial_index INT := 10001;
BEGIN
    FOR hc IN SELECT id, type FROM health_centres LOOP
        -- For CHCs, install almost all equipments
        IF hc.type = 'CHC' THEN
            FOR eq_id IN 1..25 LOOP
                -- Generate status. A few breakdowns:
                -- Refrigerator (eq_id 1) fails at CHC Mangilal Churiya (ID 6)
                IF hc.id = 6 AND eq_id = 1 THEN
                    eq_status := 'NeedsMaintenance';
                -- X-Ray (eq_id 7) fails at CHC Sanwer (ID 4)
                ELSIF hc.id = 4 AND eq_id = 7 THEN
                    eq_status := 'Broken';
                ELSE
                    eq_status := 'Operational';
                END IF;

                INSERT INTO equipment_inventory (health_centre_id, equipment_id, serial_no, status, last_inspected_at, notes)
                VALUES (
                    hc.id,
                    eq_id,
                    'IND-' || eq_id || '-' || (serial_index % 100000), -- Optimized fit inside VARCHAR(25)
                    eq_status::equipment_status,
                    CURRENT_TIMESTAMP - INTERVAL '10 days',
                    CASE WHEN eq_status <> 'Operational' THEN 'Alert raised for servicing.' ELSE 'Working fine.' END
                );
                serial_index := serial_index + 1;
            END LOOP;
        ELSE -- PHC: Installs basic & important equipment (omit heavy ones like Ventilator (3), Baby Incubator (4), Ultrasound (8), Hematology (15), Dental Chair (17))
            FOREACH eq_id IN ARRAY ARRAY[1,2,5,6,7,9,10,11,12,13,14,16,18,19,20,21,22,23,24,25] LOOP
                -- X-Ray machine (eq_id 7) is down at PHC Hatod (ID 7)
                IF hc.id = 7 AND eq_id = 7 THEN
                    eq_status := 'Broken';
                ELSE
                    eq_status := 'Operational';
                END IF;

                INSERT INTO equipment_inventory (health_centre_id, equipment_id, serial_no, status, last_inspected_at, notes)
                VALUES (
                    hc.id,
                    eq_id,
                    'IND-' || eq_id || '-' || (serial_index % 100000), -- Optimized fit inside VARCHAR(25)
                    eq_status::equipment_status,
                    CURRENT_TIMESTAMP - INTERVAL '15 days',
                    CASE WHEN eq_status <> 'Operational' THEN 'Requires repair technician.' ELSE 'Operational.' END
                );
                serial_index := serial_index + 1;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 9. Generate 7 Days of Hour-by-Hour Patient Footfall Logs
INSERT INTO patient_footfall (health_centre_id, date, hourly_slot, outpatient_count, inpatient_count, emergency_count, avg_waiting_time_mins)
SELECT 
    hc.id AS health_centre_id,
    dt::date AS date,
    slot AS hourly_slot,
    -- Outpatient count math: peak during standard OPD hours
    CASE 
        WHEN slot BETWEEN 9 AND 12 THEN (CASE WHEN hc.type = 'CHC' THEN 20 ELSE 8 END) + ROUND(random() * (CASE WHEN hc.type = 'CHC' THEN 15 ELSE 5 END))::INT
        WHEN slot BETWEEN 17 AND 19 THEN (CASE WHEN hc.type = 'CHC' THEN 15 ELSE 6 END) + ROUND(random() * (CASE WHEN hc.type = 'CHC' THEN 10 ELSE 4 END))::INT
        ELSE ROUND(random() * (CASE WHEN hc.type = 'CHC' THEN 3 ELSE 1 END))::INT
    END AS outpatient_count,
    -- Inpatient counts (higher for CHCs)
    CASE 
        WHEN hc.type = 'CHC' AND slot IN (10, 11, 18) THEN 1 + ROUND(random() * 3)::INT
        WHEN hc.type = 'PHC' AND slot = 11 THEN ROUND(random() * 1)::INT
        ELSE 0
    END AS inpatient_count,
    -- Emergency counts (peak at night or late evening)
    CASE 
        WHEN slot BETWEEN 20 AND 23 THEN ROUND(random() * (CASE WHEN hc.type = 'CHC' THEN 3 ELSE 1 END))::INT
        WHEN slot BETWEEN 0 AND 4 THEN ROUND(random() * (CASE WHEN hc.type = 'CHC' THEN 1 ELSE 0 END))::INT
        ELSE ROUND(random() * (CASE WHEN hc.type = 'CHC' THEN 1 ELSE 0 END))::INT
    END AS emergency_count,
    -- Avg waiting time scales directly with outpatient count
    CASE 
        WHEN slot BETWEEN 9 AND 12 THEN 25 + ROUND(random() * 20)::INT
        WHEN slot BETWEEN 17 AND 19 THEN 15 + ROUND(random() * 15)::INT
        ELSE 5 + ROUND(random() * 5)::INT
    END AS avg_waiting_time_mins
FROM 
    health_centres hc,
    generate_series('2026-07-01'::date, '2026-07-10'::date, '1 day') dt,
    generate_series(0, 23) slot;

-- 10. Populate Doctor Rosters & Attendance for the last 3 days
DO $$
DECLARE
    doc RECORD;
    dt RECORD;
    shift_val VARCHAR;
    start_t TIME;
    end_t TIME;
    att_status VARCHAR;
    chkin TIMESTAMP WITH TIME ZONE;
    chkout TIMESTAMP WITH TIME ZONE;
BEGIN
    FOR doc IN SELECT d.id AS doctor_id, u.health_centre_id, u.name FROM doctors d JOIN users u ON d.user_id = u.id LOOP
        FOR dt IN SELECT generate_series(CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE, '1 day')::date AS day LOOP
            -- Assign shifts: Morning or General
            IF ((doc.doctor_id + extract(day from dt.day)::int) % 2) = 0 THEN
                shift_val := 'Morning';
                start_t := TIME '08:00:00';
                end_t := TIME '14:00:00';
            ELSE
                shift_val := 'General';
                start_t := TIME '09:00:00';
                end_t := TIME '17:00:00';
            END IF;

            -- Create Duty Roster
            INSERT INTO duty_rosters (user_id, date, shift_type, start_time, end_time)
            SELECT user_id, dt.day, shift_val::shift_type, start_t, end_t
            FROM doctors WHERE id = doc.doctor_id;

            -- Simulate Attendance status
            -- For CURRENT_DATE, let's keep some doctors as "Not Marked" (skip insertion)
            IF doc.name NOT LIKE '%Gawli Palasia%' AND dt.day = CURRENT_DATE AND random() < 0.40 THEN
                CONTINUE;
            END IF;

            -- Dr. PHC Gawli Palasia Doctor is absent today (Triggering alert)
            IF doc.name LIKE '%Gawli Palasia%' AND dt.day = CURRENT_DATE THEN
                att_status := 'Absent';
                chkin := NULL;
                chkout := NULL;
            -- Some random OnLeave (e.g. 5% chance)
            ELSIF random() < 0.05 THEN
                att_status := 'OnLeave';
                chkin := NULL;
                chkout := NULL;
            ELSE
                att_status := 'Present';
                chkin := dt.day + start_t + (random() * INTERVAL '15 minutes');
                chkout := dt.day + end_t + (random() * INTERVAL '10 minutes');
            END IF;

            -- Log Attendance
            INSERT INTO doctor_attendance (doctor_id, date, status, check_in_time, check_out_time)
            VALUES (doc.doctor_id, dt.day, att_status::attendance_status, chkin, chkout);
        END LOOP;
    END LOOP;
END $$;

-- 11. Insert live Stock Inventories
-- Medicine IDs: 1 (Para 650), 8 (Amox 500), 43 (ORS), 71 (Cetirizine), 90 (Covishield)
DO $$
DECLARE
    hc RECORD;
    med_id INT;
    curr_s INT;
    min_s INT;
    reorder_s INT;
BEGIN
    FOR hc IN SELECT id, type FROM health_centres LOOP
        -- For each of the 5 key medicines
        FOREACH med_id IN ARRAY ARRAY[1, 8, 43, 71, 90] LOOP
            IF med_id = 1 THEN -- Paracetamol 650mg
                -- CHC Mangilal Churiya (ID 6) has excess (Surplus)
                IF hc.id = 6 THEN
                    curr_s := 4000; min_s := 1000; reorder_s := 300;
                -- PHC Kampel (ID 29) has shortage
                ELSIF hc.id = 29 THEN
                    curr_s := 25; min_s := 400; reorder_s := 100;
                ELSE
                    curr_s := 500 + ROUND(random() * 500)::INT; min_s := 400; reorder_s := 100;
                END IF;
            ELSIF med_id = 8 THEN -- Amoxicillin 500mg
                -- PHC Simrol (ID 20) has shortage
                IF hc.id = 20 THEN
                    curr_s := 10; min_s := 300; reorder_s := 80;
                -- CHC Manpur (ID 3) has surplus
                ELSIF hc.id = 3 THEN
                    curr_s := 2500; min_s := 500; reorder_s := 150;
                ELSE
                    curr_s := 400 + ROUND(random() * 300)::INT; min_s := 300; reorder_s := 80;
                END IF;
            ELSIF med_id = 43 THEN -- ORS
                curr_s := 200 + ROUND(random() * 200)::INT; min_s := 150; reorder_s := 50;
            ELSIF med_id = 71 THEN -- Cetirizine 10mg
                -- PHC Kampel (ID 29) is completely stocked out! (Triggering critical alert)
                IF hc.id = 29 THEN
                    curr_s := 0; min_s := 200; reorder_s := 50;
                ELSE
                    curr_s := 250 + ROUND(random() * 200)::INT; min_s := 200; reorder_s := 50;
                END IF;
            ELSIF med_id = 90 THEN -- Covishield Vaccine
                -- PHC Simrol (ID 20) is critically low
                IF hc.id = 20 THEN
                    curr_s := 2; min_s := 100; reorder_s := 30;
                -- CHC Manpur (ID 3) has surplus
                ELSIF hc.id = 3 THEN
                    curr_s := 850; min_s := 200; reorder_s := 50;
                ELSE
                    curr_s := 150 + ROUND(random() * 150)::INT; min_s := 100; reorder_s := 30;
                END IF;
            END IF;

            INSERT INTO stock_inventory (health_centre_id, medicine_id, current_stock, min_required_stock, reorder_level)
            VALUES (hc.id, med_id, curr_s, min_s, reorder_s);
        END LOOP;
    END LOOP;
END $$;

-- 12. Insert Stock Transactions Audit Trail (Inflows & Outflows for last 7 days)
INSERT INTO stock_transactions (health_centre_id, medicine_id, transaction_type, quantity, transaction_date, notes)
SELECT 
    si.health_centre_id,
    si.medicine_id,
    -- Alternating inflows and outflows
    CASE WHEN (extract(day from dt.day)::int % 3) = 0 THEN 'Inflow'::transaction_type ELSE 'Outflow'::transaction_type END AS transaction_type,
    CASE WHEN (extract(day from dt.day)::int % 3) = 0 THEN 500 ELSE 45 END AS quantity,
    dt.day + TIME '10:00:00' + (random() * INTERVAL '4 hours') AS transaction_date,
    CASE WHEN (extract(day from dt.day)::int % 3) = 0 THEN 'Received from District Medical Store.' ELSE 'Dispensed to OPD patients.' END AS notes
FROM 
    stock_inventory si,
    (SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS day) dt
WHERE 
    si.health_centre_id IN (1, 3, 6, 20, 29); -- Subset of centres to keep ledger clean

-- 13. Insert Test Availability logs
DO $$
DECLARE
    hc RECORD;
    t_id INT;
    is_a BOOLEAN;
    daily_c INT;
BEGIN
    FOR hc IN SELECT id, type FROM health_centres LOOP
        -- For each of the 7 diagnostic tests
        FOR t_id IN 1..7 LOOP
            -- PHCs can only do simple blood checks (tests 1, 2, 6, 7). No X-ray (4) or Ultrasound (5)
            IF hc.type = 'PHC' AND t_id IN (4, 5) THEN
                is_a := FALSE;
                daily_c := 0;
            -- PHC Hatod (ID 7) has a broken X-Ray machine (which is eq_id 7 in equipment)
            ELSIF hc.id = 7 AND t_id = 4 THEN
                is_a := FALSE;
                daily_c := 0;
            ELSE
                is_a := TRUE;
                daily_c := CASE WHEN hc.type = 'CHC' THEN 80 ELSE 20 END;
            END IF;

            INSERT INTO test_availability (health_centre_id, test_id, is_available, daily_capacity, status_notes)
            VALUES (
                hc.id,
                t_id,
                is_a,
                daily_c,
                CASE 
                    WHEN NOT is_a AND t_id IN (4,5) AND hc.type = 'PHC' THEN 'Advanced imaging not supported at PHC level.'
                    WHEN NOT is_a AND hc.id = 7 AND t_id = 4 THEN 'X-Ray machine tube failure. Maintenance requested.'
                    ELSE 'Running normally.'
                END
            );
        END LOOP;
    END LOOP;
END $$;

-- 14. Seed Active System Alerts
INSERT INTO alerts (health_centre_id, alert_type, severity, message, is_resolved) VALUES
-- 1. StockOut at PHC Kampel (ID 29) for Cetirizine (med_id 71)
(29, 'StockOut', 'Critical', 'Cetirizine 10mg is completely stocked out! Immediate reorder required.', FALSE),
-- 2. LowStock at PHC Simrol (ID 20) for Covishield Vaccine (med_id 90)
(20, 'LowStock', 'High', 'Covishield Vaccine is critically low (2 vials left). Reorder required immediately.', FALSE),
-- 3. BedShortage at CHC Depalpur (ID 1)
(1, 'BedShortage', 'High', 'ICU Ward beds at CHC Depalpur are at 100% occupancy. Active patient load redirection required.', FALSE),
-- 4. DoctorAbsenteeism at PHC Gawli Palasia (ID 17)
(17, 'DoctorAbsenteeism', 'High', 'The Medical Officer assigned to PHC Gawli Palasia is absent today without approved leave.', FALSE),
-- 5. EquipmentFailure at CHC Mangilal Churiya (ID 6)
(6, 'EquipmentFailure', 'Critical', 'Vaccine Cold-Chain Refrigerator (ILR Serial IND-1-10026) is running above 8 degrees C and needs maintenance.', FALSE),
-- 6. TestUnavailable at PHC Hatod (ID 7)
(7, 'TestUnavailable', 'Medium', 'Chest X-Ray is unavailable at PHC Hatod due to X-Ray machine breakdown.', FALSE);

-- 15. Seed Redistribution Recommendations
-- Recommend transferring 300 vials of Covishield Vaccine from CHC Manpur (ID 3) to PHC Simrol (ID 20)
INSERT INTO redistribution_recommendations (source_centre_id, destination_centre_id, medicine_id, recommended_quantity, status) VALUES
(3, 20, 90, 300, 'Pending');

-- Recommend transferring 1000 tablets of Paracetamol from CHC Mangilal Churiya (ID 6) to PHC Kampel (ID 29)
INSERT INTO redistribution_recommendations (source_centre_id, destination_centre_id, medicine_id, recommended_quantity, status) VALUES
(6, 29, 1, 1000, 'Pending');

-- 16. Seed Demand Forecasts
INSERT INTO demand_forecasts (health_centre_id, medicine_id, forecast_date, forecasted_demand, confidence_interval_lower, confidence_interval_upper)
SELECT 
    hc.id,
    med_id,
    CURRENT_DATE + offset_val,
    150.00 + (offset_val * 15.00) + ROUND(random() * 20)::DECIMAL AS forecasted_demand,
    120.00 + (offset_val * 10.00) AS confidence_interval_lower,
    180.00 + (offset_val * 20.00) AS confidence_interval_upper
FROM 
    (SELECT id FROM health_centres WHERE id IN (1, 29)) hc,
    (SELECT 1 AS med_id UNION SELECT 43) med,
    (SELECT 1 AS offset_val UNION SELECT 2 UNION SELECT 3) offs;
-- 17. Seed Audit Logs
INSERT INTO audit_logs (user_id, user_name, user_email, action, details, created_at) VALUES
((SELECT id FROM users WHERE email = 'manager.depalpur@smarthealth.gov.in'), 'Rajesh Nagar (Depalpur Manager)', 'manager.depalpur@smarthealth.gov.in', 'UPDATE_BED', '{"params":{"id":"5"},"body":{"status":"Occupied","bed_number":"B-105","ward_name":"General Ward","health_centre_id":"1"},"response":{}}', NOW() - INTERVAL '2 hours'),
((SELECT id FROM users WHERE email = 'manager.betma@smarthealth.gov.in'), 'Sanjay Gupta (Betma Manager)', 'manager.betma@smarthealth.gov.in', 'UPDATE_DOCTOR_LIVE_STATUS', '{"body":{"is_checked_in":true,"status":"Active"},"params":{},"response":{}}', NOW() - INTERVAL '1 hour 45 minutes'),
((SELECT id FROM users WHERE email = 'pharm.hatod@smarthealth.gov.in'), 'Sanjay Sharma (PHC Hatod Pharmacist)', 'pharm.hatod@smarthealth.gov.in', 'UPDATE_STOCK', '{"params":{"id":"10"},"body":{"current_stock":150,"min_required_stock":50,"reorder_level":60,"medicine_id":"1","health_centre_id":"7"},"response":{}}', NOW() - INTERVAL '1 hour 30 minutes'),
((SELECT id FROM users WHERE email = 'anurag.cmho@smarthealth.gov.in'), 'Dr. Anurag Dixit (CMHO)', 'anurag.cmho@smarthealth.gov.in', 'CREATE_MEDICINE', '{"body":{"name":"Amoxicillin 500mg","generic_name":"Amoxicillin","category":"Antibiotics","dosage_form":"Tablet"},"params":{},"response":{}}', NOW() - INTERVAL '1 hour 15 minutes'),
((SELECT id FROM users WHERE email = 'manager.phchatod@smarthealth.gov.in'), 'Manager PHC PHC Hatod', 'manager.phchatod@smarthealth.gov.in', 'CREATE_TEST', '{"body":{"test_id":"1","daily_capacity":"100","health_centre_id":"7"},"params":{},"response":{}}', NOW() - INTERVAL '45 minutes'),
((SELECT id FROM users WHERE email = 'pharm.hatod@smarthealth.gov.in'), 'Sanjay Sharma (PHC Hatod Pharmacist)', 'pharm.hatod@smarthealth.gov.in', 'DELETE_STOCK', '{"params":{"id":"893"},"body":{},"response":{"message":"Inventory record deleted successfully.","inventory":{"id":893,"medicine_id":15,"health_centre_id":7,"current_stock":50}}}', NOW() - INTERVAL '30 minutes'),
((SELECT id FROM users WHERE email = 'manager.phchatod@smarthealth.gov.in'), 'Manager PHC PHC Hatod', 'manager.phchatod@smarthealth.gov.in', 'DELETE_TEST', '{"params":{"id":"12"},"body":{},"response":{"message":"Test availability record deleted successfully.","test":{"id":12,"test_id":3,"health_centre_id":7}}}', NOW() - INTERVAL '15 minutes');

-- 18. Seed Patients
INSERT INTO patients (health_centre_id, name, phone_number, location, admission_reason, status, admission_date, discharge_date) VALUES
(1, 'Ramesh Patel', '9876543210', 'Depalpur Ward 3', 'Severe Pneumonia', 'Admitted', NOW() - INTERVAL '3 days', NULL),
(1, 'Kamla Bai', '9823456789', 'Betma Road Rural', 'Maternal Labor & Delivery', 'Admitted', NOW() - INTERVAL '1 day', NULL),
(2, 'Suresh Kumar', '9123456780', 'Betma Chowk', 'High Fever and Malaria', 'Admitted', NOW() - INTERVAL '2 days', NULL),
(7, 'Gopal Sharma', '9345678901', 'Hatod Main Bazaar', 'Emergency Accident Trauma', 'Admitted', NOW() - INTERVAL '4 hours', NULL),
(7, 'Sunita Verma', '9567890123', 'Rural Hatod Sector B', 'Chronic Dehydration', 'Discharged', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day');
