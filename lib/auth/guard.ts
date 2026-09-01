export const WORKSPACE_PATHS = [
  "/dashboard",
  "/opportunities",
  "/saved",
  "/company",
  "/settings",
];
export function isProtectedPath(pathname: string) {
  return WORKSPACE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
}
export function authGuardDecision(
  configured: boolean,
  hasUser: boolean,
  pathname: string,
) {
  if (!configured) return "setup";
  if (isProtectedPath(pathname) && !hasUser) return "login";
  return "allow";
}
