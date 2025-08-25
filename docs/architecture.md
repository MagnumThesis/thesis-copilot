
# Architecture

## v1.0.0

This document provides a high-level overview of the system architecture of the Thesis Copilot application. It describes the main components of the system and how they interact with each other.

### High-Level Architecture

The application follows a client-server architecture, with a React-based frontend, a Hono-based backend worker, and a Supabase PostgreSQL database.

```
+-----------------+      +-----------------+      +-----------------+
|                 |      |                 |      |                 |
|     Frontend    |----->|  Backend Worker |----->|    Database     |
| (React, Vite)   |      |   (Hono, Vite)  |      | (Supabase, PSQL)|
|                 |      |                 |      |                 |
+-----------------+      +-----------------+      +-----------------+
```

### Frontend

*   **Framework:** The frontend is built using [React](https://react.dev/) and [Vite](https://vitejs.dev/).
*   **UI Components:** The UI components are built using [shadcn/ui](https://ui.shadcn.com/), which is a collection of reusable UI components for React.
*   **Editor:** The main text editor is built using [Milkdown](https://milkdown.dev/), which is a Markdown editor framework.
*   **State Management:** The state of the application is managed using a combination of React hooks and context.

### Backend/API

*   **Framework:** The backend is a serverless worker built using [Hono](https://hono.dev/), which is a small, simple, and ultrafast web framework for the edge.
*   **AI Integration:** The backend integrates with the [Google Generative AI](https://ai.google/) API to provide AI assistance features.
*   **Database Integration:** The backend communicates with the Supabase database to store and retrieve data.

### Database

*   **Provider:** The database is provided by [Supabase](https://supabase.com/), which is an open-source Firebase alternative.
*   **Database:** The database is a [PostgreSQL](https://www.postgresql.org/) database.
*   **Schema:** The database schema is managed using SQL migration files located in the `migrations` directory.

### Key Architectural Decisions

*   **Serverless Backend:** The use of a serverless worker for the backend allows for a scalable and cost-effective architecture.
*   **Markdown Editor:** The use of a Markdown editor provides a simple and intuitive writing experience for the user.
*   **Component-Based UI:** The use of a component-based UI framework like React allows for a modular and reusable codebase.
*   **Separation of Concerns:** The application is divided into three distinct layers (frontend, backend, and database), which allows for a clear separation of concerns.
