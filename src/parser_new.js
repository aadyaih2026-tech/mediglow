// PRODUCT TYPE DETECTION
export function detectProductType(text, userSelectedType = null) {
  // Priority 1: Use user-selected type if valid
  if (userSelectedType && ['Cosmetic', 'Medicine'].includes(userSelectedType)) {
    return { type: userSelectedType, confidence: 'user-selected' };
  }

  // Priority 2: Detect using keywords
  const medicineIndicators = [
    'Drug Facts',
    'Active Ingredient',
    'USP', 'IP', 'BP',
    /\bmg\b/, /\d+%/, /w\/w/,
    'Dosage', 'Take', 'Dose'
  ];

  const cosmeticIndicators = [
    'Ingredients:',
    'INCI',
    'Botanical',
    'Fragrance',
    'Water', 'Aqua',
    'Oil'
  ];

  const medicineMatches = medicineIndicators.filter(indicator => {
    if (indicator instanceof RegExp) return indicator.test(text);
    return text.toLowerCase().includes(indicator.toLowerCase());
  }).length;

  const cosmeticMatches = cosmeticIndicators.filter(indicator => {
    if (indicator instanceof RegExp) return indicator.test(text);
    return text.toLowerCase().includes(indicator.toLowerCase());
  }).length;

  if (medicineMatches > cosmeticMatches && medicineMatches > 0) {
    return { type: 'Medicine', confidence: 'high', matches: medicineMatches };
  } else if (cosmeticMatches > 0) {
    return { type: 'Cosmetic', confidence: 'high', matches: cosmeticMatches };
  }

  return { type: 'Uncertain', confidence: 'low', medicineMatches, cosmeticMatches };
}

// INGREDIENT EXTRACTION FOR COSMETICS
export function extractCosmeticIngredients(text) {
  // Find ingredient section
  const ingredientMatch = text.match(/ingredients?:\s*([\s\S]*?)(?=directions|storage|warning|$)/i);
  const ingredientText = ingredientMatch ? ingredientMatch[1] : text;

  // Remove marketing text and directions
  const cleaned = ingredientText
    .replace(/directions?:[\s\S]*?$/i, '')
    .replace(/storage:[\s\S]*?$/i, '')
    .replace(/warning:[\s\S]*?$/i, '')
    .replace(/contains:[\s\S]*?$/i, '')
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .replace(/\n/g, ',')
    .replace(/\s*,\s*/g, ',')
    .trim();

  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);

  return {
    ingredients: parts.map(p => ({
      raw: p,
      normalized: normalizeCosmeticIngredient(p)
    })),
    missingFlag: ingredientMatch === null
  };
}

// INGREDIENT EXTRACTION FOR MEDICINES
export function extractMedicineIngredients(text) {
  const medicinePattern = /active ingredient[s]?:([\s\S]*?)(?=inactive|direction|warning|$)/i;
  const inactivePattern = /inactive ingredient[s]?:([\s\S]*?)(?=direction|warning|$)/i;

  const activeMatch = text.match(medicinePattern);
  const inactiveMatch = text.match(inactivePattern);

  const activeText = activeMatch ? activeMatch[1] : '';
  const inactiveText = inactiveMatch ? inactiveMatch[1] : '';

  const missingFlag = !activeMatch || activeText.trim().length === 0;

  return {
    active: parseWithStrength(activeText),
    inactive: parseWithStrength(inactiveText),
    missingFlag,
    incomplete: missingFlag
  };
}

// Parse ingredients with strength (mg, %, etc.)
function parseWithStrength(text) {
  if (!text) return [];

  const parts = text.split(/[,;]/).map(p => p.trim()).filter(Boolean);

  return parts.map(p => {
    const strengthMatch = p.match(/(.+?)\s*(\d+\.?\d*\s*(?:mg|g|%|w\/w|IU|units)?)\s*(?:per|each)?(.*)$/i);

    if (strengthMatch) {
      return {
        name: strengthMatch[1].trim(),
        strength: strengthMatch[2].trim(),
        form: strengthMatch[3] ? strengthMatch[3].trim() : null,
        raw: p
      };
    }

    return { name: p, strength: null, form: null, raw: p };
  });
}

// NORMALIZATION FOR COSMETICS
function normalizeCosmeticIngredient(ingredient) {
  const normalizationMap = {
    'aqua': 'Water',
    'glycerin': 'Glycerin',
    'tocopheryl acetate': 'Vitamin E Acetate',
    'retinyl palmitate': 'Retinoid (Retinyl Palmitate)',
    'sodium lauryl sulfate': 'Sodium Lauryl Sulfate (SLS)',
    'sodium laureth sulfate': 'Sodium Laureth Sulfate (SLES)',
    'methylparaben': 'Methylparaben',
    'propylparaben': 'Propylparaben',
    'butylparaben': 'Butylparaben',
    'phthalates': 'Phthalates',
    'triclosan': 'Triclosan',
    'hydroquinone': 'Hydroquinone',
    'parfum': 'Fragrance',
    'alcohol denat': 'Denatured Alcohol'
  };

  const lower = ingredient.toLowerCase();
  const normalized = normalizationMap[lower] || ingredient;

  return {
    original: ingredient,
    normalized: normalized,
    mapped: normalized !== ingredient
  };
}

// NORMALIZATION FOR MEDICINES
function normalizeMedicineIngredient(ingredient) {
  const normalizationMap = {
    'paracetamol': 'Acetaminophen',
    'ibuprofen ip': 'Ibuprofen',
    'amoxicillin trihydrate': 'Amoxicillin',
    'acetaminophen': 'Acetaminophen',
    'salicylic acid': 'Salicylic Acid'
  };

  const lower = ingredient.toLowerCase();
  const normalized = normalizationMap[lower] || ingredient;

  return {
    original: ingredient,
    normalized: normalized,
    mapped: normalized !== ingredient
  };
}

// CONFIDENCE ASSESSMENT
export function assessOCRConfidence(text, detectedType) {
  const hasCleanIngredientBlock = /ingredients?:\s*[\w\s,;\-()]+/i.test(text);
  const distortionLevel = (text.match(/[^a-zA-Z0-9\s,;()%-]/g) || []).length / text.length;
  const fragmentation = (text.match(/\n/g) || []).length;
  const blurriness = (text.match(/[a-z](?=[A-Z])/g) || []).length; // Likely OCR errors

  let confidence = 'Moderate';
  let score = 50;

  if (hasCleanIngredientBlock && distortionLevel < 0.05 && fragmentation < 3) {
    confidence = 'High';
    score = 85;
  } else if (distortionLevel > 0.15 || fragmentation > 5 || blurriness > 10) {
    confidence = 'Low';
    score = 30;
  }

  return {
    level: confidence,
    score,
    factors: {
      hasCleanBlock: hasCleanIngredientBlock,
      distortionLevel: distortionLevel.toFixed(2),
      fragmentation,
      blurriness,
      detectedType
    }
  };
}

// MAIN PARSER FUNCTION
export function parseIngredients(text, productType = null) {
  if (!text) return { ingredients: [], type: 'Unknown', confidence: 'low' };

  // Detect product type
  const typeDetection = detectProductType(text, productType);

  // Extract based on type
  let result;
  if (typeDetection.type === 'Medicine') {
    result = extractMedicineIngredients(text);
  } else if (typeDetection.type === 'Cosmetic') {
    result = extractCosmeticIngredients(text);
  } else {
    result = extractCosmeticIngredients(text); // Default fallback
  }

  // Assess confidence
  const confidence = assessOCRConfidence(text, typeDetection.type);

  return {
    ...result,
    type: typeDetection.type,
    typeConfidence: typeDetection.confidence,
    ocrConfidence: confidence,
    missingFlag: result.missingFlag,
    timestamp: new Date().toISOString()
  };
}
