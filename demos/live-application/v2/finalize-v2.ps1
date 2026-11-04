param(
  [string]$Ffmpeg = "ffmpeg",
  [string]$OutDir = "demos/live-application/v2/recording"
)

$ErrorActionPreference = "Stop"
$video = Join-Path $OutDir "harmonise-live-v2.webm"
$voiceover = Join-Path $OutDir "voiceover-v2.wav"
$captions = Join-Path $OutDir "captions-v2.srt"
$mp3 = Join-Path $OutDir "voiceover-v2.mp3"
$output = Join-Path $OutDir "harmonise-live-v2.mp4"

foreach ($path in @($video, $voiceover, $captions)) {
  if (-not (Test-Path -LiteralPath $path)) { throw "Required recording input is missing: $path" }
}

& $Ffmpeg -y -i $voiceover -codec:a libmp3lame -b:a 128k $mp3
if ($LASTEXITCODE -ne 0) { throw "Could not create the standalone MP3 voiceover." }

$captionFilter = "subtitles='$($captions.Replace('\', '/'))':force_style='FontName=Arial,FontSize=12,PrimaryColour=&H00FFFFFF,OutlineColour=&H00342F43,BackColour=&H80342F43,BorderStyle=3,Outline=1,Shadow=0,Alignment=2,MarginV=34'"
$filter = "[0:v]$captionFilter,tpad=stop_mode=clone:stop_duration=50,format=yuv420p[v];[1:a]apad[a]"
& $Ffmpeg -y -i $video -i $voiceover -i $captions `
  -filter_complex $filter -map "[v]" -map "[a]" -map "2:s:0" `
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 `
  -c:a aac -b:a 160k -c:s mov_text -movflags +faststart -t 180 $output
if ($LASTEXITCODE -ne 0) { throw "Could not create the captioned MP4." }

Write-Output "Created $output with AAC narration, burned-in captions, a selectable subtitle track, and exactly three minutes of runtime."
