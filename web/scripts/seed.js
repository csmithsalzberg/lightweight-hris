/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing
  await prisma.changeLog.deleteMany();
  await prisma.employee.deleteMany();

  // Create hierarchy
  const avery = await prisma.employee.create({
    data: {
      name: 'Avery Walker',
      title: 'CEO',
      department: 'Executive',
      managerId: null,
      contactEmail: 'avery.walker@example.com',
      contactPhone: '555-111-2222',
      hireDate: new Date('2020-01-15'),
      salary: 250000,
      status: 'active',
    },
  });

  const jordan = await prisma.employee.create({
    data: {
      name: 'Jordan Kim',
      title: 'VP of Engineering',
      department: 'Engineering',
      managerId: avery.id,
      contactEmail: 'jordan.kim@example.com',
      contactPhone: '555-222-3333',
      hireDate: new Date('2021-03-08'),
      salary: 190000,
      status: 'leave',
    },
  });

  const riley = await prisma.employee.create({
    data: {
      name: 'Riley Patel',
      title: 'Engineering Manager',
      department: 'Engineering',
      managerId: jordan.id,
      contactEmail: 'riley.patel@example.com',
      contactPhone: '555-333-4444',
      hireDate: new Date('2022-07-21'),
      salary: 155000,
      status: 'terminated',
    },
  });

  await prisma.employee.create({
    data: {
      name: 'Casey Rivera',
      title: 'Software Engineer',
      department: 'Engineering',
      managerId: riley.id,
      contactEmail: 'casey.rivera@example.com',
      contactPhone: '555-444-5555',
      hireDate: new Date('2023-02-10'),
      salary: 125000,
      status: 'active',
    },
  });

  await prisma.employee.create({
    data: {
      name: 'Morgan Blake',
      title: 'HR Generalist',
      department: 'People Ops',
      managerId: avery.id,
      contactEmail: 'morgan.blake@example.com',
      contactPhone: '555-555-6666',
      hireDate: new Date('2021-11-05'),
      salary: 90000,
      status: 'active',
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


