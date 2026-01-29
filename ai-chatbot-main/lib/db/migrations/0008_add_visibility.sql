DO $$ BEGIN
 ALTER TABLE "Chat" ADD COLUMN "visibility" varchar NOT NULL DEFAULT 'private';
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
