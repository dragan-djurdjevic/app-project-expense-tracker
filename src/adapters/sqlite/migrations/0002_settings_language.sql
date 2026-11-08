-- Spec: DS-002, DS-006, DM-060
ALTER TABLE settings ADD COLUMN language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','sr-Latn'));
