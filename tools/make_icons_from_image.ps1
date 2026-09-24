$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path (Split-Path -Parent $scriptDir) 'icons'
$srcPath = 'C:\Users\Amirii\Downloads\IMG_8597.jpeg'
if (-not (Test-Path $srcPath)) { throw "source icon not found: $srcPath" }

$src = [System.Drawing.Bitmap]::new($srcPath)
Write-Output ("source: {0}x{1}" -f $src.Width, $src.Height)

# ── مرحله ۱: تشخیص کادر آیکون داخل پس‌زمینه شطرنجی ──
function Is-Checker([int]$r, [int]$g, [int]$b) {
    # خانه‌های شطرنجی سفید/خاکستری: کانال‌ها نزدیک هم و روشن
    $m = [Math]::Max($r, [Math]::Max($g, $b))
    $n = [Math]::Min($r, [Math]::Min($g, $b))
    return (($m - $n) -lt 18) -and ($n -gt 120)
}

$step = 4
$minX = $src.Width; $minY = $src.Height; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $src.Height; $y += $step) {
    for ($x = 0; $x -lt $src.Width; $x += $step) {
        $c = $src.GetPixel($x, $y)
        if (-not (Is-Checker $c.R $c.G $c.B)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$bw = $maxX - $minX
$bh = $maxY - $minY
Write-Output ("icon bounds: x={0} y={1} w={2} h={3}" -f $minX, $minY, $bw, $bh)

function New-IconFile([int]$size, [string]$name, [double]$insetPct) {
    # برش با فرو رفتن به داخل آیکون تا گوشه‌های گرد و شطرنجی بیرون بمانند
    $inset = [int]([Math]::Min($bw, $bh) * $insetPct)
    $cx = $minX + $inset
    $cy = $minY + $inset
    $cs = [Math]::Min($bw, $bh) - (2 * $inset)
    if ($cs -lt 32) { throw 'icon too small after inset' }

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $srcRect = New-Object System.Drawing.Rectangle $cx, $cy, $cs, $cs
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $bmp.Save((Join-Path $outDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output ("saved {0} ({1}x{1})" -f $name, $size)
}

New-IconFile 1024 'icon-1024.png' 0.055
New-IconFile 512  'icon-512.png'  0.055
New-IconFile 192  'icon-192.png'  0.055
New-IconFile 180  'icon-180.png'  0.055
New-IconFile 512  'maskable-512.png' 0.11

$src.Dispose()
Write-Output 'icons done'
