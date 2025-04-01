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

export const getBarType = ({ recentHigh, recentLow, previousHigh, previousLow }) => {

  const candlePattern = getCandlePattern({ recentHigh, recentLow, previousHigh, previousLow });

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

// TODO: Idea agregar la opcion de exportar la watchlist para agregarla a TradingView y Permitir compartir la watchlist con otros
// TODO: Ocultar sectores que no tengan stocks relacionados del menu de Sectors
// TODO: Eliminar librerias no utilizadas tanto en frontend como en backend