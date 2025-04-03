import { fetchAggregatedData } from './data.service.js'
import { fetchSectors } from './db.service.js'
import { ANY, UP, DOWN, getBarType, getAvgVolume, getContinuity, getPriceChange, NONE, getStratResult } from '../utils/strat.util.js'

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
        sector
    } = filters;

    const sectorId = sector.split(':')[1];
    const sectorName = sector.split(':')[0];

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
            sectorName
        });
        return result;
    } catch (error) {
        throw error;
    }
}

export const fetchDataByFilters = ({
    arrObjects,
    sectorName = NONE,
    filterAvgVolume = ANY,
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
    filterVolume = ANY,
}) => {
    const result = [];

    for (let i = 0; i < arrObjects.length; i++) {
        const { symbol, daily, weekly, monthly, quarterly } = arrObjects[i];

        const isThereEnoughData = daily?.[1] && weekly?.[1] && monthly?.[1] && quarterly?.[1];

        if (!isThereEnoughData) {
            continue;
        }

        if (filterCurrBarDaily !== ANY) {
            const currBarDaily = getBarType({
                recentHigh: daily[0].high,
                recentLow: daily[0].low,
                previousHigh: daily[1].high,
                previousLow: daily[1].low
            });

            if (currBarDaily !== filterCurrBarDaily) {
                continue;
            }
        }

        if (filterCurrBarWeekly !== ANY) {
            const currBarWeekly = getBarType({
                recentHigh: weekly[0].high,
                recentLow: weekly[0].low,
                previousHigh: weekly[1].high,
                previousLow: weekly[1].low
            });

            if (currBarWeekly !== filterCurrBarWeekly) {
                continue;
            }
        }

        if (filterCurrBarMonthly !== ANY) {
            const currBarMonthly = getBarType({
                recentHigh: monthly[0].high,
                recentLow: monthly[0].low,
                previousHigh: monthly[1].high,
                previousLow: monthly[1].low
            });

            if (currBarMonthly !== filterCurrBarMonthly) {
                continue;
            }
        }

        if (filterCurrBarQuarterly !== ANY) {
            const currBarQuarterly = getBarType({
                recentHigh: quarterly[0].high,
                recentLow: quarterly[0].low,
                previousHigh: quarterly[1].high,
                previousLow: quarterly[1].low
            });

            if (currBarQuarterly !== filterCurrBarQuarterly) {
                continue;
            }
        }

        if (filterPrevBarDaily !== ANY) {
            const prevBarDaily = getBarType({
                recentHigh: daily[1].high,
                recentLow: daily[1].low,
                previousHigh: daily[2].high,
                previousLow: daily[2].low
            });

            if (prevBarDaily !== filterPrevBarDaily) {
                continue;
            }
        }

        if (filterPrevBarWeekly !== ANY) {
            const prevBarWeekly = getBarType({
                recentHigh: weekly[1].high,
                recentLow: weekly[1].low,
                previousHigh: weekly[2].high,
                previousLow: weekly[2].low
            });

            if (prevBarWeekly !== filterPrevBarWeekly) {
                continue;
            }
        }

        if (filterPrevBarMonthly !== ANY) {
            const prevBarMonthly = getBarType({
                recentHigh: monthly[1].high,
                recentLow: monthly[1].low,
                previousHigh: monthly[2].high,
                previousLow: monthly[2].low
            });

            if (prevBarMonthly !== filterPrevBarMonthly) {
                continue;
            }
        }

        if (filterPrevBarQuarterly !== ANY) {
            const prevBarQuarterly = getBarType({
                recentHigh: quarterly[1].high,
                recentLow: quarterly[1].low,
                previousHigh: quarterly[2].high,
                previousLow: quarterly[2].low
            });

            if (prevBarQuarterly !== filterPrevBarQuarterly) {
                continue;
            }
        }

        if (filterContinuityQuaterly !== ANY) {
            const continuityQuaterly = getContinuity({
                tfOpen: quarterly[0].open,
                tfClose: quarterly[0].close,
                dailyHigh: daily[0].high,
            })

            if (continuityQuaterly !== filterContinuityQuaterly) {
                continue;
            }
        }

        if (filterContinuityMonthly !== ANY) {
            const continuityMonthly = getContinuity({
                tfOpen: monthly[0].open,
                tfClose: monthly[0].close,
                dailyHigh: daily[0].high,
            })

            if (continuityMonthly !== filterContinuityMonthly) {
                continue;
            }
        }

        if (filterContinuityWeekly !== ANY) {
            const continuityWeekly = getContinuity({
                tfOpen: weekly[0].open,
                tfClose: weekly[0].close,
                dailyHigh: daily[0].high,
            })

            if (continuityWeekly !== filterContinuityWeekly) {
                continue;
            }
        }

        if (filterContinuityDaily !== ANY) {
            const continuityDaily = getContinuity({
                tfOpen: daily[0].open,
                tfClose: daily[0].close,
                dailyHigh: daily[0].high,
            })

            if (continuityDaily !== filterContinuityDaily) {
                continue;
            }
        }

        if (filterPrice !== ANY) {
            const price = daily[0].close;

            if (filterPrice > price) {
                continue;
            }
        }

        if (filterVolume !== ANY) {
            const volume = daily[0].volume;

            if (filterVolume > volume) {
                continue;
            }
        }

        if (filterAvgVolume !== ANY) {
            const avgVolume = getAvgVolume({ data: daily });

            if (filterAvgVolume > avgVolume) {
                continue;
            }
        }


        result.push({
            ...getStratResult({ symbol, daily, weekly, monthly, quarterly }),
            sectorName,
        });
    }

    return result;
}
