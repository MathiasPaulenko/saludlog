export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroSource {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  baseAmount: number;
}

const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function computeItemMacros(food: MacroSource, amount: number): Macros {
  const ratio = amount / food.baseAmount;
  return {
    kcal: food.kcal * ratio,
    protein: food.protein * ratio,
    carbs: food.carbs * ratio,
    fat: food.fat * ratio,
  };
}

export function computeMealMacros(
  items: { food: MacroSource; amount: number }[],
): Macros {
  return items.reduce((total, { food, amount }) => {
    const m = computeItemMacros(food, amount);
    return {
      kcal: total.kcal + m.kcal,
      protein: total.protein + m.protein,
      carbs: total.carbs + m.carbs,
      fat: total.fat + m.fat,
    };
  }, { ...ZERO });
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function roundMacros(m: Macros): Macros {
  return {
    kcal: Math.round(m.kcal),
    protein: round1(m.protein),
    carbs: round1(m.carbs),
    fat: round1(m.fat),
  };
}
