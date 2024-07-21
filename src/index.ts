#!/usr/bin/env node

import { Command } from "commander";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";

// Dynamically load the version from package.json
const packageJson = fs.readJsonSync(path.join(__dirname, "../package.json"));

// Utility function to sleep for a specified time
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const program = new Command();

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
    const { output, name, dbName, dbUser, dbPassword, dbPort, appPort } =
      options;
    const appPath = path.resolve(process.cwd(), output);

    // Step 1: Create the project directory
    console.log("Creating project directory...");
    fs.ensureDirSync(appPath);

    // Step 2: Initialize a new package.json file
    console.log("Initializing package.json...");
    execSync(`npm init -y`, { cwd: appPath, stdio: "inherit" });

    // Step 3: Install dependencies
    console.log("Installing dependencies...");
    execSync(
      "npm install react react-dom next @prisma/client classnames bcrypt jsonwebtoken sass",
      { cwd: appPath, stdio: "inherit" }
    );

    // Step 4: Install dev dependencies
    console.log("Installing dev dependencies...");
    execSync(
      "npm install --save-dev typescript @types/node @types/react @types/react-dom prisma eslint eslint-config-next",
      { cwd: appPath, stdio: "inherit" }
    );

    // Step 5: Copy template files to the new app directory
    console.log("Copying template files...");
    try {
      fs.copySync(path.join(__dirname, "templates"), appPath);
    } catch (error) {
      console.error("Error copying template files:", error);
      process.exit(1);
    }

    // Step 6: Update package.json with the new app name and next.js scripts
    const packageJsonPath = path.join(appPath, "package.json");
    let appPackageJson;
    try {
      appPackageJson = fs.readJsonSync(packageJsonPath);
      appPackageJson.name = name;
      appPackageJson.scripts = {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      };
      fs.writeJsonSync(packageJsonPath, appPackageJson, { spaces: 2 });
    } catch (err: any) {
      console.error("Error reading or writing package.json:", err);
      process.exit(1);
    }

    // Step 7: Initialize Prisma if the directory doesn't exist
    const prismaDirectory = path.join(appPath, "prisma");
    if (!fs.existsSync(prismaDirectory)) {
      console.log("Initializing Prisma...");
      execSync("npx prisma init", { cwd: appPath, stdio: "inherit" });
    } else {
      console.log("Prisma directory already exists, skipping initialization.");
    }

    // Step 8: Ensure Prisma schema exists in the correct location
    const prismaSchemaSrcPath = path.join(
      __dirname,
      "templates",
      "prisma",
      "schema.prisma"
    );
    const prismaSchemaDestPath = path.join(appPath, "prisma", "schema.prisma");
    if (!fs.existsSync(prismaSchemaDestPath)) {
      fs.ensureDirSync(path.dirname(prismaSchemaDestPath));
      fs.copyFileSync(prismaSchemaSrcPath, prismaSchemaDestPath);
    }

    // Step 9: Generate Prisma client
    execSync("npx prisma generate", { cwd: appPath, stdio: "inherit" });

    // Step 10: Create .env file
    const envContent = `DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_PORT=${dbPort}
APP_PORT=${appPort}
DATABASE_URL=postgresql://${dbUser}:${dbPassword}@db:${dbPort}/${dbName}
`;
    fs.writeFileSync(path.join(appPath, ".env.local"), envContent);

    // Step 11: Run docker-compose up
    console.log("Starting Docker containers...");
    execSync("docker-compose up -d --build", {
      cwd: appPath,
      stdio: "inherit",
    });

    // Step 12: Wait for the database to be ready
    console.log("Waiting for the database to be ready...");
    let dbReady = false;
    const maxRetries = 20;
    let retries = 0;

    while (!dbReady && retries < maxRetries) {
      try {
        await sleep(5000); // Wait for 5 seconds
        execSync(`pg_isready -h localhost -p ${dbPort} -U ${dbUser}`, {
          cwd: appPath,
          stdio: "inherit",
        });
        dbReady = true;
        console.log("Database is ready.");
      } catch (error) {
        retries += 1;
        console.log(
          `Retrying to connect to the database (${retries}/${maxRetries})...`
        );
      }
    }

    if (!dbReady) {
      console.error(
        "Failed to connect to the database. Please check the Docker container logs for more information."
      );
      process.exit(1);
    }

    // Step 13: Ensure DATABASE_URL is correctly set in environment
    const envPath = path.join(appPath, ".env.local");
    const env = fs.readFileSync(envPath, "utf8");
    if (!env.includes("DATABASE_URL")) {
      console.error(
        "DATABASE_URL is not set in .env file. Please check the .env file."
      );
      process.exit(1);
    }

    // Step 14: Apply Prisma schema to the database and generate client
    console.log(
      "Applying Prisma schema to the database and generating Prisma client..."
    );
    try {
      execSync("docker-compose exec app npx prisma db push", {
        cwd: appPath,
        stdio: "inherit",
      });
      execSync("docker-compose exec app npx prisma generate", {
        cwd: appPath,
        stdio: "inherit",
      });
    } catch (error) {
      console.error(
        "Error applying Prisma schema to the database and generating Prisma client:",
        error
      );
      process.exit(1);
    }

    console.log(
      "All done! Your project is ready and the database schema has been applied."
    );
  });

program.parse(process.argv);
