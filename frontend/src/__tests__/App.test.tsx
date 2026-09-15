import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AppProvider } from '../context/AppContext';

describe('App Component Structure', () => {
  it('renders the main layout without crashing', () => {
    render(
      <AppProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppProvider>
    );
    
    // Check for semantic HTML elements
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeDefined();
    
    const bannerElement = screen.getByRole('banner');
    expect(bannerElement).toBeDefined();
  });
});
