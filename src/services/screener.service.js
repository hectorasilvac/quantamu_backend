import { fetchAggregatedData, addStratData } from './data.service.js'

export const fetchScreener = async () => {
    const data = await fetchAggregatedData({ isSector: 10, limit: 200 })
    const result = await addStratData({ arrObject: data });
    return result;
}
