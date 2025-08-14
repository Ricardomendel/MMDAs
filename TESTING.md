# 🧪 **Testing Documentation**

## **Overview**

This document provides comprehensive information about the testing suite implemented for the MMDA Revenue Mobilization System. The testing strategy covers three main areas:

1. **Unit Testing** - Testing individual components and functions
2. **Integration Testing** - Testing API endpoints and database interactions
3. **User Acceptance Testing** - End-to-end testing of user workflows

## **📋 Table of Contents**

- [Testing Architecture](#testing-architecture)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [User Acceptance Testing](#user-acceptance-testing)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## **🏗️ Testing Architecture**

### **Frontend Testing Stack**
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **Cypress** - End-to-end testing framework

### **Backend Testing Stack**
- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library for API testing
- **Mock Database** - In-memory database for testing

### **Test Structure**
```
├── client/
│   ├── src/
│   │   ├── components/__tests__/     # Component unit tests
│   │   ├── store/__tests__/          # Redux store tests
│   │   └── services/__tests__/       # API service tests
│   ├── cypress/                      # E2E tests
│   └── jest.config.js               # Jest configuration
├── server/
│   ├── tests/                        # Backend tests
│   │   ├── integration/              # API integration tests
│   │   └── setup.ts                  # Test setup
│   └── jest.config.js               # Jest configuration
└── TESTING.md                        # This documentation
```

## **🔬 Unit Testing**

### **Frontend Unit Tests**

#### **Components**
- **LandingPage.test.tsx** - Tests landing page rendering and interactions
- **UserForm.test.tsx** - Tests user form validation and submission
- **App.test.tsx** - Tests main application component

#### **Redux Store**
- **authSlice.test.ts** - Tests authentication state management
- **userSlice.test.ts** - Tests user management state

#### **Services**
- **api.test.ts** - Tests API service methods and error handling

### **Backend Unit Tests**

#### **Services**
- **paymentService.test.ts** - Tests payment processing logic
- **mobileMoneyService.test.ts** - Tests mobile money integration
- **bankTransferService.test.ts** - Tests bank transfer integration

#### **Middleware**
- **auth.test.ts** - Tests authentication middleware
- **errorHandler.test.ts** - Tests error handling middleware

### **Running Unit Tests**

```bash
# Frontend unit tests
cd client
npm run test:unit              # Run all unit tests
npm run test:unit:watch        # Run tests in watch mode
npm run test:unit:coverage     # Run tests with coverage report

# Backend unit tests
cd server
npm run test:unit              # Run all unit tests
npm run test:unit:watch        # Run tests in watch mode
npm run test:unit:coverage     # Run tests with coverage report
```

## **🔗 Integration Testing**

### **API Endpoint Tests**

#### **Authentication Routes**
- **POST /api/auth/register** - User registration
- **POST /api/auth/login** - User login
- **GET /api/auth/profile** - User profile retrieval
- **POST /api/auth/logout** - User logout
- **POST /api/auth/forgot-password** - Password reset request
- **POST /api/auth/reset-password** - Password reset
- **POST /api/auth/verify-email** - Email verification

#### **Admin Routes**
- **GET /api/admin/users** - Retrieve all users
- **POST /api/admin/users** - Create new user
- **GET /api/admin/users/:id** - Retrieve specific user
- **PUT /api/admin/users/:id** - Update user
- **DELETE /api/admin/users/:id** - Delete user
- **GET /api/admin/stats** - System statistics
- **GET /api/admin/revenue-categories** - Revenue categories
- **POST /api/admin/revenue-categories** - Create revenue category
- **GET /api/admin/properties** - Properties list
- **GET /api/admin/activities** - Recent activities
- **POST /api/admin/send-authorization-email** - Send authorization email
- **POST /api/admin/bulk-user-operations** - Bulk user operations

#### **Payment Routes**
- **GET /api/payments** - Retrieve payments
- **POST /api/payments** - Create payment
- **GET /api/payments/:id** - Retrieve specific payment
- **GET /api/payments/:id/status** - Check payment status
- **POST /api/payments/:id/cancel** - Cancel payment
- **GET /api/payments/methods/available** - Available payment methods

### **Database Integration Tests**

#### **Mock Database**
- Tests use an in-memory mock database for consistent testing
- Each test clears the database to ensure isolation
- Tests verify both successful operations and error scenarios

#### **Test Data Setup**
```typescript
beforeEach(async () => {
  // Clear mock database
  mockDb.users = [];
  mockDb.revenueCategories = [];
  mockDb.properties = [];
  mockDb.activities = [];
  
  // Create test data
  const userData = { /* ... */ };
  await request(app)
    .post('/api/auth/register')
    .send(userData);
});
```

### **Running Integration Tests**

```bash
# Backend integration tests
cd server
npm run test:integration       # Run integration tests only
npm run test                  # Run all tests
```

## **🎯 User Acceptance Testing**

### **Cypress E2E Tests**

#### **Test Scenarios**

##### **Landing Page**
- Display of main content and navigation
- Responsive design on different devices
- Call-to-action button functionality

##### **Authentication**
- User registration with validation
- User login and logout
- Form validation and error handling
- Password reset functionality

##### **Admin Dashboard**
- Dashboard display and navigation
- System statistics visualization
- Revenue categories management
- Properties and activities display

##### **User Management**
- User list display and pagination
- User creation, editing, and deletion
- Bulk user operations
- User search and filtering
- Authorization email sending

##### **Responsive Design**
- Mobile device compatibility
- Tablet device compatibility
- Navigation on different screen sizes

##### **Error Handling**
- Network error handling
- Server error handling
- Validation error display
- Graceful degradation

##### **Accessibility**
- ARIA label implementation
- Keyboard navigation
- Screen reader compatibility
- Color contrast compliance

### **Custom Cypress Commands**

```typescript
// Login commands
cy.loginAsAdmin()           // Login as admin user
cy.loginAsTaxpayer()        // Login as taxpayer user
cy.logout()                 // Logout current user

// Navigation commands
cy.navigateToAdminDashboard()    // Navigate to admin dashboard
cy.navigateToUserManagement()    // Navigate to user management

// User management commands
cy.createUser(userData)          // Create new user
cy.deleteUser(userId)            // Delete user
cy.waitForApi(alias)             // Wait for API response
```

### **Running E2E Tests**

```bash
# Frontend E2E tests
cd client
npm run cypress:open        # Open Cypress test runner
npm run cypress:run         # Run tests in headless mode
npm run test:e2e            # Start server and run tests
```

## **▶️ Running Tests**

### **Complete Test Suite**

```bash
# Root directory
npm run test:all            # Run all tests (frontend + backend)

# Frontend tests
cd client
npm run test:unit           # Unit tests
npm run test:e2e            # E2E tests
npm run test:all            # All frontend tests

# Backend tests
cd server
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:all            # All backend tests
```

### **Test Scripts**

#### **Frontend (client/package.json)**
```json
{
  "scripts": {
    "test:unit": "jest --config jest.config.js",
    "test:unit:watch": "jest --config jest.config.js --watch",
    "test:unit:coverage": "jest --config jest.config.js --coverage",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "test:e2e": "start-server-and-test start http://localhost:3000 cypress:run"
  }
}
```

#### **Backend (server/package.json)**
```json
{
  "scripts": {
    "test": "jest --config jest.config.js",
    "test:integration": "jest --config jest.config.js --testPathPattern=integration",
    "test:unit": "jest --config jest.config.js --testPathPattern=unit",
    "test:watch": "jest --config jest.config.js --watch",
    "test:coverage": "jest --config jest.config.js --coverage"
  }
}
```

## **📊 Test Coverage**

### **Coverage Targets**

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### **Coverage Reports**

```bash
# Frontend coverage
cd client
npm run test:unit:coverage

# Backend coverage
cd server
npm run test:coverage
```

### **Coverage Exclusions**

```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/index.tsx',
  '!src/serviceWorker.ts',
]
```

## **✅ Best Practices**

### **Test Organization**

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** and isolated

### **Test Data Management**

1. **Use beforeEach/afterEach** for test setup and cleanup
2. **Create realistic test data** that matches production scenarios
3. **Use factories or fixtures** for complex test data
4. **Clean up after tests** to prevent interference

### **Assertions**

1. **Test one thing at a time** per test case
2. **Use specific assertions** rather than generic ones
3. **Test both positive and negative scenarios**
4. **Verify error conditions** and edge cases

### **Mocking**

1. **Mock external dependencies** (APIs, databases)
2. **Use consistent mock data** across tests
3. **Verify mock interactions** when relevant
4. **Keep mocks simple** and focused

## **🔧 Troubleshooting**

### **Common Issues**

#### **Frontend Tests**

**Jest Configuration Issues**
```bash
# Clear Jest cache
npx jest --clearCache

# Check Jest configuration
npx jest --showConfig
```

**Component Rendering Issues**
```typescript
// Ensure proper test environment setup
import '@testing-library/jest-dom';

// Mock Material-UI components if needed
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useTheme: () => createTheme(),
}));
```

#### **Backend Tests**

**Database Connection Issues**
```typescript
// Ensure mock database is properly configured
import { mockDb } from '../src/config/mockDatabase';

beforeEach(() => {
  mockDb.users = [];
  mockDb.revenueCategories = [];
});
```

**API Route Issues**
```typescript
// Ensure proper app import
import { app } from '../../src/index';

// Check route registration
describe('Auth Routes', () => {
  it('should register user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);
    // ... assertions
  });
});
```

#### **Cypress Tests**

**Element Selection Issues**
```typescript
// Use data-testid attributes for reliable selection
cy.get('[data-testid="login-button"]').click();

// Wait for elements to be visible
cy.get('[data-testid="user-form"]').should('be.visible');
```

**API Interception Issues**
```typescript
// Ensure proper API interception
cy.intercept('GET', '/api/auth/profile', { fixture: 'profile.json' }).as('getProfile');

// Wait for intercepted calls
cy.wait('@getProfile');
```

### **Debug Mode**

```bash
# Jest debug mode
npm run test:unit -- --verbose --detectOpenHandles

# Cypress debug mode
npm run cypress:open -- --config video=true
```

### **Performance Optimization**

1. **Run tests in parallel** when possible
2. **Use test sharding** for large test suites
3. **Optimize test data** and reduce setup time
4. **Use appropriate timeouts** for different test types

## **📚 Additional Resources**

### **Documentation**
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

### **Testing Patterns**
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [E2E Testing Strategies](https://docs.cypress.io/guides/references/best-practices)
- [API Testing Patterns](https://github.com/visionmedia/supertest#examples)

### **Community**
- [Jest Community](https://github.com/facebook/jest)
- [React Testing Library Community](https://github.com/testing-library/react-testing-library)
- [Cypress Community](https://github.com/cypress-io/cypress)

---

## **🎉 Conclusion**

This comprehensive testing suite ensures the MMDA Revenue Mobilization System is robust, reliable, and maintainable. By covering unit, integration, and user acceptance testing, we can confidently deploy and maintain the system while ensuring high quality and user satisfaction.

For questions or issues related to testing, please refer to the troubleshooting section or consult the testing team.
