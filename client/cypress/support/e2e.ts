// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // for uncaught exceptions
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection')) {
    return false;
  }
  return true;
});

// Global configuration
beforeEach(() => {
  // Clear localStorage and sessionStorage before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Intercept and mock API calls for consistent testing
  cy.intercept('GET', '/api/auth/profile', { fixture: 'profile.json' }).as('getProfile');
  cy.intercept('GET', '/api/admin/stats', { fixture: 'stats.json' }).as('getStats');
  cy.intercept('GET', '/api/admin/users', { fixture: 'users.json' }).as('getUsers');
  cy.intercept('GET', '/api/admin/revenue-categories', { fixture: 'revenueCategories.json' }).as('getRevenueCategories');
  cy.intercept('GET', '/api/admin/properties', { fixture: 'properties.json' }).as('getProperties');
  cy.intercept('GET', '/api/admin/activities', { fixture: 'activities.json' }).as('getActivities');
});
