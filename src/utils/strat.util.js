export const ANY = 'any'
export const UP = 'up'
export const DOWN = 'down'
export const INSIDE = 'inside'
export const OUTSIDE = 'outside'
export const NONE = 'none'
export const SHOOTER = 'shooter'
export const HAMMER = 'hammer'
export const TRUE_VALUE = 'true'
export const FALSE_VALUE = 'false'
export const EXCEPT_INSIDE = "except_inside"
export const UP_INSIDE = "up_inside"
export const DOWN_INSIDE = "down_inside"


const isValidNumber = (value) => typeof value === 'number' && !isNaN(value);

const isUnusualInRange = (volume, bulkData, start, end, check) => {
  const volumesInRange = bulkData.slice(start, end)
    .map((entry) => entry.volume)
    .filter((volume) => volume !== undefined);

  if (volumesInRange.length === 0) {
    return false;
  }

  if (check === "low") {
    return volume < Math.min(...volumesInRange);
  } else if (check === "high") {
    return volume > Math.max(...volumesInRange);
  } else {
    throw new Error("El parámetro 'check' debe ser 'low' o 'high'.");
  }
};

export const getAvgVolume = ({ data }) => {
  const bulkData = data || [];
  const avgVolume = bulkData.slice(0, 30).reduce((sum, item) => sum + item.volume, 0) / Math.min(bulkData.length, 30);
  return avgVolume;
}

export const getBarType = ({ recentOpen, recentHigh, recentLow, recentClose, previousHigh, previousLow }) => {

  const candlePattern = getCandlePattern({ open: recentOpen, high: recentHigh, low: recentLow, close: recentClose });

  if (candlePattern === NONE) {
    const scenario = getScenario({ recentHigh, recentLow, previousHigh, previousLow });
    return scenario;
  }

  return candlePattern;
};

export const getPriceChange = ({ recentPrice, previousPrice }) => {
  if (!recentPrice || !previousPrice) return 0;
  return ((recentPrice - previousPrice) / previousPrice) * 100;
}

export const isInsideActionable = ({ pastWeeklyTrigger, dailyData, key = "high" }) => {
  if (!dailyData?.length) return false;

  let referenceLevel = dailyData[0][key];
  let breakoutCount = 0;
  let triggerFound = false;

  for (let i = 1; i < dailyData.length; i++) {
    const currentLevel = dailyData[i][key];

    if (currentLevel === pastWeeklyTrigger) {
      triggerFound = true;
      break;
    }

    if (currentLevel > referenceLevel) {
      breakoutCount++;
      referenceLevel = currentLevel;
    }

    if (breakoutCount > 1) return false;
  }

  return triggerFound && breakoutCount <= 1;
};

export const getScenario = ({ recentHigh, recentLow, previousHigh, previousLow }) => {
  if (
    !isValidNumber(recentHigh) ||
    !isValidNumber(recentLow) ||
    !isValidNumber(previousHigh) ||
    !isValidNumber(previousLow)
  ) {
    throw new Error('Todos los valores deben ser números válidos.');
  }

  if (recentHigh > previousHigh && recentLow >= previousLow) return UP;
  if (recentHigh <= previousHigh && recentLow < previousLow) return DOWN;
  if (recentHigh <= previousHigh && recentLow >= previousLow) return INSIDE;
  if (recentHigh > previousHigh && recentLow < previousLow) return OUTSIDE;
  return NONE;
};

export const getContinuity = ({ tfOpen, tfClose, dailyHigh, dailyLow, dailyClose, dailyScenario }) => {
  const entryUp = dailyScenario === DOWN || (dailyScenario === INSIDE && dailyClose > tfOpen)
  const entryDown = dailyScenario === UP || (dailyScenario === INSIDE && dailyClose < tfOpen)

  if (entryUp && dailyHigh > tfOpen) {
    return UP
  }

  if (entryDown && dailyLow < tfOpen) {
    return DOWN
  }

  if (tfClose < tfOpen) {
    return DOWN
  }
  return UP
}

export const getUnusualVolume = (data) => {
  const bulkData = data || [];

  const recentVolume = bulkData[0].volume;
  const previousVolume = bulkData[1].volume;

  const isRecentUnusualLow = isUnusualInRange(recentVolume, bulkData, 1, 9, "low");
  const isRecentUnusualHigh = isUnusualInRange(recentVolume, bulkData, 1, 9, "high");

  const isPreviousUnusualLow = isUnusualInRange(previousVolume, bulkData, 2, 10, "low");
  const isPreviousUnusualHigh = isUnusualInRange(previousVolume, bulkData, 2, 10, "high");

  if (isRecentUnusualLow || isPreviousUnusualLow || isRecentUnusualHigh || isPreviousUnusualHigh) {
    return TRUE_VALUE
  }

  return FALSE_VALUE;
};

export const getCandlePattern = ({ open, high, low, close }) => {
  const body = Math.abs(close - open);
  const lowerShadow = Math.min(open, close) - low;
  const upperShadow = high - Math.max(open, close);

  // Definir Hammer
  const isHammer = lowerShadow > 2 * body && upperShadow < body;

  // Definir Shooting Star
  const isShootingStar = upperShadow > 2 * body && lowerShadow < body;

  if (isHammer) {
    return HAMMER;
  } else if (isShootingStar) {
    return SHOOTER;
  } else {
    return NONE;
  }
};

export const getPoints = ({
  weeklyScenario,
  monthlyScenario,
  quarterlyScenario,
  weeklyContinuity,
  monthlyContinuity,
  quarterlyContinuity,
  dailyPattern,
  weeklyPattern,
  monthlyPattern,
  quarterlyPattern,
  unusualVolume,
  potentialEntry,
  weeklyVolume,
  avgVolume,
}) => {
  let points = 0;

  if (potentialEntry !== UP && potentialEntry !== DOWN) return points;

  const scenarios = [weeklyScenario, monthlyScenario, quarterlyScenario];
  const continuities = [weeklyContinuity, monthlyContinuity, quarterlyContinuity];
  const patterns = [dailyPattern, weeklyPattern, monthlyPattern, quarterlyPattern];

  const patternToMatch = potentialEntry === UP ? HAMMER : SHOOTER;
  const continuityToMatch = potentialEntry;

  points += scenarios.filter(scenario => scenario !== INSIDE).length;
  points += continuities.filter(continuity => continuity === continuityToMatch).length;
  points += patterns.filter(pattern => pattern === patternToMatch).length;

  if (unusualVolume === TRUE_VALUE) points++;
  if (weeklyVolume > 1_000_000) points++;
  if (avgVolume > 5_000_000) points++;

  return points;
};

export const getPotentialEntry = ({
  weeklyData,
  dailyData,
  weeklyContinuity,
  monthlyContinuity,
  quarterlyContinuity,
  dailyScenario,
  weeklyScenario,
  monthlyScenario,
  quarterlyScenario,
  dailyPattern,
  avgVolume,
}) => {
  const continuities = [weeklyContinuity, monthlyContinuity, quarterlyContinuity];
  const scenarios = { daily: dailyScenario, weekly: weeklyScenario, monthly: monthlyScenario, quarterly: quarterlyScenario };

  const upsideContinuity = continuities.filter(c => c === UP).length;
  const downsideContinuity = continuities.filter(c => c === DOWN).length;

  const dailyUpsideTrigger = ([DOWN, INSIDE].includes(scenarios.daily) || dailyPattern === HAMMER);
  const dailyDownsideTrigger = ([UP, INSIDE].includes(scenarios.daily) || dailyPattern === SHOOTER);

  const extraRules = (scenarios.quarterly !== INSIDE) && (avgVolume >= 3_000_000);

  if (upsideContinuity === 3 && dailyUpsideTrigger && extraRules) return UP;
  if (downsideContinuity === 3 && dailyDownsideTrigger && extraRules) return DOWN;

  const weekUpsideException = weeklyContinuity !== UP && scenarios.weekly === INSIDE;
  if (upsideContinuity === 2 && dailyUpsideTrigger && extraRules && weekUpsideException) {
    return isInsideActionable({ pastWeeklyTrigger: weeklyData[1].high, dailyData, key: 'high' }) ? UP : NONE;
  }

  const weekDownsideException = weeklyContinuity !== DOWN && scenarios.weekly === INSIDE;
  if (downsideContinuity === 2 && dailyDownsideTrigger && extraRules && weekDownsideException) {
    return isInsideActionable({ pastWeeklyTrigger: weeklyData[1].low, dailyData, key: 'low' }) ? DOWN : NONE;
  }

  return NONE;
};

export const getStratResult = ({ symbol, daily, weekly, monthly, quarterly }) => {

  const lastDay = daily[0].date;
  const lastPrice = daily[0].close;
  const percentageChange = getPriceChange({ recentPrice: daily[0].close, previousPrice: daily[1].close });
  const priceChange = Math.abs(daily[0].close - daily[1].close);
  const atr = calculateATR({ data: daily });
  const volume = daily[0].volume;
  const weeklyVolume = weekly[0].volume;
  const avgVolume = getAvgVolume({ data: daily });
  const unusualVolume = getUnusualVolume(daily);
  const dailyScenario = getScenario({
    recentHigh: daily[0].high,
    recentLow: daily[0].low,
    previousHigh: daily[1].high,
    previousLow: daily[1].low
  });
  const weeklyScenario = getScenario({
    recentHigh: weekly[0].high,
    recentLow: weekly[0].low,
    previousHigh: weekly[1].high,
    previousLow: weekly[1].low
  });
  const monthlyScenario = getScenario({
    recentHigh: monthly[0].high,
    recentLow: monthly[0].low,
    previousHigh: monthly[1].high,
    previousLow: monthly[1].low
  });
  const quarterlyScenario = getScenario({
    recentHigh: quarterly[0].high,
    recentLow: quarterly[0].low,
    previousHigh: quarterly[1].high,
    previousLow: quarterly[1].low
  });
  const dailyPattern = getCandlePattern({
    open: daily[0].open,
    high: daily[0].high,
    low: daily[0].low,
    close: daily[0].close
  });
  const weeklyPattern = getCandlePattern({
    open: weekly[0].open,
    high: weekly[0].high,
    low: weekly[0].low,
    close: weekly[0].close
  });
  const monthlyPattern = getCandlePattern({
    open: monthly[0].open,
    high: monthly[0].high,
    low: monthly[0].low,
    close: monthly[0].close
  });
  const quarterlyPattern = getCandlePattern({
    open: quarterly[0].open,
    high: quarterly[0].high,
    low: quarterly[0].low,
    close: quarterly[0].close
  });
  const dailyContinuity = daily[0].close > daily[0].open ? UP : DOWN;
  const weeklyContinuity = getContinuity({
    tfOpen: weekly[0].open,
    tfClose: weekly[0].close,
    dailyHigh: daily[0].high,
    dailyLow: daily[0].low,
    dailyClose: daily[0].close,
    dailyScenario,
  });
  const monthlyContinuity = getContinuity({
    tfOpen: monthly[0].open,
    tfClose: monthly[0].close,
    dailyHigh: daily[0].high,
    dailyLow: daily[0].low,
    dailyClose: daily[0].close,
    dailyScenario,
  });
  const quarterlyContinuity = getContinuity({
    tfOpen: quarterly[0].open,
    tfClose: quarterly[0].close,
    dailyHigh: daily[0].high,
    dailyLow: daily[0].low,
    dailyClose: daily[0].close,
    dailyScenario,
  });
  const potentialEntry = getPotentialEntry({
    weeklyData: weekly,
    dailyData: daily,
    avgVolume,
    weeklyContinuity,
    monthlyContinuity,
    quarterlyContinuity,
    dailyScenario,
    weeklyScenario,
    monthlyScenario,
    quarterlyScenario,
    dailyPattern,
  });
  const points = getPoints({
    weeklyScenario,
    monthlyScenario,
    quarterlyScenario,
    weeklyContinuity,
    monthlyContinuity,
    quarterlyContinuity,
    dailyPattern,
    weeklyPattern,
    monthlyPattern,
    quarterlyPattern,
    unusualVolume,
    potentialEntry,
    weeklyVolume,
    avgVolume,
  });

  return {
    symbol,
    lastPrice,
    priceChange,
    percentageChange,
    atr,
    volume,
    unusualVolume,
    avgVolume,
    dailyContinuity,
    weeklyContinuity,
    monthlyContinuity,
    quarterlyContinuity,
    dailyScenario,
    weeklyScenario,
    monthlyScenario,
    quarterlyScenario,
    dailyPattern,
    weeklyPattern,
    monthlyPattern,
    quarterlyPattern,
    weeklyVolume,
    lastDay,
    potentialEntry,
    points,
  };
}

export const calculateATR = ({ data, period = 14 }) => {
  if (data.length < period + 1) {
    throw new Error("Not enough data to calculate ATR");
  }

  const trueRanges = [];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  const atr = trueRanges.slice(-period).reduce((sum, val) => sum + val, 0) / period;

  return atr;
}

// Filters
export const isVolumeValid = ({ filterVolume, volume }) => {

  if (filterVolume === 'under_500k' && volume > 500000) {
    return false;
  }
  if (filterVolume === 'under_1m' && volume > 1000000) {
    return false;
  }
  if (filterVolume === 'under_3m' && volume > 3000000) {
    return false;
  }

  if (filterVolume === 'under_5m' && volume > 5000000) {
    return false;
  }
  if (filterVolume === 'over_500k' && volume < 500000) {
    return false;
  }

  if (filterVolume === 'over_1m' && volume < 1000000) {
    return false;
  }

  if (filterVolume === 'over_3m' && volume < 3000000) {
    return false;
  }

  if (filterVolume === 'over_5m' && volume < 5000000) {
    return false;
  }

  return true;
}

export const isPriceValid = ({ filterPrice, price }) => {

  if (filterPrice === 'under_10' && price > 10) {
    return false;
  }

  if (filterPrice === 'under_50' && price > 50) {
    return false;
  }

  if (filterPrice === 'under_100' && price > 100) {
    return false;
  }

  if (filterPrice === 'under_500' && price > 500) {
    return false;
  }

  if (filterPrice === 'over_10' && price < 10) {
    return false;
  }

  if (filterPrice === 'over_50' && price < 50) {
    return false;
  }

  if (filterPrice === 'over_100' && price < 100) {
    return false;
  }

  if (filterPrice === 'over_500' && price < 500) {
    return false;
  }

  return true;
}

export const isScenarioValid = ({ filterScenario, scenario }) => {

  const specialCases = [EXCEPT_INSIDE, UP_INSIDE, DOWN_INSIDE]

  if (filterScenario === EXCEPT_INSIDE && scenario === INSIDE) {
    return false;
  }

  if (filterScenario === UP_INSIDE && (scenario === DOWN || scenario === OUTSIDE)) {
    return false;
  }

  if (filterScenario === DOWN_INSIDE && (scenario === UP || scenario === OUTSIDE)) {
    return false;
  }

  if (filterScenario !== scenario && !specialCases.includes(filterScenario)) {
    return false
  }

  return true;

}

export const isAtrValid = ({ filterAtr, atr }) => {

  if (filterAtr === 'under_0.5' && atr > 0.5) {
    return false;
  }

  if (filterAtr === 'under_1' && atr > 1) {
    return false;
  }

  if (filterAtr === 'under_2' && atr > 2) {
    return false;
  }

  if (filterAtr === 'under_3' && atr > 3) {
    return false;
  }

  if (filterAtr === 'over_0.5' && atr < 0.5) {
    return false;
  }

  if (filterAtr === 'over_1' && atr < 1) {
    return false;
  }

  if (filterAtr === 'over_2' && atr < 2) {
    return false;
  }

  if (filterAtr === 'over_3' && atr < 3) {
    return false;
  }

  return true;
}


// TODO: Idea agregar la opcion de exportar la watchlist para agregarla a TradingView y Permitir compartir la watchlist con otros
// TODO: Ocultar sectores que no tengan stocks relacionados del menu de Sectors
// TODO: Eliminar librerias no utilizadas tanto en frontend como en backend