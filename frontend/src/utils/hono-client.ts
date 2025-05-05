import type { AppType } from "../../../backend/src/index";
import { hc } from "hono/client";

// FIXME
export const honoClient = hc<AppType>("http://localhost:8787/");
