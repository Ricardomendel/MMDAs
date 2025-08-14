/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as admin user
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>;
      
      /**
       * Custom command to login as taxpayer user
       * @example cy.loginAsTaxpayer()
       */
      loginAsTaxpayer(): Chainable<void>;
      
      /**
       * Custom command to logout user
       * @example cy.logout()
       */
      logout(): Chainable<void>;
      
      /**
       * Custom command to navigate to admin dashboard
       * @example cy.navigateToAdminDashboard()
       */
      navigateToAdminDashboard(): Chainable<void>;
      
      /**
       * Custom command to navigate to user management
       * @example cy.navigateToUserManagement()
       */
      navigateToUserManagement(): Chainable<void>;
      
      /**
       * Custom command to create a new user
       * @example cy.createUser(userData)
       */
      createUser(userData: any): Chainable<void>;
      
      /**
       * Custom command to delete a user
       * @example cy.deleteUser(userId)
       */
      deleteUser(userId: number): Chainable<void>;
      
      /**
       * Custom command to wait for API response
       * @example cy.waitForApi('getUsers')
       */
      waitForApi(alias: string): Chainable<void>;
    }
  }
}

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/');
  cy.get('[data-testid="login-button"]').click();
  cy.get('[data-testid="email-input"]').type('admin@example.com');
  cy.get('[data-testid="password-input"]').type('password123');
  cy.get('[data-testid="login-submit"]').click();
  cy.wait('@getProfile');
  cy.url().should('include', '/dashboard');
});

// Custom command to login as taxpayer
Cypress.Commands.add('loginAsTaxpayer', () => {
  cy.visit('/');
  cy.get('[data-testid="login-button"]').click();
  cy.get('[data-testid="email-input"]').type('taxpayer@example.com');
  cy.get('[data-testid="password-input"]').type('password123');
  cy.get('[data-testid="login-submit"]').click();
  cy.wait('@getProfile');
  cy.url().should('include', '/dashboard');
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('not.include', '/dashboard');
});

// Custom command to navigate to admin dashboard
Cypress.Commands.add('navigateToAdminDashboard', () => {
  cy.get('[data-testid="dashboard-tab"]').click();
  cy.wait('@getStats');
  cy.wait('@getRevenueCategories');
  cy.wait('@getProperties');
  cy.wait('@getActivities');
});

// Custom command to navigate to user management
Cypress.Commands.add('navigateToUserManagement', () => {
  cy.get('[data-testid="users-tab"]').click();
  cy.wait('@getUsers');
});

// Custom command to create a new user
Cypress.Commands.add('createUser', (userData: any) => {
  cy.get('[data-testid="add-user-button"]').click();
  cy.get('[data-testid="user-form"]').within(() => {
    cy.get('[data-testid="email-input"]').type(userData.email);
    cy.get('[data-testid="password-input"]').type(userData.password);
    cy.get('[data-testid="first-name-input"]').type(userData.firstName);
    cy.get('[data-testid="last-name-input"]').type(userData.lastName);
    cy.get('[data-testid="phone-input"]').type(userData.phone);
    cy.get('[data-testid="role-select"]').click();
    cy.get(`[data-value="${userData.role}"]`).click();
    cy.get('[data-testid="submit-button"]').click();
  });
});

// Custom command to delete a user
Cypress.Commands.add('deleteUser', (userId: number) => {
  cy.get(`[data-testid="user-${userId}-delete"]`).click();
  cy.get('[data-testid="confirm-delete"]').click();
});

// Custom command to wait for API response
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`);
});

export {};
