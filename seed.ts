import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });

    // Only create admin user if it doesn't exist
    if (!existingAdmin) {
      const hashedPassword = await hashPassword("admin123");
      
      await db.insert(schema.users).values({
        username: "admin",
        password: hashedPassword
      });
      
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists, skipping creation");
    }
  } catch (error) {
    console.error("Error seeding the database:", error);
  }
}

seed();
