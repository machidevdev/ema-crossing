#!/bin/sh
# wait-for.sh

set -e

host="$1"
port="${2:-5432}"
shift 2
cmd="$@"

until nc -z "$host" "$port"; do
  echo "waiting for $host:$port to be ready..."
  sleep 1
done

echo "$host:$port is ready"
echo "executing command: $cmd"
exec $cmd 