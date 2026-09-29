-- ---------------------------------------------------------------------------
-- EWRAP schema (MySQL 8).
--
-- Design note: the uploaded source material supplied no database design, ERD or
-- field-level schema, so the six domain tables below are designed from scratch
-- to implement the objectives and modules named in Sections 1.3, 2.1.1 and 2.2.
-- Column names, types and enum values follow the agreed specification exactly.
--
-- Indexes are placed on every foreign key, on recycling_centers(latitude,
-- longitude) for the map viewport, on ewaste_reports(status, reportedAt) for the
-- administrator review queue, and on recycling_logs(loggedAt) for the
-- monthly participation aggregates.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  userId       INT AUTO_INCREMENT PRIMARY KEY,
  fullName     VARCHAR(100) NOT NULL,
  email        VARCHAR(100) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  role         ENUM('PublicUser','RegisteredUser','Administrator') NOT NULL DEFAULT 'RegisteredUser',
  affiliation  VARCHAR(60) NULL,
  createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recycling_centers (
  centerId        INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  address         VARCHAR(200) NOT NULL,
  latitude        DECIMAL(9,6) NOT NULL,
  longitude       DECIMAL(9,6) NOT NULL,
  certifiedStatus ENUM('Certified','Unverified') NOT NULL DEFAULT 'Unverified',
  contactInfo     VARCHAR(150) NULL,
  description     TEXT NULL,
  addedBy         INT NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_centers_coordinates (latitude, longitude),
  KEY idx_centers_added_by (addedBy),
  KEY idx_centers_name (name),
  CONSTRAINT fk_centers_added_by FOREIGN KEY (addedBy) REFERENCES users(userId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  articleId   INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  body        TEXT NOT NULL,
  category    ENUM('Awareness','Policy') NOT NULL DEFAULT 'Awareness',
  authorId    INT NULL,
  publishedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_articles_author (authorId),
  KEY idx_articles_category (category, publishedAt),
  CONSTRAINT fk_articles_author FOREIGN KEY (authorId) REFERENCES users(userId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ewaste_reports (
  reportId          INT AUTO_INCREMENT PRIMARY KEY,
  userId            INT NOT NULL,
  itemType          VARCHAR(100) NOT NULL,
  estimatedQuantity VARCHAR(60) NULL,
  campusLocation    VARCHAR(150) NOT NULL,
  photoPath         VARCHAR(255) NULL,
  status            ENUM('Pending','Reviewed','Resolved') NOT NULL DEFAULT 'Pending',
  reportedAt        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewedBy        INT NULL,
  reviewedAt        DATETIME NULL,
  KEY idx_reports_owner (userId),
  KEY idx_reports_reviewer (reviewedBy),
  KEY idx_reports_status_date (status, reportedAt),
  KEY idx_reports_item_type (itemType),
  CONSTRAINT fk_reports_user FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reviewer FOREIGN KEY (reviewedBy) REFERENCES users(userId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recycling_logs (
  logId    INT AUTO_INCREMENT PRIMARY KEY,
  userId   INT NOT NULL,
  centerId INT NULL,
  itemType VARCHAR(100) NOT NULL,
  quantity VARCHAR(60) NULL,
  loggedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_logs_owner (userId),
  KEY idx_logs_center (centerId),
  KEY idx_logs_logged_at (loggedAt),
  KEY idx_logs_item_type (itemType),
  CONSTRAINT fk_logs_user FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  CONSTRAINT fk_logs_center FOREIGN KEY (centerId) REFERENCES recycling_centers(centerId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback (
  feedbackId  INT AUTO_INCREMENT PRIMARY KEY,
  userId      INT NOT NULL,
  logId       INT NULL,
  rating      TINYINT NULL,
  message     TEXT NULL,
  submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_feedback_user (userId),
  KEY idx_feedback_log (logId),
  CONSTRAINT chk_feedback_rating CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  CONSTRAINT fk_feedback_user FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_log FOREIGN KEY (logId) REFERENCES recycling_logs(logId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Infrastructure table for the custom Express MySQL session store (not a domain table).
-- Declared here so the application never mutates the schema at runtime.
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires    INT UNSIGNED NOT NULL,
  data       MEDIUMTEXT COLLATE utf8mb4_bin NULL,
  PRIMARY KEY (session_id),
  KEY idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
