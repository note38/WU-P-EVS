# Election Status Cron Test Script - PowerShell Version
# This script helps test the cron endpoint locally on Windows

param(
    [switch]$Help,
    [switch]$Verbose
)

# Colors for output
$colors = @{
    Red = 'Red'
    Green = 'Green'
    Yellow = 'Yellow'
    Blue = 'Cyan'
    White = 'White'
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Show-Usage {
    Write-ColorOutput "Election Status Cron Test Script" "Blue"
    Write-Host ""
    Write-Host "Usage: .\test-cron.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help      Show this help message"
    Write-Host "  -Verbose   Show verbose output"
    Write-Host ""
    Write-Host "Environment Variables Required:"
    Write-Host "  CRON_SECRET        Secret token for authentication"
    Write-Host "  DEPLOYMENT_URL     Base URL of your application"
    Write-Host "                     (or NEXTAUTH_URL as fallback)"
    Write-Host ""
    Write-Host "Example .env.local:"
    Write-Host "  CRON_SECRET=your-secret-token-here"
    Write-Host "  DEPLOYMENT_URL=https://your-app.vercel.app"
}

function Load-Environment {
    $envFile = Join-Path $PSScriptRoot "../.env.local"
    
    if (Test-Path $envFile) {
        Write-ColorOutput "📁 Loading environment from .env.local" "Blue"
        
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]*?)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    } else {
        Write-ColorOutput "⚠️  .env.local not found, using system environment variables" "Yellow"
    }
}

function Test-Environment {
    $missingVars = @()
    
    if (-not $env:CRON_SECRET) {
        $missingVars += "CRON_SECRET"
    }
    
    if (-not $env:DEPLOYMENT_URL -and -not $env:NEXTAUTH_URL) {
        $missingVars += "DEPLOYMENT_URL or NEXTAUTH_URL"
    }
    
    if ($missingVars.Count -gt 0) {
        Write-ColorOutput "❌ Missing required environment variables:" "Red"
        foreach ($var in $missingVars) {
            Write-ColorOutput "   - $var" "Red"
        }
        Write-Host ""
        Write-ColorOutput "💡 Please set these in your .env.local file or environment" "Yellow"
        exit 1
    }
}

function Get-BaseUrl {
    if ($env:DEPLOYMENT_URL) {
        return $env:DEPLOYMENT_URL
    } elseif ($env:NEXTAUTH_URL) {
        return $env:NEXTAUTH_URL
    } else {
        return "http://localhost:3000"
    }
}

function Test-CronEndpoint {
    $baseUrl = Get-BaseUrl
    $endpoint = "$baseUrl/api/cron/election-status"
    
    Write-ColorOutput "🚀 Testing election status cron endpoint" "Blue"
    Write-ColorOutput "📡 URL: $endpoint" "Blue"
    Write-ColorOutput "⏰ Time: $(Get-Date)" "Blue"
    Write-Host ""
    
    # Prepare headers
    $headers = @{
        'Authorization' = "Bearer $env:CRON_SECRET"
        'Content-Type' = 'application/json'
        'User-Agent' = 'test-script-powershell/1.0'
    }
    
    try {
        Write-ColorOutput "📡 Making request..." "Yellow"
        
        # Measure response time
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri $endpoint -Method Get -Headers $headers -ErrorAction Stop
        $stopwatch.Stop()
        
        Write-Host ""
        Write-ColorOutput "📊 Results:" "Blue"
        Write-Host "   Status Code: 200"
        Write-Host "   Response Time: $($stopwatch.ElapsedMilliseconds)ms"
        Write-Host ""
        
        Write-ColorOutput "✅ Request successful!" "Green"
        Write-Host ""
        Write-ColorOutput "📄 Response:" "Blue"
        
        # Pretty print JSON response
        $jsonOutput = $response | ConvertTo-Json -Depth 10
        Write-Host $jsonOutput
        
        Write-Host ""
        Write-ColorOutput "📈 Election Updates: $($response.updatedCount)" "Green"
        Write-ColorOutput "💬 Message: $($response.message)" "Green"
        
        if ($response.updatedCount -gt 0 -and $response.updatedElections) {
            Write-Host ""
            Write-ColorOutput "🗳️ Updated Elections:" "Green"
            foreach ($election in $response.updatedElections) {
                Write-Host "   - $($election.name) (ID: $($election.id)) → $($election.status)"
            }
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        
        Write-Host ""
        Write-ColorOutput "📊 Results:" "Blue"
        Write-Host "   Status Code: $statusCode"
        Write-Host ""
        
        Write-ColorOutput "❌ Request failed!" "Red"
        Write-Host ""
        Write-ColorOutput "💥 Error Response:" "Red"
        
        try {
            $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host ($errorResponse | ConvertTo-Json -Depth 10)
        } catch {
            Write-Host $_.Exception.Message
        }
    }
}

# Main execution
function Main {
    if ($Help) {
        Show-Usage
        return
    }
    
    if ($Verbose) {
        $VerbosePreference = 'Continue'
    }
    
    Write-ColorOutput "🧪 Election Status Cron Endpoint Test" "Blue"
    Write-Host ""
    
    Load-Environment
    Test-Environment
    Test-CronEndpoint
    
    Write-Host ""
    Write-ColorOutput "🏁 Test completed!" "Green"
}

# Run main function
Main