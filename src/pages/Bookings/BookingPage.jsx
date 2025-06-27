import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';

const BookingsPage = () => {
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        const savedBookings = JSON.parse(localStorage.getItem('hotelBookings')) || [];
        setBookings(savedBookings);
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Your Bookings</h1>

            {bookings.length === 0 ? (
                <p>You dont have any bookings yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {bookings.map((booking, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <h2 className="text-xl font-bold mb-2">{booking.hotelName}</h2>
                            <p className="mb-1">
                                <span className="font-semibold">Dates:</span> {format(parseISO(booking.checkInDate), 'MMM d, yyyy')} - {format(parseISO(booking.checkOutDate), 'MMM d, yyyy')}
                            </p>
                            <p className="mb-1"><span className="font-semibold">Room:</span> {booking.roomType}</p>
                            <p className="mb-1"><span className="font-semibold">Guests:</span> {booking.adults} adult(s), {booking.children} child(ren)</p>
                            <p className="mb-1"><span className="font-semibold">Total:</span> ${booking.totalPrice.toFixed(2)}</p>
                            <p className="mb-1"><span className="font-semibold">Status:</span> {booking.status}</p>
                            <p><span className="font-semibold">Booking Date:</span> {format(parseISO(booking.bookingDate), 'MMM d, yyyy')}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookingsPage;