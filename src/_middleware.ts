// // export { default } from "next-auth/middleware"

// import { auth, signIn } from "./server/auth";

// // import { DEFAULT_REDIRECT, PUBLIC_ROUTES, ROOT } from '@/lib/routes';
// export const ROOT = "/";
// export const PUBLIC_ROUTES = ["/", "/sw.js"];
// export const DEFAULT_REDIRECT = "/protected";


// export default auth((req) => {
//   const { nextUrl } = req;

//   const isAuthenticated = !!req.auth;
//   const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);
//   //  const isPublicRoute = false;

//   //  if (isPublicRoute && isAuthenticated)
//   //   return Response.redirect(new URL(DEFAULT_REDIRECT, nextUrl));

//   if (!isAuthenticated && !isPublicRoute)
//     console.log("redirected from", nextUrl.toString());
//     // return Response.redirect(new URL('/api/auth/signin', nextUrl))
// });

// // export default auth((req) => {

// //   const { nextUrl } = req;
// //   if (!req.auth && req.nextUrl.pathname !== "/api/auth/signin") {
// //     const newUrl = new URL("/login", req.nextUrl.origin)
// //     return Response.redirect(new URL('/api/auth/signin', nextUrl))
// //   }
// // });

// // Optionally, don't invoke Middleware on some paths
// export const config = {
//   matcher: [
//     // match all routes except static files and APIs
//     "/((?!api|_next/static|_next/image|favicon.ico).*)my/",
//   ],
// };
