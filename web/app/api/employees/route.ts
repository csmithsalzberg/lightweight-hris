import { NextResponse } from 'next/server';

type Employee = {
  id: string;
  name: string;
  title: string;
  department: string;
  manager_id: string | null;
  contact_email: string;
  contact_phone?: string;
  hire_date: string;
  salary: number;
  status: 'active' | 'leave' | 'terminated';
};

const EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Avery Walker',
    title: 'CEO',
    department: 'Executive',
    manager_id: null,
    contact_email: 'avery.walker@example.com',
    contact_phone: '555-111-2222',
    hire_date: '2020-01-15',
    salary: 250000,
    status: 'active',
  },
  {
    id: '2',
    name: 'Jordan Kim',
    title: 'VP of Engineering',
    department: 'Engineering',
    manager_id: '1',
    contact_email: 'jordan.kim@example.com',
    contact_phone: '555-222-3333',
    hire_date: '2021-03-08',
    salary: 190000,
    status: 'active',
  },
  {
    id: '3',
    name: 'Riley Patel',
    title: 'Engineering Manager',
    department: 'Engineering',
    manager_id: '2',
    contact_email: 'riley.patel@example.com',
    contact_phone: '555-333-4444',
    hire_date: '2022-07-21',
    salary: 155000,
    status: 'active',
  },
  {
    id: '4',
    name: 'Casey Rivera',
    title: 'Software Engineer',
    department: 'Engineering',
    manager_id: '3',
    contact_email: 'casey.rivera@example.com',
    hire_date: '2023-02-10',
    salary: 125000,
    status: 'active',
  },
  {
    id: '5',
    name: 'Morgan Blake',
    title: 'HR Generalist',
    department: 'People Ops',
    manager_id: '1',
    contact_email: 'morgan.blake@example.com',
    hire_date: '2021-11-05',
    salary: 90000,
    status: 'active',
  },
];

export async function GET() {
  return NextResponse.json({ employees: EMPLOYEES });
}
