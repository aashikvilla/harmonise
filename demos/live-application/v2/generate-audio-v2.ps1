param(
  [string]$OutDir = "demos/live-application/v2/recording"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
$scratch = Join-Path $OutDir "voice-segments"
New-Item -ItemType Directory -Path $scratch -Force | Out-Null
$voiceInput = Join-Path $OutDir "voice-input.wav"
$voiceover = Join-Path $OutDir "voiceover-v2.wav"
$captions = Join-Path $OutDir "captions-v2.srt"
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$sampleRate = 22050
$channels = 1
$bitsPerSample = 16
$bytesPerSecond = $sampleRate * $channels * ($bitsPerSample / 8)
$gapSeconds = 0.42

function Format-Timecode([double]$Seconds) {
  $totalMs = [int][math]::Floor($Seconds * 1000)
  $hours = [int][math]::Floor($totalMs / 3600000)
  $minutes = [int][math]::Floor(($totalMs % 3600000) / 60000)
  $seconds = [int][math]::Floor(($totalMs % 60000) / 1000)
  $milliseconds = $totalMs % 1000
  return "{0:00}:{1:00}:{2:00},{3:000}" -f $hours, $minutes, $seconds, $milliseconds
}

function Wrap-Caption([string]$Text, [int]$Width = 46) {
  $lines = [System.Collections.Generic.List[string]]::new()
  $line = ""
  foreach ($word in $Text.Split(' ')) {
    $candidate = if ($line) { "$line $word" } else { $word }
    if ($candidate.Length -gt $Width -and $line) { $lines.Add($line); $line = $word }
    else { $line = $candidate }
  }
  if ($line) { $lines.Add($line) }
  return ($lines -join "`n")
}

function Read-WaveData([string]$Path) {
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $position = 12
  while ($position + 8 -le $bytes.Length) {
    $chunkName = [System.Text.Encoding]::ASCII.GetString($bytes, $position, 4)
    $chunkSize = [BitConverter]::ToUInt32($bytes, $position + 4)
    $chunkData = $position + 8
    if ($chunkName -eq "data") { return $bytes[$chunkData..($chunkData + $chunkSize - 1)] }
    $position = $chunkData + $chunkSize + ($chunkSize % 2)
  }
  throw "No PCM data chunk found in $Path"
}

function New-WaveHeader([int]$DataSize) {
  $stream = [System.IO.MemoryStream]::new()
  $writer = [System.IO.BinaryWriter]::new($stream)
  $writer.Write([System.Text.Encoding]::ASCII.GetBytes("RIFF"))
  $writer.Write([uint32]($DataSize + 36))
  $writer.Write([System.Text.Encoding]::ASCII.GetBytes("WAVEfmt "))
  $writer.Write([uint32]16)
  $writer.Write([uint16]1)
  $writer.Write([uint16]$channels)
  $writer.Write([uint32]$sampleRate)
  $writer.Write([uint32]$bytesPerSecond)
  $writer.Write([uint16]($channels * ($bitsPerSample / 8)))
  $writer.Write([uint16]$bitsPerSample)
  $writer.Write([System.Text.Encoding]::ASCII.GetBytes("data"))
  $writer.Write([uint32]$DataSize)
  $writer.Flush()
  $header = $stream.ToArray()
  $writer.Dispose()
  $stream.Dispose()
  return $header
}

try {
  $available = @($synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name })
  $voiceName = if ($available -contains "Microsoft Hazel Desktop") { "Microsoft Hazel Desktop" } else { $available[0] }
  $synth.SelectVoice($voiceName)
  $synth.Rate = -1
  $synth.Volume = 100

  $sentences = @(
    "A hard decision can be difficult to explain, and harder to share before you are ready.",
    "Harmonise starts privately and leaves peer connection up to you.",
    "It is for people facing personal decisions, family pressure, or life changes. This is peer support, not therapy.",
    "We sign in with the shared demo account. Community names and counts are real; member stories stay private.",
    "The member describes pressure to decide for their family.",
    "Muse Wonder offers a live reflection and practical options, with Muse Spark as fallback.",
    "The app names the model that answered. Matches appear only when the member asks.",
    "Private advice is not copied into a peer space. The public directory comes from Supabase.",
    "When no circle fits, Meta drafts a possible scope from the member's idea.",
    "The member can edit or discard the draft. A human reviews any proposal before launch.",
    "Muse Voice Transcribe turns speech into text the member can review and edit.",
    "That transcript stays unsent until the member chooses what to do.",
    "Muse Spark also supports chat, community guidance, and advisory moderation triage. People make consequential decisions.",
    "Next.js, Supabase Auth and Postgres, and server-side Meta models connect the journey.",
    "We aim to make a first step easier to see and connection easier to choose. We have not measured outcomes."
  )

  $audio = [System.IO.MemoryStream]::new()
  $captionLines = [System.Collections.Generic.List[string]]::new()
  $time = 0.0
  for ($index = 0; $index -lt $sentences.Count; $index++) {
    $sentence = $sentences[$index]
    $segmentPath = Join-Path $scratch ("segment-{0:D2}.wav" -f ($index + 1))
    $safeSentence = [System.Security.SecurityElement]::Escape($sentence)
    $ssml = "<speak version=`"1.0`" xmlns=`"http://www.w3.org/2001/10/synthesis`" xml:lang=`"en-GB`"><voice name=`"$voiceName`"><prosody rate=`"95%`">$safeSentence</prosody></voice></speak>"
    $synth.SetOutputToWaveFile($segmentPath)
    $synth.SpeakSsml($ssml)
    $synth.SetOutputToNull()

    $segment = Read-WaveData $segmentPath
    $duration = $segment.Length / $bytesPerSecond
    $captionStart = $time + 0.04
    $captionEnd = [math]::Max($captionStart + 1.2, $time + $duration - 0.04)
    $captionLines.Add(("{0}`n{1} --> {2}`n{3}`n" -f ($index + 1), (Format-Timecode $captionStart), (Format-Timecode $captionEnd), (Wrap-Caption $sentence)))
    $audio.Write($segment, 0, $segment.Length)
    $time += $duration
    if ($index -lt $sentences.Count - 1) {
      $gapBytes = [int]($bytesPerSecond * $gapSeconds)
      $gapBytes = $gapBytes - ($gapBytes % 2)
      $silence = [byte[]]::new($gapBytes)
      $audio.Write($silence, 0, $silence.Length)
      $time += $gapBytes / $bytesPerSecond
    }
  }
  $audioBytes = $audio.ToArray()
  $header = New-WaveHeader $audioBytes.Length
  $combined = [System.IO.File]::Open($voiceover, [System.IO.FileMode]::Create)
  try { $combined.Write($header, 0, $header.Length); $combined.Write($audioBytes, 0, $audioBytes.Length) }
  finally { $combined.Dispose() }
  [System.IO.File]::WriteAllText($captions, ($captionLines -join "`r`n"), [System.Text.UTF8Encoding]::new($false))

  $synth.SetOutputToWaveFile($voiceInput)
  $synth.Rate = 0
  $inputText = "I feel pressured to decide for my family. I need more time."
  $inputSsml = "<speak version=`"1.0`" xmlns=`"http://www.w3.org/2001/10/synthesis`" xml:lang=`"en-US`"><voice name=`"$voiceName`">$inputText<break time=`"10s`"/></voice></speak>"
  $synth.SpeakSsml($inputSsml)
  $synth.SetOutputToNull()

  Write-Output "Created 3-minute demo voice assets with $voiceName; narration $([math]::Round($time, 1)) seconds and $($sentences.Count) caption cues."
}
finally {
  $synth.Dispose()
  $audio.Dispose()
  Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
}
