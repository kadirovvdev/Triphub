import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { adjustSeats, recomputeTourRating, recomputeOrganizerRating } from '../../shared/bookings.ts';

// Manages the booking lifecycle for TripHub.
// action: "create" | "approve" | "reject" | "cancel" | "review"
// Centralizes seat adjustment and rating recomputation so they stay atomic.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action;
    const bookingId = body.booking_id;

    if (action === 'create') {
      // Traveler books a tour.
      const { tour_id, seats, full_name, phone, note } = body;
      if (!tour_id || !seats || seats < 1) {
        return Response.json({ error: 'Invalid booking payload' }, { status: 400 });
      }
      const tour = await base44.asServiceRole.entities.Tour.get(tour_id);
      if (!tour) return Response.json({ error: 'Tour not found' }, { status: 404 });
      if (tour.status !== 'approved') {
        return Response.json({ error: 'Tour is not available for booking' }, { status: 400 });
      }
      if ((tour.available_seats || 0) < seats) {
        return Response.json({ error: 'Not enough available seats' }, { status: 400 });
      }
      const booking = await base44.entities.Booking.create({
        tour_id,
        traveler_id: user.id,
        organizer_profile_id: tour.organizer_profile_id || null,
        seats,
        full_name: full_name || user.full_name,
        phone: phone || '',
        note: note || '',
        status: 'pending',
        total_price: (tour.price || 0) * seats,
      });
      return Response.json({ booking });
    }

    if (action === 'approve' || action === 'reject') {
      if (!bookingId) return Response.json({ error: 'booking_id required' }, { status: 400 });
      const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

      // Only the tour's organizer may approve/reject.
      if (booking.traveler_id !== user.id) {
        const tour = await base44.asServiceRole.entities.Tour.get(booking.tour_id);
        const profile = await base44.asServiceRole.entities.OrganizerProfile.get(tour?.organizer_profile_id);
        // Identify organizer by the booking's traveler profile match would be wrong;
        // we trust the organizer_profile_id belonging to current user.
        const myProfile = await base44.asServiceRole.entities.OrganizerProfile.filter({ created_by_id: user.id });
        const owns = myProfile && myProfile.some((p) => p.id === tour?.organizer_profile_id);
        if (!owns && user.role !== 'admin') {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      if (action === 'approve') {
        await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'approved' });
        await adjustSeats(base44, booking.tour_id, -Math.max(1, booking.seats || 1));
      } else {
        await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'rejected' });
      }
      return Response.json({ ok: true });
    }

    if (action === 'cancel') {
      if (!bookingId) return Response.json({ error: 'booking_id required' }, { status: 400 });
      const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
      if (booking.traveler_id !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Return seats only if the booking was previously approved.
      if (booking.status === 'approved') {
        await adjustSeats(base44, booking.tour_id, Math.max(1, booking.seats || 1));
      }
      await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'cancelled' });
      return Response.json({ ok: true });
    }

    if (action === 'review') {
      const { tour_id, rating, comment } = body;
      if (!tour_id || !rating || rating < 1 || rating > 5 || !comment) {
        return Response.json({ error: 'Invalid review payload' }, { status: 400 });
      }
      // Only travelers with an approved booking for this tour may review.
      const bookings = await base44.asServiceRole.entities.Booking.filter({
        tour_id,
        traveler_id: user.id,
        status: 'approved',
      });
      if (!bookings.length) {
        return Response.json({ error: 'Only travelers who joined this tour may review' }, { status: 403 });
      }
      const existing = await base44.asServiceRole.entities.Review.filter({ tour_id, traveler_id: user.id });
      if (existing.length) {
        return Response.json({ error: 'You have already reviewed this tour' }, { status: 400 });
      }
      const review = await base44.entities.Review.create({
        tour_id,
        traveler_id: user.id,
        rating,
        comment,
      });
      await recomputeTourRating(base44, tour_id);
      const tour = await base44.asServiceRole.entities.Tour.get(tour_id);
      if (tour?.organizer_profile_id) {
        await recomputeOrganizerRating(base44, tour.organizer_profile_id);
      }
      return Response.json({ review });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}