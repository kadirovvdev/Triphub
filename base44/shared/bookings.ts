// Shared helpers for booking seat management and rating aggregation.
// Imported by backend functions to avoid duplicated logic.

// Adjust a tour's available_seats by delta (can be negative).
// Ensures seats never drop below zero.
export async function adjustSeats(base44, tourId, delta) {
  const tour = await base44.asServiceRole.entities.Tour.get(tourId);
  if (!tour) throw new Error('Tour not found');
  const next = Math.max(0, (tour.available_seats || 0) + delta);
  await base44.asServiceRole.entities.Tour.update(tourId, { available_seats: next });
  return next;
}

// Recompute average rating + reviews count for a tour and persist it.
export async function recomputeTourRating(base44, tourId) {
  const reviews = await base44.asServiceRole.entities.Review.filter({ tour_id: tourId });
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
  await base44.asServiceRole.entities.Tour.update(tourId, {
    rating: Math.round(avg * 10) / 10,
    reviews_count: count,
  });
  return { rating: Math.round(avg * 10) / 10, reviews_count: count };
}

// Recompute organizer aggregate rating across all their approved tours.
export async function recomputeOrganizerRating(base44, organizerProfileId) {
  const tours = await base44.asServiceRole.entities.Tour.filter({ organizer_profile_id: organizerProfileId });
  const withRatings = tours.filter((t) => (t.reviews_count || 0) > 0);
  const totalReviews = withRatings.reduce((s, t) => s + (t.reviews_count || 0), 0);
  const weighted = withRatings.reduce((s, t) => s + (t.rating || 0) * (t.reviews_count || 0), 0);
  const avg = totalReviews > 0 ? weighted / totalReviews : 0;
  await base44.asServiceRole.entities.OrganizerProfile.update(organizerProfileId, {
    rating: Math.round(avg * 10) / 10,
    reviews_count: totalReviews,
    tours_count: tours.length,
  });
  return { rating: Math.round(avg * 10) / 10, reviews_count: totalReviews };
}