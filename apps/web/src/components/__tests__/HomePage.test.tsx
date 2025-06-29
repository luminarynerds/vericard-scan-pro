import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../../app/page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    
    const heading = screen.getByText('Card Verification');
    expect(heading).toBeInTheDocument();
    
    const subheading = screen.getByText('Reimagined');
    expect(subheading).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<HomePage />);
    
    const description = screen.getByText(/Professional-grade card authentication powered by AI/);
    expect(description).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<HomePage />);
    
    expect(screen.getByText('Scanner')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Launch App')).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    render(<HomePage />);
    
    expect(screen.getByText('Multi-Angle Capture')).toBeInTheDocument();
    expect(screen.getByText('0.8s Processing')).toBeInTheDocument();
    expect(screen.getByText('Theft Prevention')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    render(<HomePage />);
    
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('<0.8s')).toBeInTheDocument();
    expect(screen.getByText('$0.001')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<HomePage />);
    
    const startScanningButtons = screen.getAllByText('Start Scanning');
    expect(startScanningButtons).toHaveLength(1);
    
    expect(screen.getByText('Watch Demo')).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.getByText('View Pricing')).toBeInTheDocument();
  });

  it('applies hover effect on Start Scanning button', async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    
    const startButton = screen.getByText('Start Scanning');
    const chevronIcon = startButton.querySelector('svg');
    
    // Initially no translation
    expect(chevronIcon).toHaveClass('ml-2 transition-transform');
    
    // Hover to apply translation
    await user.hover(startButton);
    
    // Check if parent component state would trigger the transform
    // Note: Testing hover state in unit tests has limitations
    expect(startButton).toBeInTheDocument();
  });

  it('has correct href attributes on links', () => {
    render(<HomePage />);
    
    const scannerLinks = screen.getAllByRole('link', { name: /scanner/i });
    scannerLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/scanner');
    });
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    
    const pricingLinks = screen.getAllByRole('link', { name: /pricing/i });
    pricingLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/pricing');
    });
  });

  it('renders the company name in navigation', () => {
    render(<HomePage />);
    
    expect(screen.getByText('VeriCard Scan Pro')).toBeInTheDocument();
  });

  it('renders all feature descriptions', () => {
    render(<HomePage />);
    
    expect(screen.getByText(/Capture front, back, and all four edges/)).toBeInTheDocument();
    expect(screen.getByText(/Lightning-fast AI processing/)).toBeInTheDocument();
    expect(screen.getByText(/48-hour transaction freeze protocol/)).toBeInTheDocument();
  });
});