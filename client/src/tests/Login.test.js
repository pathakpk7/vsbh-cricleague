const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { BrowserRouter } = require('react-router-dom');
const Login = require('../src/pages/Login').default;
const { AuthProvider } = require('../src/contexts/AuthContext');

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  test('renders login form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('University ID')).toBeInTheDocument();
    expect(screen.getByLabelText('CricHeroes ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Email ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderWithProviders(<Login />);
    
    const loginButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/All fields are required/)).toBeInTheDocument();
    });
  });

  test('allows user to fill form fields', () => {
    renderWithProviders(<Login />);
    
    const nameInput = screen.getByLabelText('Full Name');
    const universityIdInput = screen.getByLabelText('University ID');
    const cricHeroesIdInput = screen.getByLabelText('CricHeroes ID');
    const emailInput = screen.getByLabelText('Email ID');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(universityIdInput, { target: { value: 'U12345' } });
    fireEvent.change(cricHeroesIdInput, { target: { value: 'CH12345' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    
    expect(nameInput.value).toBe('John Doe');
    expect(universityIdInput.value).toBe('U12345');
    expect(cricHeroesIdInput.value).toBe('CH12345');
    expect(emailInput.value).toBe('john@example.com');
  });

  test('shows welcome message', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Welcome to VSBH Cricket League!')).toBeInTheDocument();
    expect(screen.getByText('For support: prasoon7pathak@gmail.com')).toBeInTheDocument();
  });
});
