# SteelSmart AI Marketplace

An AI-enhanced metal & steel parts marketplace built with Next.js 15, featuring CAD drawing analysis powered by Claude API.

## Features

- 🤖 **AI-Powered CAD Analysis**: Upload technical drawings and get instant product recommendations
- 📦 **Comprehensive Product Catalog**: Browse robotic components, structural steel, fasteners, and custom parts
- 💬 **Smart Recommendations**: AI-driven product suggestions based on compatibility and usage patterns
- 📋 **Request for Quote (RFQ)**: Multi-step quote request system with file upload
- 🔍 **Advanced Search & Filtering**: Find products by specifications, materials, and categories
- 📱 **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Claude API (Anthropic)
- **Data**: JSON-based storage (MVP)
- **Deployment**: Ready for Vercel

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Claude API key (optional for full functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd steal_smart
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Add your Claude API key to `.env.local`:
```env
CLAUDE_API_KEY=your_claude_api_key_here
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── catalog/           # Product catalog pages
│   ├── rfq/              # Request for Quote page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── Header.tsx       # Navigation header
│   ├── Hero.tsx         # Homepage hero section
│   └── Footer.tsx       # Site footer
├── data/                # JSON data files
│   ├── products.json    # Product catalog
│   └── categories.json  # Category definitions
├── lib/                 # Utility libraries
│   ├── utils.ts         # General utilities
│   ├── claude-client.ts # Claude API integration
│   └── product-matcher.ts # Recommendation logic
└── types/               # TypeScript type definitions
    └── index.ts         # Main types
```

## Key Components

### CAD Analyzer
- File upload with drag-and-drop interface
- Support for PDF, PNG, JPG files (max 10MB)
- Claude API integration for technical drawing analysis
- Confidence scores and reasoning for recommendations

### Product Catalog
- 4 main categories: Robotic Components, Structural Steel, Fasteners, Custom Parts
- Advanced filtering by category, material, price range
- Search functionality across product names and specifications
- Individual product detail pages with full specifications

### RFQ System
- Multi-step quote request form
- Contact information and technical requirements capture
- File upload for additional specifications
- Form validation and error handling

### AI Recommendations
- Product compatibility analysis
- "You might also need" suggestions
- Explanation for why products are recommended
- Rules-based recommendation engine

## API Endpoints

- `POST /api/analyze-drawing` - Analyze CAD drawings with Claude AI
- `GET/POST /api/recommendations` - Get product recommendations
- `POST /api/submit-rfq` - Submit request for quote

## Environment Variables

- `CLAUDE_API_KEY` - Your Claude API key from Anthropic
- `NEXT_PUBLIC_APP_URL` - Application URL (for metadata)
- `SMTP_*` - Email configuration for RFQ notifications

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## Deployment

The application is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please contact:
- Email: info@steelsmart.com
- Phone: +1 (555) 012-3456

## Roadmap

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication and accounts
- [ ] Real-time chat support
- [ ] Advanced CAD file format support
- [ ] Machine learning-enhanced recommendations
- [ ] Mobile app development