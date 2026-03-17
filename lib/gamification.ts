// ─── Scoring Rules ────────────────────────────────────────────────────────────

export const SCORING = {
  TASK_COMPLETE:  5,   // +5  per completed task
  ON_TIME_BONUS:  10,  // +10 when completion_date ≤ target_end_date
  DELAY_PENALTY:  -3,  // -3  when completion_date > target_end_date (not in iteration)
  BUG_PENALTY:    -5,  // -5  per open bug in squad's projects (squad-level)
} as const;

// ─── Task Completion Records ───────────────────────────────────────────────────
// Mock historical completion events. "thisWeek: true" items appear in the
// weekly leaderboard; all items appear in the all-time leaderboard.
// On-time = completionDate ≤ targetEndDate (ISO string comparison is correct for YYYY-MM-DD).

interface TaskRecord {
  developer:      string;
  squad:          string;
  targetEndDate:  string;  // YYYY-MM-DD expected delivery
  completionDate: string;  // YYYY-MM-DD actual completion
  done:           boolean;
  inIteration:    boolean; // delay penalty waived for iteration projects
  thisWeek:       boolean;
}

const TASK_RECORDS: TaskRecord[] = [
  // ── Alice Johnson — Platform Squad ──────────────────────────────────────────
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-10", completionDate: "2026-03-09", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-11", completionDate: "2026-03-10", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-09", completionDate: "2026-03-11", done: true, inIteration: false, thisWeek: true  }, // late
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-12", completionDate: "2026-03-11", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-13", completionDate: "2026-03-13", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-08", completionDate: "2026-03-07", done: true, inIteration: true,  thisWeek: true  }, // on time (iteration)
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-07", completionDate: "2026-03-10", done: true, inIteration: true,  thisWeek: true  }, // over but iteration → no penalty
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-14", completionDate: "2026-03-14", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-02-20", completionDate: "2026-02-18", done: true, inIteration: false, thisWeek: false }, // on time (historical)
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-02-15", completionDate: "2026-02-17", done: true, inIteration: false, thisWeek: false }, // late (historical)
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-02-25", completionDate: "2026-02-23", done: true, inIteration: false, thisWeek: false }, // on time (historical)
  { developer: "Alice Johnson", squad: "Platform Squad", targetEndDate: "2026-03-01", completionDate: "2026-02-28", done: true, inIteration: false, thisWeek: false }, // on time (historical)

  // ── Eva Chen — Core Squad ───────────────────────────────────────────────────
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-03-10", completionDate: "2026-03-09", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-03-11", completionDate: "2026-03-10", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-03-09", completionDate: "2026-03-12", done: true, inIteration: false, thisWeek: true  }, // late
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-03-12", completionDate: "2026-03-11", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-03-13", completionDate: "2026-03-13", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-03-08", completionDate: "2026-03-06", done: true, inIteration: true,  thisWeek: true  }, // on time (iteration)
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-02-20", completionDate: "2026-02-23", done: true, inIteration: false, thisWeek: false }, // late (historical)
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-02-15", completionDate: "2026-02-14", done: true, inIteration: false, thisWeek: false }, // on time (historical)
  { developer: "Eva Chen", squad: "Core Squad", targetEndDate: "2026-02-25", completionDate: "2026-02-24", done: true, inIteration: false, thisWeek: false }, // on time (historical)

  // ── Bob Smith — Platform Squad ───────────────────────────────────────────────
  { developer: "Bob Smith", squad: "Platform Squad", targetEndDate: "2026-03-09", completionDate: "2026-03-11", done: true, inIteration: false, thisWeek: true  }, // late
  { developer: "Bob Smith", squad: "Platform Squad", targetEndDate: "2026-03-11", completionDate: "2026-03-10", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Bob Smith", squad: "Platform Squad", targetEndDate: "2026-03-12", completionDate: "2026-03-12", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Bob Smith", squad: "Platform Squad", targetEndDate: "2026-03-08", completionDate: "2026-03-10", done: true, inIteration: true,  thisWeek: true  }, // over but iteration → no penalty
  { developer: "Bob Smith", squad: "Platform Squad", targetEndDate: "2026-03-13", completionDate: "2026-03-12", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Bob Smith", squad: "Platform Squad", targetEndDate: "2026-02-18", completionDate: "2026-02-21", done: true, inIteration: false, thisWeek: false }, // late (historical)
  { developer: "Bob Smith", squad: "Platform Squad", targetEndDate: "2026-02-22", completionDate: "2026-02-22", done: true, inIteration: false, thisWeek: false }, // on time (historical)
  { developer: "Bob Smith", squad: "Platform Squad", targetEndDate: "2026-03-01", completionDate: "2026-02-28", done: true, inIteration: false, thisWeek: false }, // on time (historical)

  // ── Carol White — Growth Squad ───────────────────────────────────────────────
  { developer: "Carol White", squad: "Growth Squad", targetEndDate: "2026-03-09", completionDate: "2026-03-11", done: true, inIteration: false, thisWeek: true  }, // late
  { developer: "Carol White", squad: "Growth Squad", targetEndDate: "2026-03-11", completionDate: "2026-03-10", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Carol White", squad: "Growth Squad", targetEndDate: "2026-03-12", completionDate: "2026-03-12", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Carol White", squad: "Growth Squad", targetEndDate: "2026-03-13", completionDate: "2026-03-12", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Carol White", squad: "Growth Squad", targetEndDate: "2026-02-18", completionDate: "2026-02-22", done: true, inIteration: false, thisWeek: false }, // late (historical)
  { developer: "Carol White", squad: "Growth Squad", targetEndDate: "2026-02-22", completionDate: "2026-02-21", done: true, inIteration: false, thisWeek: false }, // on time (historical)
  { developer: "Carol White", squad: "Growth Squad", targetEndDate: "2026-03-01", completionDate: "2026-03-01", done: true, inIteration: false, thisWeek: false }, // on time (historical)

  // ── Dan Torres — Core Squad ──────────────────────────────────────────────────
  { developer: "Dan Torres", squad: "Core Squad", targetEndDate: "2026-03-12", completionDate: "2026-03-12", done: true, inIteration: false, thisWeek: true  }, // on time
  { developer: "Dan Torres", squad: "Core Squad", targetEndDate: "2026-03-10", completionDate: "2026-03-12", done: true, inIteration: false, thisWeek: true  }, // late
  { developer: "Dan Torres", squad: "Core Squad", targetEndDate: "2026-03-11", completionDate: "2026-03-13", done: true, inIteration: false, thisWeek: true  }, // late
  { developer: "Dan Torres", squad: "Core Squad", targetEndDate: "2026-02-22", completionDate: "2026-02-21", done: true, inIteration: false, thisWeek: false }, // on time (historical)
  { developer: "Dan Torres", squad: "Core Squad", targetEndDate: "2026-02-20", completionDate: "2026-02-22", done: true, inIteration: false, thisWeek: false }, // late (historical)
];

// ─── Bug counts per squad (from MOCK_BUGS + MOCK_PIPELINE_ITEMS) ───────────────
// Platform Squad owns projects 1 & 7 → 4 bugs (project 1)
// Growth Squad owns project 2 → 3 bugs
// Core Squad owns project 3 → 3 bugs
export const SQUAD_BUG_COUNTS: Record<string, number> = {
  "Platform Squad": 4,
  "Growth Squad":   3,
  "Core Squad":     3,
};

// ─── Score Types ──────────────────────────────────────────────────────────────

export interface DeveloperScore {
  rank:        number;
  name:        string;
  squad:       string;
  totalPoints: number;
  tasks:       number;
  onTime:      number;
  delayed:     number;
}

export interface SquadScore {
  rank:             number;
  squad:            string;
  totalPoints:      number;
  memberCount:      number;
  tasks:            number;
  onTimeCount:      number;  // number of tasks completed on time (completionDate ≤ targetEndDate)
  bugCount:         number;
  bugPenalty:       number;  // negative value
  members:          string[];
  avgDeliveryDelta: number;  // avg days (completion − target); negative = early, positive = late
  onTimeRate:       number;  // 0-100 percentage of tasks delivered on time
}

// ─── Computation ──────────────────────────────────────────────────────────────

function computeFromRecords(records: TaskRecord[]) {
  const devMap = new Map<string, {
    squad:   string;
    pts:     number;
    tasks:   number;
    onTime:  number;
    delayed: number;
  }>();

  for (const r of records) {
    if (!devMap.has(r.developer)) {
      devMap.set(r.developer, { squad: r.squad, pts: 0, tasks: 0, onTime: 0, delayed: 0 });
    }
    const d = devMap.get(r.developer)!;
    d.tasks++;
    d.pts += SCORING.TASK_COMPLETE;

    // Deadline metrics (on-time bonus, delay penalty) only apply to non-iteration tasks.
    // ISO date strings (YYYY-MM-DD) compare correctly with <=/>
    if (r.done && !r.inIteration) {
      const isOnTime = r.completionDate <= r.targetEndDate;
      if (isOnTime) {
        d.pts += SCORING.ON_TIME_BONUS;
        d.onTime++;
      } else {
        d.pts += SCORING.DELAY_PENALTY;
        d.delayed++;
      }
    }
  }

  return devMap;
}

export function getDeveloperLeaderboard(weekOnly: boolean): DeveloperScore[] {
  const records = weekOnly
    ? TASK_RECORDS.filter((r) => r.thisWeek)
    : TASK_RECORDS;

  const devMap = computeFromRecords(records);

  return Array.from(devMap.entries())
    .map(([name, d]) => ({
      rank:        0,
      name,
      squad:       d.squad,
      totalPoints: d.pts,
      tasks:       d.tasks,
      onTime:      d.onTime,
      delayed:     d.delayed,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((d, i) => ({ ...d, rank: i + 1 }));
}

export function getSquadLeaderboard(weekOnly: boolean): SquadScore[] {
  const records = weekOnly
    ? TASK_RECORDS.filter((r) => r.thisWeek)
    : TASK_RECORDS;

  const devMap   = computeFromRecords(records);
  const squadMap = new Map<string, { pts: number; tasks: number; members: Set<string> }>();

  for (const [dev, d] of devMap.entries()) {
    if (!squadMap.has(d.squad)) {
      squadMap.set(d.squad, { pts: 0, tasks: 0, members: new Set() });
    }
    const s = squadMap.get(d.squad)!;
    s.pts   += d.pts;
    s.tasks += d.tasks;
    s.members.add(dev);
  }

  return Array.from(squadMap.entries())
    .map(([squad, s]) => {
      const bugCount   = SQUAD_BUG_COUNTS[squad] ?? 0;
      const bugPenalty = bugCount * SCORING.BUG_PENALTY; // negative

      // ── Delivery metrics from raw task records ────────────────────────────
      const sqRecords = records.filter((r) => r.squad === squad);
      // Exclude iteration tasks from deadline delivery metrics
      const withDates = sqRecords.filter((r) => r.done && !r.inIteration);

      // avgDeliveryDelta: positive = late (days), negative = early
      const avgDeliveryDelta =
        withDates.length > 0
          ? Math.round(
              (withDates.reduce((sum, r) => {
                const diff =
                  (new Date(r.completionDate).getTime() - new Date(r.targetEndDate).getTime()) /
                  86_400_000;
                return sum + diff;
              }, 0) /
                withDates.length) *
                10,
            ) / 10
          : 0;

      const onTimeCount = withDates.filter((r) => r.completionDate <= r.targetEndDate).length;

      const onTimeRate =
        withDates.length > 0
          ? Math.round((onTimeCount / withDates.length) * 100)
          : 0;

      return {
        rank:             0,
        squad,
        totalPoints:      s.pts + bugPenalty,
        memberCount:      s.members.size,
        tasks:            s.tasks,
        onTimeCount,
        bugCount,
        bugPenalty,
        members:          Array.from(s.members),
        avgDeliveryDelta,
        onTimeRate,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}
