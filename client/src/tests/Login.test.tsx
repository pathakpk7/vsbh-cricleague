import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';

// Mock react-router-dom for Jest environment
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(), jest.fn()]
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Login Component', () => {
  test('renders native login tabs and admin form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('VSBH-CL Cricket League')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🛡️ League Admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /👑 Captain Auction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🏏 Player/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In as League Admin/i })).toBeInTheDocument();
    expect(screen.getByText('League Admin Email')).toBeInTheDocument();
    expect(screen.getByText('Password / Admin Key')).toBeInTheDocument();
  });

  test('switches to Captain Auction Login tab', () => {
    renderWithProviders(<Login />);
    
    const captainTab = screen.getByRole('button', { name: /👑 Captain Auction/i });
    fireEvent.click(captainTab);
    
    expect(screen.getByText('Unique Captain Auction Key (e.g. CAP-XXXX)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enter Auction Bidding Mode/i })).toBeInTheDocument();
  });

  test('switches to Player Login tab', () => {
    renderWithProviders(<Login />);
    
    const playerTab = screen.getByRole('button', { name: /🏏 Player/i });
    fireEvent.click(playerTab);
    
    expect(screen.getByText('Registered Player Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In as Player/i })).toBeInTheDocument();
  });
});
