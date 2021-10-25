$routes = (dir  "./../routes")

$allRoutes = $routes | Select-Object -Property Name
$jsonAll = @(
      [pscustomobject]@{routes = $allRoutes }
) | ConvertTo-Json
    
$jsonAll | Out-File -Encoding UTF8 "./../routes/routes_generated.json"

$sampleRoutes = $routes | Select-Object -Property Name -First 2
$jsonSample = @(
      [pscustomobject]@{routes = $sampleRoutes }
) | ConvertTo-Json
    
$jsonSample | Out-File -Encoding UTF8 "./../routes/routes_generated_sample.json"
