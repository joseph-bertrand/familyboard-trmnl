const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAppsScript } = require("./apps-script-loader");

const { SchoolSchedule, SCHOOL_SCHEDULE } = loadAppsScript(
  ["SchoolSchedule.gs"],
  ["SchoolSchedule", "SCHOOL_SCHEDULE"]
);

function zurichDate(value) {
  return new Date(`${value}+02:00`);
}

test("selects Monday, Wednesday and Friday courses and none on Saturday", () => {
  assert.equal(SchoolSchedule.getCoursesForDate(zurichDate("2026-08-24T08:00:00")).length, 7);
  assert.equal(SchoolSchedule.getCoursesForDate(zurichDate("2026-08-26T08:00:00")).length, 6);
  assert.equal(SchoolSchedule.getCoursesForDate(zurichDate("2026-08-28T08:00:00")).length, 7);
  assert.deepEqual(
    JSON.parse(JSON.stringify(
      SchoolSchedule.getCoursesForDate(zurichDate("2026-08-29T08:00:00"))
    )),
    []
  );
});

test("returns courses in chronological order", () => {
  const courses = SchoolSchedule.getCoursesForDate(
    zurichDate("2026-08-25T08:00:00")
  );

  assert.deepEqual(
    Array.from(courses, (course) => course.start),
    ["08:15", "09:10", "10:15", "11:10", "13:30", "14:25", "15:30", "16:25"]
  );
});

test("selects the next school day after Monday, Friday and Saturday", () => {
  assert.equal(
    SchoolSchedule.getNextSchoolDate(zurichDate("2026-08-24T12:00:00")).getDate(),
    25
  );
  assert.equal(
    SchoolSchedule.getNextSchoolDate(zurichDate("2026-08-28T12:00:00")).getDate(),
    31
  );
  assert.equal(
    SchoolSchedule.getNextSchoolDate(zurichDate("2026-08-29T12:00:00")).getDate(),
    31
  );
});

test("chooses the first course before school starts", () => {
  const next = SchoolSchedule.getNextCourse(zurichDate("2026-08-24T07:30:00"));

  assert.equal(next.subject, "Mathématiques");
  assert.equal(next.start, "08:15");
  assert.equal(next.minutesUntil, 45);
});

test("chooses the next course between two courses", () => {
  const next = SchoolSchedule.getNextCourse(zurichDate("2026-08-24T09:07:00"));

  assert.equal(next.subject, "Étude");
  assert.equal(next.start, "09:10");
  assert.equal(next.minutesUntil, 3);
});

test("chooses the following course while a course is in progress", () => {
  const next = SchoolSchedule.getNextCourse(zurichDate("2026-08-24T08:30:00"));

  assert.equal(next.subject, "Étude");
  assert.equal(next.start, "09:10");
  assert.equal(next.minutesUntil, 40);
});

test("returns no next course after the school day", () => {
  assert.equal(
    SchoolSchedule.getNextCourse(zurichDate("2026-08-24T18:00:00")),
    null
  );
});

test("preserves the complete course data", () => {
  const course = SchoolSchedule.getCoursesForDate(
    zurichDate("2026-08-24T08:00:00")
  )[0];

  assert.deepEqual(
    JSON.parse(JSON.stringify(course)),
    {
      weekday: "monday",
      start: "08:15",
      end: "09:05",
      subject: "Mathématiques",
      teacher: "VAUCHER L.",
      room: "16",
      info: ""
    }
  );
});

test("uses the confirmed study and non-Latin choices", () => {
  const mondaySubjects = Array.from(
    SchoolSchedule.getCoursesForDate(zurichDate("2026-08-24T08:00:00")),
    (course) => course.subject
  );
  const fridaySubjects = Array.from(
    SchoolSchedule.getCoursesForDate(zurichDate("2026-08-28T08:00:00")),
    (course) => course.subject
  );

  assert.ok(mondaySubjects.includes("Étude"));
  assert.ok(!mondaySubjects.includes("Option anglophone"));
  assert.ok(fridaySubjects.includes("Étude"));
  assert.ok(!SCHOOL_SCHEDULE.some((course) => course.subject === "Option latin"));
});

test("builds a weekend state centered on Monday", () => {
  const dashboard = SchoolSchedule.buildDashboard(
    zurichDate("2026-08-29T10:00:00")
  );

  assert.equal(dashboard.today.hasCourses, true);
  assert.equal(dashboard.today.weekday, "Lundi");
  assert.equal(dashboard.today.courses[0].subject, "Mathématiques");
  assert.equal(dashboard.tomorrow.weekday, "Mardi");
  assert.equal(dashboard.nextCourse.subject, "Mathématiques");
});

test("projects only the fields used by the school template", () => {
  const dashboard = SchoolSchedule.buildDashboard(
    zurichDate("2026-08-24T07:30:00")
  );
  const dto = JSON.parse(JSON.stringify(SchoolSchedule.buildTrmnlDto(dashboard)));

  assert.deepEqual(Object.keys(dto).sort(), ["className", "nextCourse", "school", "today", "tomorrow"]);
  assert.equal(dto.today.label, "Aujourd’hui");
  assert.equal(dto.tomorrow.label, "Demain");
  assert.equal(dto.nextCourse.timing, "dans 45 min");
  assert.deepEqual(
    Object.keys(dto.today.courses[0]).sort(),
    ["end", "room", "start", "subject", "teacher"]
  );
  assert.deepEqual(
    Object.keys(dto.tomorrow.courses[0]).sort(),
    ["room", "start", "subject"]
  );
});

test("keeps a representative school payload below 2048 UTF-8 bytes", () => {
  const dashboard = SchoolSchedule.buildDashboard(
    zurichDate("2026-08-25T07:30:00")
  );
  const body = SchoolSchedule.buildTrmnlRequestBody(dashboard);

  assert.ok(SchoolSchedule.getUtf8ByteSize(body) < 2048);
});

function displayedDays(now) {
  const dashboard = SchoolSchedule.buildDashboard(zurichDate(now));

  return {
    primary: `${dashboard.today.weekday} ${dashboard.today.date}`,
    secondary: `${dashboard.tomorrow.weekday} ${dashboard.tomorrow.date}`,
    primaryLabel: dashboard.today.label,
    secondaryLabel: dashboard.tomorrow.label
  };
}

test("keeps Wednesday and Thursday before the 20:00 cutoff", () => {
  assert.deepEqual(displayedDays("2026-08-26T19:59:00"), {
    primary: "Mercredi 26 août",
    secondary: "Jeudi 27 août",
    primaryLabel: "Aujourd’hui",
    secondaryLabel: "Demain"
  });
});

test("shifts to Thursday and Friday exactly at the 20:00 cutoff", () => {
  assert.deepEqual(displayedDays("2026-08-26T20:00:00"), {
    primary: "Jeudi 27 août",
    secondary: "Vendredi 28 août",
    primaryLabel: "Jeudi",
    secondaryLabel: "Vendredi"
  });
});

test("stays shifted after the cutoff", () => {
  assert.deepEqual(displayedDays("2026-08-26T21:00:00"), {
    primary: "Jeudi 27 août",
    secondary: "Vendredi 28 août",
    primaryLabel: "Jeudi",
    secondaryLabel: "Vendredi"
  });
});

test("shows Friday and Monday before Friday cutoff", () => {
  assert.deepEqual(displayedDays("2026-08-28T19:59:00"), {
    primary: "Vendredi 28 août",
    secondary: "Lundi 31 août",
    primaryLabel: "Aujourd’hui",
    secondaryLabel: "Demain"
  });
});

test("shows Monday and Tuesday from Friday at 20:00", () => {
  assert.deepEqual(displayedDays("2026-08-28T20:00:00"), {
    primary: "Lundi 31 août",
    secondary: "Mardi 1 septembre",
    primaryLabel: "Lundi",
    secondaryLabel: "Mardi"
  });
});

test("shows Monday and Tuesday throughout the weekend", () => {
  const expected = {
    primary: "Lundi 31 août",
    secondary: "Mardi 1 septembre",
    primaryLabel: "Lundi",
    secondaryLabel: "Mardi"
  };

  assert.deepEqual(displayedDays("2026-08-29T10:00:00"), expected);
  assert.deepEqual(displayedDays("2026-08-30T10:00:00"), expected);
});

test("keeps the current next-course logic before cutoff", () => {
  const dashboard = SchoolSchedule.buildDashboard(
    zurichDate("2026-08-26T09:07:00")
  );

  assert.equal(dashboard.nextCourse.subject, "Mathématiques");
  assert.equal(dashboard.nextCourse.start, "09:10");
  assert.equal(dashboard.nextCourse.minutesUntil, 3);
});

test("uses the first primary-day course after cutoff", () => {
  const dashboard = SchoolSchedule.buildDashboard(
    zurichDate("2026-08-26T20:05:00")
  );

  assert.equal(dashboard.nextCourse.subject, "Français");
  assert.equal(dashboard.nextCourse.start, "08:15");
  assert.equal(dashboard.nextCourse.room, "10");
  assert.equal(dashboard.nextCourse.minutesUntil, null);
  assert.equal(
    SchoolSchedule.buildTrmnlDto(dashboard).nextCourse.timing,
    "08:15"
  );
});
