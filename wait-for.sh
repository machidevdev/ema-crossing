#!/bin/sh
# wait-for.sh

set -e

host="$1"
shift
cmd="$@"

until nc -z "$host" "${2:-5432}"; do
  echo "waiting for $host to be ready..."
  sleep 1
done

echo "$host is ready"
exec $cmd 