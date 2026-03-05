package com.consultingplatform.booking.service;

import com.consultingplatform.booking.domain.Booking;
import java.util.List;

public interface BookingService {

    Booking requestBooking(Booking booking);

    Booking getBookingById(Long bookingId);

    Booking cancelBooking(Long bookingId);

    List<Booking> getClientBookings(Long clientId);

}