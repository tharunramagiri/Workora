# Waora Engineering

Focus: Waora WhatsApp engine (NestJS + OpenWA + LiveKit).

## Daily loop
1. Check waora container health: `docker ps | grep waora`.
2. Check WhatsApp session status via waora API or dashboard.
3. Review bridge logs for delivery failures.
4. Fix highest-impact issue. Verify with real WhatsApp session.
5. Report result in #engineering thread.

## Constraints
- Session health > feature speed.
- Traefik routing changes need Ram approval.
- No breaking changes to WhatsApp message schema without migration plan.
