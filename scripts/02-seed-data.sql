-- Insert sample patients
INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, phone, email, emergency_contact_name, emergency_contact_phone, medical_record_number) VALUES
('P001', 'John', 'Doe', '1985-03-15', 'Male', '555-0101', 'john.doe@email.com', 'Jane Doe', '555-0102', 'MRN001'),
('P002', 'Sarah', 'Johnson', '1992-07-22', 'Female', '555-0201', 'sarah.johnson@email.com', 'Mike Johnson', '555-0202', 'MRN002'),
('P003', 'Robert', 'Smith', '1978-11-08', 'Male', '555-0301', 'robert.smith@email.com', 'Mary Smith', '555-0302', 'MRN003'),
('P004', 'Emily', 'Davis', '1990-05-12', 'Female', '555-0401', 'emily.davis@email.com', 'Tom Davis', '555-0402', 'MRN004'),
('P005', 'Michael', 'Wilson', '1965-09-30', 'Male', '555-0501', 'michael.wilson@email.com', 'Lisa Wilson', '555-0502', 'MRN005');

-- Insert sample patient records (intake data)
INSERT INTO patient_records (
  patient_id, 
  systolic_bp, diastolic_bp, heart_rate, temperature, respiratory_rate, oxygen_saturation,
  consciousness_level, pain_scale,
  chief_complaint, symptoms, allergies, current_medications, medical_history,
  risk_level, notes
) VALUES
(
  (SELECT id FROM patients WHERE patient_id = 'P001'),
  120, 80, 72, 98.6, 16, 98,
  'alert', 2,
  'Chest pain', 'Mild chest discomfort, shortness of breath', 'Penicillin', 'Lisinopril 10mg daily', 'Hypertension, diagnosed 2020',
  'medium', 'Patient reports chest pain started 2 hours ago. Vital signs stable.'
),
(
  (SELECT id FROM patients WHERE patient_id = 'P002'),
  110, 70, 68, 99.2, 18, 97,
  'alert', 0,
  'Annual checkup', 'No acute symptoms', 'None known', 'Birth control pill', 'No significant medical history',
  'low', 'Routine annual physical examination. Patient appears healthy.'
),
(
  (SELECT id FROM patients WHERE patient_id = 'P003'),
  140, 90, 88, 100.4, 20, 95,
  'alert', 6,
  'Abdominal pain', 'Severe abdominal pain, nausea, vomiting', 'Shellfish', 'Metformin 500mg twice daily', 'Type 2 diabetes, diagnosed 2015',
  'high', 'Patient presents with acute abdominal pain. Possible appendicitis. Requires immediate evaluation.'
),
(
  (SELECT id FROM patients WHERE patient_id = 'P004'),
  115, 75, 76, 98.8, 14, 99,
  'alert', 1,
  'Follow-up visit', 'Feeling better after treatment', 'Latex', 'Amoxicillin 500mg three times daily', 'Recent pneumonia, treated last month',
  'low', 'Follow-up for pneumonia treatment. Patient responding well to antibiotics.'
),
(
  (SELECT id FROM patients WHERE patient_id = 'P005'),
  160, 100, 95, 97.8, 22, 92,
  'verbal', 8,
  'Difficulty breathing', 'Severe shortness of breath, chest tightness, wheezing', 'Aspirin', 'Albuterol inhaler, Atenolol 50mg daily', 'COPD, Hypertension, Heart disease',
  'critical', 'Patient in respiratory distress. Requires immediate intervention. Consider ICU admission.'
);
