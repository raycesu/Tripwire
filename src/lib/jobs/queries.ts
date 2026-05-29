import { desc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { scheduledJobRuns } from "@/db/schema"
import type { ScheduledJobName } from "@/db/schema"

export const getLastJobRun = async (jobName: ScheduledJobName) => {
  const row = await db.query.scheduledJobRuns.findFirst({
    where: eq(scheduledJobRuns.jobName, jobName),
    orderBy: [desc(scheduledJobRuns.startedAt)],
  })

  return row ?? null
}
