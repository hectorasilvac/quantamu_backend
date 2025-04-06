import { fetchAggregatedData } from './data.service.js'
import { fetchSectors } from './db.service.js'
import { ANY, UP, DOWN, getBarType, getAvgVolume, getContinuity, getScenario, isVolumeValid, isPriceValid, isScenarioValid, getCandlePattern, calculateATR, isAtrValid, getUnusualVolume, getPriceChange, getPoints, getPotentialEntry } from '../utils/strat.util.js'

export const fetchScreener = async () => {
    const getSectorsData = await fetchSectors();

    const data = await fetchAggregatedData({ isSector: 1, limit: 200 })
    const result = await fetchDataByFilters({ arrObjects: data, sectorName: 'Basic Materials' });
    return {
        sectors: getSectorsData,
        table: result
    };
}

export const processDataByFilters = async ({ filters }) => {
    const {
        filterAvgVolume,
        filterContinuityDaily,
        filterContinuityMonthly,
        filterContinuityQuaterly,
        filterContinuityWeekly,
        filterCurrBarDaily,
        filterCurrBarMonthly,
        filterCurrBarQuarterly,
        filterCurrBarWeekly,
        filterPrevBarDaily,
        filterPrevBarMonthly,
        filterPrevBarQuarterly,
        filterPrevBarWeekly,
        filterPrice,
        filterVolume,
        filterAtr,
        sector
    } = filters;

    const sectorId = sector.split(':')[1];

    try {
        const data = await fetchAggregatedData({ isSector: Number(sectorId), limit: 200 })
        const result = fetchDataByFilters({
            arrObjects: data,
            filterAvgVolume,
            filterContinuityDaily,
            filterContinuityMonthly,
            filterContinuityQuaterly,
            filterContinuityWeekly,
            filterCurrBarDaily,
            filterCurrBarMonthly,
            filterCurrBarQuarterly,
            filterCurrBarWeekly,
            filterPrevBarDaily,
            filterPrevBarMonthly,
            filterPrevBarQuarterly,
            filterPrevBarWeekly,
            filterPrice,
            filterVolume,
            filterAtr,
        });
        return result;
    } catch (error) {
        throw error;
    }
}

export const fetchDataByFilters = ({
    arrObjects,
    filterContinuityDaily = ANY,
    filterContinuityMonthly = ANY,
    filterContinuityQuaterly = ANY,
    filterContinuityWeekly = ANY,
    filterCurrBarDaily = ANY,
    filterCurrBarMonthly = ANY,
    filterCurrBarQuarterly = ANY,
    filterCurrBarWeekly = ANY,
    filterPrevBarDaily = ANY,
    filterPrevBarMonthly = ANY,
    filterPrevBarQuarterly = ANY,
    filterPrevBarWeekly = ANY,
    filterPrice = ANY,
    filterAvgVolume = ANY,
    filterVolume = ANY,
    filterAtr = ANY,
}) => {
    const isPriceFilterActive = filterPrice !== ANY;
    const isVolumeFilterActive = filterVolume !== ANY;
    const isAvgVolumeFilterActive = filterAvgVolume !== ANY;
    const isAtrFilterActive = filterAtr !== ANY;
    const isCurrBarDailyActive = filterCurrBarDaily !== ANY;
    const isCurrBarWeeklyActive = filterCurrBarWeekly !== ANY;
    const isCurrBarMonthlyActive = filterCurrBarMonthly !== ANY;
    const isCurrBarQuarterlyActive = filterCurrBarQuarterly !== ANY;
    const isPrevBarDailyActive = filterPrevBarDaily !== ANY;
    const isPrevBarWeeklyActive = filterPrevBarWeekly !== ANY;
    const isPrevBarMonthlyActive = filterPrevBarMonthly !== ANY;
    const isPrevBarQuarterlyActive = filterPrevBarQuarterly !== ANY;
    const isContinuityDailyActive = filterContinuityDaily !== ANY;
    const isContinuityWeeklyActive = filterContinuityWeekly !== ANY;
    const isContinuityMonthlyActive = filterContinuityMonthly !== ANY;
    const isContinuityQuaterlyActive = filterContinuityQuaterly !== ANY;

    const result = [];
    const arrLength = arrObjects.length;

    for (let i = 0; i < arrLength; i++) {
        const { symbol, sectorName, daily, weekly, monthly, quarterly } = arrObjects[i];

        if (!daily || !weekly || !monthly || !quarterly || daily.length < 3 || weekly.length < 3 || monthly.length < 3 || quarterly.length < 3) {
            continue;
        }

        const daily0 = daily[0];
        const daily1 = daily[1];
        const daily2 = daily[2];
        const weekly0 = weekly[0];
        const weekly1 = weekly[1];
        const weekly2 = weekly[2];
        const monthly0 = monthly[0];
        const monthly1 = monthly[1];
        const monthly2 = monthly[2];
        const quarterly0 = quarterly[0];
        const quarterly1 = quarterly[1];
        const quarterly2 = quarterly[2];

        const lastPrice = daily0.close;
        if (isPriceFilterActive && !isPriceValid({ filterPrice, lastPrice })) {
            continue;
        }

        const volume = daily0.volume;
        if (isVolumeFilterActive && !isVolumeValid({ filterVolume, volume })) {
            continue;
        }

        let dailyScenario, weeklyScenario, monthlyScenario, quarterlyScenario;
        let dailyContinuity, weeklyContinuity, monthlyContinuity, quarterlyContinuity;
        
        let currBarDaily, currBarWeekly, currBarMonthly, currBarQuarterly;
        let prevBarDaily, prevBarWeekly, prevBarMonthly, prevBarQuarterly;

        if (isCurrBarDailyActive) {
            currBarDaily = getBarType({
                recentOpen: daily0.open,
                recentHigh: daily0.high,
                recentLow: daily0.low,
                recentClose: daily0.close,
                previousHigh: daily1.high,
                previousLow: daily1.low
            });
            if (!isScenarioValid({ filterScenario: filterCurrBarDaily, scenario: currBarDaily })) {
                continue;
            }
        }

        if (isCurrBarWeeklyActive) {
            currBarWeekly = getBarType({
                recentHigh: weekly0.high,
                recentLow: weekly0.low,
                previousHigh: weekly1.high,
                previousLow: weekly1.low
            });
            if (!isScenarioValid({ filterScenario: filterCurrBarWeekly, scenario: currBarWeekly })) {
                continue;
            }
        }

        if (isCurrBarMonthlyActive) {
            currBarMonthly = getBarType({
                recentHigh: monthly0.high,
                recentLow: monthly0.low,
                previousHigh: monthly1.high,
                previousLow: monthly1.low
            });
            if (!isScenarioValid({ filterScenario: filterCurrBarMonthly, scenario: currBarMonthly })) {
                continue;
            }
        }

        if (isCurrBarQuarterlyActive) {
            currBarQuarterly = getBarType({
                recentHigh: quarterly0.high,
                recentLow: quarterly0.low,
                previousHigh: quarterly1.high,
                previousLow: quarterly1.low
            });
            if (!isScenarioValid({ filterScenario: filterCurrBarQuarterly, scenario: currBarQuarterly })) {
                continue;
            }
        }

        if (isPrevBarDailyActive) {
            prevBarDaily = getBarType({
                recentHigh: daily1.high,
                recentLow: daily1.low,
                previousHigh: daily2.high,
                previousLow: daily2.low
            });
            if (!isScenarioValid({ filterScenario: filterPrevBarDaily, scenario: prevBarDaily })) {
                continue;
            }
        }

        if (isPrevBarWeeklyActive) {
            prevBarWeekly = getBarType({
                recentHigh: weekly1.high,
                recentLow: weekly1.low,
                previousHigh: weekly2.high,
                previousLow: weekly2.low
            });
            if (!isScenarioValid({ filterScenario: filterPrevBarWeekly, scenario: prevBarWeekly })) {
                continue;
            }
        }

        if (isPrevBarMonthlyActive) {
            prevBarMonthly = getBarType({
                recentHigh: monthly1.high,
                recentLow: monthly1.low,
                previousHigh: monthly2.high,
                previousLow: monthly2.low
            });
            if (!isScenarioValid({ filterScenario: filterPrevBarMonthly, scenario: prevBarMonthly })) {
                continue;
            }
        }

        if (isPrevBarQuarterlyActive) {
            prevBarQuarterly = getBarType({
                recentHigh: quarterly1.high,
                recentLow: quarterly1.low,
                previousHigh: quarterly2.high,
                previousLow: quarterly2.low
            });
            if (!isScenarioValid({ filterScenario: filterPrevBarQuarterly, scenario: prevBarQuarterly })) {
                continue;
            }
        }

        dailyContinuity = daily0.close > daily0.open ? UP : DOWN;
        if (isContinuityDailyActive && dailyContinuity !== filterContinuityDaily) {
            continue;
        }

        if (isContinuityWeeklyActive || isContinuityMonthlyActive || isContinuityQuaterlyActive) {
            dailyScenario = getScenario({
                recentHigh: daily0.high,
                recentLow: daily0.low,
                previousHigh: daily1.high,
                previousLow: daily1.low
            });
        }

        // Verificar continuidad semanal
        if (isContinuityWeeklyActive) {
            weeklyContinuity = getContinuity({
                tfOpen: weekly0.open,
                tfClose: weekly0.close,
                dailyHigh: daily0.high,
                dailyLow: daily0.low,
                dailyClose: daily0.close,
                dailyScenario
            });
            if (weeklyContinuity !== filterContinuityWeekly) {
                continue;
            }
        }

        // Verificar continuidad mensual
        if (isContinuityMonthlyActive) {
            monthlyContinuity = getContinuity({
                tfOpen: monthly0.open,
                tfClose: monthly0.close,
                dailyHigh: daily0.high,
                dailyLow: daily0.low,
                dailyClose: daily0.close,
                dailyScenario,
            });
            if (monthlyContinuity !== filterContinuityMonthly) {
                continue;
            }
        }

        // Verificar continuidad trimestral
        if (isContinuityQuaterlyActive) {
            quarterlyContinuity = getContinuity({
                tfOpen: quarterly0.open,
                tfClose: quarterly0.close,
                dailyHigh: daily0.high,
                dailyLow: daily0.low,
                dailyClose: daily0.close,
                dailyScenario
            });
            if (quarterlyContinuity !== filterContinuityQuaterly) {
                continue;
            }
        }

        // Calcular volumen promedio solo si es necesario
        let avgVolume;
        if (isAvgVolumeFilterActive) {
            avgVolume = getAvgVolume({ data: daily });
            if (!isVolumeValid({ filterVolume: filterAvgVolume, volume: avgVolume })) {
                continue;
            }
        }

        // Calcular ATR solo si es necesario
        let atr;
        if (isAtrFilterActive) {
            atr = calculateATR({ data: daily });
            if (!isAtrValid({ filterAtr, atr })) {
                continue;
            }
        }

        // Si el objeto ha pasado todos los filtros, realizar cálculos finales para el resultado
        
        // Calcular valores para el objeto resultado solo si no se han calculado antes
        if (!dailyScenario) {
            dailyScenario = getScenario({
                recentHigh: daily0.high,
                recentLow: daily0.low,
                previousHigh: daily1.high,
                previousLow: daily1.low
            });
        }

        if (!weeklyScenario) {
            weeklyScenario = getScenario({
                recentHigh: weekly0.high,
                recentLow: weekly0.low,
                previousHigh: weekly1.high,
                previousLow: weekly1.low
            });
        }

        if (!monthlyScenario) {
            monthlyScenario = getScenario({
                recentHigh: monthly0.high,
                recentLow: monthly0.low,
                previousHigh: monthly1.high,
                previousLow: monthly1.low
            });
        }

        if (!quarterlyScenario) {
            quarterlyScenario = getScenario({
                recentHigh: quarterly0.high,
                recentLow: quarterly0.low,
                previousHigh: quarterly1.high,
                previousLow: quarterly1.low
            });
        }

        if (!weeklyContinuity) {
            weeklyContinuity = getContinuity({
                tfOpen: weekly0.open,
                tfClose: weekly0.close,
                dailyHigh: daily0.high,
                dailyLow: daily0.low,
                dailyClose: daily0.close,
                dailyScenario
            });
        }

        if (!monthlyContinuity) {
            monthlyContinuity = getContinuity({
                tfOpen: monthly0.open,
                tfClose: monthly0.close,
                dailyHigh: daily0.high,
                dailyLow: daily0.low,
                dailyClose: daily0.close,
                dailyScenario,
            });
        }

        if (!quarterlyContinuity) {
            quarterlyContinuity = getContinuity({
                tfOpen: quarterly0.open,
                tfClose: quarterly0.close,
                dailyHigh: daily0.high,
                dailyLow: daily0.low,
                dailyClose: daily0.close,
                dailyScenario
            });
        }

        if (!avgVolume) {
            avgVolume = getAvgVolume({ data: daily });
        }

        if (!atr) {
            atr = calculateATR({ data: daily });
        }

        const dailyPattern = getCandlePattern({
            open: daily0.open,
            high: daily0.high,
            low: daily0.low,
            close: daily0.close
        });

        const weeklyPattern = getCandlePattern({
            open: weekly0.open,
            high: weekly0.high,
            low: weekly0.low,
            close: weekly0.close
        });

        const monthlyPattern = getCandlePattern({
            open: monthly0.open,
            high: monthly0.high,
            low: monthly0.low,
            close: monthly0.close
        });

        const quarterlyPattern = getCandlePattern({
            open: quarterly0.open,
            high: quarterly0.high,
            low: quarterly0.low,
            close: quarterly0.close
        });

        const weeklyVolume = weekly0.volume;
        const lastDay = daily0.date;
        const priceChange = Math.abs(daily0.close - daily1.close);
        const percentageChange = getPriceChange({ recentPrice: daily0.close, previousPrice: daily1.close });
        const unusualVolume = getUnusualVolume(daily);

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

        result.push({
            symbol,
            sectorName,
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
            points
        });
    }

    return result;
}
