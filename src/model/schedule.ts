import {addDays, addMonths, addWeeks, addYears} from 'date-fns';
import { z } from "zod";

const validator = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("weekly"),
    numberOfWeeks: z.number().int().gt(0),
  }),
  z.object({
    type: z.literal("monthly"),
    numberOfMonths: z.number().int().gt(0),
  }),
  z.object({
    type: z.literal("yearly"),
    numberOfYears: z.number().int().gt(0),
  }),
  z.object({
    type: z.literal("daily"),
    numberOfDays: z.number().int().gt(0),
  }),
]);

export type Schedule = z.infer<typeof validator>;

function nextInstance(s: Schedule, start?: Date) {
    switch(s.type) {
        case 'daily': return addDays(start ?? new Date(), s.numberOfDays);
        case 'monthly': return addMonths(start ?? new Date(), s.numberOfMonths);
        case 'weekly': return addWeeks(start ?? new Date(), s.numberOfWeeks);
        case 'yearly': return addYears(start ?? new Date(), s.numberOfYears);
    }
}

export const schedule = {
    validator,
    nextInstance
}