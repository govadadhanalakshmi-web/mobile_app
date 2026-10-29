# Firebase Test Lab - Multi-Device Cloud Testing Package

ఈ డైరెక్టరీలో **Google Firebase Test Lab** లో టెస్టింగ్ చేయడానికి అవసరమైన అన్ని ఫైల్స్ ఉన్నాయి:

1. **`TodoMaster-Release.apk`**: డిజిటల్ సిగ్నేచర్‌తో కూడిన స్టాండలోన్ రిలీజ్ APK (62.2 MB, Hermes AOT బైట్‌కోడ్).
2. **`firebase-robo-script.json`**: Firebase Test Lab Robo టెస్ట్ కోసం నిర్దేశించిన అఫీషియల్ JSON స్క్రిప్ట్ (ఆటోమేటిక్ లాగిన్, టాస్క్ క్రియేషన్, సర్క్యులర్ చెక్‌బాక్స్ పూర్తి చేయడం, ఎడిటింగ్, డిలీట్ ఫ్లో).
3. **`firebase-test-cases.json`**: QA మేనేజ్‌మెంట్ మరియు ఆటోమేటెడ్ రిపోర్టింగ్ కోసం రూపొందించిన సమగ్రమైన JSON టెస్ట్ కేసెస్ మ్యాట్రిక్స్.
4. **`run-firebase-test.sh` / `run-firebase-test.ps1`**: క్లౌడ్‌లో టెస్ట్ రన్ చేయడానికి వన్-క్లిక్ స్క్రిప్ట్‌లు.

---

## విధానం 1: Firebase Console వెబ్ UI ద్వారా టెస్ట్ చేయడం (సులభమైన పద్ధతి)

Firebase Spark ప్లాన్ ద్వారా ప్రతిరోజూ **10 వర్చువల్ డివైజ్‌లు + 5 రియల్ ఫిజికల్ డివైజ్‌లు ఉచితంగా** లభిస్తాయి.

### దశలు:
1. బ్రౌజర్‌లో [Firebase Test Lab Console](https://console.firebase.google.com/project/_/testlab) ఓపెన్ చేయండి.
2. మీ ప్రాజెక్ట్‌ను ఎంచుకోండి.
3. **"Run a test"** బటన్ క్లిక్ చేసి **"Robo test"** ఎంచుకోండి.
4. **Upload APK:** ఇక్కడ ఉన్న `firebase/TodoMaster-Release.apk` ఫైల్‌ని అప్‌లోడ్ చేయండి.
5. **Robo script (Optional):** క్రింది ఆప్షన్లలో **"Robo script"** వద్ద క్లిక్ చేసి, ఇక్కడ ఉన్న **`firebase/firebase-robo-script.json`** ఫైల్‌ని అప్‌లోడ్ చేయండి.
   > **ఇది ఎందుకు ముఖ్యం?** ఈ JSON స్క్రిప్ట్ అప్‌లోడ్ చేయడం ద్వారా, Robo Crawler రాండమ్ క్లిక్స్ చేయకుండా, నేరుగా డెమో లాగిన్ అవ్వడం, టాస్క్ క్రియేట్ చేయడం, చెక్‌బాక్స్ క్లిక్ చేయడం వంటి పూర్తి CRUD టెస్ట్‌లను వరుసగా రన్ చేసి చూపిస్తుంది!
6. **Device Matrix ఎంచుకోండి:** 
   - Google Pixel 7 (Android 13)
   - Samsung Galaxy S23 (Android 13)
   - Xiaomi / Motorola ఫిజికల్ డివైజ్
7. **"Start Test"** క్లిక్ చేయండి.

టెస్ట్ పూర్తయ్యాక:
- 🎥 **వీడియో రికార్డింగ్:** స్క్రీన్ మీద యాప్ ఎలా పని చేసిందో లైవ్ వీడియో చూడవచ్చు.
- 📸 **స్క్రీన్‌షాట్‌లు:** ప్రతి స్క్రీన్ యొక్క హై-రిజల్యూషన్ చిత్రాలు.
- 📊 **క్రాష్ & పెర్ఫార్మెన్స్ లాగ్‌లు:** CPU, Memory, Frame rates మరియు Logcat లాగ్‌లు లభిస్తాయి.

---

## విధానం 2: Google Cloud CLI (gcloud) ద్వారా టెస్ట్ చేయడం

మీ కంప్యూటర్‌లో `gcloud` ఇన్స్టాల్ అయి ప్రాజెక్ట్ కాన్ఫిగర్ చేసి ఉంటే:

```bash
# Linux / macOS / Git Bash:
chmod +x ./firebase/run-firebase-test.sh
./firebase/run-firebase-test.sh

# Windows PowerShell:
.\firebase\run-firebase-test.ps1
```

లేదా డైరెక్ట్ కమాండ్:
```bash
gcloud firebase test android run \
  --type robo \
  --app ./firebase/TodoMaster-Release.apk \
  --robo-script ./firebase/firebase-robo-script.json \
  --device model=panther,version=33 \
  --device model=oriole,version=31 \
  --timeout 3m
```

