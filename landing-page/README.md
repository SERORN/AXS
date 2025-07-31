# AXS360 Landing Page

A modern, responsive landing page for the AXS360 vehicle access management platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Design**: Clean, professional design with smooth animations
- **Responsive**: Fully responsive across all device sizes
- **Performance**: Optimized for speed with Next.js 14 App Router
- **SEO Optimized**: Meta tags, OpenGraph, and structured data
- **Accessibility**: WCAG compliant with proper semantic HTML
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
landing-page/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── Industries.tsx
│   ├── Pricing.tsx
│   ├── Testimonials.tsx
│   ├── CTA.tsx
│   └── Footer.tsx
├── public/
│   └── images/
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Secondary**: Purple (#8b5cf6)
- **Accent**: Various industry-specific colors
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: Responsive typography with Tailwind CSS

### Components
- Reusable components with consistent styling
- Hover effects and smooth transitions
- Mobile-first responsive design

## 📄 Pages

- **Homepage**: Complete landing page with all sections
- **Features**: Detailed feature showcase
- **Industries**: Industry-specific solutions
- **Pricing**: Transparent pricing plans
- **Testimonials**: Customer success stories

## 🔧 Customization

### Brand Colors
Update colors in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    // Your brand colors
  }
}
```

### Content
Edit content in respective component files:
- Hero copy in `Hero.tsx`
- Features in `Features.tsx`
- Pricing plans in `Pricing.tsx`

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

### Other Platforms
1. Build the project: `npm run build`
2. Deploy the `out` folder to your hosting provider

## 📈 SEO

- Meta tags configured in `layout.tsx`
- OpenGraph and Twitter Card support
- Structured data for better search visibility
- Optimized images and loading

## 🔗 Links

- [AXS360 Platform](https://app.axs360.com)
- [Documentation](https://docs.axs360.com)
- [Support](https://support.axs360.com)

## 📝 License

© 2025 AXS360. All rights reserved.
