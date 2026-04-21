$ErrorActionPreference = "Stop"

function Invoke-CompatApi {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body = $null
    )

    $uri = "http://localhost:7000$Path"
    $headers = @{ Host = $HostName }

    if ($Body -ne $null) {
        return Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 8)
    }

    return Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
}

Write-Host "Health checks..."
Invoke-CompatApi -HostName "api.rec.net" -Method GET -Path "/health" | Out-Null
Invoke-CompatApi -HostName "auth.rec.net" -Method GET -Path "/health" | Out-Null
Invoke-CompatApi -HostName "rooms.rec.net" -Method GET -Path "/health" | Out-Null

Write-Host "Register + login..."
Invoke-CompatApi -HostName "auth.rec.net" -Method POST -Path "/register" -Body @{
    username = "mikey"
    password = "stormchase123"
} | Out-Null

$login = Invoke-CompatApi -HostName "auth.rec.net" -Method POST -Path "/login" -Body @{
    username = "mikey"
    password = "stormchase123"
}

if (-not $login.token) {
    throw "Login did not return token"
}

Write-Host "Core API endpoints..."
$headersToken = $login.token

$config = Invoke-CompatApi -HostName "api.rec.net" -Method GET -Path "/api/config/v2"
$filters = Invoke-CompatApi -HostName "rooms.rec.net" -Method GET -Path "/api/rooms/v1/filters"
$relationships = Invoke-RestMethod -Uri "http://localhost:7000/api/relationships/v2/get" -Method GET -Headers @{
    Host = "lists.rec.net"
    Authorization = "Bearer $headersToken"
}

if (-not $config -or -not $filters -or -not $relationships) {
    throw "One or more endpoint checks failed"
}

Write-Host "Smoke test passed."
