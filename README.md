# Mediglow 🧪

**Transforming Transparency Into Trust**

## Basic Details

### Team Name
Mediglow Development Team

### Team Members
- **Member 1:** Athira 
- **Member 2:** Aadya 

### Hosted Project Link
[\[Add your project hosted link here\]](https://mediglow.vercel.app/)

---

## Project Description

**Mediglow** is an educational safety analysis platform that provides science-based, structured risk awareness for cosmetic products and medicines. The application uses OCR (Optical Character Recognition) and barcode/QR code scanning to extract ingredient information and delivers professional safety analysis with personalized recommendations. Users can analyze products across three risk sensitivity levels (Conservative, Balanced, Minimalist) to understand potential safety concerns based on their skin type, allergies, age, and health conditions.

---

## The Problem Statement

Consumers lack accessible, reliable tools to understand ingredient safety in cosmetic and medicinal products. Current information is either too technical, too alarming, or scattered across multiple sources. Users need a centralized, science-backed platform that:
- Extracts ingredients from product packaging via OCR
- Scans barcodes/QR codes for quick product identification
- Provides personalized safety analysis
- Delivers educational risk awareness without medical advice
- Respects individual risk tolerance levels

---

## The Solution

**Mediglow** provides an intelligent, user-friendly web application that:

1. **OCR Image Scanning** - Extract text from product packaging images
2. **Barcode/QR Detection** - Identify products instantly via scanning
3. **Smart Ingredient Analysis** - Detect harmful chemicals, interactions, and cumulative risks
4. **Personalized Scoring** - Generate safety scores tailored to user profile
5. **Professional Output** - Deliver structured JSON reports for further analysis
6. **Educational Focus** - Maintain transparent, non-medical approach throughout

---

## Technical Details

### Technologies/Components Used

#### For Software:

**Languages Used:**
- JavaScript (ES6+)
- HTML5
- CSS3

**Frameworks Used:**
- Vanilla JavaScript (No framework dependencies for light footprint)

**Libraries Used:**
- **Tesseract.js v2.1.5** - OCR text extraction
- **Fuse.js v6.6.2** - Fuzzy searching
- **ZXing v0.19.2** - Barcode/Code detection library
- **jsQR v1.4.0** - QR code detection
- **BarcodeDetector API** - Native browser barcode detection

**Tools Used:**
- VS Code - Development environment
- Git - Version control
- GitHub - Repository hosting
- Browser DevTools - Debugging

---

## Features

### Core Features

**Feature 1: Cosmetic Product Analysis**
- Ingredient breakdown with INCI normalization
- Skin compatibility assessment (Oily, Dry, Acne-prone, Sensitive)
- Harmful chemical detection (Parabens, Sulfates, Retinoids, etc.)
- Ingredient interaction warnings
- Cumulative risk analysis
- Personalized safety scoring (0-10)
- Pregnancy risk assessment

**Feature 2: Medicine Safety Awareness**
- Drug classification and purpose
- Active ingredient explanation
- Safety checks (Pregnancy, Age, Allergies)
- Drug interaction awareness
- Risk awareness level classification
- Responsible use reminders

**Feature 3: Intelligent Scanning**
- OCR image scanning for ingredient extraction
- Real-time barcode/QR code detection via camera
- Image-based barcode scanning
- Format detection (QR Code, Code 128, EAN-13, UPC-A/E, etc.)
- Multi-method detection (jsQR, ZXing, Native API)

**Feature 4: Smart Processing**
- Automatic product type detection
- Ingredient normalization and standardization
- OCR confidence assessment
- Missing data flagging
- Regulatory status checking

**Feature 5: User Experience**
- Dark theme with blue-black gradient header
- Responsive design (Mobile & Desktop)
- Real-time camera preview
- JSON output with copy-to-clipboard
- Toast notifications for feedback
- Three risk sensitivity modes (Conservative, Balanced, Minimalist)

**Feature 6: Professional Output**
- Structured JSON analysis
- Downloadable reports
- Multiple analysis fields
- Explainable AI factors
- Data reliability indicators

---

## Implementation

### For Software:

#### Installation

```bash
# 1. Navigate to project directory
cd c:\Users\User\medical

# 2. Open index.html in a modern web browser
# Option A: Double-click index.html
# Option B: Use Live Server in VS Code
#   - Install "Live Server" extension in VS Code
#   - Right-click index.html
#   - Select "Open with Live Server"

# 3. System requirements
# - Modern browser (Chrome, Firefox, Safari, Edge)
# - Camera access (for barcode/OCR scanning)
# - JavaScript enabled
```

#### Run

```bash
# Option 1: Direct browser access
1. Open VS Code
2. Open the medical folder
3. Right-click index.html
4. Select "Open with Live Server"

# Option 2: Simple HTTP Server
python -m http.server 8000
# Then navigate to: http://localhost:8000

# Option 3: Using Node.js http-server
npm install -g http-server
http-server
# Then navigate to: http://localhost:8080

# Option 4: Using npx serve
npx serve .
```

#### Project Structure

```
medical/
├── index.html                 # Main application file
├── manifest.json             # PWA manifest
├── README.md                 # This file
├── data/                     # Data files
│   └── [ingredient database]
└── src/
    ├── app.js               # Main application logic
    ├── styles.css           # Styling (dark theme)
    ├── parser.js            # Product type detection & ingredient extraction
    ├── barcode.js           # Barcode/QR code scanning
    ├── ocr.js               # OCR functionality
    ├── ruleEngine.js        # Safety analysis logic
    └── service-worker.js    # PWA service worker
```

---

## Project Documentation

### For Software:

#### Screenshots

![Screenshot1: Dark Theme Dashboard](Add screenshot 1 here)
**Caption:** Main dashboard showing dual-tab interface with dark theme, blue-black header gradient, and cosmetic product analysis form with all input fields visible.

![Screenshot2: Barcode Scanning](Add screenshot 2 here)
**Caption:** Real-time barcode/QR code scanning interface showing camera preview, detection results, and auto-populated product name field.

![Screenshot3: Analysis Results](Add screenshot 3 here)
**Caption:** JSON analysis output for cosmetic product showing ingredient breakdown, safety scores, harmful chemical detection, and personalized recommendations.

#### Diagrams

**System Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │            Frontend (HTML/CSS/JS)             │  │
│  │  - Dark Theme UI                             │  │
│  │  - Form inputs & controls                    │  │
│  │  - Results display                           │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                     │
│  ┌────────────▼─────────────────────────────────┐  │
│  │         Core Processing Layer                │  │
│  ├──────────────────────────────────────────────┤  │
│  │ ┌──────────────────────────────────────────┐ │  │
│  │ │  OCR Module (Tesseract.js)               │ │  │
│  │ │  - Image scanning                        │ │  │
│  │ │  - Text extraction                       │ │  │
│  │ └──────────────────────────────────────────┘ │  │
│  │ ┌──────────────────────────────────────────┐ │  │
│  │ │  Barcode Module (jsQR + ZXing)           │ │  │
│  │ │  - QR code detection                     │ │  │
│  │ │  - Barcode scanning                      │ │  │
│  │ │  - Multiple format support               │ │  │
│  │ └──────────────────────────────────────────┘ │  │
│  │ ┌──────────────────────────────────────────┐ │  │
│  │ │  Parser Module                           │ │  │
│  │ │  - Product type detection                │ │  │
│  │ │  - Ingredient extraction                 │ │  │
│  │ │  - Normalization & standardization       │ │  │
│  │ └──────────────────────────────────────────┘ │  │
│  │ ┌──────────────────────────────────────────┐ │  │
│  │ │  Rule Engine                             │ │  │
│  │ │  - Safety analysis                       │ │  │
│  │ │  - Scoring algorithm                     │ │  │
│  │ │  - Risk assessment                       │ │  │
│  │ └──────────────────────────────────────────┘ │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                     │
│  ┌────────────▼─────────────────────────────────┐  │
│  │      Output & Storage Layer                  │  │
│  ├──────────────────────────────────────────────┤  │
│  │  - JSON generation                          │  │
│  │  - LocalStorage (PWA)                       │  │
│  │  - Download functionality                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data Flow:**

```
User Input → OCR/Barcode → Parser → Rule Engine → JSON Output
   ↓              ↓            ↓          ↓            ↓
Images/     Extract Text   Detect     Safety      Download/
Barcodes    & Ingredients  Type       Analysis    Display
```

**Application Workflow:**

```
1. User Opens App
   ↓
2. Select Product Type (Cosmetic/Medicine)
   ↓
3. Choose Input Method:
   ├─ Manual Entry (Type ingredients)
   ├─ OCR Image (Upload product image)
   ├─ OCR Camera (Capture frame)
   ├─ Barcode Image (Scan barcode from image)
   └─ Barcode Camera (Scan QR/Barcode with camera)
   ↓
4. Fill User Profile (Skin type, Allergies, Age, etc.)
   ↓
5. Select Risk Sensitivity Mode
   ├─ Conservative (Stricter assessment)
   ├─ Balanced (Standard assessment)
   └─ Minimalist (Lenient assessment)
   ↓
6. Click Analyze
   ↓
7. Receive JSON Output
   ├─ Ingredient breakdown
   ├─ Safety scores
   ├─ Risk warnings
   └─ Personalized recommendations
   ↓
8. Download or Copy Results
```

---

## Features in Detail

### Cosmetic Analysis Output

```json
{
  "Product_Analysis": {
    "Ingredient_Breakdown": [
      {
        "ingredient": "water",
        "normalized": "Water",
        "purpose": "Solvent, hydration",
        "benefits": ["Hydration", "Base ingredient"],
        "sideEffects": ["Minimal"],
        "comedonicRisk": 0,
        "irritationRisk": "Low"
      }
    ],
    "Skin_Compatibility": {
      "oily_skin": "Yes - Non-comedogenic",
      "dry_skin": "Yes - Provides hydration",
      "acne_prone": "Yes - Minimal irritation",
      "sensitive_skin": "Yes - Gentle formula"
    },
    "Harmful_Chemical_Detection": {
      "parabens": "Not Present",
      "sulfates": "Not Present",
      "fragrance": "Present (Moderate Concern)"
    },
    "Personalized_Safety_Score": {
      "overall_product_safety_score": 8.5,
      "suitability_score_for_user": 8.0,
      "summary": "Educational cosmetic safety rating"
    }
  }
}
```

### Medicine Analysis Output

```json
{
  "Medicine_Analysis": {
    "Medicine_Classification": {
      "drug_category": "Pain reliever",
      "primary_purpose": "Fever and pain management",
      "otc_or_prescription": "OTC"
    },
    "Active_Ingredient_Explanation": {
      "ingredient": "Ibuprofen",
      "how_it_works": "NSAID anti-inflammatory",
      "common_side_effects": ["Stomach upset", "Dizziness"]
    },
    "Safety_Checks": {
      "pregnancy_warning": "Use with caution",
      "age_caution": "Not for children under 6 months",
      "allergy_risk": "None detected"
    },
    "Informational_Safety_Rating": {
      "score": 7,
      "note": "General safety awareness only"
    }
  }
}
```

---

## Camera Functions

### Camera States

- **🟢 Camera: ON** - Camera is active and ready for scanning
- **⏸️ Camera: PAUSED** - Camera is paused (stream still active)
- **🔴 Camera: OFF** - Camera permission denied

### Button Functions

| Button | Function | State |
|--------|----------|-------|
| Request Camera | Turns camera ON | Enables OCR/Barcode buttons |
| Stop Camera | Pauses camera | Disables scan buttons |
| OCR Image | Extract text from image | Active when camera ON |
| OCR Camera | Capture & extract text | Active when camera ON |
| Barcode Image | Scan barcode from image | Active when camera ON |
| Start Scan | Begin barcode detection | Active when camera ON |
| Stop | Pause barcode scanning | Active during scan |

---

## API Documentation

### Analysis Endpoints (Client-side)

#### Cosmetic Analysis

```javascript
// Function: analyzeCosmetic()
Input: {
  productName: string,
  ingredients: Array,
  profile: {
    skinType: string,
    allergies: string,
    age: number,
    pregnancy: "Yes" | "No",
    riskSensitivity: "Conservative" | "Balanced" | "Minimalist"
  }
}

Output: {
  Product_Analysis: {
    Ingredient_Breakdown: [],
    Skin_Compatibility: {},
    Harmful_Chemical_Detection: {},
    Ingredient_Interaction_Warnings: {},
    Cumulative_Risk_Analysis: {},
    Skin_Barrier_Impact: {},
    Pregnancy_Risk_Assessment: {},
    Global_Regulatory_Status: {},
    Personalized_Safety_Score: {},
    Explainable_AI_Factors: {},
    Data_Reliability: {}
  }
}
```

#### Medicine Analysis

```javascript
// Function: analyzeMedicine()
Input: {
  productName: string,
  ingredients: Array,
  profile: {
    age: number,
    pregnancy: "Yes" | "No",
    allergies: string,
    conditions: string,
    riskSensitivity: "Conservative" | "Balanced" | "Minimalist"
  }
}

Output: {
  Medicine_Analysis: {
    Medicine_Classification: {},
    Active_Ingredient_Explanation: {},
    Safety_Checks: {},
    Drug_Interaction_Awareness: {},
    Risk_Awareness_Level: {},
    Responsible_Use_Reminder: {},
    Informational_Safety_Rating: {},
    Explainable_AI_Factors: {},
    Data_Reliability: {}
  }
}
```

---

## OCR & Barcode Formats Supported

### OCR (Tesseract.js)
- Extracts text from product packaging images
- Supports multiple languages
- Handles various image qualities

### Barcode Formats Supported
- **1D Codes:** Code 128, Code 39, Code 93, Codabar, EAN-13, EAN-8, UPC-A, UPC-E, ITF
- **2D Codes:** QR Code, Data Matrix, PDF417, Aztec

### Detection Methods (Priority Order)
1. **jsQR** - Specialized QR code detection (fastest)
2. **BarcodeDetector API** - Native browser support
3. **ZXing** - Cross-browser fallback library

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✓ Full | All features supported |
| Firefox 88+ | ✓ Full | All features supported |
| Safari 14+ | ✓ Full | All features supported |
| Edge 90+ | ✓ Full | All features supported |
| Mobile Chrome | ✓ Full | Mobile optimization applied |
| Mobile Safari | ✓ Full | Mobile optimization applied |

---

## Additional Documentation

### Processing Rules

#### Product Type Detection
- **Priority:** User selection → Keyword detection → Uncertain
- **Medicine indicators:** "Drug Facts", "Active Ingredient", mg, %, USP, IP, BP
- **Cosmetic indicators:** "Ingredients:", INCI formatting, Botanical names

#### Ingredient Extraction
- Separates by commas/semicolons
- Removes marketing text and directions
- Normalizes common spellings
- Preserves strength/concentration info

#### Confidence Levels
- **High:** Clear ingredient block, minimal distortion
- **Moderate:** Minor corrections, slight fragmentation
- **Low:** Blurry/fragmented text, missing sections

---

## Known Limitations

1. **OCR Accuracy** - Depends on image quality and lighting
2. **Barcode Detection** - Requires clear, straight barcode positioning
3. **Ingredient Database** - Limited to common ingredients (can be expanded)
4. **No Internet Required** - All processing done locally (no external API calls)
5. **Browser Storage** - LocalStorage limited to ~5-10MB

---

## Future Enhancements

- [ ] Ingredient database expansion
- [ ] Multi-language support
- [ ] Advanced interaction checker
- [ ] Skin condition specific analysis
- [ ] Community ingredient reviews
- [ ] Mobile app version (React Native)
- [ ] Backend API for cloud storage
- [ ] Machine learning for better predictions
- [ ] Integration with product databases
- [ ] Accessibility improvements (WCAG 2.1 AA)

---

## Security & Privacy

✓ **No Data Collection** - All analysis done locally in browser
✓ **No Cookies** - No tracking or cookies used
✓ **No External Calls** - All libraries loaded locally
✓ **No Account Required** - Completely anonymous
✓ **HTTPS Ready** - Can be deployed with SSL/TLS

---

## Demo Output

### Example 1: Cosmetic Analysis

**Input:**
```
Product Type: Cosmetic
Product Name: Hydrating Face Cream
Ingredients: Water, Glycerin, Hyaluronic Acid, Vitamin E, Fragrance
Skin Type: Dry
Known Allergies: None
Risk Sensitivity: Balanced
```

**Output:**
```json
{
  "Product_Analysis": {
    "Ingredient_Breakdown": [
      {
        "ingredient": "water",
        "normalized": "Water",
        "purpose": "Solvent",
        "comedogenic_risk": 0,
        "irritation_risk": "Low"
      }
    ],
    "Personalized_Safety_Score": {
      "overall_product_safety_score": 8.5,
      "suitability_score_for_user": 9.0,
      "summary": "Highly suitable for dry skin"
    }
  }
}
```

### Example 2: QR Code Barcode Scan

**Input:**
- Scan QR code from phone camera

**Output:**
```json
{
  "detection": 1,
  "barcode": "5901234123457",
  "format": "EAN_13",
  "detected_at": "2024-02-21T05:38:31.234Z"
}
```

---

## Video Demo

[Add your demo video link here - YouTube, Google Drive, etc.]

**What the demo shows:**
- App overview and UI navigation
- OCR image scanning process
- Real-time barcode detection
- Cosmetic product analysis
- Medicine safety awareness
- JSON output generation and download

---

## Project Demo Links

- **Live Site:** [Add hosted link]
- **GitHub Repository:** [Add GitHub link]
- **Download APK:** [If mobile version available]
- **Online Demo:** [If deployed online]

---

## AI Tools Used

### GitHub Copilot
**Purpose:** Code generation, debugging, and optimization
- **Examples Used For:**
  - Generated barcode detection algorithm
  - Created safety analysis rule engine
  - Debugging async camera functions
  - Code optimization suggestions

**Key Prompts Used:**
- "Create QR code detection with jsQR and ZXing fallback"
- "Debug camera stream cleanup issues"
- "Generate ingredient safety analysis logic"
- "Optimize OCR image processing pipeline"

**Percentage of AI-generated code:** ~40%

### Human Contributions:
- Architecture design and planning
- UI/UX design decisions
- Safety rule definition
- Integration testing
- Documentation
- Feature refinement

---

## Team Contributions

**Athira:**
- Frontend development (HTML, CSS)
- UI/UX design and dark theme implementation
- Camera controls and state management
- User interface testing and refinement

**Aadiya:**
- Backend logic (JavaScript)
- OCR and barcode scanning implementation
- Safety analysis rule engine
- Data processing and JSON structure design
- Testing and debugging

---

## Installation Guide

### For Web Browser

1. **Clone or Download Repository**
   ```bash
   git clone [repository-link]
   cd medical
   ```

2. **Open in Browser**
   - **Option A:** Double-click `index.html`
   - **Option B:** Right-click → Open with Live Server (VS Code)
   - **Option C:** Use Python HTTP Server
     ```bash
     python -m http.server 8000
     ```

3. **Grant Permissions**
   - Allow camera access when prompted
   - Allow microphone (if using audio features)

4. **Start Using**
   - Select product type (Cosmetic/Medicine)
   - Choose input method
   - Fill in product/user information
   - Click Analyze for results

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not working | Check browser permissions, try different browser |
| OCR not detecting text | Ensure good image quality and lighting |
| Barcode not scanning | Keep barcode steady, ensure it's in frame center |
| Slow performance | Clear browser cache, close other tabs |
| JSON not displaying | Check console for errors, try different product |

---

## License

This project is licensed under the **MIT License** - see the LICENSE file for details.

MIT License permits free use, modification, and distribution with attribution.

---

## Contact & Support

For issues, suggestions, or contributions:
- **Email:** [team-email@example.com]
- **GitHub Issues:** [Add issues link]
- **Project Repository:** [Add repo link]

---

## Disclaimer

⚠️ **Important:** Mediglow provides educational safety analysis only. It does NOT:
- Replace professional medical advice
- Diagnose medical conditions
- Prescribe dosage or treatment
- Advise stopping medication
- Substitute for healthcare professional consultation

Always consult qualified healthcare professionals for medical decisions.

---

**Made with ❤️ by Athira & Aadiya**

Last Updated: February 21, 2024
Version: 1.0.0
