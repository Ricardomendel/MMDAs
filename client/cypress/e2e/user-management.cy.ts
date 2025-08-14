describe('User Management E2E Tests', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/');
  });

  describe('Landing Page', () => {
    it('should display the landing page correctly', () => {
      // Check main heading
      cy.get('h1').should('contain', 'MMDA Revenue Mobilization System');
      
      // Check navigation links
      cy.get('nav').should('contain', 'Home');
      cy.get('nav').should('contain', 'Features');
      cy.get('nav').should('contain', 'Services');
      cy.get('nav').should('contain', 'About');
      
      // Check call-to-action buttons
      cy.get('button').should('contain', 'Get Started');
      cy.get('button').should('contain', 'Learn More');
      
      // Check statistics section
      cy.get('[data-testid="statistics"]').should('exist');
      cy.get('[data-testid="total-revenue"]').should('contain', '₵2.5M+');
      cy.get('[data-testid="active-properties"]').should('contain', '15,000+');
      cy.get('[data-testid="registered-users"]').should('contain', '8,500+');
      cy.get('[data-testid="payment-methods"]').should('contain', '5+');
    });

    it('should navigate to features section', () => {
      cy.get('a[href="#features"]').click();
      cy.get('[data-testid="features-section"]').should('be.visible');
      cy.get('[data-testid="feature-card"]').should('have.length.at.least', 4);
    });

    it('should navigate to services section', () => {
      cy.get('a[href="#services"]').click();
      cy.get('[data-testid="services-section"]').should('be.visible');
      cy.get('[data-testid="service-card"]').should('have.length.at.least', 3);
    });
  });

  describe('Authentication', () => {
    it('should open login dialog when login button is clicked', () => {
      cy.get('[data-testid="login-button"]').click();
      cy.get('[data-testid="login-dialog"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
    });

    it('should open registration dialog when register button is clicked', () => {
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="register-dialog"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="first-name-input"]').should('be.visible');
      cy.get('[data-testid="last-name-input"]').should('be.visible');
      cy.get('[data-testid="phone-input"]').should('be.visible');
    });

    it('should validate login form fields', () => {
      cy.get('[data-testid="login-button"]').click();
      cy.get('[data-testid="login-submit"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="email-error"]').should('be.visible');
      cy.get('[data-testid="password-error"]').should('be.visible');
    });

    it('should validate registration form fields', () => {
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="register-submit"]').click();
      
      // Should show validation errors for required fields
      cy.get('[data-testid="email-error"]').should('be.visible');
      cy.get('[data-testid="password-error"]').should('be.visible');
      cy.get('[data-testid="first-name-error"]').should('be.visible');
      cy.get('[data-testid="last-name-error"]').should('be.visible');
      cy.get('[data-testid="phone-error"]').should('be.visible');
    });

    it('should validate email format in registration', () => {
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="register-submit"]').click();
      cy.get('[data-testid="email-error"]').should('contain', 'valid email');
    });

    it('should validate password length in registration', () => {
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="password-input"]').type('123');
      cy.get('[data-testid="register-submit"]').click();
      cy.get('[data-testid="password-error"]').should('contain', '8 characters');
    });

    it('should validate phone number format in registration', () => {
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="phone-input"]').type('123');
      cy.get('[data-testid="register-submit"]').click();
      cy.get('[data-testid="phone-error"]').should('contain', 'valid Ghana phone number');
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      // Login as admin
      cy.loginAsAdmin();
    });

    it('should display admin dashboard after login', () => {
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="admin-dashboard"]').should('be.visible');
      cy.get('[data-testid="welcome-message"]').should('contain', 'Admin');
    });

    it('should display system statistics', () => {
      cy.navigateToAdminDashboard();
      
      cy.get('[data-testid="stats-card"]').should('have.length.at.least', 4);
      cy.get('[data-testid="total-users"]').should('be.visible');
      cy.get('[data-testid="total-revenue"]').should('be.visible');
      cy.get('[data-testid="total-properties"]').should('be.visible');
      cy.get('[data-testid="total-payments"]').should('be.visible');
    });

    it('should display revenue categories', () => {
      cy.navigateToAdminDashboard();
      
      cy.get('[data-testid="revenue-categories-section"]').should('be.visible');
      cy.get('[data-testid="revenue-category-card"]').should('have.length.at.least', 1);
    });

    it('should display properties', () => {
      cy.navigateToAdminDashboard();
      
      cy.get('[data-testid="properties-section"]').should('be.visible');
      cy.get('[data-testid="property-card"]').should('have.length.at.least', 1);
    });

    it('should display recent activities', () => {
      cy.navigateToAdminDashboard();
      
      cy.get('[data-testid="activities-section"]').should('be.visible');
      cy.get('[data-testid="activity-item"]').should('have.length.at.least', 1);
    });

    it('should navigate between different sections', () => {
      // Navigate to Users section
      cy.get('[data-testid="users-tab"]').click();
      cy.url().should('include', '/users');
      cy.get('[data-testid="users-section"]').should('be.visible');
      
      // Navigate to Properties section
      cy.get('[data-testid="properties-tab"]').click();
      cy.url().should('include', '/properties');
      cy.get('[data-testid="properties-section"]').should('be.visible');
      
      // Navigate to Settings section
      cy.get('[data-testid="settings-tab"]').click();
      cy.url().should('include', '/settings');
      cy.get('[data-testid="settings-section"]').should('be.visible');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.navigateToUserManagement();
    });

    it('should display users list', () => {
      cy.get('[data-testid="users-table"]').should('be.visible');
      cy.get('[data-testid="user-row"]').should('have.length.at.least', 1);
    });

    it('should open add user dialog', () => {
      cy.get('[data-testid="add-user-button"]').click();
      cy.get('[data-testid="user-form-dialog"]').should('be.visible');
      cy.get('[data-testid="user-form"]').should('be.visible');
    });

    it('should create a new user successfully', () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '+233123456789',
        role: 'taxpayer'
      };

      cy.createUser(newUser);
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'successfully');
      
      // Should close dialog
      cy.get('[data-testid="user-form-dialog"]').should('not.exist');
      
      // Should refresh users list
      cy.get('[data-testid="users-table"]').should('contain', newUser.email);
    });

    it('should edit existing user', () => {
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="edit-button"]').click();
      });
      
      cy.get('[data-testid="user-form-dialog"]').should('be.visible');
      cy.get('[data-testid="first-name-input"]').clear().type('Updated Name');
      cy.get('[data-testid="submit-button"]').click();
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'updated');
    });

    it('should delete user with confirmation', () => {
      const userEmail = 'testuser@example.com';
      
      // Find user row and click delete
      cy.get('[data-testid="user-row"]').contains(userEmail).parent().within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });
      
      // Should show confirmation dialog
      cy.get('[data-testid="delete-confirmation"]').should('be.visible');
      cy.get('[data-testid="confirm-delete"]').click();
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'deleted');
      
      // User should be removed from list
      cy.get('[data-testid="users-table"]').should('not.contain', userEmail);
    });

    it('should send authorization email to user', () => {
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="more-actions"]').click();
        cy.get('[data-testid="send-email-option"]').click();
      });
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'sent successfully');
    });

    it('should perform bulk user operations', () => {
      // Select multiple users
      cy.get('[data-testid="user-checkbox"]').first().check();
      cy.get('[data-testid="user-checkbox"]').eq(1).check();
      
      // Open bulk actions menu
      cy.get('[data-testid="bulk-actions-button"]').click();
      cy.get('[data-testid="bulk-activate-option"]').click();
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'successfully');
    });

    it('should filter users by role', () => {
      cy.get('[data-testid="role-filter"]').click();
      cy.get('[data-value="taxpayer"]').click();
      
      // Should filter users by taxpayer role
      cy.get('[data-testid="user-row"]').each(($row) => {
        cy.wrap($row).should('contain', 'Taxpayer');
      });
    });

    it('should search users by name or email', () => {
      const searchTerm = 'admin';
      cy.get('[data-testid="search-input"]').type(searchTerm);
      
      // Should filter users by search term
      cy.get('[data-testid="user-row"]').should('contain', searchTerm);
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      // Check mobile menu
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      
      // Check mobile navigation
      cy.get('[data-testid="mobile-nav"]').should('be.visible');
    });

    it('should be responsive on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/');
      
      // Check tablet layout
      cy.get('[data-testid="hero-section"]').should('be.visible');
      cy.get('[data-testid="features-grid"]').should('have.css', 'grid-template-columns');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API calls and force network error
      cy.intercept('GET', '/api/auth/profile', { forceNetworkError: true }).as('networkError');
      
      cy.loginAsAdmin();
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'network error');
    });

    it('should handle server errors gracefully', () => {
      // Intercept API calls and return server error
      cy.intercept('GET', '/api/admin/users', { statusCode: 500, body: { error: 'Internal Server Error' } }).as('serverError');
      
      cy.loginAsAdmin();
      cy.navigateToUserManagement();
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'server error');
    });

    it('should handle validation errors', () => {
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="register-submit"]').click();
      
      // Should show validation error
      cy.get('[data-testid="email-error"]').should('be.visible');
      cy.get('[data-testid="email-error"]').should('contain', 'valid email');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.visit('/');
      
      // Check for ARIA labels on form inputs
      cy.get('[data-testid="email-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label');
      
      // Check for ARIA labels on buttons
      cy.get('[data-testid="login-button"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="register-button"]').should('have.attr', 'aria-label');
    });

    it('should have proper heading hierarchy', () => {
      cy.visit('/');
      
      // Check heading hierarchy
      cy.get('h1').should('exist');
      cy.get('h2').should('exist');
      cy.get('h3').should('exist');
    });

    it('should be keyboard navigable', () => {
      cy.visit('/');
      
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('exist');
      
      // Test enter key on buttons
      cy.get('[data-testid="login-button"]').focus().type('{enter}');
      cy.get('[data-testid="login-dialog"]').should('be.visible');
    });
  });
});
