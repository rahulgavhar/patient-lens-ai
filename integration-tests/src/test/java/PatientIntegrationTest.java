import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;

public class PatientIntegrationTest {
    @BeforeAll
    public static void setup() {
        RestAssured.baseURI = "http://localhost:4004";
    }

    @Test
    public void shouldReturnPatientsWithValidToken() {
        String loginPayload = """
            {
                "email": "testuser@test.com",
                "password": "password123"
            }
            """;

        // Step 1: Login and extract token
        String token = given()
                .contentType("application/json")
                .body(loginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200) // make sure login succeeds
                .contentType("application/json")
                .body("token", notNullValue())
                .extract()
                .jsonPath()
                .getString("token");

        // Step 2: Use token to fetch patients
        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/patients")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("$", notNullValue());
    }

    @Test
    public void shouldCreatePatientAndBillingAccountWithValidToken() {
        String loginPayload = """
            {
                "email": "testuser@test.com",
                "password": "password123"
            }
            """;

        // Step 1: Login and extract token
        String token = given()
                .contentType("application/json")
                .body(loginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("token", notNullValue())
                .extract()
                .jsonPath()
                .getString("token");

        // Step 2: Create a patient
        String uniqueEmail = "patient_" + System.currentTimeMillis() + "@example.com";
        String patientPayload = """
            {
                "name": "Jane Doe",
                "email": "%s",
                "address": "123 Main St, Springfield",
                "dateOfBirth": "1990-01-01",
                "height": 170.0,
                "weight": 65.0,
                "bloodGroup": "A+",
                "phoneNumber": "+1234567890",
                "emergencyContact": "John Doe",
                "insuranceProvider": "HealthCare Inc"
            }
            """.formatted(uniqueEmail);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(patientPayload)
                .when()
                .post("/api/patients")
                .then()
                .statusCode(201)
                .contentType("application/json")
                .body("id", notNullValue())
                .body("billingAccountId", notNullValue());
    }
}
