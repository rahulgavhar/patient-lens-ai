-- Ensure the 'patients' table exists with new fields
CREATE TABLE IF NOT EXISTS patients
(
    id              UUID PRIMARY KEY,
    name            VARCHAR(255)        NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    address         VARCHAR(255)        NOT NULL,
    date_of_birth   DATE                NOT NULL,
    registered_date DATE                NOT NULL,
    height          DOUBLE PRECISION,
    weight          DOUBLE PRECISION,
    blood_group     VARCHAR(5),
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
    );

-- Insert well-known UUIDs with new optional fields
INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '123e4567-e89b-12d3-a456-426614174000',
       'John Doe',
       'john.doe@example.com',
       '123 Main St, Springfield',
       '1985-06-15',
       '2024-01-10',
       180.0, 75.0, 'O+', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '123e4567-e89b-12d3-a456-426614174000');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '123e4567-e89b-12d3-a456-426614174001',
       'Jane Smith',
       'jane.smith@example.com',
       '456 Elm St, Shelbyville',
       '1990-09-23',
       '2023-12-01',
       165.0, 60.0, 'A-', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '123e4567-e89b-12d3-a456-426614174001');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '123e4567-e89b-12d3-a456-426614174002',
       'Alice Johnson',
       'alice.johnson@example.com',
       '789 Oak St, Capital City',
       '1978-03-12',
       '2022-06-20',
       170.0, 68.0, 'B+', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '123e4567-e89b-12d3-a456-426614174002');

-- You can replicate the same pattern for all remaining patients, filling in height, weight, blood_group as needed.
-- Example for Bob Brown:
INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '123e4567-e89b-12d3-a456-426614174003',
       'Bob Brown',
       'bob.brown@example.com',
       '321 Pine St, Springfield',
       '1982-11-30',
       '2023-05-14',
       175.0, 80.0, 'AB+', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '123e4567-e89b-12d3-a456-426614174003');

-- Repeat similar inserts for remaining patients
INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '123e4567-e89b-12d3-a456-426614174004',
       'Emily Davis',
       'emily.davis@example.com',
       '654 Maple St, Shelbyville',
       '1995-02-05',
       '2024-03-01',
       168.0, 55.0, 'O-', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '123e4567-e89b-12d3-a456-426614174004');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174005',
       'Michael Green',
       'michael.green@example.com',
       '987 Cedar St, Springfield',
       '1988-07-25',
       '2024-02-15',
       182.0, 78.0, 'B-', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174005');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174006',
       'Sarah Taylor',
       'sarah.taylor@example.com',
       '123 Birch St, Shelbyville',
       '1992-04-18',
       '2023-08-25',
       160.0, 58.0, 'A+', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174006');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174007',
       'David Wilson',
       'david.wilson@example.com',
       '456 Ash St, Capital City',
       '1975-01-11',
       '2022-10-10',
       178.0, 82.0, 'AB-', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174007');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174008',
       'Laura White',
       'laura.white@example.com',
       '789 Palm St, Springfield',
       '1989-09-02',
       '2024-04-20',
       167.0, 63.0, 'O+', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174008');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174009',
       'James Harris',
       'james.harris@example.com',
       '321 Cherry St, Shelbyville',
       '1993-11-15',
       '2023-06-30',
       176.0, 70.0, 'A-', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174009');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174010',
       'Emma Moore',
       'emma.moore@example.com',
       '654 Spruce St, Capital City',
       '1980-08-09',
       '2023-01-22',
       162.0, 59.0, 'B+', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174010');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174011',
       'Ethan Martinez',
       'ethan.martinez@example.com',
       '987 Redwood St, Springfield',
       '1984-05-03',
       '2024-05-12',
       181.0, 77.0, 'AB+', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174011');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174012',
       'Sophia Clark',
       'sophia.clark@example.com',
       '123 Hickory St, Shelbyville',
       '1991-12-25',
       '2022-11-11',
       164.0, 56.0, 'O-', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174012');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174013',
       'Daniel Lewis',
       'daniel.lewis@example.com',
       '456 Cypress St, Capital City',
       '1976-06-08',
       '2023-09-19',
       179.0, 81.0, 'A+', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174013');

INSERT INTO patients (id, name, email, address, date_of_birth, registered_date, height, weight, blood_group, created_at, updated_at)
SELECT '223e4567-e89b-12d3-a456-426614174014',
       'Isabella Walker',
       'isabella.walker@example.com',
       '789 Willow St, Springfield',
       '1987-10-17',
       '2024-03-29',
       166.0, 62.0, 'B-', NOW(), NULL
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = '223e4567-e89b-12d3-a456-426614174014');