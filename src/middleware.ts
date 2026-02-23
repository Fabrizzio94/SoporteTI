//export { default } from "next-auth/middleware";
import withAuth from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isTecnico = token?.role === "TECNICO";
        const tryingToAccessTecnicos = req.nextUrl.pathname.startsWith("/tecnicos");
        if (isTecnico && tryingToAccessTecnicos) return NextResponse.redirect(new URL("/farmacias", req.url));
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    // Esto bloquea el acceso si no hay sesión
    matcher: ["/tecnicos/:path*", "/farmacias/:path*", "/dashboard/:path*"]
};
