import { WorkOS } from "@workos-inc/node"
import { env } from "./env.js"

export const WORKOS_CLIENT_ID = env.WORKOS_CLIENT_ID

export const workos = new WorkOS(env.WORKOS_API_KEY, {
    clientId: WORKOS_CLIENT_ID,
})
