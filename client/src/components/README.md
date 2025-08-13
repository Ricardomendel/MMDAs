# Landing Page Component

## Overview
The `LandingPage` component is a modern, responsive landing page for the MMDA Revenue System. It provides an engaging user experience for visitors who haven't logged in yet.

## Features

### 🎯 Hero Section
- Compelling headline and description
- Call-to-action buttons (Get Started, Sign In)
- Visual icon representation

### 📊 Statistics Section
- Key metrics display (MMDAs Connected, Active Users, Revenue Collected, Uptime)
- Hover effects and animations

### ✨ Features Section
- Four key platform benefits with icons
- Hover animations and card effects
- Responsive grid layout

### 🏢 Services Section
- Six main service categories
- Color-coded icons and descriptions
- Interactive cards with hover effects

### 💬 Testimonials Section
- User reviews and ratings
- Star ratings display
- User avatars and information

### 🚀 Call-to-Action Section
- Secondary CTA for user conversion
- Gradient background design
- Prominent action buttons

### 📱 Footer
- Company information
- Quick links
- Contact details

## Props

```typescript
interface LandingPageProps {
  onLogin: () => void;    // Function to open login dialog
  onRegister: () => void; // Function to open registration dialog
}
```

## Usage

```tsx
import LandingPage from './components/LandingPage';

// In your component
<LandingPage 
  onLogin={() => setLoginOpen(true)} 
  onRegister={() => setRegisterOpen(true)} 
/>
```

## Styling

- Uses Material-UI theme system
- Responsive design with breakpoints
- Hover animations and transitions
- Consistent color scheme
- Modern typography hierarchy

## Responsiveness

- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interactions
- Optimized for all devices

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Alt text for icons
- Keyboard navigation support
- High contrast ratios

## Performance

- Optimized component structure
- Efficient re-renders
- Minimal bundle impact
- Fast loading times
