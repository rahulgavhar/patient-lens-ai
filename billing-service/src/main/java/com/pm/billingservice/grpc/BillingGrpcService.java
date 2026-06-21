package com.pm.billingservice.grpc;

import billing.*;
import billing.BillingServiceGrpc.BillingServiceImplBase;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@GrpcService
public class BillingGrpcService extends BillingServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(BillingGrpcService.class);

    // patientId -> BillingResponse
    private final Map<String, BillingResponse> billingStore = new ConcurrentHashMap<>();

    // billingAccountId -> linked payments
    private final Map<String, List<LinkedPayment>> paymentLinks = new ConcurrentHashMap<>();


    @Override
    public void createBillingAccount(BillingRequest request,
                                     StreamObserver<BillingResponse> responseObserver) {

        try {

            log.info("Creating billing account for patient {}", request.getPatientId());

            String accountId = UUID.randomUUID().toString();
            String timestamp = Instant.now().toString();

            BillingResponse response = BillingResponse.newBuilder()
                    .setAccountId(accountId)
                    .setStatus("SUCCESS")
                    .setPatientId(request.getPatientId())
                    .setCreatedAt(timestamp)
                    .setUpdatedAt(timestamp)
                    .setActive(true)
                    .build();

            billingStore.put(request.getPatientId(), response);
            paymentLinks.put(accountId, new ArrayList<>());

            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {

            log.error("Billing account creation failed", e);

            BillingResponse error = BillingResponse.newBuilder()
                    .setStatus("FAILURE")
                    .setPatientId(request.getPatientId())
                    .setActive(false)
                    .build();

            responseObserver.onNext(error);
            responseObserver.onCompleted();
        }
    }


    @Override
    public void getBillingAccount(GetBillingRequest request,
                                  StreamObserver<BillingResponse> responseObserver) {

        BillingResponse billing = billingStore.get(request.getPatientId());

        if (billing == null) {

            BillingResponse notFound = BillingResponse.newBuilder()
                    .setStatus("NOT_FOUND")
                    .setPatientId(request.getPatientId())
                    .setActive(false)
                    .build();

            responseObserver.onNext(notFound);
        } else {
            responseObserver.onNext(billing);
        }

        responseObserver.onCompleted();
    }


    @Override
    public void updateBillingAccount(UpdateBillingRequest request,
                                     StreamObserver<BillingResponse> responseObserver) {

        BillingResponse existing = billingStore.get(request.getPatientId());

        if (existing == null || !existing.getActive()) {

            BillingResponse notFound = BillingResponse.newBuilder()
                    .setStatus("NOT_FOUND")
                    .setPatientId(request.getPatientId())
                    .setActive(false)
                    .build();

            responseObserver.onNext(notFound);
            responseObserver.onCompleted();
            return;
        }

        BillingResponse updated = existing.toBuilder()
                .setUpdatedAt(Instant.now().toString())
                .setStatus("UPDATED")
                .build();

        billingStore.put(request.getPatientId(), updated);

        responseObserver.onNext(updated);
        responseObserver.onCompleted();
    }


    @Override
    public void deleteBillingAccount(DeleteBillingRequest request,
                                     StreamObserver<BillingResponse> responseObserver) {

        BillingResponse existing = billingStore.get(request.getPatientId());

        if (existing == null) {

            BillingResponse notFound = BillingResponse.newBuilder()
                    .setStatus("NOT_FOUND")
                    .setPatientId(request.getPatientId())
                    .setActive(false)
                    .build();

            responseObserver.onNext(notFound);
            responseObserver.onCompleted();
            return;
        }

        BillingResponse deleted = existing.toBuilder()
                .setActive(false)
                .setStatus("DELETED")
                .setUpdatedAt(Instant.now().toString())
                .build();

        billingStore.put(request.getPatientId(), deleted);

        responseObserver.onNext(deleted);
        responseObserver.onCompleted();
    }


    @Override
    public void linkPaymentAccount(LinkPaymentRequest request,
                                   StreamObserver<BillingResponse> responseObserver) {

        List<LinkedPayment> payments = paymentLinks.get(request.getBillingAccountId());

        if (payments == null) {

            BillingResponse error = BillingResponse.newBuilder()
                    .setStatus("NOT_FOUND")
                    .setActive(false)
                    .build();

            responseObserver.onNext(error);
            responseObserver.onCompleted();
            return;
        }

        LinkedPayment payment = LinkedPayment.newBuilder()
                .setPaymentAccountId(request.getPaymentAccountId())
                .setPaymentProvider(request.getPaymentProvider())
                .setLinkedAt(Instant.now().toString())
                .build();

        payments.add(payment);

        BillingResponse response = BillingResponse.newBuilder()
                .setAccountId(request.getBillingAccountId())
                .setStatus("PAYMENT_LINKED")
                .setActive(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }


    @Override
    public void unlinkPaymentAccount(UnlinkPaymentRequest request,
                                     StreamObserver<BillingResponse> responseObserver) {

        List<LinkedPayment> payments = paymentLinks.get(request.getBillingAccountId());

        if (payments != null) {

            payments.removeIf(p ->
                    p.getPaymentAccountId().equals(request.getPaymentAccountId()));
        }

        BillingResponse response = BillingResponse.newBuilder()
                .setAccountId(request.getBillingAccountId())
                .setStatus("PAYMENT_UNLINKED")
                .setActive(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }


    @Override
    public void listLinkedPayments(ListPaymentRequest request,
                                   StreamObserver<ListPaymentResponse> responseObserver) {

        List<LinkedPayment> payments =
                paymentLinks.getOrDefault(request.getBillingAccountId(), new ArrayList<>());

        ListPaymentResponse response = ListPaymentResponse.newBuilder()
                .addAllLinkedPayments(payments)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}