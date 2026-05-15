import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getConnection } from "@/lib/db";
import { Usuario } from "@/app/types/tecnico"
import { verifyPassword } from "@/lib/password";
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Usuario", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const pool = await getConnection();
                const result = await pool.request()
                    .input("usuario", credentials?.username)
                    .query("SELECT * FROM tecnicos WHERE usuario = @usuario AND estado = 'A'");

                const user = result.recordset[0]; // Obtenemos el primer registro
                if (!user) return null; // si no existe el usuario retorna

                const isValid = verifyPassword(
                    credentials?.password ?? "",
                    user.password
                );

                if (!isValid) return null;

                return {
                    id: user.cedula,
                    name: `${user.nombres} ${user.apellidos}`,
                    role: user.rol,
                    cedula: user.cedula
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // El objeto 'user' solo existe la primera vez que se hace login
            if (user) {
                const u = user as unknown as Usuario;
                token.role = u.role;
                token.cedula = u.cedula;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // Pasamos los datos del token a la sesión de forma segura
                (session.user as Usuario).role = token.role as string;
                (session.user as Usuario).cedula = token.cedula as string;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 horas
        updateAge: 24 * 60 * 60, // se actualiza cada 24 h
    },
    secret: process.env.NEXTAUTH_SECRET, // Agrega una frase al azar en tu archivo .env
    pages: {
        signIn: "/login",
    }
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
