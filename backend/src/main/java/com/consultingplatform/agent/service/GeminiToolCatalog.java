package com.consultingplatform.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Gemini function declarations aligned with existing REST endpoints (paths and DTO fields).
 */
public final class GeminiToolCatalog {

    private static final Set<String> CLIENT = Set.of(
        "list_services",
        "list_consultants",
        "request_booking",
        "cancel_booking",
        "list_client_bookings",
        "get_payment_methods",
        "process_payment",
        "payment_history"
    );

    private static final Set<String> CONSULTANT = Set.of(
        "list_services",
        "list_consultant_bookings",
        "accept_booking",
        "reject_booking",
        "complete_booking",
        "add_availability_slot",
        "list_availability_slots",
        "delete_availability_slot"
    );

    private static final Set<String> ADMIN = Set.of(
        "list_services",
        "list_consultants",
        "approve_consultant",
        "list_pending_consultants",
        "update_policy",
        "system_status"
    );

    private GeminiToolCatalog() {
    }

    public static ArrayNode functionDeclarationsForRole(String role, ObjectMapper mapper) {
        Set<String> allowed = switch (role) {
            case "client" -> CLIENT;
            case "consultant" -> CONSULTANT;
            case "admin" -> ADMIN;
            default -> Set.of();
        };
        ArrayNode all = allDeclarations(mapper);
        ArrayNode out = mapper.createArrayNode();
        for (int i = 0; i < all.size(); i++) {
            ObjectNode decl = (ObjectNode) all.get(i);
            if (allowed.contains(decl.get("name").asText())) {
                out.add(decl);
            }
        }
        return out;
    }

    public static boolean isAllowedForRole(String toolName, String role) {
        Set<String> allowed = switch (role) {
            case "client" -> CLIENT;
            case "consultant" -> CONSULTANT;
            case "admin" -> ADMIN;
            default -> Set.of();
        };
        return allowed.contains(toolName);
    }

    public static List<String> toolNamesForRole(String role) {
        return switch (role) {
            case "client" -> CLIENT.stream().sorted().collect(Collectors.toList());
            case "consultant" -> CONSULTANT.stream().sorted().collect(Collectors.toList());
            case "admin" -> ADMIN.stream().sorted().collect(Collectors.toList());
            default -> List.of();
        };
    }

    private static ObjectNode decl(ObjectMapper m, String name, String description, ObjectNode properties) {
        ObjectNode params = m.createObjectNode();
        params.put("type", "object");
        params.set("properties", properties);
        ObjectNode o = m.createObjectNode();
        o.put("name", name);
        o.put("description", description);
        o.set("parameters", params);
        return o;
    }

    private static ObjectNode propString(ObjectMapper m, String description) {
        ObjectNode o = m.createObjectNode();
        o.put("type", "string");
        o.put("description", description);
        return o;
    }

    private static ObjectNode propNumber(ObjectMapper m, String description) {
        ObjectNode o = m.createObjectNode();
        o.put("type", "number");
        o.put("description", description);
        return o;
    }

    private static ArrayNode allDeclarations(ObjectMapper m) {
        ArrayNode a = m.createArrayNode();

        ObjectNode p1 = m.createObjectNode();
        p1.set("serviceType", propString(m, "Optional filter; matches GET /api/services?serviceType="));
        a.add(decl(m, "list_services",
            "List active consulting services (GET /api/services).",
            p1));

        a.add(decl(m, "list_consultants",
            "List registered consultants (GET /api/consultants).",
            m.createObjectNode()));

        ObjectNode p2 = m.createObjectNode();
        p2.set("slotId", propNumber(m, "Availability slot id to book (POST /bookings body slotId)."));
        a.add(decl(m, "request_booking",
            "Request a booking for the authenticated client (POST /bookings with clientId and slotId).",
            p2));

        ObjectNode p3 = m.createObjectNode();
        p3.set("booking_id", propNumber(m, "Booking id (PUT /bookings/{id}/cancel)."));
        a.add(decl(m, "cancel_booking",
            "Cancel a booking for the authenticated user (PUT /bookings/{id}/cancel).",
            p3));

        a.add(decl(m, "list_client_bookings",
            "List the authenticated client's bookings (GET /bookings/client/{clientId}).",
            m.createObjectNode()));

        a.add(decl(m, "get_payment_methods",
            "List saved payment methods for the authenticated client (GET /api/payments/methods/{clientId}).",
            m.createObjectNode()));

        ObjectNode p4 = m.createObjectNode();
        p4.set("booking_id", propNumber(m, "Booking to pay (ProcessPaymentRequest.bookingId)."));
        p4.set("amount", propNumber(m, "Payment amount (ProcessPaymentRequest.amount)."));
        ObjectNode saved = propNumber(m, "Optional saved payment method id (ProcessPaymentRequest.savedPaymentMethodId); prefer this over raw card data.");
        p4.set("saved_payment_method_id", saved);
        ObjectNode pd = m.createObjectNode();
        pd.put("type", "object");
        pd.put("description", "Optional PaymentMethodDto; never send full card numbers—use saved_payment_method_id when possible.");
        pd.set("properties", m.createObjectNode());
        p4.set("payment_details", pd);
        a.add(decl(m, "process_payment",
            "Process payment for a booking (POST /api/payments/process). Prefer saved_payment_method_id.",
            p4));

        a.add(decl(m, "payment_history",
            "List payment history for the authenticated client (GET /api/payments/history/{clientId}).",
            m.createObjectNode()));

        ObjectNode p5 = m.createObjectNode();
        ObjectNode st = propString(m, "Optional booking status filter e.g. REQUESTED (GET /api/consultant/{id}/bookings?status=).");
        p5.set("status", st);
        a.add(decl(m, "list_consultant_bookings",
            "List bookings for the authenticated consultant (GET /api/consultant/{consultantId}/bookings).",
            p5));

        ObjectNode p6 = m.createObjectNode();
        p6.set("booking_id", propNumber(m, "Booking id to accept."));
        a.add(decl(m, "accept_booking",
            "Accept a booking (PUT /api/consultant/{consultantId}/bookings/{bookingId}/accept).",
            p6));

        ObjectNode p7 = m.createObjectNode();
        p7.set("booking_id", propNumber(m, "Booking id to reject."));
        p7.set("reason", propString(m, "Optional rejection reason (BookingDecisionRequest.reason)."));
        a.add(decl(m, "reject_booking",
            "Reject a booking (PUT /api/consultant/{consultantId}/bookings/{bookingId}/reject).",
            p7));

        ObjectNode p8 = m.createObjectNode();
        p8.set("booking_id", propNumber(m, "Booking id to complete."));
        a.add(decl(m, "complete_booking",
            "Mark a booking completed (PUT /api/consultant/{consultantId}/bookings/{bookingId}/complete).",
            p8));

        ObjectNode p9 = m.createObjectNode();
        p9.set("service_id", propNumber(m, "Consulting service id (CreateAvailabilitySlotRequest.serviceId)."));
        p9.set("start_at", propString(m, "Slot start ISO-8601 offset datetime (CreateAvailabilitySlotRequest.startAt)."));
        p9.set("end_at", propString(m, "Slot end ISO-8601 offset datetime (CreateAvailabilitySlotRequest.endAt)."));
        a.add(decl(m, "add_availability_slot",
            "Add an availability slot (POST /api/consultant/{consultantId}/availability).",
            p9));

        a.add(decl(m, "list_availability_slots",
            "List availability slots (GET /api/consultant/{consultantId}/availability).",
            m.createObjectNode()));

        ObjectNode p10 = m.createObjectNode();
        p10.set("slot_id", propNumber(m, "Slot id to delete."));
        a.add(decl(m, "delete_availability_slot",
            "Delete an availability slot (DELETE /api/consultant/{consultantId}/availability/{slotId}).",
            p10));

        ObjectNode p11 = m.createObjectNode();
        p11.set("consultant_id", propNumber(m, "Consultant user id to approve or reject."));
        p11.set("decision", propString(m, "APPROVE or REJECT (ConsultantApprovalDecision)."));
        p11.set("reason", propString(m, "Optional reason (ConsultantApprovalRequestDto.reason)."));
        a.add(decl(m, "approve_consultant",
            "Approve or reject a pending consultant registration (POST /api/admin/consultants/{consultantId}/approval).",
            p11));

        a.add(decl(m, "list_pending_consultants",
            "List pending consultant registrations (GET /api/admin/consultants/pending).",
            m.createObjectNode()));

        ObjectNode p12 = m.createObjectNode();
        p12.set("policy_key", propString(m, "Policy key path segment (PUT /api/admin/policies/{policyKey})."));
        p12.set("policy_value", propString(m, "New policy text (PolicyUpsertRequestDto.policyValue)."));
        a.add(decl(m, "update_policy",
            "Create or update a system policy (PUT /api/admin/policies/{policyKey}).",
            p12));

        a.add(decl(m, "system_status",
            "View platform status stub (GET /api/admin/system/status).",
            m.createObjectNode()));

        return a;
    }
}
