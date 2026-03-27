package com.consultingplatform.agent.service;

import com.consultingplatform.admin.web.dto.ConsultantApprovalDecision;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Invokes existing REST endpoints on this application (loopback). The caller must pass the
 * same Authorization header as the original client so Spring Security and {@code @PreAuthorize}
 * behave identically to a normal API call.
 */
@Service
public class AgentToolExecutor {

    private final RestClient internalRestApiRestClient;
    private final ObjectMapper objectMapper;

    public AgentToolExecutor(RestClient internalRestApiRestClient, ObjectMapper objectMapper) {
        this.internalRestApiRestClient = internalRestApiRestClient;
        this.objectMapper = objectMapper;
    }

    public JsonNode execute(String toolName, JsonNode args, String authorizationHeader, long authenticatedUserId) {
        JsonNode a = args == null || args.isNull() ? objectMapper.createObjectNode() : args;
        try {
            return switch (toolName) {
                case "list_services" -> listServices(a, authorizationHeader);
                case "list_consultants" -> getJson("/api/consultants", authorizationHeader);
                case "request_booking" -> postJson("/bookings", bookingRequestBody(a, authenticatedUserId), authorizationHeader);
                case "cancel_booking" -> putJson(
                    "/bookings/" + longArg(a, "booking_id", "bookingId") + "/cancel",
                    "{}",
                    authorizationHeader
                );
                case "list_client_bookings" -> getJson("/bookings/client/" + authenticatedUserId, authorizationHeader);
                case "get_payment_methods" -> getJson("/api/payments/methods/" + authenticatedUserId, authorizationHeader);
                case "process_payment" -> postJson("/api/payments/process", processPaymentBody(a, authenticatedUserId), authorizationHeader);
                case "payment_history" -> getJson("/api/payments/history/" + authenticatedUserId, authorizationHeader);
                case "list_consultant_bookings" -> {
                    UriComponentsBuilder b = UriComponentsBuilder.fromPath(
                        "/api/consultant/" + authenticatedUserId + "/bookings");
                    String st = optionalText(a, "status");
                    if (st != null) {
                        b.queryParam("status", st);
                    }
                    yield getJson(b.toUriString(), authorizationHeader);
                }
                case "accept_booking" -> putJson(
                    "/api/consultant/" + authenticatedUserId + "/bookings/" + longArg(a, "booking_id", "bookingId") + "/accept",
                    "{}",
                    authorizationHeader
                );
                case "reject_booking" -> putJson(
                    "/api/consultant/" + authenticatedUserId + "/bookings/" + longArg(a, "booking_id", "bookingId") + "/reject",
                    rejectBody(a),
                    authorizationHeader
                );
                case "complete_booking" -> putJson(
                    "/api/consultant/" + authenticatedUserId + "/bookings/" + longArg(a, "booking_id", "bookingId") + "/complete",
                    "{}",
                    authorizationHeader
                );
                case "add_availability_slot" -> postJson(
                    "/api/consultant/" + authenticatedUserId + "/availability",
                    availabilityBody(a),
                    authorizationHeader
                );
                case "list_availability_slots" -> getJson("/api/consultant/" + authenticatedUserId + "/availability", authorizationHeader);
                case "delete_availability_slot" -> delete(
                    "/api/consultant/" + authenticatedUserId + "/availability/" + longArg(a, "slot_id", "slotId"),
                    authorizationHeader
                );
                case "approve_consultant" -> postJson(
                    "/api/admin/consultants/" + longArg(a, "consultant_id", "consultantId") + "/approval",
                    approvalBody(a, authenticatedUserId),
                    authorizationHeader
                );
                case "list_pending_consultants" -> getJson("/api/admin/consultants/pending", authorizationHeader);
                case "update_policy" -> putJson(
                    "/api/admin/policies/" + textArg(a, "policy_key", "policyKey"),
                    policyBody(a, authenticatedUserId),
                    authorizationHeader
                );
                case "system_status" -> getJson("/api/admin/system/status", authorizationHeader);
                default -> errorJson("Unknown tool: " + toolName);
            };
        } catch (IllegalArgumentException ex) {
            return errorJson(ex.getMessage());
        } catch (Exception ex) {
            return errorJson("Tool execution failed: " + ex.getMessage());
        }
    }

    private JsonNode listServices(JsonNode args, String auth) throws Exception {
        UriComponentsBuilder b = UriComponentsBuilder.fromPath("/api/services");
        String st = optionalText(args, "serviceType");
        if (st == null) {
            st = optionalText(args, "service_type");
        }
        if (st != null && !st.isBlank()) {
            b.queryParam("serviceType", st);
        }
        return getJson(b.build().toUriString(), auth);
    }

    private String bookingRequestBody(JsonNode args, long clientId) throws Exception {
        ObjectNode o = objectMapper.createObjectNode();
        o.put("clientId", clientId);
        o.put("slotId", longArg(args, "slotId", "slot_id"));
        return objectMapper.writeValueAsString(o);
    }

    private String processPaymentBody(JsonNode args, long clientId) throws Exception {
        ObjectNode o = objectMapper.createObjectNode();
        o.put("bookingId", longArg(args, "booking_id", "bookingId"));
        o.put("clientId", clientId);
        JsonNode amountNode = args.get("amount");
        if (amountNode == null || amountNode.isNull()) {
            throw new IllegalArgumentException("amount is required for process_payment");
        }
        BigDecimal amt = new BigDecimal(amountNode.asText());
        o.put("amount", amt);
        if (args.has("saved_payment_method_id") && !args.get("saved_payment_method_id").isNull()) {
            o.put("savedPaymentMethodId", longArg(args, "saved_payment_method_id", "savedPaymentMethodId"));
        } else if (args.has("savedPaymentMethodId") && !args.get("savedPaymentMethodId").isNull()) {
            o.put("savedPaymentMethodId", longArg(args, "saved_payment_method_id", "savedPaymentMethodId"));
        }
        JsonNode pd = args.get("payment_details");
        if (pd == null) {
            pd = args.get("paymentDetails");
        }
        if (pd != null && !pd.isNull()) {
            o.set("paymentDetails", pd);
        }
        return objectMapper.writeValueAsString(o);
    }

    private String availabilityBody(JsonNode args) throws Exception {
        ObjectNode o = objectMapper.createObjectNode();
        o.put("serviceId", longArg(args, "service_id", "serviceId"));
        String start = textArg(args, "start_at", "startAt");
        String end = textArg(args, "end_at", "endAt");
        o.put("startAt", start);
        o.put("endAt", end);
        return objectMapper.writeValueAsString(o);
    }

    private String rejectBody(JsonNode args) throws Exception {
        String reason = optionalText(args, "reason");
        if (reason == null || reason.isBlank()) {
            return "{}";
        }
        ObjectNode o = objectMapper.createObjectNode();
        o.put("reason", reason);
        return objectMapper.writeValueAsString(o);
    }

    private String approvalBody(JsonNode args, long adminUserId) throws Exception {
        ObjectNode o = objectMapper.createObjectNode();
        o.put("adminId", String.valueOf(adminUserId));
        if (!args.has("decision") || args.get("decision").isNull()) {
            throw new IllegalArgumentException("decision is required (APPROVE or REJECT)");
        }
        String d = args.get("decision").asText();
        o.put("decision", ConsultantApprovalDecision.valueOf(d.trim().toUpperCase()).name());
        String reason = optionalText(args, "reason");
        if (reason != null) {
            o.put("reason", reason);
        }
        return objectMapper.writeValueAsString(o);
    }

    private String policyBody(JsonNode args, long adminUserId) throws Exception {
        ObjectNode o = objectMapper.createObjectNode();
        o.put("adminId", String.valueOf(adminUserId));
        o.put("policyValue", textArg(args, "policy_value", "policyValue"));
        return objectMapper.writeValueAsString(o);
    }

    private JsonNode getJson(String uri, String authorizationHeader) throws Exception {
        try {
            String body = internalRestApiRestClient.get()
                .uri(uri)
                .headers(h -> {
                    if (authorizationHeader != null && !authorizationHeader.isBlank()) {
                        h.set("Authorization", authorizationHeader);
                    }
                })
                .retrieve()
                .body(String.class);
            return body == null || body.isBlank() ? objectMapper.createObjectNode() : objectMapper.readTree(body);
        } catch (RestClientResponseException e) {
            return httpError(e);
        }
    }

    private JsonNode postJson(String uri, String jsonBody, String authorizationHeader) throws Exception {
        try {
            String body = internalRestApiRestClient.post()
                .uri(uri)
                .headers(h -> {
                    if (authorizationHeader != null && !authorizationHeader.isBlank()) {
                        h.set("Authorization", authorizationHeader);
                    }
                    h.setContentType(MediaType.APPLICATION_JSON);
                })
                .body(jsonBody)
                .retrieve()
                .body(String.class);
            return body == null || body.isBlank() ? objectMapper.createObjectNode() : objectMapper.readTree(body);
        } catch (RestClientResponseException e) {
            return httpError(e);
        }
    }

    private JsonNode putJson(String uri, String jsonBody, String authorizationHeader) throws Exception {
        try {
            String body = internalRestApiRestClient.put()
                .uri(uri)
                .headers(h -> {
                    if (authorizationHeader != null && !authorizationHeader.isBlank()) {
                        h.set("Authorization", authorizationHeader);
                    }
                    h.setContentType(MediaType.APPLICATION_JSON);
                })
                .body(jsonBody)
                .retrieve()
                .body(String.class);
            return body == null || body.isBlank() ? objectMapper.createObjectNode() : objectMapper.readTree(body);
        } catch (RestClientResponseException e) {
            return httpError(e);
        }
    }

    private JsonNode delete(String uri, String authorizationHeader) throws Exception {
        try {
            internalRestApiRestClient.delete()
                .uri(uri)
                .headers(h -> {
                    if (authorizationHeader != null && !authorizationHeader.isBlank()) {
                        h.set("Authorization", authorizationHeader);
                    }
                })
                .retrieve()
                .toBodilessEntity();
            ObjectNode ok = objectMapper.createObjectNode();
            ok.put("deleted", true);
            return ok;
        } catch (RestClientResponseException e) {
            return httpError(e);
        }
    }

    private JsonNode httpError(RestClientResponseException e) throws Exception {
        ObjectNode err = objectMapper.createObjectNode();
        err.put("httpStatus", e.getStatusCode().value());
        String b = e.getResponseBodyAsString();
        if (b != null && !b.isBlank()) {
            try {
                err.set("body", objectMapper.readTree(b));
            } catch (Exception ignored) {
                err.put("body", b);
            }
        }
        return err;
    }

    private JsonNode errorJson(String message) {
        ObjectNode err = objectMapper.createObjectNode();
        err.put("error", message);
        return err;
    }

    private long longArg(JsonNode args, String snake, String camel) {
        if (args.has(snake) && !args.get(snake).isNull()) {
            return args.get(snake).asLong();
        }
        if (args.has(camel) && !args.get(camel).isNull()) {
            return args.get(camel).asLong();
        }
        throw new IllegalArgumentException("Missing required parameter: " + snake + " / " + camel);
    }

    private String textArg(JsonNode args, String snake, String camel) {
        if (args.has(snake) && !args.get(snake).isNull()) {
            return args.get(snake).asText();
        }
        if (args.has(camel) && !args.get(camel).isNull()) {
            return args.get(camel).asText();
        }
        throw new IllegalArgumentException("Missing required parameter: " + snake + " / " + camel);
    }

    private String optionalText(JsonNode args, String name) {
        if (!args.has(name) || args.get(name).isNull()) {
            return null;
        }
        String t = args.get(name).asText();
        return t == null || t.isBlank() ? null : t;
    }
}
