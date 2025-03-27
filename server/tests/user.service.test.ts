// server/src/tests/user.service.test.ts
import prisma from "../config/prisma";
import * as userService from "../services/user.service";
import { hash } from "bcrypt";

describe("User Service", () => {
  it("should create a new user", async () => {
    // Arrange
    const userData = {
      email: "test@example.com",
      password: "Password123!",
      displayName: "Test User",
      firstName: "Test",
      lastName: "User",
      role: "APPRENTICE",
    };

    // Act
    const createdUser = await userService.createUser(userData);

    // Assert
    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(userData.email);
    expect(createdUser.displayName).toBe(userData.displayName);
    expect(createdUser.firstName).toBe(userData.firstName);
    expect(createdUser.lastName).toBe(userData.lastName);

    // Vérifie que le mot de passe est bien hashé (et non stocké en clair)
    expect(createdUser.passwordHash).not.toBe(userData.password);

    // Vérifie que l'utilisateur existe dans la base de données
    const dbUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(dbUser).toBeDefined();
    expect(dbUser?.email).toBe(userData.email);
  });

  it("should throw an error when creating a user with an existing email", async () => {
    // Arrange
    const userData = {
      email: "duplicate@example.com",
      password: "Password123!",
      displayName: "Test User",
      role: "APPRENTICE",
    };

    // Create the first user
    await userService.createUser(userData);

    // Act & Assert
    await expect(userService.createUser(userData)).rejects.toThrow(
      "Un utilisateur avec cet email existe déjà"
    );
  });
});
