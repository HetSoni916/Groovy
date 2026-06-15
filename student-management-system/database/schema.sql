-- ============================================================
-- Student Management System - PostgreSQL Schema
-- ============================================================

DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE students (
  id              SERIAL PRIMARY KEY,
  student_id      VARCHAR(20) NOT NULL UNIQUE,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  phone           VARCHAR(20),
  date_of_birth   DATE,
  gender          VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
  address         TEXT,
  course          VARCHAR(150),
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status          VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email      ON students(email);
CREATE INDEX idx_students_status     ON students(status);
CREATE INDEX idx_students_course     ON students(course);
CREATE INDEX idx_students_deleted_at ON students(deleted_at);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: Default admin  (password: Admin@123)
-- Run: node backend/utils/hashPassword.js to regenerate hash
-- ============================================================
INSERT INTO users (name, email, password, role)
VALUES ('Super Admin', 'admin@sms.com',
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'superadmin');

-- ============================================================
-- SEED: Sample students
-- ============================================================
INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, gender, address, course, enrollment_date, status)
VALUES
  ('STU-20240001','Alice','Johnson','alice.johnson@example.com','555-0101','2000-03-15','Female','123 Maple St, Springfield','Computer Science','2024-01-10','Active'),
  ('STU-20240002','Bob','Smith','bob.smith@example.com','555-0102','1999-07-22','Male','456 Oak Ave, Shelbyville','Information Technology','2024-01-12','Active'),
  ('STU-20240003','Carol','Williams','carol.williams@example.com','555-0103','2001-11-05','Female','789 Pine Rd, Capital City','Data Science','2024-02-01','Active'),
  ('STU-20240004','David','Brown','david.brown@example.com','555-0104','2000-01-30','Male','321 Elm Blvd, Ogdenville','Software Engineering','2024-02-15','Inactive'),
  ('STU-20240005','Eva','Martinez','eva.martinez@example.com','555-0105','2002-06-18','Female','654 Cedar Ln, North Haverbrook','Cybersecurity','2024-03-01','Active');
