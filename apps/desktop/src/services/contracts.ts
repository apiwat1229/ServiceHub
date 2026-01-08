export interface Contract {
    id: string;
    title: string;
    contractType: 'Service' | 'Lease' | 'Software' | 'Maintenance' | 'Other';
    cost: number;
    period: string; // e.g. "1 Year"
    startDate: string; // ISO date YYYY-MM-DD
    endDate: string; // ISO date YYYY-MM-DD
    responsiblePerson: string;
    department: string;
    status: 'Active' | 'Expiring' | 'Expired' | 'Draft';
    fileUrl?: string; // Mock URL
    notificationEmails: string[];
}

const mockContracts: Contract[] = [
    {
        id: '1',
        title: 'Main Office Lease Agreement',
        contractType: 'Lease',
        cost: 1200000,
        period: '3 Years',
        startDate: '2023-01-01',
        endDate: '2026-01-01',
        responsiblePerson: 'Somchai Jai-dee',
        department: 'Administration',
        status: 'Active',
        notificationEmails: ['admin@company.com'],
    },
    {
        id: '2',
        title: 'Adobe Creative Cloud License',
        contractType: 'Software',
        cost: 45000,
        period: '1 Year',
        startDate: '2024-02-15',
        endDate: '2025-02-15',
        responsiblePerson: 'Jane Doe',
        department: 'IT',
        status: 'Expiring',
        notificationEmails: ['it@company.com'],
    },
    {
        id: '3',
        title: 'Security Guard Service',
        contractType: 'Service',
        cost: 250000,
        period: '1 Year',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        responsiblePerson: 'Security Chief',
        department: 'Safety & Compliance',
        status: 'Expired',
        notificationEmails: ['security@company.com'],
    },
    {
        id: '4',
        title: 'Printer Maintenance (Canon)',
        contractType: 'Maintenance',
        cost: 15000,
        period: '1 Year',
        startDate: '2024-06-01',
        endDate: '2025-06-01',
        responsiblePerson: 'IT Support',
        department: 'IT',
        status: 'Active',
        notificationEmails: ['helpdesk@company.com'],
    },
    {
        id: '5',
        title: 'Vehicle Fleet Insurance',
        contractType: 'Other',
        cost: 300000,
        period: '1 Year',
        startDate: '2024-03-01',
        endDate: '2025-03-01',
        responsiblePerson: 'Fleet Manager',
        department: 'Logistics & Supply',
        status: 'Expiring',
        notificationEmails: ['logistics@company.com'],
    },
    {
        id: '6',
        title: 'Microsoft 365 Enterprise License',
        contractType: 'Software',
        cost: 850000,
        period: '3 Years',
        startDate: '2023-06-01',
        endDate: '2026-06-01',
        responsiblePerson: 'IT Director',
        department: 'IT',
        status: 'Active',
        notificationEmails: ['it@company.com'],
    },
    {
        id: '7',
        title: 'Cleaning Service Contract',
        contractType: 'Service',
        cost: 180000,
        period: '2 Years',
        startDate: '2024-01-15',
        endDate: '2026-01-15',
        responsiblePerson: 'Facility Manager',
        department: 'Facility Management',
        status: 'Active',
        notificationEmails: ['facility@company.com'],
    },
    {
        id: '8',
        title: 'HVAC System Maintenance',
        contractType: 'Maintenance',
        cost: 120000,
        period: '1 Year',
        startDate: '2024-09-01',
        endDate: '2025-09-01',
        responsiblePerson: 'Building Engineer',
        department: 'Facility Management',
        status: 'Active',
        notificationEmails: ['facility@company.com'],
    },
    {
        id: '9',
        title: 'Internet Service Provider (Fiber 1Gbps)',
        contractType: 'Service',
        cost: 60000,
        period: '2 Years',
        startDate: '2023-12-01',
        endDate: '2025-12-01',
        responsiblePerson: 'Network Admin',
        department: 'IT',
        status: 'Active',
        notificationEmails: ['network@company.com'],
    },
    {
        id: '10',
        title: 'Warehouse Lease - Zone A',
        contractType: 'Lease',
        cost: 2500000,
        period: '5 Years',
        startDate: '2022-01-01',
        endDate: '2027-01-01',
        responsiblePerson: 'Warehouse Manager',
        department: 'Logistics & Supply',
        status: 'Active',
        notificationEmails: ['warehouse@company.com'],
    },
    {
        id: '11',
        title: 'SAP ERP System License',
        contractType: 'Software',
        cost: 1500000,
        period: '3 Years',
        startDate: '2024-04-01',
        endDate: '2027-04-01',
        responsiblePerson: 'CIO',
        department: 'IT',
        status: 'Active',
        notificationEmails: ['erp@company.com'],
    },
    {
        id: '12',
        title: 'Fire Safety System Inspection',
        contractType: 'Maintenance',
        cost: 35000,
        period: '1 Year',
        startDate: '2024-11-01',
        endDate: '2025-11-01',
        responsiblePerson: 'Safety Officer',
        department: 'Safety & Compliance',
        status: 'Active',
        notificationEmails: ['safety@company.com'],
    },
    {
        id: '13',
        title: 'Legal Consulting Services',
        contractType: 'Service',
        cost: 450000,
        period: '1 Year',
        startDate: '2024-07-01',
        endDate: '2025-07-01',
        responsiblePerson: 'Legal Head',
        department: 'Administration',
        status: 'Active',
        notificationEmails: ['legal@company.com'],
    },
    {
        id: '14',
        title: 'Employee Training Platform (Udemy Business)',
        contractType: 'Software',
        cost: 95000,
        period: '1 Year',
        startDate: '2024-10-01',
        endDate: '2025-10-01',
        responsiblePerson: 'HR Manager',
        department: 'Human Resources',
        status: 'Active',
        notificationEmails: ['hr@company.com'],
    },
    {
        id: '15',
        title: 'Forklift Rental Agreement',
        contractType: 'Lease',
        cost: 280000,
        period: '2 Years',
        startDate: '2024-05-01',
        endDate: '2026-05-01',
        responsiblePerson: 'Logistics Supervisor',
        department: 'Logistics & Supply',
        status: 'Active',
        notificationEmails: ['logistics@company.com'],
    },
    {
        id: '16',
        title: 'Pest Control Service',
        contractType: 'Service',
        cost: 24000,
        period: '1 Year',
        startDate: '2024-08-01',
        endDate: '2025-08-01',
        responsiblePerson: 'Facility Coordinator',
        department: 'Facility Management',
        status: 'Active',
        notificationEmails: ['facility@company.com'],
    },
    {
        id: '17',
        title: 'Backup & Disaster Recovery Service',
        contractType: 'Software',
        cost: 320000,
        period: '2 Years',
        startDate: '2024-03-15',
        endDate: '2026-03-15',
        responsiblePerson: 'IT Security',
        department: 'IT',
        status: 'Active',
        notificationEmails: ['security@company.com'],
    },
    {
        id: '18',
        title: 'Elevator Maintenance Contract',
        contractType: 'Maintenance',
        cost: 85000,
        period: '1 Year',
        startDate: '2024-12-01',
        endDate: '2025-12-01',
        responsiblePerson: 'Building Manager',
        department: 'Facility Management',
        status: 'Active',
        notificationEmails: ['building@company.com'],
    },
    {
        id: '19',
        title: 'Accounting Software (QuickBooks)',
        contractType: 'Software',
        cost: 42000,
        period: '1 Year',
        startDate: '2024-01-01',
        endDate: '2025-01-01',
        responsiblePerson: 'Finance Manager',
        department: 'Administration',
        status: 'Expiring',
        notificationEmails: ['finance@company.com'],
    },
    {
        id: '20',
        title: 'Company Vehicle Leasing',
        contractType: 'Lease',
        cost: 650000,
        period: '3 Years',
        startDate: '2023-09-01',
        endDate: '2026-09-01',
        responsiblePerson: 'Fleet Coordinator',
        department: 'Logistics & Supply',
        status: 'Active',
        notificationEmails: ['fleet@company.com'],
    },
];

export const contractsService = {
    getContracts: async (): Promise<Contract[]> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve([...mockContracts]), 800);
        });
    },

    getContract: async (id: string): Promise<Contract | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(mockContracts.find((c) => c.id === id)), 400);
        });
    },

    createContract: async (data: Omit<Contract, 'id' | 'status'>): Promise<Contract> => {
        return new Promise((resolve) => {
            const newContract: Contract = {
                ...data,
                id: Math.random().toString(36).substring(2, 9),
                status: 'Active', // Default logic, calculate based on dates in real app
            };
            mockContracts.push(newContract);
            setTimeout(() => resolve(newContract), 600);
        });
    },

    updateContract: async (id: string, data: Partial<Contract>): Promise<Contract> => {
        return new Promise((resolve, reject) => {
            const index = mockContracts.findIndex((c) => c.id === id);
            if (index !== -1) {
                mockContracts[index] = { ...mockContracts[index], ...data };
                setTimeout(() => resolve(mockContracts[index]), 600);
            } else {
                reject(new Error('Contract not found'));
            }
        });
    },

    deleteContract: async (id: string): Promise<void> => {
        return new Promise((resolve) => {
            const index = mockContracts.findIndex((c) => c.id === id);
            if (index !== -1) {
                mockContracts.splice(index, 1);
            }
            setTimeout(() => resolve(), 500);
        });
    },
};
