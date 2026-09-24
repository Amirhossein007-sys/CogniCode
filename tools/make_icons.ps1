$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path (Split-Path -Parent $scriptDir) 'icons'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function P([double]$x, [double]$y, [double]$s) {
    $cx = 512.0; $cy = 512.0
    return [System.Drawing.PointF]::new([float]($cx + ($x - $cx) * $s), [float]($cy + ($y - $cy) * $s))
}

function Draw-Glyph([System.Drawing.Graphics]$g, [double]$s) {
    $left  = @((P 335 395 $s), (P 210 512 $s), (P 335 629 $s))
    $slash = @((P 568 352 $s), (P 456 672 $s))
    $right = @((P 689 395 $s), (P 814 512 $s), (P 689 629 $s))
    foreach ($pass in @(@(96, 30), @(66, 70), @(50, 255))) {
        $color = [System.Drawing.Color]::FromArgb($pass[1], 255, 255, 255)
        $pen = New-Object System.Drawing.Pen ($color), ([float]($pass[0] * $s))
        $pen.StartCap  = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap    = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.LineJoin  = [System.Drawing.Drawing2D.LineJoin]::Round
        $g.DrawLines($pen, $left)
        $g.DrawLines($pen, $right)
        $g.DrawLines($pen, $slash)
        $pen.Dispose()
    }
}

function New-Icon([string]$kind, [double]$s) {
    $bmp = New-Object System.Drawing.Bitmap 1024, 1024
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $rect = New-Object System.Drawing.Rectangle 0, 0, 1024, 1024
    $c1 = [System.Drawing.Color]::FromArgb(255, 99, 91, 255)
    $c2 = [System.Drawing.Color]::FromArgb(255, 168, 85, 247)
    $c3 = [System.Drawing.Color]::FromArgb(255, 255, 60, 130)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($rect), ($c1), ($c3), ([float]45)
    $blend = New-Object System.Drawing.Drawing2D.ColorBlend
    $blend.Colors = @($c1, $c2, $c3)
    $blend.Positions = @(0.0, 0.5, 1.0)
    $brush.InterpolationColors = $blend
    $g.FillRectangle($brush, $rect)

    Draw-Glyph $g $s
    $g.Dispose()

    $sizes = @(512, 192, 180)
    if ($kind -eq 'maskable') { $sizes = @(512) }
    foreach ($sz in $sizes) {
        $b2 = New-Object System.Drawing.Bitmap $sz, $sz
        $g2 = [System.Drawing.Graphics]::FromImage($b2)
        $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g2.DrawImage($bmp, 0, 0, $sz, $sz)
        $g2.Dispose()
        if ($kind -eq 'maskable') {
            $name = 'maskable-512.png'
        } else {
            $name = 'icon-{0}.png' -f $sz
        }
        $b2.Save((Join-Path $outDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
        $b2.Dispose()
    }
    $bmp.Dispose()
}

New-Icon 'main' 1.0
New-Icon 'maskable' 0.82
Write-Output 'icons done'
