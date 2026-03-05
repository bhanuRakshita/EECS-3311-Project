package com.consultingplatform.consultant.service;

import com.consultingplatform.admin.service.ResourceNotFoundException;
import com.consultingplatform.booking.domain.Booking;
import com.consultingplatform.booking.repository.BookingRepository;
import com.consultingplatform.consultant.domain.AvailabilitySlot;
import com.consultingplatform.consultant.repository.AvailabilitySlotRepository;
import com.consultingplatform.consultant.web.dto.*;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ConsultantServiceImpl implements ConsultantService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final BookingRepository bookingRepository;

    public ConsultantServiceImpl(AvailabilitySlotRepository availabilitySlotRepository,
                                 BookingRepository bookingRepository) {
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public AvailabilitySlotResponse createAvailabilitySlot(Long consultantId, CreateAvailabilitySlotRequest request) {
        if (!request.getEndAt().isAfter(request.getStartAt())) {
            throw new IllegalStateException("end_at must be after start_at");
        }

        boolean overlapping = availabilitySlotRepository.existsOverlappingSlot(
                consultantId, request.getStartAt(), request.getEndAt());
        if (overlapping) {
            throw new IllegalStateException("Overlapping availability slot exists");
        }

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setConsultantId(consultantId);
        slot.setStartAt(request.getStartAt());
        slot.setEndAt(request.getEndAt());
        slot.setIsAvailable(true);

        AvailabilitySlot saved = availabilitySlotRepository.save(slot);
        return toSlotResponse(saved);
    }

    @Override
    public List<AvailabilitySlotResponse> getAvailabilitySlots(Long consultantId) {
        return availabilitySlotRepository.findByConsultantId(consultantId)
                .stream()
                .map(this::toSlotResponse)
                .toList();
    }

    @Override
    public void deleteAvailabilitySlot(Long consultantId, Long slotId) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability slot not found"));
        if (!slot.getConsultantId().equals(consultantId)) {
            throw new IllegalStateException("Slot does not belong to this consultant");
        }
        availabilitySlotRepository.delete(slot);
    }

    @Override
    public List<ConsultantBookingResponse> getBookingsByStatus(Long consultantId, String status) {
        List<Booking> bookings;
        if (status != null && !status.isBlank()) {
            bookings = bookingRepository.findByConsultantIdAndStatus(consultantId, status);
        } else {
            bookings = bookingRepository.findByConsultantId(consultantId);
        }
        return bookings.stream().map(this::toBookingResponse).toList();
    }

    @Override
    public ConsultantBookingResponse acceptBooking(Long consultantId, Long bookingId) {
        Booking booking = getBookingForConsultant(consultantId, bookingId);
        booking.accept();
        booking.setConsultantDecidedAt(OffsetDateTime.now());
        Booking saved = bookingRepository.save(booking);
        return toBookingResponse(saved);
    }

    @Override
    public ConsultantBookingResponse rejectBooking(Long consultantId, Long bookingId, BookingDecisionRequest request) {
        Booking booking = getBookingForConsultant(consultantId, bookingId);
        booking.reject();
        booking.setConsultantDecidedAt(OffsetDateTime.now());
        if (request != null && request.getReason() != null) {
            booking.setRejectionReason(request.getReason());
        }
        Booking saved = bookingRepository.save(booking);
        return toBookingResponse(saved);
    }

    @Override
    public ConsultantBookingResponse completeBooking(Long consultantId, Long bookingId) {
        Booking booking = getBookingForConsultant(consultantId, bookingId);
        booking.complete();
        Booking saved = bookingRepository.save(booking);
        return toBookingResponse(saved);
    }

    private Booking getBookingForConsultant(Long consultantId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!booking.getConsultantId().equals(consultantId)) {
            throw new IllegalStateException("Booking does not belong to this consultant");
        }
        return booking;
    }

    private AvailabilitySlotResponse toSlotResponse(AvailabilitySlot slot) {
        return new AvailabilitySlotResponse(
                slot.getId(), slot.getConsultantId(), slot.getStartAt(),
                slot.getEndAt(), slot.getIsAvailable(), slot.getCreatedAt());
    }

    private ConsultantBookingResponse toBookingResponse(Booking booking) {
        return new ConsultantBookingResponse(
                booking.getId(), booking.getClientId(), booking.getConsultantId(),
                booking.getServiceId(), booking.getRequestedStartAt(), booking.getRequestedEndAt(),
                booking.getStatus(), booking.getRequestedAt(),
                booking.getConsultantDecidedAt(), booking.getCompletedAt(),
                booking.getRejectionReason());
    }
}
