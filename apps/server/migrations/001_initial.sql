CREATE TABLE police_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  administrative_level TEXT NOT NULL,
  address TEXT,
  duty_hotline TEXT,
  latitude REAL CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude REAL CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  verification_source TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((latitude IS NULL) = (longitude IS NULL))
);

CREATE TABLE places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'service')),
  address TEXT NOT NULL,
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  verification_source TEXT,
  data_source TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  demo_data INTEGER NOT NULL DEFAULT 0 CHECK (demo_data IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  access_token_hash TEXT NOT NULL UNIQUE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('fire', 'traffic_accident', 'fighting', 'public_security', 'other')),
  description TEXT,
  incident_latitude REAL NOT NULL CHECK (incident_latitude BETWEEN -90 AND 90),
  incident_longitude REAL NOT NULL CHECK (incident_longitude BETWEEN -180 AND 180),
  reporter_latitude REAL CHECK (reporter_latitude IS NULL OR reporter_latitude BETWEEN -90 AND 90),
  reporter_longitude REAL CHECK (reporter_longitude IS NULL OR reporter_longitude BETWEEN -180 AND 180),
  gps_accuracy REAL CHECK (gps_accuracy IS NULL OR gps_accuracy >= 0),
  attachment_stored_name TEXT,
  attachment_original_name TEXT,
  attachment_mime_type TEXT,
  attachment_size INTEGER CHECK (attachment_size IS NULL OR attachment_size >= 0),
  suggested_police_unit_id INTEGER REFERENCES police_units(id) ON DELETE SET NULL,
  assigned_police_unit_id INTEGER REFERENCES police_units(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'received', 'processing', 'resolved')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((reporter_latitude IS NULL) = (reporter_longitude IS NULL))
);

CREATE TABLE report_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'received', 'processing', 'resolved')),
  changed_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_police_units_public ON police_units(active, verified);
CREATE INDEX idx_places_public ON places(active, category);
CREATE INDEX idx_reviews_place_status ON reviews(place_id, status, created_at DESC);
CREATE INDEX idx_reports_status_created ON reports(status, created_at DESC);
CREATE INDEX idx_reports_incident_type ON reports(incident_type, created_at DESC);
CREATE INDEX idx_report_history_report ON report_status_history(report_id, created_at ASC);
