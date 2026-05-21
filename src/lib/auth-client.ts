import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "./auth"

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL! as string,
    plugins: [inferAdditionalFields<typeof auth>()]
})