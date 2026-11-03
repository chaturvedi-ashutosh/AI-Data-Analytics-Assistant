import { pool } from '../db/pool.js'

export async function getSchema(schemaName = 'public') {
  const [tableResult, columnResult, foreignKeyResult] = await Promise.all([
    pool.query(
      `SELECT table_name AS name
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      [schemaName],
    ),
    pool.query(
      `SELECT
         columns.table_name AS table_name,
         columns.column_name AS name,
         columns.data_type AS data_type,
         columns.udt_name AS native_type,
         columns.is_nullable = 'YES' AS nullable,
         columns.column_default AS default_value,
         EXISTS (
           SELECT 1
           FROM pg_constraint AS primary_constraint
           JOIN pg_class AS table_relation
             ON table_relation.oid = primary_constraint.conrelid
           JOIN pg_namespace AS table_namespace
             ON table_namespace.oid = table_relation.relnamespace
           JOIN pg_attribute AS primary_column
             ON primary_column.attrelid = table_relation.oid
            AND primary_column.attnum = ANY(primary_constraint.conkey)
           WHERE primary_constraint.contype = 'p'
             AND table_namespace.nspname = columns.table_schema
             AND table_relation.relname = columns.table_name
             AND primary_column.attname = columns.column_name
         ) AS primary_key
       FROM information_schema.columns AS columns
       WHERE columns.table_schema = $1
       ORDER BY columns.table_name, columns.ordinal_position`,
      [schemaName],
    ),
    pool.query(
       `SELECT
         source_table.relname AS table_name,
         source_column.attname AS column_name,
         constraint_details.conname AS constraint_name,
         target_table.relname AS referenced_table,
         target_column.attname AS referenced_column
       FROM pg_constraint AS constraint_details
       JOIN pg_class AS source_table
         ON source_table.oid = constraint_details.conrelid
       JOIN pg_namespace AS source_schema
         ON source_schema.oid = source_table.relnamespace
       JOIN pg_class AS target_table
         ON target_table.oid = constraint_details.confrelid
       JOIN LATERAL unnest(constraint_details.conkey) WITH ORDINALITY AS source_key(attnum, position)
         ON TRUE
       JOIN LATERAL unnest(constraint_details.confkey) WITH ORDINALITY AS target_key(attnum, position)
         ON target_key.position = source_key.position
       JOIN pg_attribute AS source_column
         ON source_column.attrelid = source_table.oid
        AND source_column.attnum = source_key.attnum
       JOIN pg_attribute AS target_column
         ON target_column.attrelid = target_table.oid
        AND target_column.attnum = target_key.attnum
       WHERE constraint_details.contype = 'f'
         AND source_schema.nspname = $1
       ORDER BY source_table.relname, source_key.position`,
      [schemaName],
    ),
  ])

  const tables = new Map(
    tableResult.rows.map(({ name }) => [name, { name, columns: [], foreignKeys: [] }]),
  )

  for (const column of columnResult.rows) {
    tables.get(column.table_name)?.columns.push({
      name: column.name,
      dataType: column.data_type,
      nativeType: column.native_type,
      nullable: column.nullable,
      default: column.default_value,
      primaryKey: column.primary_key,
    })
  }

  for (const foreignKey of foreignKeyResult.rows) {
    tables.get(foreignKey.table_name)?.foreignKeys.push({
      name: foreignKey.constraint_name,
      column: foreignKey.column_name,
      referencedTable: foreignKey.referenced_table,
      referencedColumn: foreignKey.referenced_column,
    })
  }

  return [...tables.values()]
}
