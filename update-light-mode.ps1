# PowerShell script to update all remaining dark mode styles to light mode

$files = @(
    "src\app\classes\page.tsx",
    "src\app\trainers\page.tsx",
    "src\app\membership\page.tsx",
    "src\app\success\page.tsx",
    "src\app\about\page.tsx",
    "src\app\contact\page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Update section backgrounds
        $content = $content -replace 'className="([^"]*?)bg-neutral-900([^"]*?)"', 'className="$1bg-gray-50$2"'
        $content = $content -replace 'className="([^"]*?)bg-neutral-800([^"]*?)"', 'className="$1bg-white$2"'
        
        # Update headings to gray-900
        $content = $content -replace 'text-white mb-([1246])"', 'text-gray-900 mb-$1"'
        $content = $content -replace 'font-bold text-white', 'font-bold text-gray-900'
        $content = $content -replace 'font-semibold text-white', 'font-semibold text-gray-900'
        
        # Update paragraph and description text
        $content = $content -replace 'text-gray-400', 'text-gray-600'
        $content = $content -replace 'text-gray-300([^0-9])', 'text-gray-700$1'
        
        # Update card backgrounds
        $content = $content -replace 'bg-white/5', 'bg-white'
        $content = $content -replace 'bg-white/10', 'bg-gray-50'
        $content = $content -replace 'border-white/10', 'border-gray-200'
        
        # Update form inputs
        $content = $content -replace 'text-white placeholder-gray-500', 'text-gray-900 placeholder-gray-400'
        $content = $content -replace 'text-white focus', 'text-gray-900 focus'
        
        # Update CTAs at end of pages
        $content = $content -replace 'border-white text-white hover:bg-white hover:text-black', 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
        
        Set-Content $file -Value $content
        Write-Host "Updated $file" -ForegroundColor Green
    }
}

Write-Host "`nAll files updated successfully!" -ForegroundColor Cyan
