$ErrorActionPreference = "Stop"

param(
    [Parameter(Mandatory = $true)][string]$ProjectId,
    [string]$InstanceName = "restoroom-free",
    [string]$Zone = "us-central1-a",
    [string]$MachineType = "e2-micro",
    [string]$BaseDomain = "rec.net",
    [string]$PublicDomain = "",
    [string]$SourceBackendPath = "C:\Users\mikey\Documents\RestoRoom\backend",
    [switch]$SkipVmCreate
)

function Require-Command {
    param([Parameter(Mandatory = $true)][string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

Require-Command -Name "gcloud"

if (-not (Test-Path -LiteralPath $SourceBackendPath)) {
    throw "Source backend path not found: $SourceBackendPath"
}

Write-Host "Configuring gcloud project..."
gcloud config set project $ProjectId | Out-Null

if (-not $SkipVmCreate) {
    Write-Host "Ensuring firewall rules exist..."
    $existingWebRule = gcloud compute firewall-rules list --filter="name=restoroom-allow-web" --format="value(name)"
    if (-not $existingWebRule) {
        gcloud compute firewall-rules create restoroom-allow-web `
            --direction=INGRESS `
            --action=ALLOW `
            --rules=tcp:80,tcp:443 `
            --target-tags=restoroom-web `
            --source-ranges=0.0.0.0/0 | Out-Null
    }

    $existingSshRule = gcloud compute firewall-rules list --filter="name=restoroom-allow-ssh" --format="value(name)"
    if (-not $existingSshRule) {
        gcloud compute firewall-rules create restoroom-allow-ssh `
            --direction=INGRESS `
            --action=ALLOW `
            --rules=tcp:22 `
            --target-tags=restoroom-web `
            --source-ranges=0.0.0.0/0 | Out-Null
    }

    Write-Host "Creating VM ($InstanceName) in $Zone..."
    gcloud compute instances create $InstanceName `
        --zone=$Zone `
        --machine-type=$MachineType `
        --image-family=ubuntu-2204-lts `
        --image-project=ubuntu-os-cloud `
        --boot-disk-type=pd-standard `
        --boot-disk-size=20GB `
        --tags=restoroom-web | Out-Null
}

Write-Host "Uploading backend to VM..."
gcloud compute ssh "$InstanceName" --zone="$Zone" --command "sudo mkdir -p /opt/restoroom && sudo rm -rf /opt/restoroom/backend && sudo chown -R \$USER:\$USER /opt/restoroom"
gcloud compute scp --recurse "$SourceBackendPath" "$InstanceName`:/opt/restoroom/" --zone="$Zone"

Write-Host "Uploading VM setup script..."
$localSetupScript = Join-Path $SourceBackendPath "scripts\gcp\setup-on-vm.sh"
if (-not (Test-Path -LiteralPath $localSetupScript)) {
    throw "Setup script missing: $localSetupScript"
}
gcloud compute scp "$localSetupScript" "$InstanceName`:/tmp/setup-on-vm.sh" --zone="$Zone"

$escapedBaseDomain = $BaseDomain.Replace("'", "''")
$escapedPublicDomain = $PublicDomain.Replace("'", "''")

Write-Host "Running remote setup..."
$remoteCmd = @"
chmod +x /tmp/setup-on-vm.sh &&
sudo BASE_DOMAIN='$escapedBaseDomain' PUBLIC_DOMAIN='$escapedPublicDomain' SERVICE_USER=`$USER /tmp/setup-on-vm.sh &&
sudo systemctl restart restoroom-backend
"@
gcloud compute ssh "$InstanceName" --zone="$Zone" --command $remoteCmd

Write-Host "Deployment complete."
$ip = gcloud compute instances describe $InstanceName --zone=$Zone --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
Write-Host "VM public IP: $ip"
Write-Host "Health check (base): http://$ip/health"
if ($PublicDomain) {
    Write-Host "Remember to point DNS A records to $ip for your subdomains under $PublicDomain."
}
