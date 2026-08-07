#!/usr/bin/env bash
# Create 3 Sentry issue alert rules for domain tags (payment / nfe / webhook).
# Requires: SENTRY_AUTH_TOKEN, SENTRY_ORG (default: navoxi), SENTRY_PROJECT (default: node-nestjs)
set -euo pipefail

ORG="${SENTRY_ORG:-navoxi}"
PROJECT="${SENTRY_PROJECT:-node-nestjs}"
TOKEN="${SENTRY_AUTH_TOKEN:?Set SENTRY_AUTH_TOKEN (Sentry User Auth Token with project:write)}"

API="https://sentry.io/api/0/projects/${ORG}/${PROJECT}/rules/"

create_rule() {
  local name="$1"
  local domain="$2"
  local payload
  payload=$(cat <<EOF
{
  "name": "${name}",
  "environment": "production",
  "actionMatch": "any",
  "filterMatch": "all",
  "frequency": 30,
  "conditions": [
    {
      "id": "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition"
    }
  ],
  "filters": [
    {
      "id": "sentry.rules.filters.tagged_event.TaggedEventFilter",
      "key": "domain",
      "match": "eq",
      "value": "${domain}"
    }
  ],
  "actions": [
    {
      "id": "sentry.mail.actions.NotifyEmailAction",
      "targetType": "IssueOwners",
      "fallthroughType": "ActiveMembers"
    }
  ]
}
EOF
)

  echo "Creating rule: ${name} (domain=${domain})"
  curl -sS -X POST "$API" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload" | head -c 500
  echo
}

create_rule "Salomar — payment failures" "payment"
create_rule "Salomar — NF-e failures" "nfe"
create_rule "Salomar — webhook failures" "webhook"

echo "Done. Verify in Sentry → Alerts for ${ORG}/${PROJECT}."
