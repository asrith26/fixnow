# TODO: Update Booking Services in BookingHistory Page

## Backend Changes
- [x] Add `updateBooking` function in `backend/controllers/bookingController.js` to allow updating booking details for authenticated user
- [x] Update `backend/routes/bookings.js` to include PUT `/api/bookings/:id` route for updating bookings

## Frontend Changes
- [x] In `src/pages/BookingHistory.js`, add "Edit" button for upcoming bookings that opens a modal with form to edit details (service, date, time, address, city, zipCode, notes)
- [x] Enhance cancellation functionality with confirmation dialog including refund message (3 working days if payment was made)

## Testing
- [x] Test edit functionality for upcoming bookings
- [x] Test enhanced cancellation with refund message
- [x] Verify user-specific data retrieval and updates
