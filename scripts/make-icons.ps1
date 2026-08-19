Add-Type -AssemblyName System.Drawing

function CreateCuteIcon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Background (Soft Pink with rounded corners effect)
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#FFF0F5'))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Border
    $borderPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#FFC0D3')), ($size * 0.04)
    $g.DrawRectangle($borderPen, 0, 0, $size, $size)

    # Cute Aqua Water Droplet
    $cx = $size / 2
    $cy = $size / 2 + ($size * 0.05)
    $r = $size * 0.32

    $dropBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#74D4FF'))
    $dropPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#3AA0E8')), ($size * 0.03)

    # Draw Droplet Body
    $g.FillEllipse($dropBrush, ($cx - $r), ($cy - $r * 0.8), ($r * 2), ($r * 1.8))
    $g.DrawEllipse($dropPen, ($cx - $r), ($cy - $r * 0.8), ($r * 2), ($r * 1.8))

    # Top Point
    $topPoint = New-Object System.Drawing.PointF ($cx), ($cy - $r * 1.35)
    $leftPt = New-Object System.Drawing.PointF ($cx - $r * 0.85), ($cy - $r * 0.2)
    $rightPt = New-Object System.Drawing.PointF ($cx + $r * 0.85), ($cy - $r * 0.2)
    $triangle = [System.Drawing.PointF[]]@($topPoint, $leftPt, $rightPt)
    $g.FillPolygon($dropBrush, $triangle)

    # Anime Eyes
    $eyeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#1A2E3B'))
    $eyeR = $size * 0.04
    $g.FillEllipse($eyeBrush, ($cx - $r * 0.4), ($cy - $r * 0.1), ($eyeR * 2), ($eyeR * 2))
    $g.FillEllipse($eyeBrush, ($cx + $r * 0.4 - $eyeR * 2), ($cy - $r * 0.1), ($eyeR * 2), ($eyeR * 2))

    # Pink Blush
    $blushBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#FFAAC9'))
    $blushW = $size * 0.08
    $blushH = $size * 0.04
    $g.FillEllipse($blushBrush, ($cx - $r * 0.6), ($cy + $r * 0.15), $blushW, $blushH)
    $g.FillEllipse($blushBrush, ($cx + $r * 0.6 - $blushW), ($cy + $r * 0.15), $blushW, $blushH)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

CreateCuteIcon 180 'public/apple-touch-icon.png'
CreateCuteIcon 192 'public/icon-192.png'
CreateCuteIcon 512 'public/icon-512.png'
CreateCuteIcon 180 'public/apple-touch-icon-precomposed.png'
Write-Host 'PNG icons generated successfully!'
