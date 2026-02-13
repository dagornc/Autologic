import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
    it('renders the Liquid Interface with main title', () => {
        render(<App />);
        expect(screen.getByText('What will we solve today?')).toBeInTheDocument();
    });
});
