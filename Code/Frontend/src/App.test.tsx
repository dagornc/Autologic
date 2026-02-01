import { render } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Assuming there is some text or element that is always present.
        // If not, we can just check if render doesn't throw.
        // Adjust this expectation based on actual App content.
        expect(document.body).toBeInTheDocument();
    });
});
