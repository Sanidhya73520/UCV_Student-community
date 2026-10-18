export function getSemesterForDate(date = new Date()) {
  const d = new Date(date);
  const month = d.getUTCMonth(); // 0 = Jan, 8 = Sep
  const year = d.getUTCFullYear();

  // Autumn semester: September (8) to January (0)
  // September - December belongs to that year's autumn semester
  // January belongs to previous year's autumn semester
  if (month >= 8) {
    return {
      id: `autumn-${year}`,
      name: `Autumn semester ${year}`,
      start: new Date(Date.UTC(year, 8, 1, 0, 0, 0)),
      end: new Date(Date.UTC(year + 1, 0, 31, 23, 59, 59, 999))
    };
  } else if (month === 0) {
    return {
      id: `autumn-${year - 1}`,
      name: `Autumn semester ${year - 1}`,
      start: new Date(Date.UTC(year - 1, 8, 1, 0, 0, 0)),
      end: new Date(Date.UTC(year, 0, 31, 23, 59, 59, 999))
    };
  } else {
    // Spring semester: February (1) to August (7)
    return {
      id: `spring-${year}`,
      name: `Spring semester ${year}`,
      start: new Date(Date.UTC(year, 1, 1, 0, 0, 0)),
      end: new Date(Date.UTC(year, 7, 31, 23, 59, 59, 999))
    };
  }
}

export function getCurrentSemester() {
  return getSemesterForDate(new Date());
}

export function getSemestersList(baseYear = 2026) {
  return [
    { id: 'autumn-2026', name: 'Autumn semester 2026' },
    { id: 'spring-2027', name: 'Spring semester 2027' },
    { id: 'autumn-2027', name: 'Autumn semester 2027' },
    { id: 'spring-2028', name: 'Spring semester 2028' }
  ];
}

export function semesterOf(date = new Date()) {
  return getSemesterForDate(date).name;
}

