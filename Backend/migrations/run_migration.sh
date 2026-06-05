#!/usr/bin/env bash
# Run a single SQL migration against the CRM database.
# Usage: ./run_migration.sh create_invoices_table.sql
# Env overrides: DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION="${1:-}"

if [[ -z "$MIGRATION" ]]; then
  echo "Usage: $0 <migration-file.sql>"
  echo "Example: $0 create_invoices_table.sql"
  exit 1
fi

MIGRATION_PATH="$SCRIPT_DIR/$MIGRATION"
if [[ ! -f "$MIGRATION_PATH" ]]; then
  echo "Migration not found: $MIGRATION_PATH"
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-Digious_CRM_DataBase}"

echo "Running migration: $MIGRATION"
echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"

if [[ -n "$DB_PASSWORD" ]]; then
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_PATH"
else
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$MIGRATION_PATH"
fi

echo "Migration completed successfully."
