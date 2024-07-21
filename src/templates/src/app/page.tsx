import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function Home() {
  // Fetch users on the server side
  const users = await prisma.user.findMany();

  // Server-side function to create a user
  async function createUser() {
    "use server"; // Ensure this runs on the server
    try {
      const newUser = await prisma.user.create({
        data: {
          email: "john.doe@example.com",
          password: "password",
        },
      });
      revalidatePath("/"); // Revalidate the path to fetch the updated list of users
      return { success: true, newUser };
    } catch (error: any) {
      console.error("Error creating user:", error);
      return { success: false, error: "User could not be created." };
    }
  }

  return (
    <main>
      <h1>This is your new app's base. Make something cool with it xD</h1>
      <form action={createUser}>
        <button type="submit">Create User</button>
      </form>
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
