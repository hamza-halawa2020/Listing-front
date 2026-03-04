$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Save-Png {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [string]$Path
    )

    $directory = Split-Path -Path $Path -Parent
    Ensure-Directory -Path $directory
    $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $Bitmap.Dispose()
}

function New-Graphics {
    param([System.Drawing.Bitmap]$Bitmap)

    $graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    return $graphics
}

function Draw-ContainedImage {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Image]$Image,
        [double]$CanvasWidth,
        [double]$CanvasHeight,
        [double]$MaxWidth,
        [double]$MaxHeight
    )

    $scale = [Math]::Min($MaxWidth / $Image.Width, $MaxHeight / $Image.Height)
    $drawWidth = [int][Math]::Round($Image.Width * $scale)
    $drawHeight = [int][Math]::Round($Image.Height * $scale)
    $drawX = [int][Math]::Round(($CanvasWidth - $drawWidth) / 2)
    $drawY = [int][Math]::Round(($CanvasHeight - $drawHeight) / 2)

    $Graphics.DrawImage($Image, $drawX, $drawY, $drawWidth, $drawHeight)
}

$mobileShellRoot = Split-Path -Path $PSScriptRoot -Parent
$projectRoot = Split-Path -Path $mobileShellRoot -Parent
$logoSvgPath = Join-Path $projectRoot 'src\assets\images\logo.svg'
$resourcesDir = Join-Path $mobileShellRoot 'resources'
$androidResDir = Join-Path $mobileShellRoot 'android\app\src\main\res'

Ensure-Directory -Path $resourcesDir

$svgContent = Get-Content -LiteralPath $logoSvgPath -Raw
$match = [regex]::Match($svgContent, 'data:image/png;base64,([^"]+)')

if (-not $match.Success) {
    throw "Could not find an embedded PNG inside $logoSvgPath"
}

$logoBytes = [Convert]::FromBase64String($match.Groups[1].Value)
$sourceLogoPath = Join-Path $resourcesDir 'brand-logo-source.png'
[System.IO.File]::WriteAllBytes($sourceLogoPath, $logoBytes)

$stream = New-Object System.IO.MemoryStream(, $logoBytes)
$sourceImage = [System.Drawing.Image]::FromStream($stream)
$logoImage = New-Object System.Drawing.Bitmap $sourceImage
$sourceImage.Dispose()
$stream.Dispose()

$symbolCropSize = [int][Math]::Min([Math]::Round($logoImage.Width * 0.44), $logoImage.Height)
$symbolCropX = [int][Math]::Round(($logoImage.Width - $symbolCropSize) / 2)
$symbolImage = New-Object System.Drawing.Bitmap $symbolCropSize, $symbolCropSize
$symbolGraphics = New-Graphics -Bitmap $symbolImage
$symbolGraphics.Clear([System.Drawing.Color]::Transparent)
$symbolDestination = New-Object System.Drawing.Rectangle(0, 0, $symbolCropSize, $symbolCropSize)
$symbolSource = New-Object System.Drawing.Rectangle($symbolCropX, 0, $symbolCropSize, $symbolCropSize)
$symbolGraphics.DrawImage($logoImage, $symbolDestination, $symbolSource, [System.Drawing.GraphicsUnit]::Pixel)
$symbolGraphics.Dispose()

$white = [System.Drawing.Color]::White
$borderColor = [System.Drawing.Color]::FromArgb(255, 15, 157, 138)
$iconPreviewSize = 1024
$iconPreview = New-Object System.Drawing.Bitmap $iconPreviewSize, $iconPreviewSize
$iconGraphics = New-Graphics -Bitmap $iconPreview
$iconGraphics.Clear($white)
$borderPen = New-Object System.Drawing.Pen($borderColor, 36)
$iconGraphics.DrawRectangle($borderPen, 18, 18, $iconPreviewSize - 36, $iconPreviewSize - 36)
$borderPen.Dispose()
Draw-ContainedImage -Graphics $iconGraphics -Image $symbolImage -CanvasWidth $iconPreviewSize -CanvasHeight $iconPreviewSize -MaxWidth ($iconPreviewSize * 0.68) -MaxHeight ($iconPreviewSize * 0.68)
$iconGraphics.Dispose()
Save-Png -Bitmap $iconPreview -Path (Join-Path $resourcesDir 'brand-icon-preview.png')

$iconTargets = @(
    @{ Density = 'mdpi'; Legacy = 48; Foreground = 108 },
    @{ Density = 'hdpi'; Legacy = 72; Foreground = 162 },
    @{ Density = 'xhdpi'; Legacy = 96; Foreground = 216 },
    @{ Density = 'xxhdpi'; Legacy = 144; Foreground = 324 },
    @{ Density = 'xxxhdpi'; Legacy = 192; Foreground = 432 }
)

foreach ($target in $iconTargets) {
    $densityDir = Join-Path $androidResDir ("mipmap-{0}" -f $target.Density)
    Ensure-Directory -Path $densityDir

    $foregroundBitmap = New-Object System.Drawing.Bitmap $target.Foreground, $target.Foreground
    $foregroundGraphics = New-Graphics -Bitmap $foregroundBitmap
    $foregroundGraphics.Clear([System.Drawing.Color]::Transparent)
    Draw-ContainedImage -Graphics $foregroundGraphics -Image $symbolImage -CanvasWidth $target.Foreground -CanvasHeight $target.Foreground -MaxWidth ($target.Foreground * 0.82) -MaxHeight ($target.Foreground * 0.82)
    $foregroundGraphics.Dispose()
    Save-Png -Bitmap $foregroundBitmap -Path (Join-Path $densityDir 'ic_launcher_foreground.png')

    foreach ($iconName in @('ic_launcher.png', 'ic_launcher_round.png')) {
        $legacyBitmap = New-Object System.Drawing.Bitmap $target.Legacy, $target.Legacy
        $legacyGraphics = New-Graphics -Bitmap $legacyBitmap
        $legacyGraphics.Clear($white)
        $legacyPen = New-Object System.Drawing.Pen($borderColor, [Math]::Max(2, [Math]::Round($target.Legacy * 0.06)))
        $legacyInset = [int][Math]::Round($target.Legacy * 0.05)
        $legacyGraphics.DrawRectangle($legacyPen, $legacyInset, $legacyInset, $target.Legacy - ($legacyInset * 2), $target.Legacy - ($legacyInset * 2))
        $legacyPen.Dispose()
        Draw-ContainedImage -Graphics $legacyGraphics -Image $symbolImage -CanvasWidth $target.Legacy -CanvasHeight $target.Legacy -MaxWidth ($target.Legacy * 0.74) -MaxHeight ($target.Legacy * 0.74)
        $legacyGraphics.Dispose()
        Save-Png -Bitmap $legacyBitmap -Path (Join-Path $densityDir $iconName)
    }
}

$splashTargets = @(
    @{ Path = 'drawable\splash.png'; Width = 480; Height = 800; WidthRatio = 0.62; HeightRatio = 0.18 },
    @{ Path = 'drawable-port-mdpi\splash.png'; Width = 320; Height = 480; WidthRatio = 0.62; HeightRatio = 0.18 },
    @{ Path = 'drawable-port-hdpi\splash.png'; Width = 480; Height = 800; WidthRatio = 0.62; HeightRatio = 0.18 },
    @{ Path = 'drawable-port-xhdpi\splash.png'; Width = 720; Height = 1280; WidthRatio = 0.62; HeightRatio = 0.18 },
    @{ Path = 'drawable-port-xxhdpi\splash.png'; Width = 960; Height = 1600; WidthRatio = 0.62; HeightRatio = 0.18 },
    @{ Path = 'drawable-port-xxxhdpi\splash.png'; Width = 1280; Height = 1920; WidthRatio = 0.62; HeightRatio = 0.18 },
    @{ Path = 'drawable-land-mdpi\splash.png'; Width = 480; Height = 320; WidthRatio = 0.40; HeightRatio = 0.34 },
    @{ Path = 'drawable-land-hdpi\splash.png'; Width = 800; Height = 480; WidthRatio = 0.40; HeightRatio = 0.34 },
    @{ Path = 'drawable-land-xhdpi\splash.png'; Width = 1280; Height = 720; WidthRatio = 0.40; HeightRatio = 0.34 },
    @{ Path = 'drawable-land-xxhdpi\splash.png'; Width = 1600; Height = 960; WidthRatio = 0.40; HeightRatio = 0.34 },
    @{ Path = 'drawable-land-xxxhdpi\splash.png'; Width = 1920; Height = 1280; WidthRatio = 0.40; HeightRatio = 0.34 }
)

foreach ($target in $splashTargets) {
    $fullPath = Join-Path $androidResDir $target.Path
    $splashBitmap = New-Object System.Drawing.Bitmap $target.Width, $target.Height
    $splashGraphics = New-Graphics -Bitmap $splashBitmap
    $splashGraphics.Clear($white)
    Draw-ContainedImage -Graphics $splashGraphics -Image $logoImage -CanvasWidth $target.Width -CanvasHeight $target.Height -MaxWidth ($target.Width * $target.WidthRatio) -MaxHeight ($target.Height * $target.HeightRatio)
    $splashGraphics.Dispose()
    Save-Png -Bitmap $splashBitmap -Path $fullPath
}

$symbolImage.Dispose()
$logoImage.Dispose()

Write-Host 'Android branding assets generated successfully.'
