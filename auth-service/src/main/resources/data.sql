-- Ensure the 'users' table exists with username column
CREATE TABLE IF NOT EXISTS "users" (
    id UUID PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);



-- BCrypt hash of 'password123' (compatible with Spring Security BCryptPasswordEncoder)
-- Seed ADMIN user
INSERT INTO "users" (id, username, email, password, role)
SELECT '223e4567-e89b-12d3-a456-426614174006', 'admin', 'admin@patientlens.ai',
       '$2a$12$7hoRZfJrRKD2nIm2vHLs7OBETy.LWenXXMLKf99W8M4PUwO6KB7fu', 'ADMIN'
WHERE NOT EXISTS (
    SELECT 1 FROM "users" WHERE email = 'admin@patientlens.ai' OR username = 'admin'
);

-- Seed DOCTOR user
INSERT INTO "users" (id, username, email, password, role)
SELECT '323e4567-e89b-12d3-a456-426614174007', 'dr.house', 'house@hospital.com',
       '$2a$12$7hoRZfJrRKD2nIm2vHLs7OBETy.LWenXXMLKf99W8M4PUwO6KB7fu', 'DOCTOR'
WHERE NOT EXISTS (
    SELECT 1 FROM "users" WHERE email = 'house@hospital.com' OR username = 'dr.house'
);

-- Seed PATIENT user
INSERT INTO "users" (id, username, email, password, role)
SELECT '423e4567-e89b-12d3-a456-426614174008', 'john.doe', 'john@patient.com',
       '$2a$12$7hoRZfJrRKD2nIm2vHLs7OBETy.LWenXXMLKf99W8M4PUwO6KB7fu', 'PATIENT'
WHERE NOT EXISTS (
    SELECT 1 FROM "users" WHERE email = 'john@patient.com' OR username = 'john.doe'
);

-- Seed TEST user
INSERT INTO "users" (id, username, email, password, role)
SELECT '523e4567-e89b-12d3-a456-426614174009', 'testuser', 'testuser@test.com',
       '$2a$12$7hoRZfJrRKD2nIm2vHLs7OBETy.LWenXXMLKf99W8M4PUwO6KB7fu', 'ADMIN'
WHERE NOT EXISTS (
    SELECT 1 FROM "users" WHERE email = 'testuser@test.com' OR username = 'testuser'
);
