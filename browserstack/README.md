# BrowserStack Mobile Testing Guide - Live & Automate

ఈ డైరెక్టరీలో **BrowserStack** ద్వారా మన `TodoMaster-Release.apk` ని రియల్ మొబైల్స్‌లో టెస్ట్ చేయడానికి రెండు విధానాలు ఉన్నాయి:

1. **App Live (మాన్యువల్ ఇంటరాక్షన్):** బ్రౌజర్‌లో రియల్ శామ్‌సంగ్/పిక్సెల్ స్క్రీన్‌ను మౌస్‌తో క్లిక్ చేస్తూ చూడటానికి.
2. **App Automate (ఆటోమేటెడ్ Maestro రన్):** మనం రాసిన `google-tasks-crud-e2e.yaml` టెస్ట్ ఫ్లోను క్లౌడ్ రియల్ ఫోన్లలో మీ ప్రమేయం లేకుండా ఆటోమేటిక్‌గా రన్ చేయడానికి.

---

## విధానం 2: App Automate లో Maestro స్క్రిప్ట్‌ను ఆటోమేటిక్‌గా రన్ చేయడం

మీరు ఒక్క కమాండ్ రన్ చేస్తే చాలు:
1. మన `TodoMaster-Release.apk` ఆటోమేటిక్‌గా క్లౌడ్‌కి అప్‌లోడ్ అవుతుంది.
2. మనం రాసిన `google-tasks-crud-e2e.yaml` జిప్ ఫైల్ అప్‌లోడ్ అవుతుంది.
3. **Samsung Galaxy S23** మరియు **Google Pixel 8** నిజమైన మొబైల్స్‌లో టెస్ట్ వాటంతట అదే రన్ అవుతుంది.
4. మీకు లైవ్ వీడియో లింక్ & పాస్/ఫెయిల్ రిపోర్ట్ డాష్‌బోర్డ్ వస్తుంది.

### మీ యూజర్‌నేమ్ & యాక్సెస్ కీ ఎక్కడ ఉంటాయి?
1. [BrowserStack Dashboard](https://app-automate.browserstack.com) కి వెళ్ళండి.
2. కుడివైపు పైభాగంలో మీ ప్రొఫైల్ ఐకాన్ పక్కన **"Access Key"** పై క్లిక్ చేయండి.
3. అక్కడ మీ `Username` మరియు `Access Key` కనిపిస్తాయి.

### రన్ చేసే కమాండ్ (PowerShell లో):
```powershell
.\browserstack\run-app-automate.ps1 -Username "YOUR_USERNAME" -AccessKey "YOUR_ACCESS_KEY"
```

స్క్రిప్ట్ రన్ అవ్వగానే మీకు ఈ విధమైన లైవ్ లింక్ వస్తుంది:
`https://app-automate.browserstack.com/dashboard/v2/builds/<build-id>`

---

## విధానం 1: App Live లో చేతులతో మాన్యువల్ టెస్ట్ చేయడం

1. [BrowserStack App Live](https://app-live.browserstack.com) ఓపెన్ చేయండి.
2. `firebase/TodoMaster-Release.apk` అప్‌లోడ్ చేయండి.
3. Samsung Galaxy S23 లేదా Pixel 8 ఎంచుకోండి.
4. మౌస్‌తో క్లిక్ చేసి UI లేఅవుట్, చెక్‌బాక్స్ `◯` ఫంక్షనాలిటీని తనిఖీ చేయండి.
