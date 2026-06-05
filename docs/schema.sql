-- Health Campaign Manager Database Schema
-- MySQL/MariaDB compatible
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci

CREATE DATABASE IF NOT EXISTS health_campaign_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE health_campaign_manager;

-- ============================================================
-- AUTHENTICATION & AUTHORIZATION TABLES
-- ============================================================

-- User roles for access control
CREATE TABLE role (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT
);

-- System users with authentication credentials
CREATE TABLE user (
    id_user BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    telephone VARCHAR(30),
    email VARCHAR(255),
    actif BOOLEAN DEFAULT TRUE,
    derniere_connexion DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

-- ============================================================
-- GEOGRAPHIC HIERARCHY TABLES
-- ============================================================

-- Top-level geographic entity
CREATE TABLE region (
    id_region INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    nom_region VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Department within a region
CREATE TABLE departement (
    id_dpt INT AUTO_INCREMENT PRIMARY KEY,
    id_region INT NOT NULL,
    code VARCHAR(20),
    nom_dpt VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_region) REFERENCES region(id_region)
);

-- Primary Health Center within a department
CREATE TABLE phc (
    id_phc INT AUTO_INCREMENT PRIMARY KEY,
    id_dpt INT NOT NULL,
    code VARCHAR(50) UNIQUE,
    nom_phc VARCHAR(255) NOT NULL,
    adresse TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_dpt) REFERENCES departement(id_dpt)
);

-- Community Health Worker assigned to a PHC
CREATE TABLE chw (
    id_chw INT AUTO_INCREMENT PRIMARY KEY,
    id_phc INT NOT NULL,
    code VARCHAR(50) UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    telephone VARCHAR(30),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_phc) REFERENCES phc(id_phc)
);

-- ============================================================
-- USER ROLE & SCOPE TABLES
-- ============================================================

-- Many-to-many relationship between users and roles
CREATE TABLE user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_user BIGINT NOT NULL,
    id_role INT NOT NULL,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_role) REFERENCES role(id_role) ON DELETE CASCADE
);

-- Geographic access scope for users
CREATE TABLE user_scope (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_user BIGINT NOT NULL,
    niveau ENUM('NATIONAL','REGION','DEPARTEMENT','PHC','CHW') NOT NULL,
    id_region INT NULL,
    id_dpt INT NULL,
    id_phc INT NULL,
    id_chw INT NULL,
    actif BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_user) REFERENCES user(id_user),
    FOREIGN KEY (id_region) REFERENCES region(id_region),
    FOREIGN KEY (id_dpt) REFERENCES departement(id_dpt),
    FOREIGN KEY (id_phc) REFERENCES phc(id_phc),
    FOREIGN KEY (id_chw) REFERENCES chw(id_chw)
);

-- ============================================================
-- CAMPAIGN MANAGEMENT TABLES
-- ============================================================

-- Medical molecules/vaccines used in campaigns
CREATE TABLE molecule (
    id_molecule INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    nombre_dose_standard INT DEFAULT 1
);

-- Health campaign definition
CREATE TABLE campaign (
    id_campaign BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    type_campagne ENUM('VACCINATION','DEPISTAGE','SUPPLEMENTATION','SENSIBILISATION','TRAITEMENT') NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    age_min INT,
    age_max INT,
    sexe ENUM('M','F','ALL') DEFAULT 'ALL',
    nombre_dose INT DEFAULT 1,
    actif BOOLEAN DEFAULT TRUE,
    total_personne INT DEFAULT 0,
    creee_par BIGINT NOT NULL,
    modifiee_par BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creee_par) REFERENCES user(id_user),
    FOREIGN KEY (modifiee_par) REFERENCES user(id_user)
);

-- Geographic zones targeted by a campaign
CREATE TABLE campaign_zone (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_campaign BIGINT NOT NULL,
    niveau ENUM('REGION','DEPARTEMENT','PHC','CHW') NOT NULL,
    id_region INT NULL,
    id_dpt INT NULL,
    id_phc INT NULL,
    id_chw INT NULL,
    FOREIGN KEY (id_campaign) REFERENCES campaign(id_campaign) ON DELETE CASCADE
);

-- Molecules used in a campaign (many-to-many)
CREATE TABLE campaign_molecule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_campaign BIGINT NOT NULL,
    id_molecule INT NOT NULL,
    FOREIGN KEY (id_campaign) REFERENCES campaign(id_campaign) ON DELETE CASCADE,
    FOREIGN KEY (id_molecule) REFERENCES molecule(id_molecule)
);

-- ============================================================
-- AUDIT TABLE
-- ============================================================

-- Audit trail for all data modifications
CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_user BIGINT NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NULL,
    ancienne_valeur JSON NULL,
    nouvelle_valeur JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user)
);

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Insert default roles
INSERT INTO role(code, nom, description) VALUES
('SUPER_ADMIN', 'Super Administrateur', 'Full system access with all permissions'),
('NATIONAL_MANAGER', 'Gestionnaire National', 'National level campaign management'),
('REGION_MANAGER', 'Gestionnaire Région', 'Regional level campaign management'),
('DPT_MANAGER', 'Gestionnaire Département', 'Department level campaign management'),
('PHC_MANAGER', 'Responsable PHC', 'Primary Health Center management'),
('CHW', 'Agent Communautaire', 'Community Health Worker field access');

-- Insert default region
INSERT INTO region(code, nom_region)
VALUES ('CENTRE', 'Centre');

-- Insert default admin user (plain text password for development)
INSERT INTO user(
    username, password_hash, nom, prenom, telephone, email, actif
) VALUES (
    'admin',
    'admin123',
    'Administrateur',
    'System',
    '+22600000000',
    'admin@health.local',
    1
);

-- Assign SUPER_ADMIN role to admin user
INSERT INTO user_role(id_user, id_role)
SELECT u.id_user, r.id_role
FROM user u, role r
WHERE u.username = 'admin'
AND r.code = 'SUPER_ADMIN';

-- Assign NATIONAL scope to admin user
INSERT INTO user_scope(id_user, niveau, actif)
SELECT u.id_user, 'NATIONAL', 1
FROM user u
WHERE u.username = 'admin';

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_user_username ON user(username);
CREATE INDEX idx_user_actif ON user(actif);
CREATE INDEX idx_campaign_code ON campaign(code);
CREATE INDEX idx_campaign_dates ON campaign(date_debut, date_fin);
CREATE INDEX idx_campaign_type ON campaign(type_campagne);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_user ON audit_log(id_user);
CREATE INDEX idx_audit_created ON audit_log(created_at);
