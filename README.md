`npdp-create-app` is a CLI tool to quickly set up a new Next.js project with TypeScript, Prisma, SCSS modules, and custom authentication. It also sets up Docker for easy local and remote deployment.

## Features

- **Next.js with TypeScript**: The latest Next.js setup with TypeScript.
- **Prisma ORM**: Integrated Prisma for database management.
- **SCSS Modules**: Styled with SCSS modules and classnames package.
- **Docker**: Ready-to-use Docker setup for both the application and database.
- **Custom Authentication**: Simple and secure authentication system without external libraries like `next-auth`.

## Prerequisites

- Node.js (>= 14.x)
- npm (>= 6.x) or yarn (>= 1.x)
- Docker

## Installation

First, install the CLI globally using npm:

```
npm install -g npdp-create-app
```

## Usage

To create a new project, run:

```
npdp-create-app -o <APP_DIRECTORY> -n <APP_NAME> --db-name <DB_NAME> --db-user  <DB_USER> --db-password <DB_PASSWORD> --db-port <DB_PORT> --app-port <APP_PORT>
```

Example:

```
npdp-create-app -o ./myapp -n myapp
```

All variables, except for --o and --n have it's default values, that go like this:

- `--dbname`: "mydb";
- `--db-user`: "user";
- `--db-password`: "password";
- `--db-port`: "5432";
- `--app-port`: "3000";

This will create a new Next.js project in the specified directory with the given project name and database config.

**MAKE SURE YOU'VE SET YOUR OWN VALUES IF YOU ARE GOING TO UPLOAD YOUR APP SOMEWHERE EXCEPT YOUR LOCAL MACHINE!!! AND DO NOT EXPOSE YOUR OWN VALUES ANYWHERE! REMEBMER ABOUT SECURITY!**

## Project Structure

The created project will have the following structure:

```
myapp
├── prisma
│ └── schema.prisma
├── src
│ ├── app
│ ├── styles
│ ├── lib
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package.lock.json
├── .env.example
├── .eslintrc.json
├── .gitignore
├── README.md
└── tsconfig.json
```

## Scripts

In the generated project, you can use the following npm scripts:

- `dev`: Starts the development server.
- `build`: Builds the application for production.
- `start`: Starts the application in production mode.
- `lint`: Runs ESLint on the project files.

## Environment Variables

The generated project includes an `.env` file where you can configure environment variables, such as database connection strings.

## Docker Usage

Generated project includes a `Dockerfile` and `docker-compose.yml` for easy Docker setup.

### Build and Run with Docker

To build and run the project with Docker:

```bash
docker-compose up --build
```

This command will build the Docker images and start the application along with a PostgreSQL database.

## Custom Authentication

The project includes a basic custom authentication system. You can find the authentication logic in the `src/lib/auth` directory.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License.
