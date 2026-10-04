/** Public assets use Vite's base, including installations in a subdirectory. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
