import { DateRange } from '../types';
import { MONTHS } from '../constants';

export const getDateError = (range: DateRange): string | null => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const getMonthIdx = (m: string) => MONTHS.indexOf(m);

    const compare = (m1: number, y1: number, m2: number, y2: number) => {
        if (y1 > y2) return 1;
        if (y1 < y2) return -1;
        if (m1 > m2) return 1;
        if (m1 < m2) return -1;
        return 0;
    };

    if (range.isAnticipated) {
        if (range.startDateMonth && range.startDateYear) {
            const startM = getMonthIdx(range.startDateMonth);
            const startY = parseInt(range.startDateYear);
            if (compare(startM, startY, currentMonthIdx, currentYear) < 0) {
                return "Anticipated start date cannot be in the past.";
            }
        }
        const maxYear = currentYear + 1;
        const maxMonth = 7;
        if (range.endDateMonth && range.endDateYear) {
            const endM = getMonthIdx(range.endDateMonth);
            const endY = parseInt(range.endDateYear);
            if (compare(endM, endY, maxMonth, maxYear) > 0) {
                return `Anticipated end date cannot be later than August ${maxYear}.`;
            }
        }
    } else {
        if (range.startDateMonth && range.startDateYear) {
            const startM = getMonthIdx(range.startDateMonth);
            const startY = parseInt(range.startDateYear);
            if (compare(startM, startY, currentMonthIdx, currentYear) > 0) {
                return "Start date cannot be in the future.";
            }
        }
        if (range.endDateMonth && range.endDateYear) {
            const endM = getMonthIdx(range.endDateMonth);
            const endY = parseInt(range.endDateYear);
            if (compare(endM, endY, currentMonthIdx, currentYear) > 0) {
                return "End date cannot be in the future.";
            }
        }
    }
    return null;
};
