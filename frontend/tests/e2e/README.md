# Maestro End-to-End (E2E) Testing Guide

Comprehensive guide to executing automated Maestro E2E test flows across all mobile environments.

---

## 🛠️ 1. Installing Maestro CLI (Windows)

Maestro can be installed in PowerShell with one command:
```powershell
# Install Maestro CLI via official curl installer (or Git Bash)
curl -Ls "https://get.maestro.mobile.dev" | bash
```
Or via npm / standalone binary.

---

## 🚀 2. The 5 Ways to Execute Maestro Tests

### A. Local Physical Phone (via USB Debugging)
1. Enable **Developer Options -> USB Debugging** on your Android phone.
2. Connect your phone to your PC via USB cable.
3. Verify connection:
   ```powershell
   tools\platform-tools\adb.exe devices
   ```
4. Run the Maestro test:
   ```powershell
   maestro test frontend/tests/e2e/suite.yaml
   ```
   *Watch your phone's screen automatically launch the app, type text, tap buttons, and verify UI elements in real time!*

---

### B. Local Android Studio Emulator
1. Start an Android Virtual Device (AVD) from Android Studio.
2. Run:
   ```powershell
   maestro test frontend/tests/e2e/suite.yaml
   ```

---

### C. Maestro Cloud (Instant Cloud Devices)
Run your tests on real cloud devices hosted by Maestro without maintaining local emulators:
```powershell
maestro cloud --apiKey <YOUR_MAESTRO_KEY> frontend/build/app.apk frontend/tests/e2e/suite.yaml
```

---

### D. BrowserStack App Automate (Multi-Device Matrix)
1. Build your APK:
   ```powershell
   cd frontend
   npx eas build -p android --profile preview
   ```
2. Upload the APK to BrowserStack:
   ```bash
   curl -u "USER:KEY" -X POST "https://api-cloud.browserstack.com/app-automate/upload" -F "file=@app.apk"
   ```
3. Run the automated suite across 10+ real devices (Samsung S23, Google Pixel 8, OnePlus 11, etc.) simultaneously.

---

### E. Automated GitHub Actions CI/CD
Maestro tests can be triggered automatically on every pull request using the official GitHub Action:
```yaml
- name: Run Maestro Tests
  uses: mobile-dev-inc/action-maestro@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: frontend/build/app.apk
    workspace: frontend/tests/e2e/
```

---

## 📂 Test Flows Included:
1. `todo-flow.yaml`: Create task, status selection, and list filtering.
2. `02-edit-delete.yaml`: Quick status cycle, edit modal, and soft delete confirmation.
3. `03-theme-toggle.yaml`: Switching between Light (White) and Dark theme.
4. `suite.yaml`: Master regression runner executing all flows.

