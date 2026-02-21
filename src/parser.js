export function parseIngredients(text){
  if(!text) return [];
  // Normalize common separators and remove extraneous chars
  const cleaned = text.replace(/\(.*?\)/g,'')
                      .replace(/\s*\d+\.?\d*%?/g,'')
                      .replace(/\n/g,',')
                      .replace(/\s*,\s*/g,',')
                      .trim();
  const parts = cleaned.split(',').map(p=>p.trim()).filter(Boolean);
  // Normalize casing and common aliases minimally
  return parts.map(p=>{
    const name = p.replace(/\s+/g,' ').trim();
    return { raw: p, name: normalizeName(name)};
  });
}

function normalizeName(n){
  return n.toLowerCase();
}
