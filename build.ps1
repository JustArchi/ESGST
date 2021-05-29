Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Push-Location "$PSScriptRoot"

try {
	git pull

	npm i
	npm run build

	if (!(Test-Path "hosted" -PathType Container)) {
		New-Item -ItemType Directory -Force -Path "hosted"
	}

	Copy-Item 'dist\userscript.user.js' 'hosted\ESGST.user.js'
	Copy-Item 'dist\userscript.meta.js' 'hosted\ESGST.meta.js'

	git reset
	git add -A "hosted"
	git commit -m "A-ESGST build"
	git push
} finally {
	Pop-Location
}

pause
