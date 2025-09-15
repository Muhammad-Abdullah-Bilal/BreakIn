import { render, screen } from '@testing-library/react';
import CandidateCard from '../components/CandidateCard';

describe('CandidateCard', () => {
  const mockCandidate = {
    id: 'c1',
    name: 'Test Candidate',
    track: 'Frontend',
    proofScore: 95,
    bio: 'Test bio',
    skills: ['React', 'TypeScript'],
    verified: true
  };
  
  test('renders candidate name', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('Test Candidate')).toBeInTheDocument();
  });
  
  test('renders candidate track', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });
  
  test('renders candidate skills', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
  
  test('renders verification badge when candidate is verified', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    expect(screen.getByLabelText('Verified')).toBeInTheDocument();
  });
  
  test('does not render verification badge when candidate is not verified', () => {
    const unverifiedCandidate = { ...mockCandidate, verified: false };
    render(<CandidateCard candidate={unverifiedCandidate} />);
    expect(screen.queryByLabelText('Verified')).not.toBeInTheDocument();
  });
});
