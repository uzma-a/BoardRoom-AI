/**
 * Base URL of the FastAPI backend. Set NEXT_PUBLIC_API_BASE_URL in
 * .env.local for anything other than local development (see .env.example).
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
