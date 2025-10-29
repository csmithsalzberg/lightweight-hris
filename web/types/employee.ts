export type Employee = {
    id: string;
    name: string;
    title: string;
    department: string;
    manager_id: string | null;
    contact_email: string;
    contact_phone?: string;
    hire_date: string; // ISO string like "2020-01-15"
    salary: number;
    status: 'active' | 'leave' | 'terminated';
  };
  