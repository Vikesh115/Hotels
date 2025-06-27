import { useState, useEffect } from 'react';
import { format, addDays, differenceInDays } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';

const BookingForm = ({ hotel }) => {
    const [checkInDate, setCheckInDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [checkOutDate, setCheckOutDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [selectedRoom, setSelectedRoom] = useState(hotel?.rooms?.[0] || null);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stripe, setStripe] = useState(null);

    // Load Stripe when component mounts
    useEffect(() => {
        const initializeStripe = async () => {
            try {
                const stripeInstance = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
                setStripe(stripeInstance);
            } catch (err) {
                console.error('Failed to load Stripe:', err);
                setError('Failed to initialize payment system. Please refresh the page.');
            }
        };
        initializeStripe();
    }, []);

    // Auto-select first room if available
    useEffect(() => {
        if (hotel?.rooms?.length > 0 && !selectedRoom) {
            setSelectedRoom(hotel.rooms[0]);
        }
    }, [hotel?.rooms]);

    const nights = differenceInDays(new Date(checkOutDate), new Date(checkInDate));
    const totalPrice = selectedRoom
        ? nights * (selectedRoom.baseRate || 100)
        : nights * 100;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!guestName || !guestEmail) {
            setError('Please fill in all required fields');
            return;
        }

        if (!stripe) {
            setError('Payment system not ready. Please try again.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const booking = {
                hotelId: hotel?.id,
                hotelName: hotel?.name,
                checkInDate,
                checkOutDate,
                nights,
                adults,
                children,
                roomType: selectedRoom?.roomName || 'Standard Room',
                guestName,
                guestEmail,
                totalPrice,
                bookingDate: new Date().toISOString(),
                status: 'pending'
            };

            // Create payment intent
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Math.round(totalPrice * 100), // in cents
                    currency: 'usd',
                    metadata: {
                        hotelId: hotel?.id,
                        bookingData: JSON.stringify(booking)
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }

            const { clientSecret, error: intentError } = await response.json();

            if (intentError) {
                throw new Error(intentError.message);
            }

            // Confirm payment
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                clientSecret,
                paymentMethod: {
                    billing_details: {
                        name: guestName,
                        email: guestEmail,
                    },
                },
                return_url: `${window.location.origin}/bookings`,
            });

            if (stripeError) {
                throw stripeError;
            }

            // Payment successful
            booking.status = 'confirmed';
            booking.paymentId = paymentIntent.id;
            saveBookingToLocalStorage(booking);

            // Redirect to bookings page
            window.location.href = '/bookings';
        } catch (err) {
            console.error('Booking error:', err);
            setError(err.message || 'Payment failed. Please try again.');
            setLoading(false);
        }
    };

    const saveBookingToLocalStorage = (booking) => {
        try {
            const bookings = JSON.parse(localStorage.getItem('hotelBookings')) || [];
            bookings.push(booking);
            localStorage.setItem('hotelBookings', JSON.stringify(bookings));
        } catch (error) {
            console.error('Error saving booking:', error);
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Book Your Stay</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            min={format(addDays(new Date(checkInDate), 1), 'yyyy-MM-dd')}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={adults}
                            onChange={(e) => setAdults(parseInt(e.target.value))}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={children}
                            onChange={(e) => setChildren(parseInt(e.target.value))}
                        />
                    </div>
                </div>

                {hotel.rooms?.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={selectedRoom?.id || ''}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                const room = hotel.rooms.find(r => String(r.id) === selectedId);
                                if (room) {
                                    setSelectedRoom(room);
                                } else {
                                    console.error('Room not found:', selectedId);
                                }
                            }}
                            required
                        >
                            <option value="" disabled>Select your room</option>
                            {hotel.rooms.map(room => (
                                <option
                                    key={room.id}
                                    value={String(room.id)} // Ensure string type
                                >
                                    {room.roomName} - ${room.baseRate || 100}/night
                                    {room.roomSizeSquare && ` (${room.roomSizeSquare} ${room.roomSizeUnit})`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Price Summary</h3>
                    <div className="space-y-1">
                        <p className="text-gray-600"><span className="font-medium">Nights:</span> {nights}</p>
                        <p className="text-gray-600"><span className="font-medium">Hotel:</span> {hotel?.name}</p>
                        <p className="text-gray-600"><span className="font-medium">Room:</span> {selectedRoom?.roomName || 'Standard Room'}</p>
                        <p className="text-lg font-bold text-gray-800 mt-2">Total: ${totalPrice.toFixed(2)}</p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-md">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        'Confirm Booking'
                    )}
                </button>
            </form>
        </div>
    );
};

export default BookingForm;