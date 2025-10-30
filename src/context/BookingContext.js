import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const BookingContext = createContext({});

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const [bookingData, setBookingData] = useState({
    service: '',
    date: '',
    time: '',
    address: '',
    city: '',
    zipCode: '',
    notes: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load booking data from localStorage on mount
    const savedData = localStorage.getItem('bookingData');
    if (savedData) {
      setBookingData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    // Load user-specific bookings from backend when user changes
    if (currentUser?.id) {
      fetchUserBookings();
    } else {
      setBookings([]);
    }
  }, [currentUser]);

  const fetchUserBookings = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/bookings', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.bookings) {
          setBookings(data.bookings);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Fallback to localStorage if backend fails
      const userBookingsKey = `bookings_${currentUser.id}`;
      const savedBookings = localStorage.getItem(userBookingsKey);
      if (savedBookings) {
        setBookings(JSON.parse(savedBookings));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBookingData = (newData) => {
    const updatedData = { ...bookingData, ...newData };
    setBookingData(updatedData);
    localStorage.setItem('bookingData', JSON.stringify(updatedData));
  };

  const clearBookingData = () => {
    setBookingData({
      service: '',
      date: '',
      time: '',
      address: '',
      city: '',
      zipCode: '',
      notes: ''
    });
    localStorage.removeItem('bookingData');
    setCurrentStep(1);
  };

  const setService = (service) => {
    updateBookingData({ service });
  };

  const setDate = (date) => {
    updateBookingData({ date });
    setCurrentStep(2);
  };

  const setTime = (time) => {
    updateBookingData({ time });
    setCurrentStep(3);
  };

  const setAddress = (address) => {
    updateBookingData({ address });
  };

  const setCity = (city) => {
    updateBookingData({ city });
  };

  const setZipCode = (zipCode) => {
    updateBookingData({ zipCode });
  };

  const setNotes = (notes) => {
    updateBookingData({ notes });
  };

  const confirmBooking = async () => {
    try {
      setLoading(true);

      const bookingPayload = {
        service: bookingData.service,
        title: `${bookingData.service} Service`,
        date: bookingData.date,
        time: bookingData.time,
        address: bookingData.address,
        city: bookingData.city,
        zipCode: bookingData.zipCode,
        notes: bookingData.notes,
        professional: 'Professional' // This would come from the selected professional
      };

      const response = await fetch('http://localhost:5001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.booking) {
          // Add the new booking to the local state
          setBookings([data.booking, ...bookings]);
        }
      }

      clearBookingData();
      setCurrentStep(4);
    } catch (error) {
      console.error('Error creating booking:', error);
      // Fallback to localStorage if backend fails
      if (currentUser?.id && bookingData.service) {
        const newBooking = {
          _id: Date.now().toString(),
          service: bookingData.service,
          title: `${bookingData.service} Service`,
          date: bookingData.date,
          time: bookingData.time,
          address: bookingData.address,
          city: bookingData.city,
          zipCode: bookingData.zipCode,
          notes: bookingData.notes,
          professional: 'Professional',
          status: 'Confirmed',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQLOVZd8fLaYEiHDEob_8XrxpaaAjlr6i_KKpa7glTxDI4dh4xyhV_NF0Zwk85jXGiNUNOYJ4LC7bU_KPZusXj0MTr7uUcZs2zyyJlSx02nooFI6qBg3UfrpIKk7piMFJXngknZSCknuvBSIgMad-8FJEQOzuVd4Ut7_IYms9l49MInGSWt3EGc6lUB1W352Apg-A5pAAyMdhLVEp66tbb1L7j25z_Y-_mnrQAmV7sc9sfRkPSIUNU3HZ0HpBxksfYazRoNTUttSCa'
        };

        const updatedBookings = [newBooking, ...bookings];
        setBookings(updatedBookings);
        localStorage.setItem(`bookings_${currentUser.id}`, JSON.stringify(updatedBookings));
      }

      clearBookingData();
      setCurrentStep(4);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      setLoading(true);

      const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.booking) {
          const updatedBookings = bookings.map(booking =>
            booking._id === bookingId ? data.booking : booking
          );
          setBookings(updatedBookings);
        }
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      // Fallback to local update if backend fails
      const updatedBookings = bookings.map(booking => {
        if (booking._id === bookingId && booking.status === 'Confirmed') {
          return { ...booking, status: 'Cancelled' };
        }
        return booking;
      });
      setBookings(updatedBookings);
      if (currentUser?.id) {
        localStorage.setItem(`bookings_${currentUser.id}`, JSON.stringify(updatedBookings));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (bookingId, updatedData) => {
    try {
      setLoading(true);

      const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.booking) {
          const updatedBookings = bookings.map(booking =>
            booking._id === bookingId ? data.booking : booking
          );
          setBookings(updatedBookings);
        }
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      // Fallback to local update if backend fails
      const updatedBookings = bookings.map(booking => {
        if (booking._id === bookingId) {
          return { ...booking, ...updatedData };
        }
        return booking;
      });
      setBookings(updatedBookings);
      if (currentUser?.id) {
        localStorage.setItem(`bookings_${currentUser.id}`, JSON.stringify(updatedBookings));
      }
    } finally {
      setLoading(false);
    }
  };

  const value = {
    bookingData,
    currentStep,
    bookings,
    loading,
    setService,
    setDate,
    setTime,
    setAddress,
    setCity,
    setZipCode,
    setNotes,
    updateBookingData,
    clearBookingData,
    confirmBooking,
    cancelBooking,
    updateBooking,
    fetchUserBookings
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
