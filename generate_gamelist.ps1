# PowerShell Script to Auto-Generate games.json

# Get the script's directory to build absolute paths
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Define paths relative to the script location
$gamesDir = Join-Path -Path $PSScriptRoot -ChildPath "Assets\Games"
$imagesDir = Join-Path -Path $PSScriptRoot -ChildPath "Assets\Images"
$outputFile = Join-Path -Path $PSScriptRoot -ChildPath "Data\games.json"

# Get all subdirectories in the Assets/Games folder
$gameFolders = Get-ChildItem -Path $gamesDir -Directory

$gameList = @()

foreach ($folder in $gameFolders) {
    # Create a more readable name from the folder name (e.g., SampleGame1 -> Sample Game 1)
    $gameName = $folder.Name -replace '([A-Z])', ' $1' -replace '-', ' ' | ForEach-Object { $_.Trim() }

    # Define preferred image names
    $preferredNames = @("logo", "cover", "thumbnail", "header", "icon")
    $imageFile = $null

    # 1. Search for preferred names in the root of the game folder
    foreach ($name in $preferredNames) {
        $imageFile = Get-ChildItem -Path $folder.FullName -Filter "$name.*" -Include *.png, *.jpg, *.jpeg, *.webp | Select-Object -First 1
        if ($null -ne $imageFile) { break }
    }

    # 2. If not found, search for any image in the root
    if ($null -eq $imageFile) {
        $imageFile = Get-ChildItem -Path $folder.FullName -Include *.png, *.jpg, *.jpeg, *.webp | Select-Object -First 1
    }

    # 3. If still not found, search recursively for any image
    if ($null -eq $imageFile) {
        $imageFile = Get-ChildItem -Path $folder.FullName -Recurse -Include *.png, *.jpg, *.jpeg, *.webp | Select-Object -First 1
    }
    $imagePath = ""
    if ($null -ne $imageFile) {
        # Create a relative path from the project root
        $relativePath = $imageFile.FullName.Substring($PSScriptRoot.Length + 1)
        $imagePath = "../" + ($relativePath -replace '\\', '/')
    }

    $gameObject = [PSCustomObject]@{
        name = $gameName
        image = $imagePath
        file = "../Assets/Games/$($folder.Name)/index.html"
    }
    $gameList += $gameObject
}

# Create the final JSON structure
$jsonObject = [PSCustomObject]@{ games = $gameList }

# Convert to JSON and save to the file
$jsonObject | ConvertTo-Json -Depth 3 | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "Successfully generated games.json with $($gameList.Count) games!"
