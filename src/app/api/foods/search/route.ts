interface OffNutriments {
  "energy-kcal_100g"?: number;
  energy_100g?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: OffNutriments;
}

export interface OffCandidate {
  id: string;
  name: string;
  brand: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return Response.json({ results: [] });

  try {
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl" +
      `?search_terms=${encodeURIComponent(q)}` +
      "&search_simple=1&action=process&json=1&page_size=10" +
      "&fields=code,product_name,brands,nutriments";
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "saludlog/0.1 (local personal health tracker)" },
    });
    if (!res.ok) {
      return Response.json(
        { error: "OpenFoodFacts no respondió" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { products?: OffProduct[] };
    const results: OffCandidate[] = (data.products ?? [])
      .map((p) => {
        const kcal =
          p.nutriments?.["energy-kcal_100g"] ??
          (p.nutriments?.energy_100g ? p.nutriments.energy_100g / 4.184 : null);
        if (!p.product_name || kcal == null) return null;
        return {
          id: p.code ?? "",
          name: p.product_name.trim(),
          brand: p.brands?.split(",")[0]?.trim() || null,
          kcal: Math.round(kcal),
          protein: round1(p.nutriments?.proteins_100g),
          carbs: round1(p.nutriments?.carbohydrates_100g),
          fat: round1(p.nutriments?.fat_100g),
        };
      })
      .filter((p): p is OffCandidate => p !== null);

    return Response.json({ results });
  } catch {
    return Response.json(
      { error: "Sin conexión con OpenFoodFacts" },
      { status: 502 },
    );
  }
}

const round1 = (n: number | undefined) =>
  typeof n === "number" ? Math.round(n * 10) / 10 : 0;
