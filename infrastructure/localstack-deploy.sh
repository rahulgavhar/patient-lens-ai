#!/bin/bash

set -e

echo "Deleting stack..."

aws --endpoint-url=http://localhost:4566 cloudformation delete-stack \
--stack-name patient-management || true

aws --endpoint-url=http://localhost:4566 cloudformation wait stack-delete-complete \
--stack-name patient-management || true

echo "Deploying stack..."

aws --endpoint-url=http://localhost:4566 cloudformation deploy \
--template-file "./cdk.out/localstack.template.json" \
--stack-name patient-management \
--capabilities CAPABILITY_NAMED_IAM \
--region us-east-1

echo "Getting LoadBalancer DNS..."

aws --endpoint-url=http://localhost:4566 elbv2 describe-load-balancers \
--query "LoadBalancers[0].DNSName" \
--output text