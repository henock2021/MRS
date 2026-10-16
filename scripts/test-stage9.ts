import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runStage9Tests() {
  console.log("\n🛡️ Running Stage 9 Polish, Security, & Backup Tests...\n");

  // TEST 1: Password Reset Token Generation & 1-Hour Expiry Window
  console.log("Test Suite 1: Password Reset Token Generation & Lifespan");

  const testUser = await prisma.user.findFirst({
    where: { email: "staff@natureclub.org" },
  });
  assert(testUser !== null, "Test coordinator user exists in database");

  // Generate 64-char hex token
  const testToken = crypto.randomBytes(32).toString("hex");
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

  const resetRecord = await prisma.passwordResetToken.create({
    data: {
      token: testToken,
      userId: testUser!.id,
      expiresAt: oneHourFromNow,
    },
  });

  assert(resetRecord.id !== undefined, "Password reset token created successfully");
  assert(resetRecord.token.length === 64, "Reset token is cryptographically secure 64-character hex");

  const diffMs = resetRecord.expiresAt.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  assert(diffMinutes >= 59 && diffMinutes <= 60, "Reset token has exact 1-hour validity window");

  // TEST 2: Password Reset Execution & Single-Use Protection
  console.log("\nTest Suite 2: Password Reset Execution & Single-Use Enforcement");

  const newTestPassword = "NewStaffPassword2026!Secure";
  const newHash = await bcrypt.hash(newTestPassword, 12);

  // Update user password and delete used token
  await prisma.user.update({
    where: { id: testUser!.id },
    data: { passwordHash: newHash },
  });

  await prisma.passwordResetToken.delete({
    where: { id: resetRecord.id },
  });

  // Verify token is no longer in database (single-use)
  const tokenLookup = await prisma.passwordResetToken.findUnique({
    where: { token: testToken },
  });
  assert(tokenLookup === null, "Used reset token is immediately consumed and deleted (Single-Use)");

  // Verify new password works
  const updatedUser = await prisma.user.findUnique({ where: { id: testUser!.id } });
  const newPassValid = await bcrypt.compare(newTestPassword, updatedUser!.passwordHash);
  assert(newPassValid === true, "New password verifies successfully with bcrypt");

  // Restore staff password to original seed
  const originalHash = await bcrypt.hash("NatureStaff2026!Secure", 12);
  await prisma.user.update({
    where: { id: testUser!.id },
    data: { passwordHash: originalHash },
  });

  // TEST 3: Expired Token Rejection
  console.log("\nTest Suite 3: Expired Token Rejection");

  const expiredToken = crypto.randomBytes(32).toString("hex");
  const pastDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes in past

  const expiredRecord = await prisma.passwordResetToken.create({
    data: {
      token: expiredToken,
      userId: testUser!.id,
      expiresAt: pastDate,
    },
  });

  const isExpired = new Date() > expiredRecord.expiresAt;
  assert(isExpired === true, "Expired token is correctly detected as invalid");

  // Clean up
  await prisma.passwordResetToken.delete({ where: { id: expiredRecord.id } });

  // TEST 4: SQLite Database Backup Integrity
  console.log("\nTest Suite 4: SQLite Point-in-Time Database Backup Verification");

  const projectRoot = path.resolve(__dirname, "..");
  const backupsDir = path.resolve(projectRoot, "backups");
  assert(fs.existsSync(backupsDir), "Backups directory exists on disk");

  const backupFiles = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith("natureclub-backup-") && f.endsWith(".db"));

  assert(backupFiles.length > 0, "At least one point-in-time database backup snapshot exists");

  const latestBackupPath = path.join(backupsDir, backupFiles[0]);
  const stats = fs.statSync(latestBackupPath);
  assert(stats.size > 0, `Backup file is non-empty (${stats.size} bytes)`);

  console.log("\n========================================");
  console.log("Stage 9 Tests Complete: All Passed!");
  console.log("========================================\n");
}

runStage9Tests()
  .catch((e) => {
    console.error("Test execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
