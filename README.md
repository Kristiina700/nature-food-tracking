# Nature food buys and transmission

A web application for tracking nature food buys and transmission. Built with React TypeScript frontend and Node.js backend.

## Features

- **User Management**: Create and manage user accounts
- **Tracking**: Add, view, and manage nature food buys and transmission
- **Detailed Records**: Track species, quantity, location, collection date, and notes
- **Modern UI**: Clean, responsive interface with intuitive design
- **Real-time Updates**: Live data synchronization between frontend and backend

## Project Structure

```
nature-food-tracking/
├── backend/                 # Node.js Express TypeScript API
│   ├── src/
│   │   ├── controllers/     # API route controllers
│   │   ├── models/          # Data models and storage
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Express middleware
│   │   ├── types/           # TypeScript type definitions
│   │   └── server.ts        # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React TypeScript application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.tsx          # Main App component
│   │   └── main.tsx         # Application entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository** (or navigate to your project directory)
   ```bash
   cd nature-food-tracking
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Option 1: Manual Start (Recommended for Development)

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will start on `http://localhost:3001`

2. **Start the Frontend (in a new terminal)**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will start on `http://localhost:3000`

#### Option 2: Using Scripts

From the project root, you can create scripts to run both services:

**Backend Script (save as `start-backend.sh`):**
```bash
#!/bin/bash
cd backend && npm run dev
```

**Frontend Script (save as `start-frontend.sh`):**
```bash
#!/bin/bash
cd frontend && npm run dev
```

Make them executable and run:
```bash
chmod +x start-backend.sh start-frontend.sh
./start-backend.sh &
./start-frontend.sh
```

### Building for Production

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Usage

1. **Open the application** in your browser at `http://localhost:3000`

2. **Create a user account**:
   - Enter your name in the "Create User Account" section
   - Click "Create Account"

3. **Select your user** from the dropdown at the top

4. **Add stock items**:
   - Choose between Berry or Mushroom
   - Enter the species/variety name
   - Specify quantity in grams (g)
   - Add the collection location
   - Optionally add notes
   - Click "Add Stock"

5. **View your nature food buys and transmissions**:
   - All your items will appear in the "Your buys" section
   - Items are sorted by buys date (newest first)
   - You can delete items using the delete button

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Stock Items
- `POST /api/stock` - Create a new nature food item
- `GET /api/stock` - Get all nature food items (optionally filter by userId)
- `GET /api/stock/:id` - Get nature food item by ID
- `PUT /api/stock/:id` - Update a nature food item
- `DELETE /api/stock/:id` - Delete a nature food item

### Health Check
- `GET /health` - Check if the API is running

## Data Storage

Currently, the application uses in-memory storage. Data will be lost when the server restarts. For production use, consider integrating with a persistent database like:

- PostgreSQL
- MongoDB
- SQLite
- MySQL

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with hot-reload using ts-node-dev
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite development server with hot-reload
```

### Linting
```bash
# Frontend
cd frontend
npm run lint

# Backend (you can add ESLint if needed)
cd backend
npm run build  # TypeScript compiler will catch errors
```

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware

### Frontend
- **React** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **Axios** - HTTP client for API calls
- **CSS3** - Styling with modern CSS features

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Persistent database integration
- [ ] User authentication and authorization
- [ ] Image upload for collections
- [ ] Export data to CSV/PDF
- [ ] Collection statistics and analytics
- [ ] Mobile app version
- [ ] Geolocation integration
- [ ] Social sharing features
- [ ] Collection reminders and notifications

---

Happy buys and transmissions tracking!
