ALTER TABLE profile ADD COLUMN profile_photo_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;
