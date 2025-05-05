import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/b40b2d706a3d028d256a60103a0d9bd43054abdbe0c9e1d0e9bc53b697f9fb34.sqlite",
  },
});
