import { NextRequest, NextResponse } from "next/server";
import { AIDoctorAgents } from "@/shared/list";

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json();

    if (!notes || typeof notes !== "string") {
      return NextResponse.json(
        { error: "Notes are required" },
        { status: 400 }
      );
    }

    const text = notes.toLowerCase();

    const maps = [
      { specialist: "Dermatologist", keywords: ["skin", "acne", "rash", "itch", "eczema", "psoriasis", "pimple", "hives", "mole", "wart", "fungal", "ringworm", "dermatitis", "sunburn", "blister"] },
      { specialist: "Pediatrician", keywords: ["child", "kid", "baby", "infant", "teen", "pediatric", "newborn", "toddler"] },
      { specialist: "Cardiologist", keywords: ["heart", "chest pain", "palpitation", "blood pressure", "bp", "hypertension", "cholesterol", "cardiac", "arrhythmia", "angina"] },
      { specialist: "Gynecologist", keywords: ["pregnant", "pregnancy", "period", "menstruation", "fertility", "pcos", "vaginal", "ovary", "uterus", "menopause", "cramp", "irregular period", "breast"] },
      { specialist: "ENT Specialist", keywords: ["ear", "nose", "throat", "sinus", "tonsils", "hearing", "sore throat", "nasal", "snoring", "voice", "vertigo", "ear infection", "runny nose", "stuffy nose"] },
      { specialist: "Dentist", keywords: ["tooth", "teeth", "gum", "cavity", "mouth", "dental", "jaw", "wisdom tooth", "toothache", "oral", "braces"] },
      { specialist: "Orthopedic", keywords: ["bone", "joint", "muscle", "back pain", "knee", "shoulder", "sprain", "fracture", "arthritis", "spine", "neck pain", "hip", "ligament", "posture", "sciatica", "leg pain", "arm pain", "wrist"] },
      { specialist: "Psychologist", keywords: ["anxiety", "depression", "stress", "sleep", "mental", "panic", "insomnia", "trauma", "mood", "anger", "loneliness", "overthinking", "nervous", "phobia", "ocd"] },
      { specialist: "Nutritionist", keywords: ["diet", "nutrition", "weight", "obesity", "food", "calories", "vitamin", "mineral", "supplement", "metabolism", "bmi", "underweight", "overweight", "eating disorder"] },
      { specialist: "General Physician", keywords: ["fever", "cold", "cough", "headache", "general", "fatigue", "nausea", "vomit", "diarrhea", "stomach", "abdomen", "abdominal", "flu", "infection", "weakness", "body ache", "chills", "dehydration", "allergy", "dizzy", "dizziness", "swelling", "pain", "ache", "sick", "unwell", "tiredness", "gastric", "bloating", "indigestion", "constipation", "acidity", "gas", "loose motion", "food poison", "migraine", "breathless", "urinary", "urine"] },
    ];

    const matchedSpecialists = maps
      .filter(m => m.keywords.some(k => text.includes(k)))
      .map(m => m.specialist);

    let suggestions = AIDoctorAgents.filter(d => matchedSpecialists.includes(d.specialist));

    // Always include General Physician if no matches found
    if (suggestions.length === 0) {
      const gp = AIDoctorAgents.find(d => d.specialist === "General Physician");
      suggestions = gp ? [gp] : [];
    }

    // If only one match and it's not General Physician, also include GP for a second opinion
    if (suggestions.length === 1 && suggestions[0].specialist !== "General Physician") {
      const gp = AIDoctorAgents.find(d => d.specialist === "General Physician");
      if (gp) suggestions.push(gp);
    }

    // Limit to top 3
    suggestions = suggestions.slice(0, 3);

    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error("Suggest doctors API error:", error);
    return NextResponse.json(
      { error: "Failed to suggest doctors" },
      { status: 500 }
    );
  }
}