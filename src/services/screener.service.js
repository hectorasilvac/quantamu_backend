import { fetchAggregatedData, addStratData } from './data.service.js'
import { getBarType } from '../utils/strat.util.js'

export const fetchScreener = async () => {
    const data = await fetchAggregatedData({ isSector: 10, limit: 200 })
    const result = fetchDataByFilters({ arrObjects: data });
    return result;
}

export const fetchDataByFilters = ({ 
    arrObjects, 
    filterCurrBarDaily, 
    filterCurrBarWeekly, 
    filterCurrBarMonthly, 
    filterCurrBarQuarterly, 
    filterPrevBarDaily, 
    filterPrevBarWeekly, 
    filterPrevBarMonthly, 
    filterPrevBarQuarterly 
}) => {
    const result = [];

    for (let i = 0; i < arrObjects.length; i++) {
        const { symbol, daily, weekly, monthly, quarterly } = arrObjects[i];

        const isThereEnoughData = daily?.[1] && weekly?.[1] && monthly?.[1] && quarterly?.[1];

        if (!isThereEnoughData) {
            continue;
        }

        if (filterCurrBarDaily !== ANY) {
            const CurBarDaily = getBarType({
                recentHigh: daily[0].high,
                recentLow: daily[0].low,
                previousHigh: daily[1].high,
                previousLow: daily[1].low
            });

            if (CurBarDaily !== filterCurrBarDaily) {
                continue;
            }
        }

        if (filterCurrBarWeekly !== ANY) {
            const CurBarWeekly = getBarType({
                recentHigh: weekly[0].high,
                recentLow: weekly[0].low,
                previousHigh: weekly[1].high,
                previousLow: weekly[1].low
            });

            if (CurBarWeekly !== filterCurrBarWeekly) {
                continue;
            }
        }

        if (filterCurrBarMonthly !== ANY) {
            const CurBarMonthly = getBarType({
                recentHigh: monthly[0].high,
                recentLow: monthly[0].low,
                previousHigh: monthly[1].high,
                previousLow: monthly[1].low
            });

            if (CurBarMonthly !== filterCurrBarMonthly) {
                continue;
            }
        }

        if (filterCurrBarQuarterly !== ANY) {
            const CurBarQuarterly = getBarType({
                recentHigh: quarterly[0].high,
                recentLow: quarterly[0].low,
                previousHigh: quarterly[1].high,
                previousLow: quarterly[1].low
            });

            if (CurBarQuarterly !== filterCurrBarQuarterly) {
                continue;
            }
        }

        if (filterPrevBarDaily !== ANY) {
            const PrevBarDaily = getBarType({
                recentHigh: daily[1].high,
                recentLow: daily[1].low,
                previousHigh: daily[2].high,
                previousLow: daily[2].low
            });

            if (PrevBarDaily !== filterPrevBarDaily) {  
                continue;
            }
        }

        if (filterPrevBarWeekly !== ANY) {
            const PrevBarWeekly = getBarType({
                recentHigh: weekly[1].high,
                recentLow: weekly[1].low,
                previousHigh: weekly[2].high,
                previousLow: weekly[2].low
        });

            if (PrevBarWeekly !== filterPrevBarWeekly) {
                continue;
            }
        }

        if (filterPrevBarMonthly !== ANY) {
            const PrevBarMonthly = getBarType({
                recentHigh: monthly[1].high,
                recentLow: monthly[1].low,
                previousHigh: monthly[2].high,
                previousLow: monthly[2].low
            });

            if (PrevBarMonthly !== filterPrevBarMonthly) {
                continue;
            }
        }

        if (filterPrevBarQuarterly !== ANY) {
            const PrevBarQuarterly = getBarType({
                recentHigh: quarterly[1].high,
                recentLow: quarterly[1].low,
                previousHigh: quarterly[2].high,
                previousLow: quarterly[2].low
            });

            if (PrevBarQuarterly !== filterPrevBarQuarterly) {
                continue;
            }
        }
        
        
        
        

        // result.push({
        //     symbol
        // });
    }

    return result;
}

// export const addStratData = async ({ arrObject }) => {
//     return (await Promise.all(
//       arrObject.map(async ({ symbol, daily, weekly, monthly, quarterly }) => {
//         if (!daily?.[1] || !weekly?.[1] || !monthly?.[1] || !quarterly?.[1]) {
//           return null;
//         }
  
//         const [
//           dailyScenario,
//           weeklyScenario,
//           monthlyScenario,
//           quarterlyScenario,
//           dailyPattern,
//           weeklyPattern,
//           monthlyPattern,
//           quarterlyPattern,
//           unusualVolume
//         ] = await Promise.all([
//           getBarType({
//             recentHigh: daily[0].high,
//             recentLow: daily[0].low,
//             previousHigh: daily[1].high,
//             previousLow: daily[1].low
//           }),
//           getBarType({
//             recentHigh: weekly[0].high,
//             recentLow: weekly[0].low,
//             previousHigh: weekly[1].high,
//             previousLow: weekly[1].low
//           }),
//           getBarType({
//             recentHigh: monthly[0].high,
//             recentLow: monthly[0].low,
//             previousHigh: monthly[1].high,
//             previousLow: monthly[1].low
//           }),
//           getBarType({
//             recentHigh: quarterly[0].high,
//             recentLow: quarterly[0].low,
//             previousHigh: quarterly[1].high,
//             previousLow: quarterly[1].low
//           }),
//           getCandlePattern({
//             open: daily[0].open,
//             high: daily[0].high,
//             low: daily[0].low,
//             close: daily[0].close
//           }),
//           getCandlePattern({
//             open: weekly[0].open,
//             high: weekly[0].high,
//             low: weekly[0].low,
//             close: weekly[0].close
//           }),
//           getCandlePattern({
//             open: monthly[0].open,
//             high: monthly[0].high,
//             low: monthly[0].low,
//             close: monthly[0].close
//           }),
//           getCandlePattern({
//             open: quarterly[0].open,
//             high: quarterly[0].high,
//             low: quarterly[0].low,
//             close: quarterly[0].close
//           }),
//           getUnusualVolume(daily)
//         ])
  
//         const [weeklyContinuity, monthlyContinuity, quarterlyContinuity] =
//           await Promise.all([
//             getContinuity({
//               tfOpen: weekly[0].open,
//               tfClose: weekly[0].close,
//               dailyHigh: daily[0].high,
//               dailyLow: daily[0].low,
//               dailyClose: daily[0].close,
//               dailyScenario
//             }),
//             getContinuity({
//               tfOpen: monthly[0].open,
//               tfClose: monthly[0].close,
//               dailyHigh: daily[0].high,
//               dailyLow: daily[0].low,
//               dailyClose: daily[0].close,
//               dailyScenario
//             }),
//             getContinuity({
//               tfOpen: quarterly[0].open,
//               tfClose: quarterly[0].close,
//               dailyHigh: daily[0].high,
//               dailyLow: daily[0].low,
//               dailyClose: daily[0].close,
//               dailyScenario
//             })
//           ])
  
//           const avgVolume = daily.slice(0, 30).reduce((sum, item) => sum + item.volume, 0) / Math.min(daily.length, 30);
//           const weeklyVolume = weekly[0].volume;
//           const lastPrice = daily[0].close;
//           const percentageChange = ((daily[0].close - daily[1].close) / daily[1].close) * 100;
//           const priceChange = Math.abs(daily[0].close - daily[1].close);
//           const lastDay = daily[0].date;
  
//         const [potentialEntry] = await Promise.all([
//           getPotentialEntry({
//             weeklyData: weekly,
//             dailyData: daily,
//             avgVolume,
//             weeklyContinuity,
//             monthlyContinuity,
//             quarterlyContinuity,
//             dailyScenario,
//             weeklyScenario,
//             monthlyScenario,
//             quarterlyScenario,
//             dailyPattern,
//           })
//         ])
  
//         const points = getPoints({
//           weeklyScenario,
//           monthlyScenario,
//           quarterlyScenario,
//           weeklyContinuity,
//           monthlyContinuity,
//           quarterlyContinuity,
//           dailyPattern,
//           weeklyPattern,
//           monthlyPattern,
//           quarterlyPattern,
//           unusualVolume,
//           potentialEntry,
//           weeklyVolume,
//           avgVolume,
//         });
  
//         return {
//           symbol,
//           dailyScenario,
//           weeklyScenario,
//           monthlyScenario,
//           quarterlyScenario,
//           weeklyContinuity,
//           monthlyContinuity,
//           quarterlyContinuity,
//           dailyPattern,
//           weeklyPattern,
//           monthlyPattern,
//           quarterlyPattern,
//           unusualVolume,
//           potentialEntry,
//           avgVolume,
//           weeklyVolume,
//           lastPrice,
//           percentageChange,
//           priceChange,
//           lastDay,
//           points,
//         }
//       })
//     )).filter(Boolean);
//   }