export interface DbUser {
  id?: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  username?: string;
  avatar?: string;
  bio?: string;
  role?: string;
  karma?: number;
  reputation?: number;
}
