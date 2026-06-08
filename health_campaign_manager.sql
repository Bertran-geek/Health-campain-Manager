-- Adminer 5.4.2 MySQL 8.0.46 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_user` bigint DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` bigint DEFAULT NULL,
  `ancienne_valeur` json DEFAULT NULL,
  `nouvelle_valeur` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_table` (`table_name`),
  KEY `idx_audit_user` (`id_user`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `audit_log` (`id`, `id_user`, `action`, `table_name`, `record_id`, `ancienne_valeur`, `nouvelle_valeur`, `created_at`) VALUES
(1,	1,	'LOGIN',	'user',	1,	'null',	'null',	'2026-06-05 12:34:12'),
(2,	1,	'LOGIN',	'user',	1,	'null',	'null',	'2026-06-05 12:35:24'),
(3,	1,	'LOGIN',	'user',	1,	'null',	'null',	'2026-06-05 14:00:39'),
(4,	1,	'LOGIN',	'user',	1,	'null',	'null',	'2026-06-05 17:54:48'),
(5,	1,	'CREATE',	'user',	2,	'null',	'{\"nom\": \"OUEDRAOGO\", \"username\": \"bertrand\"}',	'2026-06-05 17:56:56'),
(6,	1,	'LOGIN',	'user',	1,	'null',	'null',	'2026-06-08 11:18:40');

DROP TABLE IF EXISTS `campaign`;
CREATE TABLE `campaign` (
  `id_campaign` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `code` varchar(100) NOT NULL,
  `description` text,
  `type_campagne` enum('VACCINATION','DEPISTAGE','SUPPLEMENTATION','SENSIBILISATION','TRAITEMENT') NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `age_min` int DEFAULT NULL,
  `age_max` int DEFAULT NULL,
  `sexe` enum('M','F','ALL') DEFAULT 'ALL',
  `nombre_dose` int DEFAULT '1',
  `actif` tinyint(1) DEFAULT '1',
  `total_personne` int DEFAULT '0',
  `creee_par` bigint NOT NULL,
  `modifiee_par` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_campaign`),
  UNIQUE KEY `code` (`code`),
  KEY `creee_par` (`creee_par`),
  KEY `modifiee_par` (`modifiee_par`),
  KEY `idx_campaign_code` (`code`),
  KEY `idx_campaign_dates` (`date_debut`,`date_fin`),
  KEY `idx_campaign_type` (`type_campagne`),
  CONSTRAINT `campaign_ibfk_1` FOREIGN KEY (`creee_par`) REFERENCES `user` (`id_user`),
  CONSTRAINT `campaign_ibfk_2` FOREIGN KEY (`modifiee_par`) REFERENCES `user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `campaign_molecule`;
CREATE TABLE `campaign_molecule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_campaign` bigint NOT NULL,
  `id_molecule` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_campaign` (`id_campaign`),
  KEY `id_molecule` (`id_molecule`),
  CONSTRAINT `campaign_molecule_ibfk_1` FOREIGN KEY (`id_campaign`) REFERENCES `campaign` (`id_campaign`) ON DELETE CASCADE,
  CONSTRAINT `campaign_molecule_ibfk_2` FOREIGN KEY (`id_molecule`) REFERENCES `molecule` (`id_molecule`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `campaign_zone`;
CREATE TABLE `campaign_zone` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_campaign` bigint NOT NULL,
  `niveau` enum('REGION','DEPARTEMENT','PHC','CHW') NOT NULL,
  `id_region` int DEFAULT NULL,
  `id_dpt` int DEFAULT NULL,
  `id_phc` int DEFAULT NULL,
  `id_chw` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_campaign` (`id_campaign`),
  CONSTRAINT `campaign_zone_ibfk_1` FOREIGN KEY (`id_campaign`) REFERENCES `campaign` (`id_campaign`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `chw`;
CREATE TABLE `chw` (
  `id_chw` int NOT NULL AUTO_INCREMENT,
  `id_phc` int NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_chw`),
  UNIQUE KEY `code` (`code`),
  KEY `id_phc` (`id_phc`),
  CONSTRAINT `chw_ibfk_1` FOREIGN KEY (`id_phc`) REFERENCES `phc` (`id_phc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `departement`;
CREATE TABLE `departement` (
  `id_dpt` int NOT NULL AUTO_INCREMENT,
  `id_region` int NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `nom_dpt` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_dpt`),
  KEY `id_region` (`id_region`),
  CONSTRAINT `departement_ibfk_1` FOREIGN KEY (`id_region`) REFERENCES `region` (`id_region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `molecule`;
CREATE TABLE `molecule` (
  `id_molecule` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `nombre_dose_standard` int DEFAULT '1',
  PRIMARY KEY (`id_molecule`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `phc`;
CREATE TABLE `phc` (
  `id_phc` int NOT NULL AUTO_INCREMENT,
  `id_dpt` int NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `nom_phc` varchar(255) NOT NULL,
  `adresse` text,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_phc`),
  UNIQUE KEY `code` (`code`),
  KEY `id_dpt` (`id_dpt`),
  CONSTRAINT `phc_ibfk_1` FOREIGN KEY (`id_dpt`) REFERENCES `departement` (`id_dpt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `region`;
CREATE TABLE `region` (
  `id_region` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) DEFAULT NULL,
  `nom_region` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_region`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `region` (`id_region`, `code`, `nom_region`, `created_at`) VALUES
(1,	'CENTRE',	'Centre',	'2026-06-05 12:32:21');

DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `id_role` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`id_role`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `role` (`id_role`, `code`, `nom`, `description`) VALUES
(1,	'SUPER_ADMIN',	'Super Administrateur',	'Full system access with all permissions'),
(2,	'NATIONAL_MANAGER',	'Gestionnaire National',	'National level campaign management'),
(3,	'REGION_MANAGER',	'Gestionnaire RÃ©gion',	'Regional level campaign management'),
(4,	'DPT_MANAGER',	'Gestionnaire DÃ©partement',	'Department level campaign management'),
(5,	'PHC_MANAGER',	'Responsable PHC',	'Primary Health Center management'),
(6,	'CHW',	'Agent Communautaire',	'Community Health Worker field access');

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id_user` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `derniere_connexion` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_user_username` (`username`),
  KEY `idx_user_actif` (`actif`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `user` (`id_user`, `username`, `password_hash`, `nom`, `prenom`, `telephone`, `email`, `actif`, `derniere_connexion`, `created_at`, `updated_at`) VALUES
(1,	'admin',	'admin123',	'Administrateur',	'System',	'+22600000000',	'admin@health.local',	1,	'2026-06-08 11:18:40',	'2026-06-05 12:32:21',	'2026-06-08 11:18:40'),
(2,	'bertrand',	'password',	'OUEDRAOGO',	'Bertrand',	'+22657474467',	'campuskader321@gmail.com',	1,	NULL,	'2026-06-05 17:56:56',	NULL);

DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_user` bigint NOT NULL,
  `id_role` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_user` (`id_user`),
  KEY `id_role` (`id_role`),
  CONSTRAINT `user_role_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE,
  CONSTRAINT `user_role_ibfk_2` FOREIGN KEY (`id_role`) REFERENCES `role` (`id_role`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `user_role` (`id`, `id_user`, `id_role`) VALUES
(1,	1,	1),
(2,	2,	3);

DROP TABLE IF EXISTS `user_scope`;
CREATE TABLE `user_scope` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_user` bigint NOT NULL,
  `niveau` enum('NATIONAL','REGION','DEPARTEMENT','PHC','CHW') NOT NULL,
  `id_region` int DEFAULT NULL,
  `id_dpt` int DEFAULT NULL,
  `id_phc` int DEFAULT NULL,
  `id_chw` int DEFAULT NULL,
  `actif` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `id_user` (`id_user`),
  KEY `id_region` (`id_region`),
  KEY `id_dpt` (`id_dpt`),
  KEY `id_phc` (`id_phc`),
  KEY `id_chw` (`id_chw`),
  CONSTRAINT `user_scope_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`),
  CONSTRAINT `user_scope_ibfk_2` FOREIGN KEY (`id_region`) REFERENCES `region` (`id_region`),
  CONSTRAINT `user_scope_ibfk_3` FOREIGN KEY (`id_dpt`) REFERENCES `departement` (`id_dpt`),
  CONSTRAINT `user_scope_ibfk_4` FOREIGN KEY (`id_phc`) REFERENCES `phc` (`id_phc`),
  CONSTRAINT `user_scope_ibfk_5` FOREIGN KEY (`id_chw`) REFERENCES `chw` (`id_chw`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `user_scope` (`id`, `id_user`, `niveau`, `id_region`, `id_dpt`, `id_phc`, `id_chw`, `actif`) VALUES
(1,	1,	'NATIONAL',	NULL,	NULL,	NULL,	NULL,	1),
(2,	2,	'REGION',	NULL,	NULL,	NULL,	NULL,	1);

-- 2026-06-08 11:23:49 UTC
