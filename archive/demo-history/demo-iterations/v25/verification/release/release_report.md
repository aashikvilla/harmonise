# v25 release report

The archived candidate is a 160.033-second H.264 film at 1920×1080 and 30 fps, with mono 48 kHz AAC and 25 burned-in captions. The full decode passed; audio/video duration differs by 0.000333 seconds. Builder measurements are −18.1 LUFS integrated and −2.0 dBFS true peak. Independent release inspection measured −19.3 dB mean and −2.0 dB peak. Captions remain clear at 960×540; body interface text is smaller but readable at full size.

There are no visible glitches. The longest narrated pause is 4.425 seconds at 46.77–51.19; the ending has about three seconds of silence. Several five-second low-motion UI holds occur at 12–17, 31–36, 87–92, 106–111, 125–130, and 144–149 seconds. Participants, stories, and sharing controls are truthfully labeled fictional/prepared; consent remains unchecked and nothing is sent.

The independent cold review returned **72/100 fixed weighted** and **79/100 film-persuasion** (19 clarity + 21 journey/payoff + 18 differentiation/role value + 21 craft), with a **maybe** decision and medium confidence. Evidence mode was picture and embedded captions; AAC audio was unheard. Technical evidence is film-visible prototype behavior. The judge found the correction and privacy controls persuasive, while noting no model execution or live community activity is evidenced, the audience and proposition could be clearer in the opening, the ending has no human exchange, and some UI text is small.

See [verification.md](verification.md), `ffprobe.json`, `decode.log`, `audio-levels.txt`, and the unchanged cold-review files for supporting evidence.
