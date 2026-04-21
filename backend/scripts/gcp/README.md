# Google Cloud Quick Deploy

This folder contains scripts to deploy the RestoRoom backend to Google Cloud
Compute Engine.

## What this deploys

- one VM (default: `e2-micro`)
- backend copied to `/opt/restoroom/backend`
- systemd service: `restoroom-backend`
- Caddy reverse proxy on ports `80/443`

## Requirements

- Google Cloud SDK (`gcloud`) installed and authenticated
- a Google Cloud project with billing enabled
- local backend path:
  `C:\Users\mikey\Documents\RestoRoom\backend`

## Run

```powershell
cd C:\Users\mikey\Documents\RestoRoom\backend\scripts\gcp
powershell -ExecutionPolicy Bypass -File .\deploy-gcp.ps1 `
  -ProjectId "YOUR_GCP_PROJECT_ID" `
  -BaseDomain "yourdomain.com" `
  -PublicDomain "yourdomain.com"
```

If you do not have DNS yet, omit `-PublicDomain` and test by VM IP over HTTP.

## Re-deploy without creating VM again

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-gcp.ps1 `
  -ProjectId "YOUR_GCP_PROJECT_ID" `
  -InstanceName "restoroom-free" `
  -Zone "us-central1-a" `
  -BaseDomain "yourdomain.com" `
  -PublicDomain "yourdomain.com" `
  -SkipVmCreate
```

## Important cost notes

- Stay in free-tier eligible region and machine class if targeting near-zero cost.
- Watch egress and IP/network charges in billing.
- Set a budget alert before running production traffic.
