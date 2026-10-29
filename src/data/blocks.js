/* Open play sessions block court rentals. This turns sessions into "taken" blocks, one per court, for the booking screens.
   A session lists the courts it uses; an older session without a list is treated as using every court. */
export const openPlayBlocks = (sessions, allCourts) =>
  (sessions || []).flatMap((se) => {
    const courts = se.courts && se.courts.length ? se.courts : allCourts;
    return courts.map((c) => ({ id: `${se.id}_${c}`, court: c, date: se.date, start: se.start, end: se.end, name: 'Open play', kind: 'openplay' }));
  });
