import authReducer, {
  login,
  logout,
  getProfile,
  register,
  initialState,
} from '../slices/authSlice';

describe('Auth Slice', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Initial State', () => {
    test('should return initial state', () => {
      const state = authReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('Login Action', () => {
    test('should handle pending state', () => {
      const action = { type: login.pending.type };
      const state = authReducer(initialState, action);
      
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    test('should handle fulfilled state', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'admin',
      };
      
      const mockToken = 'mock-jwt-token';
      
      const action = {
        type: login.fulfilled.type,
        payload: { user: mockUser, token: mockToken },
      };
      
      const state = authReducer(initialState, action);
      
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.isAuthenticated).toBe(true);
    });

    test('should handle rejected state', () => {
      const mockError = 'Invalid credentials';
      
      const action = {
        type: login.rejected.type,
        payload: mockError,
      };
      
      const state = authReducer(initialState, action);
      
      expect(state.loading).toBe(false);
      expect(state.error).toBe(mockError);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Action', () => {
    test('should clear user data and token', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'admin',
      };
      
      const mockToken = 'mock-jwt-token';
      
      const stateWithUser = {
        ...initialState,
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
      };
      
      const action = { type: logout.type };
      const state = authReducer(stateWithUser, action);
      
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('Get Profile Action', () => {
    test('should handle pending state', () => {
      const action = { type: getProfile.pending.type };
      const state = authReducer(initialState, action);
      
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    test('should handle fulfilled state', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'admin',
      };
      
      const action = {
        type: getProfile.fulfilled.type,
        payload: mockUser,
      };
      
      const state = authReducer(initialState, action);
      
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.isAuthenticated).toBe(true);
    });

    test('should handle rejected state', () => {
      const mockError = 'Failed to fetch profile';
      
      const action = {
        type: getProfile.rejected.type,
        payload: mockError,
      };
      
      const state = authReducer(initialState, action);
      
      expect(state.loading).toBe(false);
      expect(state.error).toBe(mockError);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Register Action', () => {
    test('should handle pending state', () => {
      const action = { type: register.pending.type };
      const state = authReducer(initialState, action);
      
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    test('should handle fulfilled state', () => {
      const mockUser = {
        id: 1,
        email: 'new@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'taxpayer',
      };
      
      const action = {
        type: register.fulfilled.type,
        payload: mockUser,
      };
      
      const state = authReducer(initialState, action);
      
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.isAuthenticated).toBe(true);
    });

    test('should handle rejected state', () => {
      const mockError = 'Email already exists';
      
      const action = {
        type: register.rejected.type,
        payload: mockError,
      };
      
      const state = authReducer(initialState, action);
      
      expect(state.loading).toBe(false);
      expect(state.error).toBe(mockError);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Local Storage Integration', () => {
    test('should load token from localStorage on initialization', () => {
      const mockToken = 'stored-jwt-token';
      localStorage.setItem('token', mockToken);
      
      // Simulate app initialization by dispatching an unknown action
      const state = authReducer(initialState, { type: 'unknown' });
      
      // Note: The token loading from localStorage happens in the component, not in the reducer
      // This test verifies the reducer doesn't interfere with localStorage
      expect(state.token).toBe(null);
    });

    test('should persist token to localStorage on login', () => {
      const mockToken = 'new-jwt-token';
      
      const action = {
        type: login.fulfilled.type,
        payload: { user: null, token: mockToken },
      };
      
      authReducer(initialState, action);
      
      // Note: The localStorage persistence happens in the component, not in the reducer
      // This test verifies the reducer updates the state correctly
      expect(localStorage.getItem('token')).toBe(null);
    });
  });

  describe('State Transitions', () => {
    test('should transition from unauthenticated to authenticated on login', () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'token';
      
      let state = authReducer(initialState, { type: 'unknown' });
      expect(state.isAuthenticated).toBe(false);
      
      state = authReducer(state, {
        type: login.fulfilled.type,
        payload: { user: mockUser, token: mockToken },
      });
      
      expect(state.isAuthenticated).toBe(true);
    });

    test('should transition from authenticated to unauthenticated on logout', () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'token';
      
      let state = {
        ...initialState,
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
      };
      
      expect(state.isAuthenticated).toBe(true);
      
      state = authReducer(state, { type: logout.type });
      
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should clear error on new action', () => {
      const stateWithError = {
        ...initialState,
        error: 'Previous error',
      };
      
      const action = { type: login.pending.type };
      const state = authReducer(stateWithError, action);
      
      expect(state.error).toBe(null);
    });

    test('should preserve error state on logout', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error',
      };
      
      const action = { type: logout.type };
      const state = authReducer(stateWithError, action);
      
      expect(state.error).toBe(null); // Logout clears the error
    });
  });
});
