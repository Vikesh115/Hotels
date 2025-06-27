import { useEffect, useState } from 'react';
import { useParams, NavLink } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { hoteldetail } from '../../Redux/actions/Action';
import Breadcrumb from '../../Components/BreadCrumb/BreadCrumb';
import RatingReview from '../../Components/RatingReview/RatingReview';
import { FaRegThumbsUp } from "react-icons/fa";
import Facility from './facility/Facility';
import Type from './rooms/Type';
import Footer from './footer/Footer';
import Details from './home/Details';
import BookingForm from '../Bookings/BookingForm';

function Detailpage() {
    const [showBookingForm, setShowBookingForm] = useState(false);

    const { details, loading } = useSelector((state) => state.hotels)
    const { id } = useParams();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(hoteldetail(id))
    }, [id, dispatch])

    if (loading) {
        return (
            <div className='flex justify-center items-center h-screen w-[100%] text-black'>loading...</div>
        )
    }

    return (
        <>
            <div className='bg-gradient-to-t from-cyan-950 to-sky-700 text-blue-400'>
                <Breadcrumb />
                <p className='text-white text-4xl pb-2 pl-4'>Hotel in {details?.city}</p>
            </div>

            <div className='flex flex-col lg:ml-18 ml-10 mt-6'>
                <div className='flex flex-row gap-2 items-center font-light'>
                    <RatingReview rating={details?.starRating} />
                    <FaRegThumbsUp className='bg-yellow-200 p-1' size={20} />
                </div>
                <p className='flex text-2xl font-bold'>{details?.name}</p>
            </div>

            <Details />

            <div className='flex justify-center'>
                <div className='lg:hidden flex w-[90%] font-medium h-[30%] flex-col gap-2'>
                    <span className='text-3xl font-bold'>{details?.hotelType}</span>
                    <span>{details?.name}</span>
                    <NavLink target='blank' to={`https://www.google.com/search?q=${details?.address} + ${details?.city}`}
                        className="hover:text-blue-500 font-bold text-amber-950 hover:text-2xl"
                    >{details?.address},{details?.city}</NavLink>
                    <span>{details?.hotelImportantInformation?.slice(0, 200)}
                        <NavLink to="/info" className="text-blue-700">
                            ...more
                        </NavLink>
                    </span>
                </div>
            </div>
            <Type />
            <Facility />
            
            <div className='pl-10'>
                <button
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
                {showBookingForm ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Hide Form
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Book Now
                    </>
                )}
            </button>
            </div>

            {showBookingForm && (
                <div className="mt-6 transition-all duration-300 ease-in-out">
                    <BookingForm hotel={details} />
                </div>
            )}
            <Footer />
        </>
    )
}

export default Detailpage