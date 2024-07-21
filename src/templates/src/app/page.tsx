import prisma from "@/lib/prisma";
import { useState } from "react";
import { revalidatePath } from "next/cache";

export default async function Home() {
  // Fetch users on the server side
  const users = await prisma.user.findMany();

  // This state and function are purely for client-side error handling
  const [error, setError] = useState<string | null>(null);

  // Server-side function to create a user
  async function createUser() {
    "use server"; // Ensure this runs on the server
    try {
      const newUser = await prisma.user.create({
        data: {
          email: "john.doe@example.com",
          name: "John Doe",
        },
      });
      revalidatePath("/"); // Revalidate the path to fetch the updated list of users
      return { success: true, newUser };
    } catch (error: any) {
      console.error("Error creating user:", error);
      setError("User could not be created."); // Set the error state for client-side display
      return { success: false, error: "User could not be created." };
    }
  }

  return (
    <main>
      <h1>This is your new app's base. Make something cool with it xD</h1>
      <form action={createUser}>
        <button type="submit">Create User</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}{" "}
      {/* Display error message */}
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.id}: {user.email} - {user.name}
          </li>
        ))}
      </ul>
    </main>
  );
}
