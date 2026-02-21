let DB = null;

async function getDB() {
  if (!DB) {
    const url = new URL('../data/ingredient_db.json', import.meta.url).href;
    const res = await fetch(url);
    DB = await res.json();
  }
  return DB;
}

// Expanded harmful chemical definitions to match new spec
const HARMFUL_CHEMICALS = {
  Parabens: {
    keywords: ['paraben', 'methylparaben', 'ethylparaben', 'propylparaben', 'butylparaben'],
    concern: 'Present (Low Concern)',
    info: 'Preservatives with some controversial studies, though generally considered safe at low concentrations by regulatory bodies.'
  },
  Sulfates: {
    keywords: ['sodium lauryl sulfate', 'sls', 'sodium laureth sulfate', 'sles'],
    concern: 'Present (Moderate Concern)',
    info: 'Surfactants that can be irritating or drying for some skin types, especially sensitive skin.'
  },
  Phthalates: {
    keywords: ['phthalate', 'diethyl phthalate', 'dep', 'dibutyl phthalate', 'dbp'],
    concern: 'Present (Moderate Concern)',
    info: 'Often used in fragrances; some types have been linked to endocrine disruption.'
  },
  'Formaldehyde releasers': {
    keywords: ['quaternium-15', 'diazolidinyl urea', 'imidazolidinyl urea', 'dmdm hydantoin'],
    concern: 'Present (Moderate Concern)',
    info: 'Preservatives that can release small amounts of formaldehyde, a known allergen.'
  },
  Triclosan: {
    keywords: ['triclosan'],
    concern: 'Present (High Concern)',
    info: 'An antibacterial agent with concerns about antibiotic resistance and hormonal effects. Restricted by the FDA in certain products.'
  },
  Hydroquinone: {
    keywords: ['hydroquinone'],
    concern: 'Present (High Concern)',
    info: 'A skin-lightening agent that is prescription-only in many regions (e.g., EU, India) due to potential side effects.'
  },
  'High-strength retinoids': {
    keywords: ['tretinoin', 'tazarotene', 'adapalene'], // Note: Retinol is handled separately
    concern: 'Present (High Concern)',
    info: 'Prescription-strength retinoids that require medical supervision.'
  }
};

function detectHarmful(ingredientNames) {
  const found = {};
  Object.entries(HARMFUL_CHEMICALS).forEach(([name, def]) => {
    const match = ingredientNames.find(n => def.keywords.some(kw => n.includes(kw)));
    found[name] = match ? def.concern : 'Not Present';
  });
  // Special handling for fragrance
  if (ingredientNames.some(n => n.includes('parfum') || n.includes('fragrance'))) {
    found['Fragrance allergens'] = 'Present (Moderate Concern)';
  } else {
    found['Fragrance allergens'] = 'Not Present';
  }
  return found;
}

export async function analyzeCosmetic({ productName, ingredients, profile, sensitivity = 'Balanced' }) {
  const db = await getDB();
  const ingNames = ingredients.map(i => i.name);

  const ingredient_breakdown = ingredients.map(i=>{
    const meta = db[i.name] || null;
    return {
      "Ingredient Name": meta ? meta.name : i.name,
      "Purpose": meta ? meta.purpose : "Unknown",
      "Key Benefits": meta ? meta.benefits || "Unknown" : "Unknown",
      "Potential Side Effects": meta ? meta.side_effects || "Unknown" : "Unknown",
      "Comedogenic Risk": meta ? meta.comedogenic : null,
      "Irritation Risk": meta ? meta.irritation || "Medium" : "Unknown",
    };
  });

  const harmful = detectHarmful(ingNames);

  // --- New Spec Logic ---

  // Skin Compatibility
  const skinCompatibility = {
    "Oily Skin": {
      Suitable: ingNames.some(n => n.includes('salicylic acid')) || !ingNames.some(n => n.includes('oil')) ? 'Yes' : 'No',
      Reason: ingNames.some(n => n.includes('salicylic acid')) ? 'Contains BHA beneficial for oily skin.' : (!ingNames.some(n => n.includes('oil')) ? 'Appears to be oil-free.' : 'May contain oils not ideal for all oily skin types.')
    },
    "Dry Skin": {
      Suitable: ingNames.some(n => n.includes('glycerin') || n.includes('hyaluronic acid')) ? 'Yes' : 'No',
      Reason: 'Contains humectants like glycerin which are beneficial for dry skin.'
    },
    "Acne-Prone Skin": {
      Suitable: ingredient_breakdown.some(i => i['Comedogenic Risk'] > 2) ? 'No' : 'Yes',
      Reason: ingredient_breakdown.some(i => i['Comedogenic Risk'] > 2) ? 'Contains ingredients with a comedogenic rating > 2.' : 'No high-comedogenic ingredients detected.'
    },
    "Sensitive Skin": {
      Suitable: harmful['Fragrance allergens'] !== 'Not Present' || ingredient_breakdown.some(i => i['Irritation Risk'] === 'High') ? 'No' : 'Yes',
      Reason: harmful['Fragrance allergens'] !== 'Not Present' ? 'Contains fragrance, a common irritant.' : (ingredient_breakdown.some(i => i['Irritation Risk'] === 'High') ? 'Contains high-irritation ingredients.' : 'Appears free of common irritants.')
    }
  };

  // Ingredient Interaction Warnings
  const hasAHA = ingNames.some(n => n.includes('glycolic') || n.includes('lactic'));
  const hasBHA = ingNames.some(n => n.includes('salicylic'));
  const hasRetinoid = ingNames.some(n => n.includes('retinol') || n.includes('retinyl'));
  const interactionWarnings = {
    "Acid stacking (AHA/BHA/PHA)": (hasAHA && hasBHA) ? 'Present: AHA/BHA stacking may increase irritation. Use with caution.' : 'Not detected',
    "Retinol + exfoliating acids": (hasRetinoid && (hasAHA || hasBHA)) ? 'Present: Combining retinoids and acids can cause dryness and irritation. Consider alternating usage.' : 'Not detected',
    "Benzoyl peroxide + Vitamin C": 'Not detected', // Cannot reliably detect without more data
    "Multiple strong actives": ( (hasRetinoid?1:0) + (hasAHA?1:0) + (hasBHA?1:0) > 1) ? 'Yes, multiple potent actives detected. Introduce slowly.' : 'No',
    "Fragrance + alcohol stacking": (ingNames.some(n => n.includes('alcohol')) && ingNames.some(n => n.includes('parfum'))) ? 'Present: Combination can be drying and irritating for sensitive skin.' : 'Not detected',
  };

  // Cumulative Risk Analysis
  const highIrritants = ingredient_breakdown.filter(i => i['Irritation Risk'] === 'High').length;
  const mediumIrritants = ingredient_breakdown.filter(i => i['Irritation Risk'] === 'Medium').length;
  const totalIrritationLoad = highIrritants > 1 || (highIrritants === 1 && mediumIrritants > 1) ? 'High' : (highIrritants === 1 || mediumIrritants > 2 ? 'Moderate' : 'Low');

  const cumulativeRisk = {
    "Total Irritation Load": totalIrritationLoad,
    "Barrier Stress Risk": totalIrritationLoad === 'High' ? 'High' : (totalIrritationLoad === 'Moderate' ? 'Moderate' : 'Low'),
    "Over-Exfoliation Risk": (hasAHA && hasBHA) || (hasRetinoid && (hasAHA || hasBHA)) ? 'High' : 'Low',
    "Preservative Load": harmful['Parabens'] !== 'Not Present' || harmful['Formaldehyde releasers'] !== 'Not Present' ? 'Moderate' : 'Low',
    "Fragrance Load": harmful['Fragrance allergens'] !== 'Not Present' ? 'High' : 'Low',
  };

  // Skin Barrier Impact
  const skinBarrierImpact = {
    "Barrier Friendly?": totalIrritationLoad === 'High' ? 'No' : 'Yes',
    "Barrier-support ingredients present?": ingNames.some(n => n.includes('glycerin') || n.includes('ceramide') || n.includes('niacinamide')) ? 'Yes' : 'No',
    "Barrier-disruptive ingredients present?": highIrritants > 0 || harmful['Sulfates'] !== 'Not Present' ? 'Yes' : 'No',
  };

  // Pregnancy Risk Assessment
  const flaggedForPregnancy = [];
  let pregClassification = 'Generally Safe';
  if (ingNames.some(n => HARMFUL_CHEMICALS['High-strength retinoids'].keywords.some(kw => n.includes(kw))) || ingNames.some(n => n.includes('hydroquinone'))) {
    pregClassification = 'Avoid During Pregnancy';
    if (ingNames.some(n => n.includes('hydroquinone'))) flaggedForPregnancy.push('Hydroquinone');
    ingNames.filter(n => HARMFUL_CHEMICALS['High-strength retinoids'].keywords.some(kw => n.includes(kw))).forEach(i => flaggedForPregnancy.push(i));
  } else if (ingNames.some(n => n.includes('retinol'))) {
    pregClassification = 'Use With Caution';
    flaggedForPregnancy.push('Retinol');
  } else if (ingNames.some(n => n.includes('salicylic acid'))) {
    // Note: low-dose topical is often considered safe, but we can't know concentration.
    pregClassification = 'Use With Caution';
    flaggedForPregnancy.push('Salicylic Acid (High Dose)');
  }
  const pregnancyRisk = {
    Classification: pregClassification,
    "Flagged Ingredients": flaggedForPregnancy
  };

  // Global Regulatory Status
  let regStatus = "No major regulatory restrictions identified based on listed ingredients.";
  if (harmful['Hydroquinone'] !== 'Not Present') {
    regStatus = "Contains Hydroquinone, which is a prescription-only or banned substance for cosmetics in the EU, UK, and other regions.";
  } else if (harmful['Triclosan'] !== 'Not Present') {
    regStatus = "Contains Triclosan, which is restricted in cosmetics in several regions and by the US FDA for certain uses.";
  }

  // Scoring
  let score = 10;
  let suitability = 10;
  const scoreFactors = [];
  const suitabilityFactors = [profile.skinType, profile.allergies || 'no allergies specified', sensitivity];

  // Deductions for harmful chemicals
  Object.entries(harmful).forEach(([key, value]) => {
    if (value.includes('High Concern')) { score -= 2.5; scoreFactors.push(`High concern chemical: ${key}`); }
    if (value.includes('Moderate Concern')) { score -= 1.5; scoreFactors.push(`Moderate concern chemical: ${key}`); }
  });
  // Deductions for irritation
  if (totalIrritationLoad === 'High') { score -= 2; scoreFactors.push('High cumulative irritation load'); }
  if (totalIrritationLoad === 'Moderate') { score -= 1; }

  // Deductions for user suitability
  suitability = score;
  if (profile.skinType === 'Sensitive' && totalIrritationLoad !== 'Low') { suitability -= 2; suitabilityFactors.push('High irritation for sensitive skin'); }
  if (profile.allergies) {
    const userAllergies = profile.allergies.split(',').map(a => a.trim().toLowerCase());
    if (ingNames.some(ing => userAllergies.includes(ing))) { suitability -= 4; suitabilityFactors.push('Contains known user allergy'); }
  }
  if (profile.pregnancy === 'Yes' && pregClassification !== 'Generally Safe') { suitability -= 3; suitabilityFactors.push('Not ideal for pregnancy'); }

  // Adjust for sensitivity mode
  const sensitivityMultiplier = sensitivity === 'Conservative' ? 0.8 : (sensitivity === 'Minimalist' ? 1.2 : 1);
  score = Math.max(0, Math.min(10, score * sensitivityMultiplier));
  suitability = Math.max(0, Math.min(10, suitability * sensitivityMultiplier));

  // Data Reliability
  const ingredient_missing = ingredients.filter(i => !db[i.name]).length;
  const completeness = ingredient_missing === 0 ? 'High' : (ingredient_missing / ingredients.length > 0.5 ? 'Low' : 'Moderate');
  const confidence = completeness === 'High' ? 'High' : (completeness === 'Moderate' ? 'Moderate' : 'Low');

  const result = {
    Product_Analysis: {
      Ingredient_Breakdown: ingredient_breakdown,
      Skin_Compatibility: skinCompatibility,
      Harmful_Chemical_Detection: harmful,
      Ingredient_Interaction_Warnings: interactionWarnings,
      Cumulative_Risk_Analysis: cumulativeRisk,
      Skin_Barrier_Impact: skinBarrierImpact,
      Pregnancy_Risk_Assessment: pregnancyRisk,
      Global_Regulatory_Status: { "Status": regStatus },
      Personalized_Safety_Score: {
        "Overall Product Safety Score": parseFloat(score.toFixed(1)),
        "Suitability Score for THIS user": parseFloat(suitability.toFixed(1)),
        "Summary": "Informational cosmetic safety rating, not a medical risk score. Based on ingredient data, not product formulation."
      },
      Explainable_AI_Factors: {
        "Top_Factors_Affecting_Overall_Score": scoreFactors.slice(0, 3),
        "Top_Factors_Affecting_User_Suitability": suitabilityFactors.slice(0, 3)
      },
      Data_Reliability: {
        Ingredient_List_Completeness: completeness,
        "OCR_Uncertainty_Impact": "Not Applicable for manual entry.",
        "Concentration_Data_Missing_Impact": "High. Risk estimates are conservative as ingredient concentrations are unknown.",
        "Overall_Analysis_Confidence": confidence
      }
    }
  };
  return result;
}

export function analyzeMedicine({ productName, ingredients, profile }) {
  const actives = ingredients.map(i => i.name);
  const hasActives = actives.length > 0;

  return {
    Medicine_Analysis: {
      Medicine_Classification: {
        "Drug category": "To be determined by a healthcare professional.",
        "Primary purpose": "Consult product packaging and a healthcare professional for the intended use.",
        "OTC or Prescription": "This must be verified on the product packaging or by a pharmacist."
      },
      Active_Ingredient_Explanation: {
        "How it works": "Each active ingredient has a specific mechanism. This information must be provided by a pharmacist or doctor.",
        "Common side effects": "Refer to the patient information leaflet included with the medicine.",
        "Clearly labeled serious warnings": "Always read the 'Warnings' and 'When not to use' sections on the label. Consult a doctor for clarification."
      },
      Safety_Checks: {
        "Pregnancy warning": "Pregnancy status is critical. Many medicines are not safe during pregnancy. This requires professional medical consultation.",
        "Age-related caution": "Dosage and safety can vary significantly with age, especially for children and the elderly. Follow age instructions strictly.",
        "Allergy risk detection": "If you have known allergies (e.g., to penicillin, aspirin), cross-reference them with the active and inactive ingredients list with a pharmacist.",
        "Condition-specific caution": "Existing conditions (e.g., kidney disease, high blood pressure) can be severely impacted by medications. Full disclosure to your doctor is essential."
      },
      Drug_Interaction_Awareness: {
        "Interaction potential": "All medicines, including OTCs and supplements, can interact. Provide a full list of everything you take to your doctor and pharmacist.",
        "Mechanism": "Interactions can increase side effects or reduce effectiveness. This is a complex medical topic requiring professional evaluation."
      },
      Risk_Awareness_Level: {
        "Classification": "Unknown without professional evaluation. All medicines carry risk.",
        "Note": "Risk level varies from 'Low-risk OTC' to 'High-risk (medical supervision essential)'. A professional must make this determination."
      },
      Responsible_Use_Reminder: {
        "Guidance": "ALWAYS follow the guidance of a licensed healthcare professional (doctor or pharmacist).",
        "Instructions": "NEVER exceed the labeled dosage or duration of use without medical advice.",
        "Disclaimer": "Mediglow provides educational awareness and CANNOT replace professional medical advice, diagnosis, or treatment.",
        "Side Effects": "Report any unexpected side effects to your healthcare provider immediately."
      },
      Informational_Safety_Rating: {
        "Score": "N/A",
        "Note": "Assigning a simple score to a medicine is inappropriate and dangerous. Safety is relative to a specific patient and condition, as assessed by a professional."
      },
      Explainable_AI_Factors: {
        "Top Contributors": [
          "Requirement for professional medical diagnosis.",
          "Complexity of drug interactions.",
          "Individual patient health profile."
        ]
      },
      Data_Reliability: {
        "Completeness of Active Ingredients": hasActives ? "User-provided, requires verification against product label." : "Missing. Analysis is not possible without active ingredients."
      }
    }
  };
}
