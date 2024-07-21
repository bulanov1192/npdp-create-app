#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const child_process_1 = require("child_process");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// Dynamically load the version from package.json
const packageJson = fs_extra_1.default.readJsonSync(path_1.default.join(__dirname, "../package.json"));
// Utility function to sleep for a specified time
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const program = new commander_1.Command();
program
    .version(packageJson.version)
    .requiredOption("-o, --output <output>", "Output directory for the new app")
    .requiredOption("-n, --name <name>", "Name of the new app")
    .option("--db-name <dbname>", "Database name", "mydb")
    .option("--db-user <dbuser>", "Database user", "user")
    .option("--db-password <dbpassword>", "Database password", "password")
    .option("--db-port <dbport>", "Database port", "5432")
    .option("--app-port <appport>", "Application port", "3000")
    .action(async (options) => {
    const { output, name, dbName, dbUser, dbPassword, dbPort, appPort } = options;
    const appPath = path_1.default.resolve(process.cwd(), output);
    // Step 1: Create the project directory
    console.log("Creating project directory...");
    fs_extra_1.default.ensureDirSync(appPath);
    // Step 2: Initialize a new package.json file
    console.log("Initializing package.json...");
    (0, child_process_1.execSync)(`npm init -y`, { cwd: appPath, stdio: "inherit" });
    // Step 3: Install dependencies
    console.log("Installing dependencies...");
    (0, child_process_1.execSync)("npm install react react-dom next @prisma/client classnames bcrypt jsonwebtoken sass", { cwd: appPath, stdio: "inherit" });
    // Step 4: Install dev dependencies
    console.log("Installing dev dependencies...");
    (0, child_process_1.execSync)("npm install --save-dev typescript @types/node @types/react @types/react-dom prisma eslint eslint-config-next", { cwd: appPath, stdio: "inherit" });
    // Step 5: Copy template files to the new app directory
    console.log("Copying template files...");
    try {
        fs_extra_1.default.copySync(path_1.default.join(__dirname, "templates"), appPath);
    }
    catch (error) {
        console.error("Error copying template files:", error);
        process.exit(1);
    }
    // Step 6: Update package.json with the new app name and next.js scripts
    const packageJsonPath = path_1.default.join(appPath, "package.json");
    let appPackageJson;
    try {
        appPackageJson = fs_extra_1.default.readJsonSync(packageJsonPath);
        appPackageJson.name = name;
        appPackageJson.scripts = {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
        };
        fs_extra_1.default.writeJsonSync(packageJsonPath, appPackageJson, { spaces: 2 });
    }
    catch (err) {
        console.error("Error reading or writing package.json:", err);
        process.exit(1);
    }
    // Step 7: Initialize Prisma if the directory doesn't exist
    const prismaDirectory = path_1.default.join(appPath, "prisma");
    if (!fs_extra_1.default.existsSync(prismaDirectory)) {
        console.log("Initializing Prisma...");
        (0, child_process_1.execSync)("npx prisma init", { cwd: appPath, stdio: "inherit" });
    }
    else {
        console.log("Prisma directory already exists, skipping initialization.");
    }
    // Step 8: Ensure Prisma schema exists in the correct location
    const prismaSchemaSrcPath = path_1.default.join(__dirname, "templates", "prisma", "schema.prisma");
    const prismaSchemaDestPath = path_1.default.join(appPath, "prisma", "schema.prisma");
    if (!fs_extra_1.default.existsSync(prismaSchemaDestPath)) {
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(prismaSchemaDestPath));
        fs_extra_1.default.copyFileSync(prismaSchemaSrcPath, prismaSchemaDestPath);
    }
    // Step 9: Generate Prisma client
    (0, child_process_1.execSync)("npx prisma generate", { cwd: appPath, stdio: "inherit" });
    // Step 10: Create .env.local file
    const envContent = `DATABASE_URL=postgresql://${dbUser}:${dbPassword}@db:${dbPort}/${dbName}
APP_PORT=${appPort}
`;
    fs_extra_1.default.writeFileSync(path_1.default.join(appPath, ".env.local"), envContent);
    // Step 11: Update Dockerfile and docker-compose.yml
    const dockerComposePath = path_1.default.join(appPath, "docker-compose.yml");
    const dockerComposeContent = `version: '3.8'
services:
  app:
    build: .
    ports:
      - '${appPort}:3000'
    environment:
      DATABASE_URL: 'postgresql://${dbUser}:${dbPassword}@db:${dbPort}/${dbName}'
      PORT: '${appPort}'
  db:
    image: postgres:13
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${dbUser}
      POSTGRES_PASSWORD: ${dbPassword}
      POSTGRES_DB: ${dbName}
    ports:
      - '${dbPort}:5432'

volumes:
  postgres_data:
`;
    fs_extra_1.default.writeFileSync(dockerComposePath, dockerComposeContent);
    console.log("All done! Your project is ready.");
});
program.parse(process.argv);
