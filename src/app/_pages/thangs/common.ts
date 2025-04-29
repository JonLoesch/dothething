import type { Schedule } from "~/model/schedule";
import type { notificationRouter } from "~/server/api/routers/notification";
import type { taskRouter } from "~/server/api/routers/task";


export type Group = Awaited<ReturnType<typeof taskRouter.allGroups>>[0];
export type Task = Group['tasks'][0];
export type Target = Awaited<ReturnType<typeof notificationRouter.allTargets>>[0];

export function displaySchedule(schedule: Schedule) {
    switch (schedule.type) {
      case "daily":
        return `Every ${schedule.numberOfDays} days`;
      case "monthly":
        return `Every ${schedule.numberOfMonths} months`;
      case "weekly":
        return `Every ${schedule.numberOfWeeks} weeks`;
      case "yearly":
        return `Every ${schedule.numberOfYears} years`;
    }
  }