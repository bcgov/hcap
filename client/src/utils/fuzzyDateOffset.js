import { stringToDateTime } from './date';

export const fuzzyDateOffset = (datestring) => {
    if (!datestring) return "Never Updated";

    // Some browsers (firefox, safari) cannot parse datestrings of the following form:
    // 2021-02-11 16:02:12.877406+00
    let offsetTime = null;
    if (datestring.includes(' ')) {
        offsetTime = stringToDateTime(datestring).format('x');
    } else {
        offsetTime = new Date(datestring).getTime();
    }
    const currentTime = new Date().getTime();
    const weekInMilliseconds = 7*24*60*60*1000; 
    const dayInMilliseconds = 24*60*60*1000; 
    const hourInMilliseconds = 60*60*1000; 
    const diff = currentTime - offsetTime;

    if ( diff > weekInMilliseconds ) {
        const weeks = Math.floor(diff/weekInMilliseconds); 
        return `${weeks} ${(weeks === 1)? "week":"weeks"} ago`;
    } else if ( diff > dayInMilliseconds) {
        const days = Math.floor(diff/dayInMilliseconds); 
        return `${days} ${(days === 1)? "day":"days"} ago`;
    } else if ( diff > hourInMilliseconds) {
        const hours = Math.floor(diff/hourInMilliseconds); 
        return `${hours} ${(hours === 1)? "hour":"hours"} ago`;
    } else if ( diff > 60000) {
        const minutes = Math.floor(diff/60000);
        return `${minutes} ${(minutes === 1)? "minute":"minutes"} ago`;
    } else {
        return "Just now";
    }
}
