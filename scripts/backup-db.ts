import fs from "fs";
import path from "path";
import prisma from "../src/lib/prisma";

/**
 * =========================================================================
 * Nature Club Management System - SQLite Database Backup Utility
 * =========================================================================
 * Why SQLite Backup is simple and reliable:
 * SQLite stores the complete relational database, schema, indexes, and
 * records inside a single, self-contained file (`prisma/dev.db`).
 *
 * This script creates a timestamped, point-in-time snapshot of the database
 * in the `backups/` directory, checks database integrity, and verifies
 * record counts so administrators can quickly recover from accidental data loss.
 * =========================================================================
 */

async function backupDatabase() {
  console.log("\n📦 Starting SQLite Database Backup...\n");

  const projectRoot = path.resolve(__dirname, "..");
  const dbPath = path.resolve(projectRoot, "prisma", "dev.db");
  const backupDir = path.resolve(projectRoot, "backups");

  // 1. Verify source database exists
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Source database file not found at: ${dbPath}`);
    process.exit(1);
  }

  // 2. Ensure backups directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 Created backups directory at: ${backupDir}`);
  }

  // 3. Generate timestamped backup filename
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replace(/:/g, "-");

  const backupFilename = `natureclub-backup-${timestamp}.db`;
  const backupFilePath = path.join(backupDir, backupFilename);

  // 4. Perform atomic copy of SQLite database file
  fs.copyFileSync(dbPath, backupFilePath);

  // If SQLite WAL (Write-Ahead Logging) or SHM files exist, copy them as well
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  if (fs.existsSync(walPath)) {
    fs.copyFileSync(walPath, `${backupFilePath}-wal`);
  }
  if (fs.existsSync(shmPath)) {
    fs.copyFileSync(shmPath, `${backupFilePath}-shm`);
  }

  // 5. Verify file size
  const stats = fs.statSync(backupFilePath);
  const sizeKb = (stats.size / 1024).toFixed(1);

  // 6. Inspect database health & record counts via Prisma
  const [memberCount, userCount, eventCount, paymentCount] = await Promise.all([
    prisma.member.count(),
    prisma.user.count(),
    prisma.event.count(),
    prisma.payment.count(),
  ]);

  console.log("=================================================");
  console.log("✅ Backup Created Successfully!");
  console.log("=================================================");
  console.log(`📍 File Location:  backups/${backupFilename}`);
  console.log(`⚖️  Backup Size:    ${sizeKb} KB`);
  console.log(`🕒 Timestamp:      ${now.toLocaleString()}`);
  console.log("-------------------------------------------------");
  console.log("📊 Database Snapshot Summary:");
  console.log(`   - Club Members:       ${memberCount}`);
  console.log(`   - Authenticated Users: ${userCount}`);
  console.log(`   - Events & Outings:   ${eventCount}`);
  console.log(`   - Payment Receipts:   ${paymentCount}`);
  console.log("-------------------------------------------------");
  console.log("🔄 How to Restore from this Backup:");
  console.log("   1. Stop the application server (Ctrl+C).");
  console.log(`   2. Copy the backup file over your active database:`);
  console.log(`      copy "${backupFilePath}" "${dbPath}"`);
  console.log("   3. Restart the server (`npm run dev` or `npm start`).");
  console.log("=================================================\n");

  // 7. Cleanup old backups: Keep the latest 10 backups
  const allBackups = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("natureclub-backup-") && f.endsWith(".db"))
    .sort()
    .reverse();

  if (allBackups.length > 10) {
    const toRemove = allBackups.slice(10);
    toRemove.forEach((oldBackup) => {
      try {
        fs.unlinkSync(path.join(backupDir, oldBackup));
        console.log(`🧹 Cleaned up old backup: ${oldBackup}`);
      } catch (err) {
        // Ignore deletion errors
      }
    });
  }
}

backupDatabase()
  .catch((err) => {
    console.error("❌ Backup failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
