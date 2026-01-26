"use client";

import { useState } from "react";
import { SearchAndResults } from "./search-and-results";
import { DoctorBookingView } from "./doctor-booking-view";

export function AgendarCitaContent() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  if (selectedDoctorId) {
    return (
      <DoctorBookingView
        doctorId={selectedDoctorId}
        onBack={() => setSelectedDoctorId(null)}
      />
    );
  }

  return (
    <SearchAndResults
      onSelectDoctor={(id) => setSelectedDoctorId(id)}
    />
  );
}
