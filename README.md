# TaskFlow – MERN Stack Project Management System

TaskFlow is a web-based project management application developed using the MERN stack. It helps users organize projects, manage tasks, and track project progress through a simple and user-friendly interface.

## Features

- User registration and login
- Secure authentication using JWT
- Password hashing using bcrypt
- Create and manage projects
- Create, update, and delete tasks
- Organize project activities
- Responsive user interface
- MongoDB database integration

## Technologies Used

**Frontend**
- React
- Vite
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

**Authentication**
- JSON Web Tokens (JWT)
- bcrypt

**Development Tools**
- Git and GitHub
- GitHub Actions for Continuous Integration (CI)

## Project Structure

```text
TaskFlow/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── .github/
│   └── workflows/
│       └── taskflow-ci.yml
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- A MongoDB database (MongoDB Atlas or local MongoDB)
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/hiruna2001-sudo/taskfolw_mern_project.git
```

2. Navigate to the project directory:

```bash
cd taskfolw_mern_project
```

3. Install the root dependencies:

```bash
npm install
```

4. Install the backend dependencies:

```bash
cd backend
npm install
cd ..
```

5. Install the frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

### Environment Configuration

Create a `.env` file inside the `backend` folder and configure the required environment variables.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Replace the example values with your actual MongoDB connection string and a secure JWT secret.

**Important:** Never upload your `.env` file or database credentials to GitHub.

### Running the Application

From the project root, start the backend and frontend using:

```bash
npm run dev
```

The application will run locally. The backend is configured for port `5000`, and the frontend uses the Vite development server, usually at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## GitHub Actions – Continuous Integration

TaskFlow uses GitHub Actions to automatically check the project when changes are pushed to GitHub or a pull request is created.

The CI workflow performs the following checks:

- Installs root, backend, and frontend dependencies
- Checks backend JavaScript syntax
- Builds the frontend application

A successful workflow run indicates that these checks have passed.

## Future Improvements

- Team collaboration and project member management
- Task priorities and deadlines
- Project progress dashboard
- Deployment to a cloud hosting platform

## Author

Developed as a MERN stack learning and development project.

GitHub: [hiruna2001-sudo](https://github.com/hiruna2001-sudo)
