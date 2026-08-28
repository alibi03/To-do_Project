enum UserRole {
  Admin = "admin",
  Member = "member",
}

type AuthenticatedUser = {
  userId: number;
  role: UserRole;
};

export { type AuthenticatedUser, UserRole };
