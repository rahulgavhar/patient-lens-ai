package com.pm.paymentservice.service;

import payment.PaymentRequest;
import payment.PaymentResponse;
import payment.RefundRequest;
import payment.RefundResponse;

public interface PaymentService {
    PaymentResponse processPayment(PaymentRequest request);
    RefundResponse refundPayment(RefundRequest request);
}
