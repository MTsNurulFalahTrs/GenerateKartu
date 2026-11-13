# Neon database: Format Komunitas

The Neon PostgreSQL migration for the GenerateKartu community catalog is db/migrations/001_community_formats.sql.
The historical Supabase migration under supabase/migrations is an earlier alternative; do not apply it to Neon.

1. Connect the correct Neon database to the intended Vercel project. Set DATABASE_URL in the server environment only, never in a client-exposed variable or source file.
2. Apply db/migrations/001_community_formats.sql once in the intended database using its SQL editor or an authorized migration workflow.
3. If a previous catalog exists, copy id, definition, and created_at transactionally; reconcile the identity sequence after importing IDs.
4. Check GET, consent-based POST, deduplication, publish limits, manual field labels and Excel headers, and rejection of Password in staging.
5. Keep verified backups and prior catalog access until the migration is validated. Do not silently drop historical data.

When DATABASE_URL is missing, GET returns [] plus X-Community-Unavailable: true; POST cannot publish. Merging this code does not mean a database has been provisioned or migrated.
Only public format definitions are sent. Names, field labels, and Excel headers should not contain participant information.
