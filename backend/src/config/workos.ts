import { WorkOS } from "@workos-inc/node"
import { env } from "./env.js"

export const workos = new WorkOS(env.WORKOS_API_KEY)

export const WORKOS_CLIENT_ID = env.WORKOS_CLIENT_ID
