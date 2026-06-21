import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

public class AppointmentIntegrationTest {

    @BeforeAll
    public static void setup() {
        RestAssured.baseURI = "http://localhost:4004";
    }

    private String getAuthToken() {
        String loginPayload = """
            {
                "email": "testuser@test.com",
                "password": "password123"
            }
            """;

        return given()
                .contentType("application/json")
                .body(loginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getString("token");
    }

    @Test
    public void shouldBookAndConfirmAppointmentOnHappyPath() throws Exception {
        String token = getAuthToken();

        String patientId = UUID.randomUUID().toString();
        String doctorId = UUID.randomUUID().toString();
        String slotDatetime = "2026-06-25T10:00:00";
        double amount = 150.0;

        String appointmentPayload = String.format("""
            {
                "patientId": "%s",
                "doctorId": "%s",
                "slotDatetime": "%s",
                "amount": %s
            }
            """, patientId, doctorId, slotDatetime, amount);

        // Step 1: Create appointment via REST API Gateway
        String appointmentId = given()
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(appointmentPayload)
                .when()
                .post("/api/appointments")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("status", equalTo("CONFIRMED"))
                .body("patientId", equalTo(patientId))
                .body("doctorId", equalTo(doctorId))
                .body("amount", equalTo(150.0f))
                .extract()
                .jsonPath()
                .getString("id");

        // Step 2: Wait for Kafka event propagation to Billing Service
        Thread.sleep(2500);

        // Step 3: Verify that an invoice was generated in Billing Service directly (port 4001)
        given()
                .when()
                .get("http://localhost:4001/invoices/patient/" + patientId)
                .then()
                .statusCode(200)
                .body("size()", greaterThan(0))
                .body("[0].appointmentId", equalTo(appointmentId))
                .body("[0].patientId", equalTo(patientId))
                .body("[0].amount", equalTo(150.0f))
                .body("[0].status", equalTo("PAID"));
    }

    @Test
    public void shouldCancelAppointmentOnPaymentFailure() throws Exception {
        String token = getAuthToken();

        String patientId = UUID.randomUUID().toString();
        String doctorId = UUID.randomUUID().toString();
        String slotDatetime = "2026-06-25T11:00:00";
        double amount = 999.0; // special failure amount

        String appointmentPayload = String.format("""
            {
                "patientId": "%s",
                "doctorId": "%s",
                "slotDatetime": "%s",
                "amount": %s
            }
            """, patientId, doctorId, slotDatetime, amount);

        // Step 1: Create appointment, expecting 400 Bad Request
        given()
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(appointmentPayload)
                .when()
                .post("/api/appointments")
                .then()
                .statusCode(400);

        // Step 2: Fetch appointments for the patient and verify status is CANCELLED
        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/appointments/patient/" + patientId)
                .then()
                .statusCode(200)
                .body("size()", equalTo(1))
                .body("[0].status", equalTo("CANCELLED"))
                .body("[0].amount", equalTo(999.0f));
    }
}
