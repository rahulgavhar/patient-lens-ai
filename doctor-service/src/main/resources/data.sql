-- Ensure the 'doctors' table exists with all fields
CREATE TABLE IF NOT EXISTS doctors
(
    id                UUID PRIMARY KEY,
    name              VARCHAR(255)        NOT NULL,
    email             VARCHAR(255) UNIQUE NOT NULL,
    specialization    VARCHAR(255)        NOT NULL,
    license_number    VARCHAR(255) UNIQUE NOT NULL,
    phone_number      VARCHAR(20),
    years_of_experience INT,
    hospital_name     VARCHAR(255),
    joined_date       DATE,
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP
    );

-- Insert sample doctors with audit and optional fields
INSERT INTO doctors (id, name, email, specialization, license_number, phone_number, years_of_experience, hospital_name, joined_date, created_at, updated_at)
SELECT '323e4567-e89b-12d3-a456-426614174100',
       'Dr. John Smith',
       'john.smith@example.com',
       'Cardiology',
       'LIC12345',
       '123-456-7890',
       10,
       'City Hospital',
       '2015-06-15',
       NOW(),
       NULL
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE id = '323e4567-e89b-12d3-a456-426614174100');

INSERT INTO doctors (id, name, email, specialization, license_number, phone_number, years_of_experience, hospital_name, joined_date, created_at, updated_at)
SELECT '323e4567-e89b-12d3-a456-426614174101',
       'Dr. Alice Johnson',
       'alice.johnson@example.com',
       'Neurology',
       'LIC12346',
       '234-567-8901',
       8,
       'Greenwood Hospital',
       '2017-09-20',
       NOW(),
       NULL
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE id = '323e4567-e89b-12d3-a456-426614174101');

INSERT INTO doctors (id, name, email, specialization, license_number, phone_number, years_of_experience, hospital_name, joined_date, created_at, updated_at)
SELECT '323e4567-e89b-12d3-a456-426614174102',
       'Dr. Robert Brown',
       'robert.brown@example.com',
       'Orthopedics',
       'LIC12347',
       '345-678-9012',
       12,
       'Sunrise Hospital',
       '2012-03-10',
       NOW(),
       NULL
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE id = '323e4567-e89b-12d3-a456-426614174102');

INSERT INTO doctors (id, name, email, specialization, license_number, phone_number, years_of_experience, hospital_name, joined_date, created_at, updated_at)
SELECT '323e4567-e89b-12d3-a456-426614174103',
       'Dr. Emily Davis',
       'emily.davis@example.com',
       'Pediatrics',
       'LIC12348',
       '456-789-0123',
       6,
       'Mercy Hospital',
       '2018-11-05',
       NOW(),
       NULL
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE id = '323e4567-e89b-12d3-a456-426614174103');

INSERT INTO doctors (id, name, email, specialization, license_number, phone_number, years_of_experience, hospital_name, joined_date, created_at, updated_at)
SELECT '323e4567-e89b-12d3-a456-426614174104',
       'Dr. Michael Green',
       'michael.green@example.com',
       'Dermatology',
       'LIC12349',
       '567-890-1234',
       15,
       'Central Hospital',
       '2010-01-22',
       NOW(),
       NULL
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE id = '323e4567-e89b-12d3-a456-426614174104');