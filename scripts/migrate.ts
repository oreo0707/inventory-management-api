
import fs from "node:fs/promises";
import path from "node:path";
import pool from "../lib/db";
import type { PoolClient } from "pg";

type MigrationStatus = {
  version: string;
  status: "APPLIED" | "PENDING";
};

const MIGRATIONS_DIRECTORY = path.join(
  process.cwd(),
  "database",
  "migrations"
);

async function getMigrationFiles(): Promise<string[]> {
  const files = await fs.readdir(MIGRATIONS_DIRECTORY);

  return files
    .filter((file) => /^\d+_[a-zA-Z0-9_]+\.sql$/.test(file))
    .sort();
}

async function getMigrationStatus(
  client: PoolClient
): Promise<MigrationStatus[]> {
  const files = await getMigrationFiles();

  const result = await client.query<{ version: string }>(
    "SELECT version FROM schema_migrations"
  );

  const appliedVersions = new Set(
    result.rows.map((row) => row.version)
  );

  const availableVersions = new Set(
    files.map((file) => path.basename(file, ".sql"))
  );

  for (const version of appliedVersions) {
    if (!availableVersions.has(version)) {
      throw new Error(
        `Migration history mismatch: "${version}" is recorded ` +
        `in PostgreSQL but its SQL file is missing.`
      );
    }
  }

  // Prevent migrations from being applied out of order.
  let encounteredPending = false;

  for (const file of files) {
    const version = path.basename(file, ".sql");
    const applied = appliedVersions.has(version);

    if (!applied) {
      encounteredPending = true;
    } else if (encounteredPending) {
      throw new Error(
        `Migration ordering mismatch: "${version}" was applied ` +
        `while an earlier migration is still pending.`
      );
    }
  }

  return files.map((file) => {
    const version = path.basename(file, ".sql");

    return {
      version,
      status: appliedVersions.has(version)
        ? "APPLIED"
        : "PENDING",
    };
  });
}

async function showStatus(): Promise<void> {
  const client = await pool.connect();

  try {
    const migrations = await getMigrationStatus(client);

    console.log("\nDatabase Migration Status");
    console.log("-------------------------");

    for (const migration of migrations) {
      console.log(`${migration.version}: ${migration.status}`);
    }

    const applied = migrations.filter(
      (migration) => migration.status === "APPLIED"
    ).length;

    console.log(`\nApplied: ${applied}`);
    console.log(`Pending: ${migrations.length - applied}`);
  } finally {
    client.release();
  }
}

async function applyMigrations(): Promise<void> {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    // A session-level lock prevents concurrent migration runners.
    const lockResult = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock(48271, 1) AS acquired"
    );

    lockAcquired = lockResult.rows[0]?.acquired === true;

    if (!lockAcquired) {
      throw new Error(
        "Another migration runner is already running."
      );
    }

    // Recheck history after acquiring the lock.
    const migrations = await getMigrationStatus(client);
    const pending = migrations.filter(
      (migration) => migration.status === "PENDING"
    );

    if (pending.length === 0) {
      console.log("Database is already up to date.");
      return;
    }

    for (const migration of pending) {
      const filePath = path.join(
        MIGRATIONS_DIRECTORY,
        `${migration.version}.sql`
      );

      const sql = await fs.readFile(filePath, "utf8");
      let transactionStarted = false;

      try {
        await client.query("BEGIN");
        transactionStarted = true;

        await client.query(sql);

        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [migration.version]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        console.log(`Applied: ${migration.version}`);
      } catch (error) {
        if (transactionStarted) {
          await client.query("ROLLBACK");
        }

        throw new Error(
          `Failed to apply migration "${migration.version}".`,
          { cause: error }
        );
      }
    }

    console.log("All pending migrations applied successfully.");
  } finally {
    if (lockAcquired) {
      await client.query(
        "SELECT pg_advisory_unlock(48271, 1)"
      );
    }

    client.release();
  }
}

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command === "status") {
    await showStatus();
  } else if (command === "migrate") {
    await applyMigrations();
  } else {
    throw new Error(
      "Unsupported command. Use 'status' or 'migrate'."
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error("Migration runner failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
