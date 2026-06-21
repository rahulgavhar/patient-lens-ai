package com.pm.patientservice.grpc;

import billing.*;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.util.concurrent.TimeUnit;

@Service
public class BillingServiceGrpcClient {

    private static final Logger log = LoggerFactory.getLogger(BillingServiceGrpcClient.class);

    private final ManagedChannel channel;
    private final BillingServiceGrpc.BillingServiceBlockingStub blockingStub;

    public BillingServiceGrpcClient(
            @Value("${billing.service.address:localhost}") String serverAddress,
            @Value("${billing.service.grpc.port:9001}") int serverPort) {

        log.info("Initializing BillingServiceGrpcClient {}:{}", serverAddress, serverPort);

        this.channel = ManagedChannelBuilder
                .forAddress(serverAddress, serverPort)
                .usePlaintext() // switch to TLS in production
                .build();

        this.blockingStub = BillingServiceGrpc
                .newBlockingStub(channel);
    }

    // --------------------------------
    // CREATE BILLING ACCOUNT
    // --------------------------------
    public BillingResponse createBillingAccount(String patientId, String name, String email) {

        BillingRequest request = BillingRequest.newBuilder()
                .setPatientId(patientId)
                .setName(name)
                .setEmail(email)
                .build();

        try {
            return blockingStub
                    .withDeadlineAfter(3, TimeUnit.SECONDS)
                    .createBillingAccount(request);

        } catch (StatusRuntimeException e) {
            log.error("createBillingAccount failed for patientId {}", patientId, e);
            throw e;
        }
    }

    // --------------------------------
    // GET BILLING ACCOUNT
    // --------------------------------
    public BillingResponse getBillingAccount(String patientId) {

        GetBillingRequest request = GetBillingRequest.newBuilder()
                .setPatientId(patientId)
                .build();

        try {
            return blockingStub
                    .withDeadlineAfter(3, TimeUnit.SECONDS)
                    .getBillingAccount(request);

        } catch (StatusRuntimeException e) {
            log.error("getBillingAccount failed for patientId {}", patientId, e);
            throw e;
        }
    }

    // --------------------------------
    // UPDATE BILLING ACCOUNT
    // --------------------------------
    public BillingResponse updateBillingAccount(String patientId, String name, String email) {

        UpdateBillingRequest request = UpdateBillingRequest.newBuilder()
                .setPatientId(patientId)
                .setName(name)
                .setEmail(email)
                .build();

        try {
            return blockingStub
                    .withDeadlineAfter(3, TimeUnit.SECONDS)
                    .updateBillingAccount(request);

        } catch (StatusRuntimeException e) {
            log.error("updateBillingAccount failed for patientId {}", patientId, e);
            throw e;
        }
    }

    // --------------------------------
    // DELETE BILLING ACCOUNT
    // --------------------------------
    public BillingResponse deleteBillingAccount(String patientId) {

        DeleteBillingRequest request = DeleteBillingRequest.newBuilder()
                .setPatientId(patientId)
                .build();

        try {
            return blockingStub
                    .withDeadlineAfter(3, TimeUnit.SECONDS)
                    .deleteBillingAccount(request);

        } catch (StatusRuntimeException e) {
            log.error("deleteBillingAccount failed for patientId {}", patientId, e);
            throw e;
        }
    }

    // --------------------------------
    // LINK PAYMENT ACCOUNT
    // --------------------------------
    public BillingResponse linkPaymentAccount(String billingAccountId,
                                              String paymentAccountId,
                                              String provider) {

        LinkPaymentRequest request = LinkPaymentRequest.newBuilder()
                .setBillingAccountId(billingAccountId)
                .setPaymentAccountId(paymentAccountId)
                .setPaymentProvider(provider)
                .build();

        try {
            return blockingStub
                    .withDeadlineAfter(3, TimeUnit.SECONDS)
                    .linkPaymentAccount(request);

        } catch (StatusRuntimeException e) {
            log.error("linkPaymentAccount failed for account {}", billingAccountId, e);
            throw e;
        }
    }

    // --------------------------------
    // UNLINK PAYMENT ACCOUNT
    // --------------------------------
    public BillingResponse unlinkPaymentAccount(String billingAccountId,
                                                String paymentAccountId) {

        UnlinkPaymentRequest request = UnlinkPaymentRequest.newBuilder()
                .setBillingAccountId(billingAccountId)
                .setPaymentAccountId(paymentAccountId)
                .build();

        try {
            return blockingStub
                    .withDeadlineAfter(3, TimeUnit.SECONDS)
                    .unlinkPaymentAccount(request);

        } catch (StatusRuntimeException e) {
            log.error("unlinkPaymentAccount failed for account {}", billingAccountId, e);
            throw e;
        }
    }

    // --------------------------------
    // LIST LINKED PAYMENTS
    // --------------------------------
    public ListPaymentResponse listLinkedPayments(String billingAccountId) {

        ListPaymentRequest request = ListPaymentRequest.newBuilder()
                .setBillingAccountId(billingAccountId)
                .build();

        try {
            return blockingStub
                    .withDeadlineAfter(3, TimeUnit.SECONDS)
                    .listLinkedPayments(request);

        } catch (StatusRuntimeException e) {
            log.error("listLinkedPayments failed for account {}", billingAccountId, e);
            throw e;
        }
    }

    // --------------------------------
    // SHUTDOWN
    // --------------------------------
    @PreDestroy
    public void shutdown() {

        log.info("Shutting down Billing gRPC channel");

        if (!channel.isShutdown()) {
            channel.shutdown();
        }
    }
}