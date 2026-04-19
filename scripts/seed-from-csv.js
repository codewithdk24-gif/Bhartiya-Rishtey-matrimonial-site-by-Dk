/**
 * Seed Database from CSV
 * 
 * Reads data/profiles.csv and creates users + profiles in the SQLite database.
 * Also exports current DB data back to CSV for viewing.
 * 
 * Usage: node scripts/seed-from-csv.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function toCSV(rows, headers) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h] ?? '';
      // Quote values containing commas
      if (String(val).includes(',') || String(val).includes('"') || String(val).includes('\n')) {
        return `"${String(val).replace(/"/g, '""')}"`;
      }
      return String(val);
    });
    lines.push(values.join(','));
  }
  return lines.join('\n');
}

async function seedFromCSV() {
  const csvPath = path.join(__dirname, '..', 'data', 'profiles.csv');

  if (!fs.existsSync(csvPath)) {
    console.log('❌ data/profiles.csv not found. Skipping seed.');
    return;
  }

  console.log('📂 Reading data/profiles.csv...');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);
  console.log(`   Found ${rows.length} profiles in CSV`);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: row.email } });
    if (existing) {
      skipped++;
      continue;
    }

    const passwordHash = await bcrypt.hash(row.password || 'Demo1234', 12);

    await prisma.user.create({
      data: {
        email: row.email,
        passwordHash,
        role: 'USER',
        isVerified: true,
        profile: {
          create: {
            fullName: row.fullName,
            gender: row.gender,
            dateOfBirth: new Date(row.dateOfBirth),
            heightCm: parseInt(row.heightCm) || null,
            religion: row.religion || null,
            caste: row.caste || null,
            location: row.location || null,
            education: row.education || null,
            profession: row.profession || null,
            incomeTier: row.incomeTier || null,
            bio: row.bio || null,
            completionPct: 70,
            isCompleted: true,
            isVisible: true,
          },
        },
      },
    });

    created++;
  }

  console.log(`✅ Seed complete: ${created} created, ${skipped} skipped (already exist)`);
}

async function exportToCSV() {
  console.log('\n📤 Exporting current DB to data/profiles_export.csv...');

  const profiles = await prisma.profile.findMany({
    include: { user: { select: { email: true } } },
  });

  const rows = profiles.map(p => ({
    email: p.user.email,
    fullName: p.fullName,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().split('T')[0] : '',
    heightCm: p.heightCm ?? '',
    religion: p.religion ?? '',
    caste: p.caste ?? '',
    location: p.location ?? '',
    education: p.education ?? '',
    profession: p.profession ?? '',
    incomeTier: p.incomeTier ?? '',
    bio: p.bio ?? '',
    completionPct: p.completionPct,
    isCompleted: p.isCompleted,
    isVisible: p.isVisible,
  }));

  const headers = ['email', 'fullName', 'gender', 'dateOfBirth', 'heightCm', 'religion', 'caste', 'location', 'education', 'profession', 'incomeTier', 'bio', 'completionPct', 'isCompleted', 'isVisible'];
  const csvContent = toCSV(rows, headers);

  const exportPath = path.join(__dirname, '..', 'data', 'profiles_export.csv');
  fs.writeFileSync(exportPath, csvContent, 'utf-8');

  console.log(`✅ Exported ${rows.length} profiles to data/profiles_export.csv`);
  console.log('\n📊 Profile Summary:');
  console.log(`   Total: ${rows.length}`);
  console.log(`   Males: ${rows.filter(r => r.gender === 'A Groom').length}`);
  console.log(`   Females: ${rows.filter(r => r.gender === 'A Bride').length}`);
  console.log(`   Completed: ${rows.filter(r => r.isCompleted).length}`);
}

async function main() {
  try {
    await seedFromCSV();
    await exportToCSV();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
