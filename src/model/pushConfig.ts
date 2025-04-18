import { z } from "zod";
import { UAParser } from "ua-parser-js";
import { ExtraDevices } from "ua-parser-js/extensions";
import type { pushConfigs } from "~/server/db/schema";

const validator = z.object({
  // https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription
  endpoint: z.string().min(1),
  //   expirationTime: z.number().nullable(), // we don't use this
  keys: z.record(z.string(), z.string()),
});

export type PushConfig = z.infer<typeof validator>;
function FromDb({ ua, ...p }: typeof pushConfigs.$inferSelect) {
  return {
    ...p,
    // browserDescription: ,
  };
}

function defaultTargetName(ua: UAParser.IResult) {
    return `${ua.browser.name} (${ua.os.name} ${ua.os.version})`;
}

export const pushConfig = {
  validator,
  defaultTargetName,
  FromDb,
};
