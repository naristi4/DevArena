import "next-auth";
import "next-auth/jwt";
import type { Role } from "@/lib/users";

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      name:  string;
      email: string;
      role:  Role;
      squad: string;
    };
  }

  interface User {
    role:  Role;
    squad: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:    string;
    role:  Role;
    squad: string;
  }
}
