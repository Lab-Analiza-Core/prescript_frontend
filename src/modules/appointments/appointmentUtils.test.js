import assert from "node:assert/strict";
import test from "node:test";

import { hasAppointmentTimeConflict } from "./appointmentConflict.js";

test("detecta solapamientos de citas que cruzan medianoche", () => {
  const appointments = [
    {
      id: 1,
      doctor: 7,
      duration_minutes: 60,
      scheduled_at: "2026-10-26T23:30:00",
      status: "scheduled",
    },
  ];

  assert.equal(
    hasAppointmentTimeConflict({
      appointments,
      date: "2026-10-27",
      doctor: 7,
      durationMinutes: 30,
      time: "00:00",
    }),
    true,
  );
});

test("ignora citas inactivas y citas de otro doctor", () => {
  const base = {
    duration_minutes: 60,
    scheduled_at: "2026-10-26T10:00:00",
  };

  assert.equal(
    hasAppointmentTimeConflict({
      appointments: [
        { ...base, id: 1, doctor: 8, status: "scheduled" },
        { ...base, id: 2, doctor: 7, status: "cancelled" },
      ],
      date: "2026-10-26",
      doctor: 7,
      durationMinutes: 30,
      time: "10:15",
    }),
    false,
  );
});
