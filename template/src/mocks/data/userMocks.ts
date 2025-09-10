import { faker } from '@faker-js/faker';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'moderator';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
  };
}

// Generate a single mock user
export const generateMockUser = (overrides: Partial<MockUser> = {}): MockUser => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const email = faker.internet.email(firstName, lastName).toLowerCase();
  
  return {
    id: faker.datatype.uuid(),
    name: `${firstName} ${lastName}`,
    email,
    avatar: faker.internet.avatar(),
    role: faker.helpers.arrayElement(['admin', 'user', 'moderator']),
    isActive: faker.datatype.boolean(),
    createdAt: faker.date.past(2).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
    profile: {
      bio: faker.lorem.sentence(),
      location: `${faker.address.city()}, ${faker.address.stateAbbr()}`,
      website: faker.internet.url(),
    },
    ...overrides,
  };
};

// Generate multiple users
export const generateMockUsers = (count: number = 10): MockUser[] => {
  return Array.from({ length: count }, () => generateMockUser());
};

// Predefined mock users for consistent testing
export const userMocks = {
  // Admin user for testing admin features
  admin: generateMockUser({
    id: 'admin-user-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
  }),
  
  // Regular user for testing standard features
  user: generateMockUser({
    id: 'regular-user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user',
    isActive: true,
  }),
  
  // Inactive user for testing status scenarios
  inactiveUser: generateMockUser({
    id: 'inactive-user-1',
    name: 'Inactive User',
    email: 'inactive@example.com',
    role: 'user',
    isActive: false,
  }),
  
  // Generate a list of users for pagination/listing
  list: generateMockUsers(25),
};

// Helper to find user by ID
export const findUserById = (id: string): MockUser | undefined => {
  // Check predefined users first
  const predefinedUser = Object.values(userMocks).find(user => 
    typeof user === 'object' && 'id' in user && user.id === id
  ) as MockUser | undefined;
  
  if (predefinedUser) return predefinedUser;
  
  // Check in the list
  return userMocks.list.find(user => user.id === id);
};

// Helper to update user
export const updateUserInMocks = (id: string, updates: Partial<MockUser>): MockUser | null => {
  const user = findUserById(id);
  if (!user) return null;
  
  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  return user;
};

// Helper to delete user from list
export const deleteUserFromMocks = (id: string): boolean => {
  const index = userMocks.list.findIndex(user => user.id === id);
  if (index > -1) {
    userMocks.list.splice(index, 1);
    return true;
  }
  return false;
};

// Helper to add user to list
export const addUserToMocks = (user: Omit<MockUser, 'id' | 'createdAt' | 'updatedAt'>): MockUser => {
  const newUser = generateMockUser(user);
  userMocks.list.unshift(newUser);
  return newUser;
};