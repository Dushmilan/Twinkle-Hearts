# Twinkle-Hearts

## Project Overview

Twinkle-Hearts is a proprietary Progressive Web Application (PWA) designed for e-commerce, replacing traditional payment gateways with a WhatsApp-based checkout flow. This approach simplifies integration, reduces costs, and facilitates direct communication between customers and businesses.

## Key Features

- **Product Catalog**: Browse products with images, descriptions, and pricing.
- **Persistent Cart**: Cart persists across browser sessions and supports offline use.
- **WhatsApp Checkout**: Pre-formatted order messages via WhatsApp for seamless checkout.
- **Order Management**: Unique order ID generation, price validation, and audit logging.

## Technical Architecture

### Frontend

- **Framework**: React-based Single Page Application (SPA)
- **State Management**: Zustand
- **Persistence**: IndexedDB and LocalStorage
- **Service Worker**: Offline support and background sync

### Backend

- **Language**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL
- **RESTful API**: Server-side price and stock validation
- **Order State Machine**: Tracks order lifecycle

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Yarn or npm
- PostgreSQL (managed service recommended)
- Redis (optional)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/twinkle-hearts.git
   cd twinkle-hearts
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env.local` file based on `.env.example`:
   ```sh
   cp .env.example .env.local
   ```
4. Set up the database:
   ```sh
   npm run db:migrate
   ```
5. Start the development server:
   ```sh
   npm run dev
   ```

### Running Tests

```sh
npm test
```

### Docker

To run the application using Docker, use the following command:

```sh
docker-compose up -d
```

## Contributing

We welcome contributions from the community. Please follow these guidelines:

- **Code Style**: Follow the style guidelines defined in `.editorconfig`, `.prettierrc`, and `eslint.config.js`.
- **Commit Messages**: Use the guidelines defined in `commitlint.config.js`.
- **Pull Requests**: Ensure your pull request is well-documented and includes tests.

## License and Confidentiality

This project is **proprietary** and **confidential**. All code, documentation, designs, business logic, and intellectual property are owned by the project owners. No redistribution, public disclosure, or use for personal projects or portfolios is allowed without written permission.

## Contact

For support or questions, please contact:

- **Email**: support@twinkle-hearts.com
- **GitHub**: [Twinkle-Hearts](https://github.com/your-repo/twinkle-hearts)

## Appendices

### Known Issues

- No testing infrastructure
- No CI/CD pipeline
- No API documentation
- No error boundaries
- No toast notifications
- No loading states

### Future Enhancements

- User authentication
- Order history
- WhatsApp Business API integration
- Admin dashboard
- Multi-vendor support
- Analytics dashboard
- Inventory management
- Marketing integrations

---

**© 2026 Twinkle-Hearts. All Rights Reserved.**
