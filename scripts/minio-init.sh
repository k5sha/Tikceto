#!/bin/sh

sleep 5
mc alias set local http://minio:9000 admin adminpassword

mc policy set public local/tikceto

echo "✅ MinIO bucket 'tikceto' is now public!"
