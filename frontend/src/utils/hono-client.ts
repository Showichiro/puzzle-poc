import type { AppType } from "../../../backend/src/index";
import { hc } from "hono/client";

// FIXME
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export const honoClient = hc<AppType>(baseURL);
