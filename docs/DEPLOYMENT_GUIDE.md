# Deployment Guide — Phase 10A

This guide prepares the controlled Rule Zero hackathon demo for hosting. Phase 10A does not authorize a deployment.

## Required order

1. Import `Enosh2212/rule-zero` into Render, create the service with automatic deployment disabled, and note the assigned Render hostname.
2. Generate three independent signing keys locally. Add all backend variables in Render; do not paste keys into source, chat, screenshots, or logs.
3. Import the same repository into Vercel. Set `NEXT_PUBLIC_API_URL` to the HTTPS Render origin and note the assigned Vercel production origin.
4. Set `CORS_ORIGINS` in Render to that exact Vercel origin, without a trailing slash. Add separately approved preview/custom origins as comma-separated exact origins only.
5. Manually deploy Render. Confirm `/health` and the positive/negative CORS checks.
6. Deploy Vercel. Run the automated validation script and the manual checklist.

This ordering avoids publishing a frontend that points at an unavailable API and ensures the backend knows the actual frontend origin before it serves the demo.

## Render dashboard fields

| Field | Exact value |
|---|---|
| Service type | Web Service |
| Repository | `Enosh2212/rule-zero` |
| Root directory | `backend` |
| Runtime | Python 3 |
| Python version | `3.13` from `backend/.python-version` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health-check path | `/health` |
| Auto-deploy | Off during controlled release |

The root `render.yaml` describes the same service and contains variable names only, never secret values.

### Render environment variables

| Variable | Value |
|---|---|
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | Exact HTTPS Vercel production origin; comma-separated exact origins if additional origins are approved |
| `APPROVAL_SIGNING_KEY` | Independent strong random value |
| `RECOVERY_SIGNING_KEY` | Different independent strong random value |
| `AUDIT_SIGNING_KEY` | Different independent strong random value |

Generate each signing key separately:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Production startup fails when any key is absent, shorter than 32 characters, or resembles a documented placeholder. It also rejects missing, localhost, and wildcard CORS configuration.

## Vercel dashboard fields

| Field | Exact value |
|---|---|
| Repository | `Enosh2212/rule-zero` |
| Framework preset | Next.js |
| Root directory | `frontend` |
| Install command | Default (`npm install`) |
| Build command | `npm run build` |
| Output directory | Leave blank; use the standard Next.js output |
| Production variable | `NEXT_PUBLIC_API_URL=https://<assigned-render-host>` |

Do not add static export configuration. `/`, `/demo`, and `/demo/shopping` are intentionally public and require no credentials. Never create a `NEXT_PUBLIC_` variable for a signing key or any backend secret.

Vercel preview origins are different origins. Either keep previews unable to call the production API or explicitly add only the required preview origin to `CORS_ORIGINS`.

## Validation

After both deployments exist:

```powershell
python scripts/verify_deployment.py --frontend-url https://<vercel-host> --backend-url https://<render-host>
```

Then complete `docs/DEPLOYMENT_VALIDATION.md`.

## Rollback

1. Stop evaluator traffic and mark the demo NO-GO.
2. Roll back the backend to its previous known-good Render deploy.
3. Roll back the frontend to the matching previous Vercel deploy.
4. Restore the matching environment configuration without weakening CORS or key validation.
5. Rerun the deployment validator and manual smoke path before declaring GO.

Frontend and backend schemas are version-coupled, so treat rollback as a pair. Never recover availability by adding `*`, localhost, placeholder keys, or client-visible secrets.
