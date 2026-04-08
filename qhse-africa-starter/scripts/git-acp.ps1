# add + commit + push (PowerShell 5.x n'accepte pas && comme bash)
$ErrorActionPreference = 'Stop'
$message = if ($args.Count -gt 0) { $args -join ' ' } else { 'chore: update' }
git add -A
git commit -m $message
git push
