import { logger } from '../utils/logger';

// Mock user data for development
const mockUsers = [
  {
    id: 1,
    email: 'admin@mmda.com',
    password_hash: '$2a$12$OVPV.AbouUa7lslr7vSEpuzdp8E7aCTIxgmxrEJ4DJFKXseR15U06', // password: admin123
    first_name: 'Admin',
    last_name: 'User',
    phone: '+233200000000',
    role: 'admin',
    status: 'active',
    mmda_id: 1,
    email_verified: true,
    phone_verified: true,
    created_at: new Date('2024-01-01'),
    login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    last_login_ip: null
  },
  {
    id: 2,
    email: 'taxpayer@example.com',
    password_hash: '$2a$12$0pchw/k1d.RaY.4Dt3u9y.Qa31j55YBJ8rU8kY8Srq04PW9q6CCuy', // password: taxpayer123
    first_name: 'John',
    last_name: 'Doe',
    phone: '+233200000001',
    role: 'taxpayer',
    status: 'active',
    mmda_id: 1,
    email_verified: true,
    phone_verified: true,
    created_at: new Date('2024-01-01'),
    login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    last_login_ip: null
  },
  {
    id: 3,
    email: 'staff@mmda.com',
    password_hash: '$2a$12$fmPwpfEEqXnkWLMFTFilAeBiRsLL0XmaASPu3uuPA368rX0AMtwia', // password: staff123
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '+233200000002',
    role: 'staff',
    status: 'active',
    mmda_id: 1,
    email_verified: true,
    phone_verified: true,
    created_at: new Date('2024-01-01'),
    login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    last_login_ip: null
  }
];

// Mock database operations
export const mockDb = {
  // Mock database destroy method
  destroy: async () => {
    logger.info('Mock database destroyed');
  },
  // Mock raw query method for health checks
  raw: async (query: string) => {
    if (query === 'SELECT 1') {
      return [{ '?column?': 1 }];
    }
    throw new Error('Mock raw query not implemented');
  },
  // Mock users table
  users: {
    where: (field: string, value: any) => ({
      first: () => {
        const user = mockUsers.find(u => u[field as keyof typeof u] === value);
        return user || null;
      },
      orWhere: (field2: string, value2: any) => ({
        first: () => {
          const user = mockUsers.find(u => 
            u[field as keyof typeof u] === value || u[field2 as keyof typeof u] === value2
          );
          return user || null;
        }
      }),
      update: async (data: any) => {
        const userIndex = mockUsers.findIndex(u => u[field as keyof typeof u] === value);
        if (userIndex !== -1) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
          return [1]; // Mock affected rows
        }
        return [0];
      }
    }),
    insert: (data: any) => ({
      returning: (fields: string[]) => {
        const newUser = {
          id: Math.floor(Math.random() * 10000) + 1000,
          ...data,
          created_at: new Date(),
          status: 'pending',
          email_verified: false,
          phone_verified: false,
          login_attempts: 0,
          locked_until: null,
          last_login_at: null,
          last_login_ip: null
        };
        mockUsers.push(newUser);
        
        const result: any = {};
        fields.forEach(field => {
          if (field in newUser) {
            result[field] = newUser[field as keyof typeof newUser];
          }
        });
        return [result];
      }
    }),
    select: (...fields: string[]) => ({
      where: (field: string, value: any) => ({
        first: () => {
          const user = mockUsers.find(u => u[field as keyof typeof u] === value);
          if (user) {
            const selectedUser: any = {};
            fields.forEach(field => {
              if (field in user) {
                selectedUser[field] = user[field as keyof typeof user];
              }
            });
            return selectedUser;
          }
          return null;
        }
      })
    })
  }
};

// Mock database connection
export async function connectMockDatabase(): Promise<void> {
  logger.info('Mock database connected successfully');
}

export async function disconnectMockDatabase(): Promise<void> {
  logger.info('Mock database disconnected successfully');
}

export async function checkMockDatabaseHealth(): Promise<boolean> {
  return true;
}
