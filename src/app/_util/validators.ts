import { z } from "zod";

export const validators = {
    requests: {
        pushNotificationSubscription: z.object({
           endpoint: z.string().min(1),
           expirationTime: z.number().nullable(),
           keys: z.record(z.string(), z.string()),
       }),
    }
}