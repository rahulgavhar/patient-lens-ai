
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.equalTo;

public class DoctorIntegrationTest {

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
    public void shouldPerformDoctorCRUD() {
        String token = getAuthToken();

        // 1. Create a Doctor
        String licenseNumber = "LIC-" + System.currentTimeMillis();
        String doctorPayload = """
            {
                "name": "Dr. Gregory House",
                "email": "house.%s@princetonplainsboro.com",
                "specialization": "Diagnostic Medicine",
                "licenseNumber": "%s",
                "phoneNumber": "+15550199",
                "yearsOfExperience": 20,
                "hospitalName": "Princeton-Plainsboro",
                "joinedDate": "2004-09-16"
            }
            """.formatted(System.currentTimeMillis(), licenseNumber);

        String doctorId = given()
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(doctorPayload)
                .when()
                .post("/api/doctors")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Dr. Gregory House"))
                .body("email", notNullValue())
                .body("specialization", equalTo("Diagnostic Medicine"))
                .body("licenseNumber", equalTo(licenseNumber))
                .extract()
                .jsonPath()
                .getString("id");

        // 2. Get Doctor By ID
        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/doctors/" + doctorId)
                .then()
                .statusCode(200)
                .body("id", equalTo(doctorId))
                .body("name", equalTo("Dr. Gregory House"));

        // 3. List Doctors
        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/doctors")
                .then()
                .statusCode(200)
                .body("$", notNullValue());

        // 4. Update Doctor
        String updatedPayload = """
            {
                "name": "Dr. Gregory House",
                "email": "house.%s@princetonplainsboro.com",
                "specialization": "Nephrology & Diagnostics",
                "licenseNumber": "%s",
                "phoneNumber": "+15550199",
                "yearsOfExperience": 21,
                "hospitalName": "Princeton-Plainsboro Teaching Hospital",
                "joinedDate": "2004-09-16"
            }
            """.formatted(System.currentTimeMillis(), licenseNumber);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(updatedPayload)
                .when()
                .put("/api/doctors/" + doctorId)
                .then()
                .statusCode(200)
                .body("specialization", equalTo("Nephrology & Diagnostics"))
                .body("yearsOfExperience", equalTo(21));

        // 5. Delete Doctor
        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .delete("/api/doctors/" + doctorId)
                .then()
                .statusCode(204); // HTTP 204 No Content

        // 6. Verify Delete (should return 404)
        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/doctors/" + doctorId)
                .then()
                .statusCode(404);
    }

    @Test
    public void shouldReturnBadRequestForDuplicateEmailOrLicense() {
        String token = getAuthToken();

        String license1 = "LIC-" + System.currentTimeMillis() + "-1";
        String email = "duplicate_" + System.currentTimeMillis() + "@test.com";

        String doctorPayload1 = """
            {
                "name": "Dr. John Smith",
                "email": "%s",
                "specialization": "Cardiology",
                "licenseNumber": "%s",
                "phoneNumber": "+15550199",
                "yearsOfExperience": 10,
                "hospitalName": "General Hospital"
            }
            """.formatted(email, license1);

        // Create first doctor
        given()
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(doctorPayload1)
                .when()
                .post("/api/doctors")
                .then()
                .statusCode(201);

        // Try creating with duplicate email
        String license2 = "LIC-" + System.currentTimeMillis() + "-2";
        String doctorPayloadDuplicateEmail = """
            {
                "name": "Dr. Sarah Smith",
                "email": "%s",
                "specialization": "Pediatrics",
                "licenseNumber": "%s",
                "phoneNumber": "+15550188",
                "yearsOfExperience": 5,
                "hospitalName": "General Hospital"
            }
            """.formatted(email, license2);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(doctorPayloadDuplicateEmail)
                .when()
                .post("/api/doctors")
                .then()
                .statusCode(400)
                .body("error", notNullValue());

        // Try creating with duplicate license
        String uniqueEmail = "unique_" + System.currentTimeMillis() + "@test.com";
        String doctorPayloadDuplicateLicense = """
            {
                "name": "Dr. Sarah Smith",
                "email": "%s",
                "specialization": "Pediatrics",
                "licenseNumber": "%s",
                "phoneNumber": "+15550188",
                "yearsOfExperience": 5,
                "hospitalName": "General Hospital"
            }
            """.formatted(uniqueEmail, license1);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .body(doctorPayloadDuplicateLicense)
                .when()
                .post("/api/doctors")
                .then()
                .statusCode(400)
                .body("error", notNullValue());
    }
}
