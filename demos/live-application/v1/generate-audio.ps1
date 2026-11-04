param(
  [string]$OutDir = "demos/live-application/v1/recording"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$voiceInput = Join-Path $OutDir "voice-input.wav"
$voiceover = Join-Path $OutDir "voiceover.wav"
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $available = @($synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name })
  $voiceName = if ($available -contains "Microsoft Hazel Desktop") { "Microsoft Hazel Desktop" } else { $available[0] }
  $synth.SelectVoice($voiceName)
  $synth.Rate = -1
  $synth.Volume = 100

  $synth.SetOutputToWaveFile($voiceInput)
  $synth.Rate = 0
  $inputSsml = @"
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="$voiceName">I feel pressured to decide for my family. I need more time.<break time="10s"/></voice></speak>
"@
  $synth.SpeakSsml($inputSsml)
  $synth.SetOutputToNull()

  $synth.SetOutputToWaveFile($voiceover)
  $synth.Rate = -1
  $ssml = @'
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
  <voice name="Microsoft Hazel Desktop">
    <prosody rate="85%">
      When a hard situation is still taking shape, the first step can be difficult: explain it, decide what to do, and find people who might understand. Harmonise begins with private reflection. It offers a useful next step, then lets the person decide whether a peer community belongs in that journey.
      <break time="5s"/>
      We’ll use the shared demo account to walk through the working product. It uses the same authentication and data services as the application. This account is shared, so we’ll keep the visit read-only.
      <break time="5s"/>
      This answer is generated on the server by Meta Muse Wonder when available, with Muse Spark as the configured fallback. The model returns a reflection, a few practical options, and possible community matches. The label reports which model actually answered. Harmonise screens urgent language deterministically before the model call; that safety response is not presented as AI advice. The community suggestions stay hidden until the member asks to see them.
      <break time="5s"/>
      Community names and activity counts come from Supabase, not a demo fixture. This production community is active. Its posts are visible only to members, and they contain personal stories, so we’re not recording them without permission. Joining is a separate action with a member-chosen alias. Harmonise never shares the private adviser conversation automatically.
      <break time="5s"/>
      If an existing circle does not fit, Meta can help draft a focused scope using the proposed purpose and approved public community information. The member can edit every suggestion. This is a private draft until the member submits it; a human must review coverage before a community can launch. The system does not create and publish a group on its own.
      <break time="5s"/>
      For someone who would rather speak than type, the private chat includes Meta Muse Voice Transcribe. Audio is sent to the server-side transcription route; the transcript appears as editable text. The member reviews it before sending it anywhere. Here we’ll leave it unsent, so it is not added to the shared demo account’s saved conversations.
      <break time="5s"/>
      Models can help draft a boundary or triage a report, but they do not approve communities, remove members, or decide appeals. A human reviewer is responsible for those decisions. Harmonise is peer support and navigation. It does not currently provide therapist search, bookings, direct messages to volunteers, or emergency response.
      <break time="5s"/>
      The intended impact is a gentler path from being heard to choosing what comes next: private reflection, practical options, and real peer connection when it fits. The models help with language and orientation; the member keeps control, and people remain accountable for community care. That is Harmonise.
    </prosody>
  </voice>
</speak>
'@
  # Use the installed voice selected above; do not fail if its friendly alias differs from the voice catalog.
  $ssml = $ssml -replace 'name="Microsoft Hazel Desktop"', "name=`"$voiceName`""
  $synth.SpeakSsml($ssml)
  $synth.SetOutputToNull()
  Write-Output "Created voice-input.wav and voiceover.wav using installed voice: $voiceName"
}
finally {
  $synth.Dispose()
}
