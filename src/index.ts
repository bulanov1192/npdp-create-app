#!/usr/bin/env node

import { Command } from "commander";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";

// Dynamically load the version from package.json
const packageJson = fs.readJsonSync(path.join(__dirname, "../package.json"));

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
    } catch (err) {
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
DATABASE_URL=postgresql://${dbUser}:${dbPassword}@localhost:${dbPort}/${dbName}
`;
    fs.writeFileSync(path.join(appPath, ".env"), envContent);

    console.log(
      "Dependencies installed and files copied. Your project is ready to be set up with Docker."
    );

    // Inform the user to manually run Docker Compose and apply Prisma schema
    console.log("Next steps:");
    console.log(`1. Navigate to the project directory: cd ${output}`);
    console.log("2. Start Docker containers: docker-compose up -d --build");
    console.log(
      "3. Apply Prisma schema to the database: npx prisma migrate dev --name init"
    );

    console.log("All done! Your project is ready.");
  });

program.parse(process.argv);
