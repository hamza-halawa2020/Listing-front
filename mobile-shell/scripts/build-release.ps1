param(
    [ValidateSet('apk', 'aab')]
    [string]$Format = 'apk'
)

$ErrorActionPreference = 'Stop'

$mobileShellRoot = Split-Path -Path $PSScriptRoot -Parent
$keystorePropertiesPath = Join-Path $mobileShellRoot 'android\keystore.properties'

if (-not (Test-Path -LiteralPath $keystorePropertiesPath)) {
    throw 'Missing android\keystore.properties. Copy android\keystore.properties.example and replace the placeholder values first.'
}

$keystorePropertiesContent = Get-Content -LiteralPath $keystorePropertiesPath -Raw
if ($keystorePropertiesContent -match 'change-me') {
    throw 'android\keystore.properties still contains placeholder values. Replace all change-me entries before building a release package.'
}

$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
    $javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
}
if (-not $javaHome) {
    $javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine')
}

if ($javaHome -and (Test-Path -LiteralPath (Join-Path $javaHome 'bin\java.exe'))) {
    $env:JAVA_HOME = $javaHome
    if ($env:Path -notlike "*$javaHome\\bin*") {
        $env:Path = "$javaHome\bin;$env:Path"
    }
}

$javaCommand = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCommand -and -not $env:JAVA_HOME) {
    throw 'Java/JDK was not found. Install JDK 17 or newer and set JAVA_HOME before building release artifacts.'
}

$gradleTask = if ($Format -eq 'aab') { 'bundleRelease' } else { 'assembleRelease' }

Push-Location $mobileShellRoot

try {
    & npm.cmd run prepare:android
    if ($LASTEXITCODE -ne 0) {
        throw 'prepare:android failed.'
    }

    & .\android\gradlew.bat -p android $gradleTask
    if ($LASTEXITCODE -ne 0) {
        throw "$gradleTask failed."
    }
}
finally {
    Pop-Location
}
