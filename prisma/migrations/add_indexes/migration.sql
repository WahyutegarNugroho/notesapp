-- AddIndex
CREATE INDEX IF NOT EXISTS "folders_user_id_idx" ON "folders"("user_id");

-- AddIndex
CREATE INDEX IF NOT EXISTS "notes_user_id_idx" ON "notes"("user_id");

-- AddIndex
CREATE INDEX IF NOT EXISTS "notes_folder_id_idx" ON "notes"("folder_id");

-- AddIndex
CREATE INDEX IF NOT EXISTS "notes_created_at_id_idx" ON "notes"("created_at" DESC, "id" DESC);

-- AddIndex
CREATE INDEX IF NOT EXISTS "attachments_note_id_idx" ON "attachments"("note_id");

-- AddIndex
CREATE INDEX IF NOT EXISTS "tags_user_id_idx" ON "tags"("user_id");

-- AddIndex
CREATE INDEX IF NOT EXISTS "tags_name_idx" ON "tags"("name");
