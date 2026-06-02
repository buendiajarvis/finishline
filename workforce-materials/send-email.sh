#!/bin/bash
# Send email via Resend API — two sender identities:
#   finishline   → phil@finishlinemsp.com
#   aiworx4me    → outreach@aiworx4me.com
# Usage: ./send-email.sh [-s identity] recipient subject body_text
#        ./send-email.sh -s aiworx4me to@example.com "Subject" "Body"

set -euo pipefail

usage() {
  echo "Usage: $0 [-s SENDER] <to> <subject> <body>"
  echo "  SENDER: finishline (default) | aiworx4me"
  exit 1
}

SENDER="finishline"
while [[ $# -ge 1 && "$1" == -* ]]; do
  case "$1" in
    -s|--sender) SENDER="${2:?missing sender value}"; shift 2 ;;
    -h|--help)   usage ;;
    *)           echo "Unknown option: $1"; usage ;;
  esac
done

TO="${1:?missing to address}"
SUBJECT="${2:?missing subject}"
BODY="${3:?missing body}"

declare -A KEYS=(
  [finishline]="re_ioeSWU8m_5vmq5PFApQagRggpG8GCHFqH"
  [aiworx4me]="re_4GwJygvc_C6cbMjhQZX7o2azRahjgB61h"
)
declare -A FROM=(
  [finishline]="Phil <phil@finishlinemsp.com>"
  [aiworx4me]="AIWorx4me Outreach <outreach@aiworx4me.com>"
)

KEY="${KEYS[$SENDER]:?unknown sender: $SENDER}"
FROM_ADDR="${FROM[$SENDER]:?no from configured for: $SENDER}"

RESPONSE=$(curl -s -X POST "https://api.resend.com/email" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg from "$FROM_ADDR" \
    --arg to "$TO" \
    --arg subject "$SUBJECT" \
    --arg body "$BODY" \
    '{from: $from, to: [$to], subject: $subject, text: $body}')")

echo "$RESPONSE"
if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
  echo "✓ Sent [$SENDER] → $TO"
else
  echo "✗ Failed [$SENDER] → $TO: $RESPONSE" >&2
  exit 1
fi
